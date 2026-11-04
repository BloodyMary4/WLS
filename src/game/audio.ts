export class GrimdarkAmbience {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  // Буферные источники слоёв «ветер» и «шёпоты» — раньше не сохранялись и не
  // останавливались в stop(): при выкл/вкл музыки старые слои оставались
  // играть поверх новых → дублирование звука.
  private windNode: AudioBufferSourceNode | null = null;
  private whisperNode: AudioBufferSourceNode | null = null;
  /** Слой «хор шёпотов» (см. createWhisperLayer) — громкость зависит от настроения */
  private whisperGainNode: GainNode | null = null;
  /** true, когда игрок сам выключил музыку кнопкой — автозапуск от жестов не должен её включать */
  private userPaused = false;
  // Ссылка на bandpass-фильтр шумового слоя — чтобы mood-переходы могли
  // сдвигать тембр «гула улья» (danger = выше и резче, normal = ниже и мягче).
  private noiseFilter: BiquadFilterNode | null = null;
  private isPlaying = false;
  private volume = 0.55;
  private intervalId: ReturnType<typeof setTimeout> | null = null;
  // Мастер-шейпер: защищает от клиппинга при наложении мелодических событий
  // поверх плотного амбиент-дроуна (раньше все слои шли напрямую в destination).
  private compressor: DynamicsCompressorNode | null = null;

  /**
   * v0.4.3 «Соборный реверб»: общий ConvolverNode с процедурно сгенерированным
   * импульсом готического собора (экспоненциальный хвост ~2.6 c, предзадержка
   * 45 мс, лёгкий стерео-разброс). Все мелодические слои и UI-звуки получают
   * параллельную отправку в эту шину — звуки перестают быть сухими «писками»
   * синтезатора и склеиваются в единое пространство трека.
   */
  private reverb: ConvolverNode | null = null;
  private reverbReturn: GainNode | null = null;

  /** Шина задержки для арпеджио-солиста (эхо синхронизировано с темпом). */
  private trackEchoIn: GainNode | null = null;
  private trackEchoDelay: DelayNode | null = null;

  /**
   * Пре-композированная барабанная дробь (буфер шума) — раньше генерировалась
   * заново на каждый вызов playTimpaniRoll, что на слабых устройствах вызывало
   * «щелчки» и рывки звука посреди фразы.
   */
  private rollBuffer: AudioBuffer | null = null;

  // Сохранённая настройка громкости (localStorage) — переживает перезагрузку страницы
  private static readonly VOLUME_KEY = 'wls-ambience-volume';
  private static loadSavedVolume(): number {
    try {
      if (typeof localStorage === 'undefined') return 0.55;
      const raw = localStorage.getItem(GrimdarkAmbience.VOLUME_KEY);
      if (raw === null) return 0.55;
      const v = parseFloat(raw);
      if (!Number.isFinite(v)) return 0.55;
      return Math.max(0, Math.min(1, v));
    } catch {
      return 0.55;
    }
  }

  constructor() {
    // Восстанавливаем громкость из прошлой сессии; если игрок выкрутил её в 0 —
    // поднимаем до слышимого минимума (иначе «музыка не играет» навсегда).
    const saved = GrimdarkAmbience.loadSavedVolume();
    this.volume = saved <= 0 ? 0.55 : Math.max(0.1, saved);
  }

  /**
   * Разблокировать AudioContext для ОДНОРАЗОВЫХ звуков (колокол года, клики)
   * из обработчика реального пользовательского жеста. Фоновую музыку НЕ
   * запускает — она управляется только кнопкой вкл/выкл (v0.3.69).
   */
  resumeContextOnly(): void {
    if (!this.init()) return;
    const ctx = this.audioContext;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => { /* попробуем при следующем жесте */ });
    }
  }

  // Универсальная разблокировка звука: вызывать из обработчиков реальных
  // пользовательских жестов (клик/нажатие клавиши). Идемпотентно.
  // v0.3.69: если игрок сам выключил музыку кнопкой (userPaused) — жесты её
  // больше НЕ включают. Музыка управляется только кнопкой вкл/выкл.
  unlockOnUserGesture(): void {
    if (this.userPaused) return;
    if (!this.init()) return;
    const ctx = this.audioContext;
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (!this.isPlaying && !this.userPaused) this.start();
      }).catch(() => { /* попробуем при следующем жесте */ });
    } else if (!this.isPlaying) {
      this.start();
    }
  }

  // Если автозапуск был заблокирован политикой браузера (autoplay policy),
  // стартуем при первом пользовательском действии (клик/клавиша).
  private pendingGestureStart = false;
  private gestureListener: (() => void) | null = null;

  init(): boolean {
    // Переиспользуем существующий контекст, даже если он suspended:
    // браузеры создают AudioContext до жеста пользователя именно в suspended.
    if (this.audioContext) {
      if (this.audioContext.state === 'closed') {
        this.audioContext = null;
        this.masterGain = null;
      } else {
        return true;
      }
    }

    try {
      const Ctx = window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return false;
      this.audioContext = new Ctx();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      // master → compressor → destination: мягкий лимитер вместо прямого подключения
      const comp = this.audioContext.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 24;
      comp.ratio.value = 6;
      comp.attack.value = 0.004;
      comp.release.value = 0.25;
      this.compressor = comp;
      this.masterGain.connect(comp);
      comp.connect(this.audioContext.destination);
      // v0.4.3 «Соборный реверб»: параллельная шина ConvolverNode поверх
      // компрессора — все мелодические слои и UI-звуки получают общий
      // «соборный» хвост, музыка склеивается в единое пространство.
      this.buildReverbBus(this.audioContext, comp);
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      this.audioContext = null;
      this.masterGain = null;
      return false;
    }
  }

  /** Процедурный импульсный отклик готического собора (~2.6 с хвоста). */
  private static createCathedralIR(ctx: AudioContext): AudioBuffer {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 2.6);
    const preDelay = Math.floor(sr * 0.045);
    const ir = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      // Ранние отражения — дискретные «столпы» свода
      const early = [0.011, 0.019, 0.027, 0.038, 0.047];
      early.forEach((tSec, i) => {
        const idx = Math.floor(tSec * sr) + preDelay;
        if (idx < len) data[idx] += (i % 2 === ch % 2 ? 0.5 : -0.5) / (i + 1);
      });
      // Диффузный хвост: шум с экспоненциальным затуханием + лёгкий lowpass
      let lp = 0;
      for (let i = preDelay; i < len; i++) {
        const t = (i - preDelay) / (len - preDelay);
        lp = lp * 0.62 + (Math.random() * 2 - 1) * 0.38; // грубая ФЧХ-фильтрация хвоста
        data[i] += lp * Math.exp(-4.6 * t);
      }
    }
    // Нормировка, чтобы реверб не раздувал мастер
    let peak = 0;
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
    }
    if (peak > 0) {
      const k = 0.5 / peak;
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < d.length; i++) d[i] *= k;
      }
    }
    return ir;
  }

  /** Собирает реверб-шину и темпо-синхронную эхо-шину солиста. */
  private buildReverbBus(ctx: AudioContext, dest: AudioNode): void {
    try {
      const conv = ctx.createConvolver();
      conv.buffer = GrimdarkAmbience.createCathedralIR(ctx);
      conv.normalize = true;
      const ret = ctx.createGain();
      ret.gain.value = 0.34;
      // Хвост тоже мягко фильтруем — без «песка» на высоких
      const damp = ctx.createBiquadFilter();
      damp.type = 'lowpass';
      damp.frequency.value = 3200;
      conv.connect(damp);
      damp.connect(ret);
      ret.connect(dest);
      this.reverb = conv;
      this.reverbReturn = ret;

      // Эхо-шина арпеджио: delay подстраивается под темп в playThemeArpeggio.
      const echoIn = ctx.createGain();
      const echo = ctx.createDelay(2.0);
      echo.delayTime.value = 0.5;
      const fb = ctx.createGain();
      fb.gain.value = 0.28;
      const eLp = ctx.createBiquadFilter();
      eLp.type = 'lowpass';
      eLp.frequency.value = 900;
      echoIn.connect(echo);
      echo.connect(eLp);
      eLp.connect(fb);
      fb.connect(echo);
      eLp.connect(dest);
      this.trackEchoIn = echoIn;
      this.trackEchoDelay = echo;
    } catch {
      // WebAudio без Convolver (древние браузеры) — просто сухая работа
      this.reverb = null;
      this.reverbReturn = null;
      this.trackEchoIn = null;
      this.trackEchoDelay = null;
    }
  }

  /**
   * v0.4.3: универсальная отправка узла в соборный реверб. Вызывать из
   * каждого генератора звуков: `this.sendToReverb(gainNode, 0.25)`.
   */
  private sendToReverb(node: AudioNode, amount = 0.22): void {
    if (!this.reverb || !this.audioContext) return;
    const send = this.audioContext.createGain();
    send.gain.value = amount;
    node.connect(send);
    send.connect(this.reverb);
  }

  private armGestureAutostart() {
    if (typeof window === 'undefined' || this.pendingGestureStart) return;
    if (this.userPaused) return; // игрок выключил музыку — не включаем её жестами
    this.pendingGestureStart = true;
    this.gestureListener = () => {
      this.disarmGestureAutostart();
      if (!this.isPlaying && !this.userPaused) {
        this.start();
      }
    };
    window.addEventListener('pointerdown', this.gestureListener);
    window.addEventListener('keydown', this.gestureListener);
  }

  private disarmGestureAutostart() {
    this.pendingGestureStart = false;
    if (this.gestureListener) {
      window.removeEventListener('pointerdown', this.gestureListener);
      window.removeEventListener('keydown', this.gestureListener);
      this.gestureListener = null;
    }
  }

  start() {
    if (this.isPlaying) return;
    // v0.3.69: игрок явно выключил музыку кнопкой — не стартуем сами.
    if (this.userPaused) return;

    this.init();

    if (!this.audioContext || !this.masterGain) return;

    if (this.audioContext.state === 'suspended') {
      // resume() сработает только из пользовательского жеста; если браузер
      // отказал — вооружаем автозапуск на первый клик/нажатие клавиши.
      this.audioContext.resume()
        .then(() => {
          this.doStart();
        })
        .catch((error) => {
          console.warn('Audio resume blocked by autoplay policy; waiting for user gesture.', error);
          this.isPlaying = false;
          this.armGestureAutostart();
        });
    } else {
      this.doStart();
    }
  }

  private doStart() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.createDrone();
    this.createNoise();
    this.createWindLayer();
    this.createWhisperLayer();
    this.createLFO();
    this.startMelodicEvents();
  }

  private createDrone() {
    if (!this.audioContext || !this.masterGain) return;

    const baseFreqs = [
      27.5, 55, 55.1, 55.2, 55.3, 55.4, 55.5,
      82.4, 82.5, 110, 110.1, 146.8, 164.8, 220, 293.7,
    ];
    
    baseFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      const panner = this.audioContext!.createStereoPanner();
      
      osc.type = i < 6 ? 'sawtooth' : i < 10 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      
      const panPosition = (i % 2 === 0 ? -1 : 1) * (0.3 + (i % 4) * 0.15);
      panner.pan.value = panPosition;
      
      gain.gain.value = 0.02 / (i + 1);
      
      const filter = this.audioContext!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 120 + i * 25;
      filter.Q.value = 2;
      
      const lfo = this.audioContext!.createOscillator();
      const lfoGain = this.audioContext!.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.06 + i * 0.012;
      lfoGain.gain.value = 30;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      
      const lfo2 = this.audioContext!.createOscillator();
      const lfo2Gain = this.audioContext!.createGain();
      lfo2.type = 'sine';
      lfo2.frequency.value = 0.03 + i * 0.008;
      lfo2Gain.gain.value = 0.005;
      lfo2.connect(lfo2Gain);
      lfo2Gain.connect(gain.gain);
      lfo2.start();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain!);
      
      osc.start();
      this.oscillators.push(osc, lfo, lfo2);
      this.gains.push(gain);
    });

    const pad = this.audioContext.createOscillator();
    const padGain = this.audioContext.createGain();
    const padFilter = this.audioContext.createBiquadFilter();
    const padPanner = this.audioContext.createStereoPanner();
    
    pad.type = 'sine';
    pad.frequency.value = 73.4;
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 90;
    padFilter.Q.value = 3;
    padPanner.pan.value = 0;
    padGain.gain.value = 0.05;
    
    const padLfo = this.audioContext.createOscillator();
    const padLfoGain = this.audioContext.createGain();
    padLfo.type = 'sine';
    padLfo.frequency.value = 0.03;
    padLfoGain.gain.value = 2;
    padLfo.connect(padLfoGain);
    padLfoGain.connect(pad.frequency);
    padLfo.start();
    
    pad.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(padPanner);
    padPanner.connect(this.masterGain);
    pad.start();
    
    const pad2 = this.audioContext.createOscillator();
    const pad2Gain = this.audioContext.createGain();
    const pad2Filter = this.audioContext.createBiquadFilter();
    const pad2Panner = this.audioContext.createStereoPanner();
    
    pad2.type = 'triangle';
    pad2.frequency.value = 55;
    pad2Filter.type = 'lowpass';
    pad2Filter.frequency.value = 70;
    pad2Filter.Q.value = 3.5;
    pad2Panner.pan.value = -0.4;
    pad2Gain.gain.value = 0.04;
    
    pad2.connect(pad2Filter);
    pad2Filter.connect(pad2Gain);
    pad2Gain.connect(pad2Panner);
    pad2Panner.connect(this.masterGain);
    pad2.start();
    
    const pad3 = this.audioContext.createOscillator();
    const pad3Gain = this.audioContext.createGain();
    const pad3Filter = this.audioContext.createBiquadFilter();
    const pad3Panner = this.audioContext.createStereoPanner();
    
    pad3.type = 'sine';
    pad3.frequency.value = 36.7;
    pad3Filter.type = 'lowpass';
    pad3Filter.frequency.value = 50;
    pad3Filter.Q.value = 4;
    pad3Panner.pan.value = 0.4;
    pad3Gain.gain.value = 0.035;
    
    pad3.connect(pad3Filter);
    pad3Filter.connect(pad3Gain);
    pad3Gain.connect(pad3Panner);
    pad3Panner.connect(this.masterGain);
    pad3.start();
    
    this.oscillators.push(pad, padLfo, pad2, pad3);
    this.gains.push(padGain, pad2Gain, pad3Gain);
  }

  private createNoise() {
    if (!this.audioContext || !this.masterGain) return;

    const bufferSize = this.audioContext.sampleRate * 6;
    
    const pinkBuffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = pinkBuffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }

    this.noiseNode = this.audioContext.createBufferSource();
    this.noiseNode.buffer = pinkBuffer;
    this.noiseNode.loop = true;

    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 250;
    noiseFilter.Q.value = 0.8;
    this.noiseFilter = noiseFilter;

    const noiseLfo = this.audioContext.createOscillator();
    const noiseLfoGain = this.audioContext.createGain();
    noiseLfo.type = 'sine';
    noiseLfo.frequency.value = 0.03;
    noiseLfoGain.gain.value = 50;
    noiseLfo.connect(noiseLfoGain);
    noiseLfoGain.connect(noiseFilter.frequency);
    noiseLfo.start();

    this.noiseGain = this.audioContext.createGain();
    this.noiseGain.gain.value = 0.04;

    const delay = this.audioContext.createDelay();
    delay.delayTime.value = 0.3;
    const feedback = this.audioContext.createGain();
    feedback.gain.value = 0.4;
    const delayFilter = this.audioContext.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 800;

    this.noiseNode.connect(noiseFilter);
    noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    
    this.noiseGain.connect(delay);
    delay.connect(delayFilter);
    delayFilter.connect(feedback);
    feedback.connect(delay);
    delayFilter.connect(this.masterGain);

    this.noiseNode.start();
    this.oscillators.push(noiseLfo);
  }

  private createWindLayer() {
    if (!this.audioContext || !this.masterGain) return;

    const bufferSize = this.audioContext.sampleRate * 8;
    const buffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }
    }

    const windNode = this.audioContext.createBufferSource();
    windNode.buffer = buffer;
    windNode.loop = true;

    const windFilter = this.audioContext.createBiquadFilter();
    windFilter.type = 'highpass';
    windFilter.frequency.value = 2000;
    windFilter.Q.value = 0.5;

    const windLfo = this.audioContext.createOscillator();
    const windLfoGain = this.audioContext.createGain();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.07;
    windLfoGain.gain.value = 800;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start();

    const panner = this.audioContext.createStereoPanner();
    const panLfo = this.audioContext.createOscillator();
    const panLfoGain = this.audioContext.createGain();
    panLfo.type = 'sine';
    panLfo.frequency.value = 0.03;
    panLfoGain.gain.value = 0.8;
    panLfo.connect(panLfoGain);
    panLfoGain.connect(panner.pan);
    panLfo.start();

    const windGain = this.audioContext.createGain();
    windGain.gain.value = 0.016;

    windNode.connect(windFilter);
    windFilter.connect(panner);
    panner.connect(windGain);
    windGain.connect(this.masterGain);

    windNode.start();
    this.windNode = windNode;
    this.oscillators.push(windLfo, panLfo);
  }

  private createWhisperLayer() {
    if (!this.audioContext || !this.masterGain) return;

    const bufferSize = this.audioContext.sampleRate * 10;
    const buffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.05;
      }
    }

    const whisperNode = this.audioContext.createBufferSource();
    whisperNode.buffer = buffer;
    whisperNode.loop = true;

    const whisperFilter = this.audioContext.createBiquadFilter();
    whisperFilter.type = 'bandpass';
    whisperFilter.frequency.value = 4000;
    whisperFilter.Q.value = 2;

    const whisperLfo = this.audioContext.createOscillator();
    const whisperLfoGain = this.audioContext.createGain();
    whisperLfo.type = 'sine';
    whisperLfo.frequency.value = 0.05;
    whisperLfoGain.gain.value = 1000;
    whisperLfo.connect(whisperLfoGain);
    whisperLfoGain.connect(whisperFilter.frequency);
    whisperLfo.start();

    const whisperGain = this.audioContext.createGain();
    whisperGain.gain.value = 0.008;

    whisperNode.connect(whisperFilter);
    whisperFilter.connect(whisperGain);
    whisperGain.connect(this.masterGain);
    this.whisperGainNode = whisperGain;

    whisperNode.start();
    this.whisperNode = whisperNode;
    this.oscillators.push(whisperLfo);
  }

  private createLFO() {
    if (!this.audioContext || !this.masterGain) return;

    this.lfo = this.audioContext.createOscillator();
    this.lfoGain = this.audioContext.createGain();
    
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.05;
    this.lfoGain.gain.value = 0.02;
    
    this.lfo.connect(this.lfoGain);
    
    if (this.gains.length > 0) {
      this.lfoGain.connect(this.gains[0].gain);
    }
    
    this.lfo.start();
  }

  /**
   * Маршрутизация мелодических событий по четырём направлениям гримдарка
   * (v0.3.73, ТЗ пользователя):
   *  • normal — «зловещий эмбиент и пустота»: редкие струнные аккорды, колокола, гул;
   *  • tense  — «кибер-готика / индастриал»: церковный орган поверх скрежета механизмов;
   *  • danger — «дарк-электро» (в духе Darktide): дисторшн-бас, индустриальные удары,
   *    церковные колокола; далёкая артиллерия живёт отдельно в setMood('danger');
   *  • epic   — «оркестровый пафос»: литавры и псевдо-латинский хор.
   */
  private pickMoodEvent(mood: 'normal' | 'tense' | 'danger' | 'epic'): () => void {
    const r = Math.random();
    if (mood === 'epic') {
      // Оркестровый пафос: струнный накат + литавры, хор, акцент литавр,
      // триумфальный аккорд темы, колокол
      if (r < 0.25) return () => this.playEpicSwell();
      if (r < 0.45) return () => this.playLatinChoir();
      if (r < 0.7) return () => this.playTimpaniRoll();
      if (r < 0.88) return () => this.playChord();
      return () => this.playBellTone();
    }
    if (mood === 'danger') {
      // Дарк-электро: грязный бас, стена удара, колокола отчаяния
      if (r < 0.45) return () => this.playDistortedBassHit();
      if (r < 0.7) return () => this.playIndustrialPercussion();
      if (r < 0.85) return () => this.playBellTone();
      return () => this.playDeepPulse();
    }
    if (mood === 'tense') {
      // Кибер-готика: орган, скрежет, шёпоты варпа, редкий низкий аккорд
      if (r < 0.45) return () => this.playPipeOrgan();
      if (r < 0.7) return () => this.playMetalCreak();
      if (r < 0.85) return () => this.playWhisperSurge();
      return () => this.playChord();
    }
    // normal — дарк-эмбиент: одиночные ноты, аккорды, эхо, звон механизмов
    if (r < 0.3) return () => this.playDarkNote();
    if (r < 0.52) return () => this.playChord();
    if (r < 0.7) return () => this.playAtmospheric();
    if (r < 0.82) return () => this.playBellTone();
    if (r < 0.92) return () => this.playMechanismClank();
    return () => this.playDeepPulse();
  }

  /**
   * v0.3.83 «Полноценный трек»: темп трека (удара пульса) по настроениям.
   * danger ≈ 100 BPM, tense ≈ 79, normal ≈ 62, epic ≈ 70 — музыка идёт
   * ровным метром, а не разрозненными звуками.
   */
  private static readonly MOOD_TEMPO: Record<'normal' | 'tense' | 'danger' | 'epic', number> = {
    normal: 960,
    tense: 760,
    danger: 600,
    epic: 850,
  };

  /**
   * Форма трека: гармонический оборот MOOD_THEMES (4accf6d1 «Тема») теперь
   * привязан к барам, а не к числу сыгранных фраз: одна смена аккорда =
   * один бар. Мелодические фразы вписываются в сетку баров и звучат
   * синхронно с басом и пульсом — как связный трек, а не случайные звуки.
   */
  private trackBar = 0;
  private phraseUntilBar = 0;
  private nextPhraseAtBar = 1;
  private lastPhraseBar = -1;
  private bassBeat = 0;

  private startMelodicEvents() {
    this.trackBar = 0;
    this.phraseUntilBar = 0;
    this.nextPhraseAtBar = 1;
    this.lastPhraseBar = -1;
    this.bassBeat = 0;
    // Первый бар — сразу, дальше сетка сама себя перезапускает.
    this.playTrackBar();
    this.scheduleBarTick();
  }

  /** Один бар трека: гармония + пульс (4 удара по сетке) + бас + фраза. */
  private playTrackBar(): void {
    if (!this.isPlaying || !this.audioContext || !this.masterGain) return;
    const beatMs = GrimdarkAmbience.MOOD_TEMPO[this.currentMood];
    const beatsPerBar = this.currentMood === 'normal' ? 8 : 4;

    this.trackBar++;
    // Смена гармонии строго раз в бар — ладовая тема дышит тактами.
    if (this.trackBar > this.phraseUntilBar) {
      this.playThemePad();
      this.phraseUntilBar = this.trackBar;
    }
    // Ровный пульс конвейера (в danger — бочина Darktide, в epic — литавры).
    // Удары планируются в будущее время AudioContext — точная сетка, не залп.
    for (let b = 0; b < beatsPerBar; b++) {
      this.playTrackPulse(b === 0, b, b * (beatMs / 1000));
    }
    // Непрерывное бас-остинато: держит трек «треком», даже когда фраз молчат
    this.playBassOstinato(beatsPerBar * beatMs);
    // Мелодическая фраза — поплотнее в напряжении, пореже в покое
    if (this.trackBar >= this.nextPhraseAtBar && this.lastPhraseBar !== this.trackBar) {
      // v0.3.83 «Полноценный трек»: перед характерным звуком настроения
      // звучит арпеджио ТЕКУЩЕГО аккорда темы, ровно по долям бара. Это
      // связующая мелодическая линия: набор эффектов превращается в трек,
      // потому что солист играет ту же гармонию, что пад и бас.
      this.playThemeArpeggio(beatMs / 1000);
      this.pickMoodEvent(this.currentMood)();
      this.lastPhraseBar = this.trackBar;
      const density = this.currentMood === 'danger' ? [1, 2]
        : this.currentMood === 'tense' ? [2, 3]
        : this.currentMood === 'epic' ? [2, 4]
        : [3, 6];
      this.nextPhraseAtBar = this.trackBar + density[Math.floor(Math.random() * density.length)];
    }
  }

  /** Тик сетки: ровно один бар за срабатывание таймера. */
  private scheduleBarTick() {
    if (!this.isPlaying) return;
    const beatMs = GrimdarkAmbience.MOOD_TEMPO[this.currentMood];
    const beatsPerBar = this.currentMood === 'normal' ? 8 : 4;
    this.intervalId = setTimeout(() => {
      this.playTrackBar();
      this.scheduleBarTick();
    }, beatMs * beatsPerBar);
  }

  /**
   * Удар сетки трека: route по настроению — normal/epic мягче, danger —
   * электронная бочина, tense — лязг конвейера на слабые доли.
   * `offsetSec` — сдвиг удара внутри бара (сетка 4/4, а не залп).
   */
  private playTrackPulse(accent: boolean, beatInBar: number, offsetSec: number): void {
    if (!this.audioContext || !this.masterGain) return;
    const mood = this.currentMood;
    const weakElectronic = mood === 'danger';
    const weakIndustrial = mood === 'tense' && !accent;
    if (weakElectronic || weakIndustrial) {
      this.playIndustrialKick(accent, offsetSec);
      return;
    }
    if (mood === 'epic') {
      // Литавровый бой: сильная доля — заметно, слабые — приглушённо
      this.playTimpaniTick(accent ? 0.1 : 0.045, offsetSec);
      return;
    }
    // normal: глубокий пульс только на сильную долю, лязг механизма — на «3».
    // Оба звука планируются в будущее время AudioContext (offsetSec) — точная
    // сетка трека без дребезга setTimeout.
    if (accent) this.playDeepPulseAt(offsetSec);
    else if (beatInBar % 4 === 2) this.playMechanismClankAt(offsetSec);
  }

  /** Пульс-метроном эмбиента: три низких «удара сердца» с сетки бара. */
  private playDeepPulseAt(offsetSec: number): void {
    if (!this.audioContext || !this.masterGain) return;
    const ctx = this.audioContext;
    const base = ctx.currentTime + 0.02 + offsetSec;
    for (let i = 0; i < 3; i++) {
      const t = base + i * 0.45;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(58 - i * 6, t);
      lp.type = 'lowpass';
      lp.frequency.value = 110;
      lp.Q.value = 1.8;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.07 / (i * 0.5 + 1), t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(lp);
      lp.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.45);
    }
  }

  /** Лязг механизма на слабой доле — ровно по сетке (будущее время ctx). */
  private playMechanismClankAt(offsetSec: number): void {
    if (!this.audioContext || !this.masterGain) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime + 0.02 + offsetSec;
    const freq = 180 + Math.random() * 240;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2.76;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = freq * 3;
    bandpass.Q.value = 6;

    osc.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.35);
    osc2.start(now);
    osc2.stop(now + 0.35);
  }

  /**
   * Электронная бочина (Darktide): синус 150→48 Гц с быстрой атакой —
   * четырёхчетвертный пульс опасности.
   */
  private playIndustrialKick(accent: boolean, offsetSec: number): void {
    if (!this.audioContext || !this.masterGain) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime + 0.01 + offsetSec;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(46, now + 0.11);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(accent ? 0.13 : 0.07, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** Короткий литавровый удар сетки эпика (без длинного ролла). */
  private playTimpaniTick(level: number, offsetSec: number): void {
    if (!this.audioContext || !this.masterGain) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime + 0.01 + offsetSec;
    const themeRoot = GrimdarkAmbience.MOOD_THEMES[this.currentMood][0][0];
    const f = 55 * Math.pow(2, themeRoot / 12);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(f, now + 0.18);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(level, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  /**
   * Бас-остинато: два низких удара за бар от корня ТЕКУЩЕГО оборота темы —
   * непрерывная пульсирующая линия, которая и делает набор звуков треком.
   */
  private playBassOstinato(barMs: number): void {
    if (!this.audioContext || !this.masterGain) return;
    const ctx = this.audioContext;
    // peekThemeChord возвращает частоты от 55 Гц; делим на 2 — бас на октаву
    // ниже пада, чтобы остинато читалось как отдельный слой микса.
    const chord = this.peekThemeChord();
    const rootFreq = chord[0] / 2;
    const fifthFreq = (chord[1] ?? chord[0] * 1.5) / 2;
    const hits: Array<[number, number]> = [
      [0, rootFreq],
      [barMs * 0.5, this.bassBeat % 2 === 0 ? fifthFreq : rootFreq],
    ];
    this.bassBeat++;
    const now = ctx.currentTime + 0.01;
    hits.forEach(([offsetMs, freq]) => {
      const t = now + offsetMs / 1000;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      lp.type = 'lowpass';
      lp.frequency.value = 160;
      lp.Q.value = 1.5;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.075, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.connect(lp);
      lp.connect(g);
      g.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  /** Аккордовый пад текущего оборота темы (без продвижения сетки). */
  private peekThemeChord(): number[] {
    const theme = GrimdarkAmbience.MOOD_THEMES[this.currentMood];
    const step = this.trackBar % theme.length;
    const octaveShift = Math.floor(this.trackBar / theme.length) % 2 === 1 ? 12 : 0;
    return theme[step].map((semi) => 55 * Math.pow(2, (semi + octaveShift) / 12));
  }

  /**
   * v0.3.83 «Полноценный трек»: мелодическое арпеджио по аккорду текущей
   * темы — ноты ровно по долям бара (каждая на всю долю), мягкая атака и
   * длинное затухание, тёплый фильтр, лёгкое эхо. Солист играет ту же
   * гармонию, что пад и бас-остинато: музыка слышится цельным треком, а
   * не набором резких звуков. В danger — на октаву ниже и глуше (басовая
   * линия электро), в epic — на октаву выше (струнная кантилена).
   */
  private playThemeArpeggio(beatSec: number): void {
    if (!this.audioContext || !this.masterGain) return;
    const ctx = this.audioContext;
    const mood = this.currentMood;
    // Ритмический рисунок фразы: доли внутри бара, на которых звучит нота
    // (4/4 — все четыре доли; normal с 8-долевым баром — зыбкие 1, 3, 6).
    const pattern: Array<[number, boolean]> =
      mood === 'normal' ? [[0, true], [2, false], [5, false]]
      : mood === 'epic' ? [[0, true], [1, false], [2, true], [3, false]]
      : [[0, true], [1, false], [2, false], [3, false]];
    const chord = this.peekThemeChord();
    // Октавный регистр солиста по настроению.
    const regMul = mood === 'danger' ? 0.5 : mood === 'epic' ? 4 : 2;
    const levelBase = mood === 'danger' ? 0.028 : mood === 'epic' ? 0.05 : 0.04;
    const cutoff = mood === 'tense' ? 900 : mood === 'danger' ? 500 : 1200;
    const now = ctx.currentTime + 0.02;

    // v0.4.3 «Соборный реверб»: эхо солиста — общая темпо-синхронная шина
    // (задержка ровно = 3/4 доли), перестроенная под текущий темп настроения.
    // Раньше delay создавался заново на каждый бар и протекал в мастер без
    // фильтра обратной связи — лишние узлы и «грязный» повтор.
    let echoSend: GainNode | null = null;
    if (this.trackEchoIn) {
      const t = Math.min(2.0, beatSec * 0.75);
      if (this.trackEchoDelay) {
        this.trackEchoDelay.delayTime.setTargetAtTime(t, ctx.currentTime, 0.25);
      }
      echoSend = this.trackEchoIn;
    }

    pattern.forEach(([beatIdx, accent], i) => {
      // Ход по аккорду вверх-вниз (root → 3rd → 5th → oct…), синкопа
      // опускает ноту на ступень лада для певучести.
      const deg = (i + (accent ? 0 : 1)) % chord.length;
      let freq = chord[deg] * regMul;
      if (!accent && Math.random() < 0.5) freq *= 0.89; // ♭2 ступень — певучий «вздох»
      const t = now + beatIdx * beatSec;
      const dur = beatSec * (accent ? 1.9 : 1.5);

      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      const panner = ctx.createStereoPanner();
      osc.type = mood === 'epic' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.value = (Math.random() - 0.5) * 5;
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(cutoff, t);
      lp.Q.value = 0.8;
      panner.pan.value = (i % 2 === 0 ? -1 : 1) * 0.35;
      const lvl = (accent ? levelBase : levelBase * 0.65);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(lvl, t + beatSec * 0.35); // мягкая, «струнная» атака
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(lp);
      lp.connect(g);
      g.connect(panner);
      panner.connect(this.masterGain!);
      if (echoSend) g.connect(echoSend); // темпо-эхо вместо локального delay
      this.sendToReverb(g, 0.18);        // соборный хвост солиста
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  }

  /**
   * Гармония трека: аккорд текущего оборота темы на весь бар — медленная
   * атака, длинное дыхание, тёплый эхолог собора. Это «подушка», поверх
   * которой поют фразы; раньше гармония менялась с каждой фразой вразнобой
   * с пульсом, теперь — синхронно с сеткой.
   */
  private playThemePad(): void {
    if (!this.audioContext || !this.masterGain) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const beatMs = GrimdarkAmbience.MOOD_TEMPO[this.currentMood];
    const duration = ((beatMs / 1000) * (this.currentMood === 'normal' ? 8 : 4)) + 0.8;
    const chord = this.peekThemeChord();

    const padDelay = ctx.createDelay();
    padDelay.delayTime.value = 0.28;
    const padFeedback = ctx.createGain();
    padFeedback.gain.value = 0.3;
    const padDelayFilter = ctx.createBiquadFilter();
    padDelayFilter.type = 'lowpass';
    padDelayFilter.frequency.value = 750;
    padDelay.connect(padDelayFilter);
    padDelayFilter.connect(padFeedback);
    padFeedback.connect(padDelay);
    padDelayFilter.connect(this.masterGain);

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const panner = ctx.createStereoPanner();

      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 6;
      panner.pan.value = (i - 1) * 0.5;

      filter.type = 'lowpass';
      filter.frequency.value = 420 + i * 90;
      filter.Q.value = 1.2;

      const level = 0.05 / (i * 0.7 + 1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(level, now + duration * 0.3);
      gain.gain.linearRampToValueAtTime(level * 0.75, now + duration * 0.7);
      gain.gain.linearRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain!);
      gain.connect(padDelay);
      this.sendToReverb(gain, 0.25); // v0.4.3 соборный хвост пада

      osc.start(now);
      osc.stop(now + duration + 0.1);
    });
  }

  // ---------- v0.3.73: новые слои по четырём направлениям гримдарка ----------

  /**
   * Кирка по ржавой балке — короткий металлический лязг (скиталец Адептус
   * Механикус). Случайная высота тона, чтобы не звучало как метроном.
   */
  playMechanismClank(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime + 0.02;
    const freq = 180 + Math.random() * 240;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2.76; // фальшивый частичный тон — «колокольный» лязг

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = freq * 3;
    bandpass.Q.value = 6;

    const panner = ctx.createStereoPanner();
    panner.pan.value = (Math.random() - 0.5) * 1.2;

    osc.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.4);
    osc2.start(now);
    osc2.stop(now + 0.4);
  }

  /**
   * Тяжёлый церковный орган (кибер-готика / Mechanicus): ряд труб —
   * основной тон + октава/квинта/кварта, медленная атака, длинный хвост
   * через feedback-delay, имитирующий гул собора.
   */
  private playPipeOrgan(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const duration = 5 + Math.random() * 3;
    const roots = [55, 61.74, 65.41, 73.42];
    const root = roots[Math.floor(Math.random() * roots.length)];
    const pipes = [root, root * 2, root * 3, root * 4];

    const organDelay = ctx.createDelay();
    organDelay.delayTime.value = 0.42;
    const organFeedback = ctx.createGain();
    organFeedback.gain.value = 0.32;
    const organDelayFilter = ctx.createBiquadFilter();
    organDelayFilter.type = 'lowpass';
    organDelayFilter.frequency.value = 900;
    organDelay.connect(organDelayFilter);
    organDelayFilter.connect(organFeedback);
    organFeedback.connect(organDelay);
    organDelayFilter.connect(this.masterGain);

    pipes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
      osc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.004);

      const oscGain = ctx.createGain();
      const level = 0.03 / (i + 1);
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(level, now + 1.2);
      oscGain.gain.setValueAtTime(level, now + Math.max(1.2, duration - 2));
      oscGain.gain.linearRampToValueAtTime(0, now + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600 + i * 250;
      filter.Q.value = 1.2;

      const panner = ctx.createStereoPanner();
      panner.pan.value = (i - 1.5) * 0.35;

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(panner);
      panner.connect(this.masterGain!);
      panner.connect(organDelay);
      this.sendToReverb(panner, 0.4); // v0.4.3 орган гудит в соборе

      osc.start(now);
      osc.stop(now + duration + 0.1);
    });
  }

  /**
   * Металлический скрежет (индастриал): шум через узкий bandpass, ползущий
   * вверх по спектру — звук тормозящей шестерни или скрипящей переборки.
   */
  private playMetalCreak(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const duration = 1.6 + Math.random() * 1.4;

    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.min(1, i / (data.length * 0.1)) * Math.exp(-i / (data.length * 0.6));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(900, now);
    bandpass.frequency.exponentialRampToValueAtTime(2600, now + duration);
    bandpass.Q.value = 14;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const panner = ctx.createStereoPanner();
    panner.pan.value = (Math.random() - 0.5) * 1.4;

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    noise.start(now);
  }

  /**
   * Хор на псевдо-латыни (эпика): вокальные форманты a-o-u в три голоса
   * (бас/баритон/тенор), медленная атака, тяжёлое эхо собора.
   * Звучит как молитва миллиардов.
   */
  private playLatinChoir(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const duration = 6 + Math.random() * 3;
    // v0.3.75: хор поёт текущий оборот темы (корень на октаву выше баса),
    // чтобы эпические партии звучали как одна тема, а не случайный набор.
    const chord = this.nextThemeChord();
    const root = chord[0] * 2;
    // «Слоги» псевдо-латыни — гласные форманты: A, O, U
    const vowels: Array<[number, number]> = [[720, 1100], [420, 780], [320, 720]];

    const choirDelay = ctx.createDelay();
    choirDelay.delayTime.value = 0.33;
    const choirFeedback = ctx.createGain();
    choirFeedback.gain.value = 0.38;
    const choirFilter = ctx.createBiquadFilter();
    choirFilter.type = 'lowpass';
    choirFilter.frequency.value = 1400;
    choirDelay.connect(choirFilter);
    choirFilter.connect(choirFeedback);
    choirFeedback.connect(choirDelay);
    choirFilter.connect(this.masterGain);

    // Голоса хора — аккордовые тоны текущей темы (без «тритона» 1.5x)
    const voices = [chord[0], chord[1] ?? chord[0] * 1.5, chord[2] ?? chord[0] * 2];
    voices.forEach((freq, vi) => {
      const syllables = 3;
      const sylLen = duration / syllables;
      for (let s = 0; s < syllables; s++) {
        const t = now + s * sylLen;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.006);

        const vowel = vowels[(s + vi) % vowels.length];
        const formant1 = ctx.createBiquadFilter();
        formant1.type = 'bandpass';
        formant1.frequency.value = vowel[0];
        formant1.Q.value = 7;
        const formant2 = ctx.createBiquadFilter();
        formant2.type = 'bandpass';
        formant2.frequency.value = vowel[1];
        formant2.Q.value = 9;

        const g = ctx.createGain();
        const level = 0.022 / (vi * 0.5 + 1);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(level, t + sylLen * 0.25);
        g.gain.linearRampToValueAtTime(level * 0.7, t + sylLen * 0.75);
        g.gain.linearRampToValueAtTime(0.0001, t + sylLen * 0.98);

        const panner = ctx.createStereoPanner();
        panner.pan.value = (vi - 1) * 0.5;

        osc.connect(formant1);
        formant1.connect(formant2);
        formant2.connect(g);
        g.connect(panner);
        panner.connect(this.masterGain!);
        panner.connect(choirDelay);
        this.sendToReverb(panner, 0.45); // v0.4.3 хор поёт в соборе

        osc.start(t);
        osc.stop(t + sylLen);
      }
    });
  }

  /**
   * Литавры (эпика): синус с проседающей частотой + шумовой удар колотушки,
   * нарастающий ритмический рисунок — накатывает полк.
   */
  private playTimpaniRoll(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    let t = ctx.currentTime + 0.05;
    const hits = 4 + Math.floor(Math.random() * 3);
    let gap = 0.5;

    // v0.4.3: шум колотушки — ОДИН пре-композированный буфер на весь темп.
    // Раньше новый буфер записывался в главном потоке на каждый удар —
    // на слабых устройствах это давало «щелчки» и пропуски сетки посреди
    // фразы (заметный дефект звучания, а не только CPU).
    if (!this.rollBuffer) {
      const dur = 0.12;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let k = 0; k < data.length; k++) {
        data[k] = (Math.random() * 2 - 1) * Math.exp(-k / (data.length * 0.2));
      }
      this.rollBuffer = buffer;
    }

    for (let i = 0; i < hits; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      // v0.3.75: литавры строим от корня текущей темы — эпика звучит
      // как оркестровая сюита в одной тональности, а не белый шум ударов.
      const themeRoot = GrimdarkAmbience.MOOD_THEMES[this.currentMood][0][0];
      const baseF = 55 * Math.pow(2, themeRoot / 12);
      const f = i % 2 === 0 ? baseF : baseF * 1.5;
      osc.frequency.setValueAtTime(f * 1.6, t);
      osc.frequency.exponentialRampToValueAtTime(f, t + 0.25);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

      osc.connect(g);
      g.connect(this.masterGain);
      this.sendToReverb(g, 0.3); // собор под литаврами
      osc.start(t);
      osc.stop(t + 1.2);

      // Шумовой «щелчок» колотушки — из общего буфера
      const noise = ctx.createBufferSource();
      noise.buffer = this.rollBuffer;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 400;
      const ng = ctx.createGain();
      ng.gain.value = 0.05;
      noise.connect(lp);
      lp.connect(ng);
      ng.connect(this.masterGain);
      noise.start(t);

      gap = Math.max(0.18, gap * 0.72);
      t += gap;
    }
  }

  /**
   * v0.3.75 «Оркестровый пафос»: струнный накат — три скрещенные пилы в
   * октавах текущего оборота темы через lowpass с нарастающей яркостью,
   * длинная атака и нисходящий темп; поверх — удар литавр в конце наката.
   */
  private playEpicSwell(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const chord = GrimdarkAmbience.MOOD_THEMES.epic[this.themeIndex % 4];
    const duration = 7;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(300, now);
    lp.frequency.linearRampToValueAtTime(2600, now + duration * 0.7);
    lp.frequency.linearRampToValueAtTime(900, now + duration);
    lp.Q.value = 0.7;

    const swellGain = ctx.createGain();
    swellGain.gain.setValueAtTime(0, now);
    swellGain.gain.linearRampToValueAtTime(0.05, now + duration * 0.65);
    swellGain.gain.linearRampToValueAtTime(0.0001, now + duration);

    lp.connect(swellGain);
    swellGain.connect(this.masterGain);
    this.sendToReverb(swellGain, 0.45); // v0.4.3 струнный накат — с соборным дыханием

    chord.forEach((semi, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 55 * Math.pow(2, semi / 12) * (i === 0 ? 2 : 4);
      osc.detune.value = (Math.random() - 0.5) * 8;
      const g = ctx.createGain();
      g.gain.value = 0.5 / (i + 1);
      osc.connect(g);
      g.connect(lp);
      osc.start(now);
      osc.stop(now + duration);
    });

    // Финальный акцент литавр на последней секунде наката
    setTimeout(() => this.playTimpaniRoll(), duration * 700);
  }

  /**
   * Грязный дисторшн-бас (дарк-электро / Darktide): пила через waveshaper
   * с сильной перегрузкой и lowpass — стена звука на два удара.
   */
  private playDistortedBassHit(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 1023) * 2 - 1;
      curve[i] = Math.tanh(4.5 * x); // мягкий, но грязный клиппинг
    }
    shaper.curve = curve;
    shaper.oversample = '4x';

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = 2.5;

    const out = ctx.createGain();
    out.gain.value = 0.9;

    shaper.connect(lp);
    lp.connect(out);
    out.connect(this.masterGain);

    for (let hit = 0; hit < 2; hit++) {
      const t = now + hit * 0.42;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      const f = 41 + Math.random() * 10;
      osc.frequency.setValueAtTime(f * 2.2, t);
      osc.frequency.exponentialRampToValueAtTime(f, t + 0.18);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.11, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(shaper);
      osc.start(t);
      osc.stop(t + 0.65);
    }
  }

  /**
   * Индустриальная перкуссия (дарк-электро): цепь бочек и лязгающих
   * акцентов — ритм конвейера улья.
   */
  private playIndustrialPercussion(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    let t = ctx.currentTime + 0.05;
    const pattern = [0.34, 0.34, 0.22, 0.34, 0.5];
    for (let i = 0; i < pattern.length; i++) {
      const kick = i % 2 === 0;
      const osc = ctx.createOscillator();
      osc.type = kick ? 'sine' : 'square';
      const f = kick ? 55 : 160 + Math.random() * 120;
      osc.frequency.setValueAtTime(kick ? 90 : f * 1.5, t);
      osc.frequency.exponentialRampToValueAtTime(f, t + 0.1);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(kick ? 0.1 : 0.035, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, t + (kick ? 0.4 : 0.18));

      const panner = ctx.createStereoPanner();
      panner.pan.value = kick ? 0 : (Math.random() - 0.5) * 1.2;

      osc.connect(g);
      g.connect(panner);
      panner.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.5);

      t += pattern[i];
    }
  }

  /**
   * Шёпот варпа проступает сквозь гул (tense): временное усиление слоя
   * шёпотов с последующим возвратом к текущему настроению.
   */
  private playWhisperSurge(): void {
    if (!this.audioContext || !this.whisperGainNode) return;
    const now = this.audioContext.currentTime;
    const s = GrimdarkAmbience.MOOD_SETTINGS[this.currentMood];
    const g = this.whisperGainNode.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(s.whisperGain * 3.5, now + 1.2);
    g.linearRampToValueAtTime(s.whisperGain, now + 4.5);
  }

  /**
   * v0.3.75: ладовая память саундтрека. Аккорды берутся из «текущей темы» —
   * гармонического оборота, который крутится по кругу и меняется только при
   * смене настроения. За игрой слышна связная музыкальная мысль, а не
   * случайный набор звуков. Ллады: эолийский (эмбиент), фригийский
   * (кибер-готика/индастриал), мажорные фанфары (эпика).
   */
  private static readonly MOOD_THEMES: Record<'normal' | 'tense' | 'danger' | 'epic', number[][]> = {
    // Дарк-эмбиент: эолийский лад, оборот i - VI - v - i
    normal: [[0, 3, 7], [8, 12, 15], [7, 10, 14], [0, 3, 8]],
    // Кибер-готика: фригийский лад со «зловещей» секундой bII
    tense: [[0, 1, 7], [5, 8, 12], [1, 5, 8], [0, 3, 6]],
    // Дарк-электро: остинатно bII - i - bII - bVII, качающий бас
    danger: [[1, 5, 8], [0, 3, 7], [1, 5, 8], [0, 1, 5]],
    // Оркестровый пафос: мажорные фанфары IV - V - I - vi
    epic: [[5, 9, 12], [7, 11, 14], [0, 4, 7], [9, 12, 16]],
  };

  private themeIndex = 0;

  /** Следующий оборот текущей темы (по кругу; каждые 4 оборота — сдвиг на октаву). */
  private nextThemeChord(): number[] {
    const theme = GrimdarkAmbience.MOOD_THEMES[this.currentMood];
    const step = this.themeIndex % theme.length;
    const octaveShift = Math.floor(this.themeIndex / theme.length) % 2 === 1 ? 12 : 0;
    this.themeIndex++;
    return theme[step].map((semi) => 55 * Math.pow(2, (semi + octaveShift) / 12));
  }

  private playDarkNote() {
    if (!this.audioContext || !this.masterGain) return;

    // v0.3.75: одиночные ноты эмбиента звучат в ладу ТЕКУЩЕЙ темы —
    // фригийский лад для кибер-готики/индастриала, эолийский для покоя,
    // мажорный для эпика. Сольные линии больше не фальшивят аккордам.
    const MOOD_SCALES: Record<string, number[]> = {
      normal: [0, 2, 3, 5, 7, 8, 10],
      tense: [0, 1, 3, 5, 7, 8, 10],
      danger: [0, 1, 3, 5, 7, 8, 10],
      epic: [0, 2, 4, 5, 7, 9, 11],
    };
    const semis = MOOD_SCALES[this.currentMood] ?? MOOD_SCALES.normal;
    const octaves = [1, 2];
    const scale = octaves.flatMap((o) => semis.map((semi) => 55 * o * Math.pow(2, semi / 12)));
    
    const noteIndex = Math.floor(Math.random() * scale.length);
    const note = scale[noteIndex];
    const duration = 4 + Math.random() * 6;
    
    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    const panner = this.audioContext.createStereoPanner();
    
    const panPosition = (Math.random() - 0.5) * 1.5;
    panner.pan.value = panPosition;
    
    osc.type = Math.random() > 0.7 ? 'sine' : Math.random() > 0.4 ? 'triangle' : 'sawtooth';
    osc.frequency.value = note;
    
    filter.type = 'lowpass';
    filter.frequency.value = 250 + Math.random() * 300;
    filter.Q.value = 2 + Math.random() * 2;
    
    const attack = 0.8 + Math.random() * 1.5;
    const decay = 0.5 + Math.random() * 0.5;
    const sustain = 0.03 + Math.random() * 0.02;
    const release = 1.5 + Math.random() * 2.5;
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + attack);
    gain.gain.linearRampToValueAtTime(sustain * 2, now + attack + decay);
    gain.gain.linearRampToValueAtTime(sustain * 1.4, now + duration - release);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + duration);
    
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    const filter2 = this.audioContext.createBiquadFilter();
    const panner2 = this.audioContext.createStereoPanner();
    
    osc2.type = 'sine';
    osc2.frequency.value = note * 2;
    filter2.type = 'lowpass';
    filter2.frequency.value = 400;
    filter2.Q.value = 1.5;
    panner2.pan.value = -panPosition;
    
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.015, now + attack);
    gain2.gain.linearRampToValueAtTime(0.008, now + duration - release);
    gain2.gain.linearRampToValueAtTime(0, now + duration);
    
    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(panner2);
    panner2.connect(this.masterGain);
    
    osc2.start(now);
    osc2.stop(now + duration);
    
    const osc3 = this.audioContext.createOscillator();
    const gain3 = this.audioContext.createGain();
    const panner3 = this.audioContext.createStereoPanner();
    
    osc3.type = 'triangle';
    osc3.frequency.value = note * 1.5;
    panner3.pan.value = panPosition * 0.5;
    
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.012, now + attack * 1.2);
    gain3.gain.linearRampToValueAtTime(0.006, now + duration - release);
    gain3.gain.linearRampToValueAtTime(0, now + duration);
    
    osc3.connect(gain3);
    gain3.connect(panner3);
    panner3.connect(this.masterGain);
    
    osc3.start(now);
    osc3.stop(now + duration);
    
    const bassOsc = this.audioContext.createOscillator();
    const bassGain = this.audioContext.createGain();
    const bassFilter = this.audioContext.createBiquadFilter();
    const bassPanner = this.audioContext.createStereoPanner();
    
    bassOsc.type = 'sine';
    bassOsc.frequency.value = note / 2;
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 150;
    bassFilter.Q.value = 1;
    bassPanner.pan.value = 0;
    
    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(0.025, now + 1);
    bassGain.gain.linearRampToValueAtTime(0.015, now + duration - 2);
    bassGain.gain.linearRampToValueAtTime(0, now + duration);
    
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(bassPanner);
    bassPanner.connect(this.masterGain);
    
    bassOsc.start(now);
    bassOsc.stop(now + duration);
    
    const delay = this.audioContext.createDelay();
    delay.delayTime.value = 0.2 + Math.random() * 0.1;
    const feedback = this.audioContext.createGain();
    feedback.gain.value = 0.35;
    const delayFilter = this.audioContext.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 800;
    
    gain.connect(delay);
    delay.connect(delayFilter);
    delayFilter.connect(feedback);
    feedback.connect(delay);
    delayFilter.connect(this.masterGain);
    
    const delay2 = this.audioContext.createDelay();
    delay2.delayTime.value = 0.3 + Math.random() * 0.15;
    const feedback2 = this.audioContext.createGain();
    feedback2.gain.value = 0.25;
    const delayFilter2 = this.audioContext.createBiquadFilter();
    delayFilter2.type = 'lowpass';
    delayFilter2.frequency.value = 600;
    
    gain2.connect(delay2);
    delay2.connect(delayFilter2);
    delayFilter2.connect(feedback2);
    feedback2.connect(delay2);
    delayFilter2.connect(this.masterGain);
  }

  private playChord() {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const duration = 5 + Math.random() * 3;

    const chord = this.nextThemeChord();
    
    const panPositions = [-0.6, 0, 0.6, -0.3, 0.3];
    
    const chordDelay = this.audioContext.createDelay();
    chordDelay.delayTime.value = 0.25;
    const chordFeedback = this.audioContext.createGain();
    chordFeedback.gain.value = 0.3;
    const chordDelayFilter = this.audioContext.createBiquadFilter();
    chordDelayFilter.type = 'lowpass';
    chordDelayFilter.frequency.value = 700;
    
    chord.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      const filter = this.audioContext!.createBiquadFilter();
      const panner = this.audioContext!.createStereoPanner();
      
      osc.type = i === 0 ? 'sine' : i === 1 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      
      panner.pan.value = panPositions[i % panPositions.length];
      
      filter.type = 'lowpass';
      filter.frequency.value = 350 + Math.random() * 100;
      filter.Q.value = 1.5 + Math.random();
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 1);
      gain.gain.linearRampToValueAtTime(0.03, now + duration - 2);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain!);
      
      gain.connect(chordDelay);
      
      osc.start(now);
      osc.stop(now + duration);
      
      const osc2 = this.audioContext!.createOscillator();
      const gain2 = this.audioContext!.createGain();
      const panner2 = this.audioContext!.createStereoPanner();
      
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2;
      panner2.pan.value = -panPositions[i % panPositions.length];
      
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.02, now + 1.2);
      gain2.gain.linearRampToValueAtTime(0.015, now + duration - 2);
      gain2.gain.linearRampToValueAtTime(0, now + duration);
      
      osc2.connect(gain2);
      gain2.connect(panner2);
      panner2.connect(this.masterGain!);
      
      osc2.start(now);
      osc2.stop(now + duration);
    });
    
    chordDelay.connect(chordDelayFilter);
    chordDelayFilter.connect(chordFeedback);
    chordFeedback.connect(chordDelay);
    chordDelayFilter.connect(this.masterGain);
  }

  private playAtmospheric() {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const duration = 6 + Math.random() * 4;
    
    const panPosition = (Math.random() - 0.5) * 1.6;
    
    const type = Math.random();
    
    if (type < 0.25) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      const panner = this.audioContext.createStereoPanner();
      
      osc.type = 'sine';
      const startFreq = 100 + Math.random() * 200;
      const endFreq = startFreq * (1.5 + Math.random());
      
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(startFreq * 2, now);
      filter.frequency.exponentialRampToValueAtTime(endFreq * 2, now + duration);
      filter.Q.value = 3;
      
      panner.pan.value = panPosition;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 1.5);
      gain.gain.linearRampToValueAtTime(0.02, now + duration - 2);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + duration);
      
      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      const panner2 = this.audioContext.createStereoPanner();
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(startFreq * 2, now);
      osc2.frequency.exponentialRampToValueAtTime(endFreq * 2, now + duration);
      panner2.pan.value = -panPosition;
      
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.015, now + 1.5);
      gain2.gain.linearRampToValueAtTime(0.01, now + duration - 2);
      gain2.gain.linearRampToValueAtTime(0, now + duration);
      
      osc2.connect(gain2);
      gain2.connect(panner2);
      panner2.connect(this.masterGain);
      
      osc2.start(now);
      osc2.stop(now + duration);
    } else if (type < 0.5) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      const panner = this.audioContext.createStereoPanner();
      
      osc.type = 'triangle';
      const startFreq = 300 + Math.random() * 400;
      const endFreq = startFreq * (0.3 + Math.random() * 0.3);
      
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(startFreq, now);
      filter.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      filter.Q.value = 2;
      
      panner.pan.value = panPosition;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.024, now + 1);
      gain.gain.linearRampToValueAtTime(0.016, now + duration - 1.5);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + duration);
      
      const bassOsc = this.audioContext.createOscillator();
      const bassGain = this.audioContext.createGain();
      
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(startFreq / 4, now);
      bassOsc.frequency.exponentialRampToValueAtTime(endFreq / 4, now + duration);
      
      bassGain.gain.setValueAtTime(0, now);
      bassGain.gain.linearRampToValueAtTime(0.02, now + 1);
      bassGain.gain.linearRampToValueAtTime(0.01, now + duration - 2);
      bassGain.gain.linearRampToValueAtTime(0, now + duration);
      
      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain);
      
      bassOsc.start(now);
      bassOsc.stop(now + duration);
    } else if (type < 0.75) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      const panner = this.audioContext.createStereoPanner();
      
      osc.type = 'sine';
      const baseFreq = 150 + Math.random() * 150;
      const peakFreq = baseFreq * 2;
      
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(peakFreq, now + duration / 2);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + duration);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 1.5, now);
      filter.frequency.exponentialRampToValueAtTime(peakFreq * 1.5, now + duration / 2);
      filter.frequency.exponentialRampToValueAtTime(baseFreq, now + duration);
      filter.Q.value = 4;
      
      panner.pan.value = panPosition;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 1.5);
      gain.gain.linearRampToValueAtTime(0.03, now + duration / 2);
      gain.gain.linearRampToValueAtTime(0.016, now + duration - 1.5);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + duration);
    } else {
      const numVoices = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < numVoices; i++) {
        const voiceOsc = this.audioContext.createOscillator();
        const voiceGain = this.audioContext.createGain();
        const voiceFilter = this.audioContext.createBiquadFilter();
        const voicePanner = this.audioContext.createStereoPanner();
        
        const baseFreq = 200 + Math.random() * 100;
        const freqVariation = (Math.random() - 0.5) * 20;
        
        voiceOsc.type = 'sine';
        voiceOsc.frequency.setValueAtTime(baseFreq + freqVariation, now);
        
        const vibrato = this.audioContext.createOscillator();
        const vibratoGain = this.audioContext.createGain();
        vibrato.type = 'sine';
        vibrato.frequency.value = 4 + Math.random() * 2;
        vibratoGain.gain.value = 3 + Math.random() * 2;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(voiceOsc.frequency);
        vibrato.start(now);
        vibrato.stop(now + duration);
        
        voicePanner.pan.value = panPosition + (i - numVoices / 2) * 0.15;
        
        voiceFilter.type = 'bandpass';
        voiceFilter.frequency.value = baseFreq * 1.5;
        voiceFilter.Q.value = 5;
        
        voiceGain.gain.setValueAtTime(0, now);
        voiceGain.gain.linearRampToValueAtTime(0.016, now + 2);
        voiceGain.gain.linearRampToValueAtTime(0.012, now + duration - 2);
        voiceGain.gain.linearRampToValueAtTime(0, now + duration);
        
        voiceOsc.connect(voiceFilter);
        voiceFilter.connect(voiceGain);
        voiceGain.connect(voicePanner);
        voicePanner.connect(this.masterGain);
        
        voiceOsc.start(now);
        voiceOsc.stop(now + duration);
      }
    }
  }

  private playBellTone() {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const duration = 8 + Math.random() * 4;
    
    const frequencies = [440, 523.25, 587.33, 659.25, 783.99];
    const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    const panner = this.audioContext.createStereoPanner();
    
    const panPosition = (Math.random() - 0.5) * 1.4;
    panner.pan.value = panPosition;
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 10;
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + duration);
    
    const harmonics = [2, 3, 4.5, 5.5, 7];
    harmonics.forEach((multiplier, i) => {
      const harmOsc = this.audioContext!.createOscillator();
      const harmGain = this.audioContext!.createGain();
      const harmPanner = this.audioContext!.createStereoPanner();
      
      harmOsc.type = 'sine';
      harmOsc.frequency.value = freq * multiplier;
      
      harmPanner.pan.value = panPosition + (i - 2) * 0.15;
      
      harmGain.gain.setValueAtTime(0, now);
      harmGain.gain.linearRampToValueAtTime(0.02 / (i + 1), now + 0.3);
      harmGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);
      
      harmOsc.connect(harmGain);
      harmGain.connect(harmPanner);
      harmPanner.connect(this.masterGain!);
      
      harmOsc.start(now);
      harmOsc.stop(now + duration);
    });
    
    const bellDelay = this.audioContext.createDelay();
    bellDelay.delayTime.value = 0.15;
    const bellFeedback = this.audioContext.createGain();
    bellFeedback.gain.value = 0.4;
    const bellDelayFilter = this.audioContext.createBiquadFilter();
    bellDelayFilter.type = 'lowpass';
    bellDelayFilter.frequency.value = 1000;
    
    this.sendToReverb(gain, 0.5); // v0.4.3 набат — в соборный хвост
    gain.connect(bellDelay);
    bellDelay.connect(bellDelayFilter);
    bellDelayFilter.connect(bellFeedback);
    bellFeedback.connect(bellDelay);
    bellDelayFilter.connect(this.masterGain);
  }

  private playDeepPulse() {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const numPulses = 3 + Math.floor(Math.random() * 3);
    const pulseInterval = 0.4 + Math.random() * 0.3;
    
    for (let i = 0; i < numPulses; i++) {
      const pulseTime = now + i * pulseInterval;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      const panner = this.audioContext.createStereoPanner();
      
      const freq = 40 + Math.random() * 30;
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      panner.pan.value = (Math.random() - 0.5) * 0.8;
      
      filter.type = 'lowpass';
      filter.frequency.value = 100;
      filter.Q.value = 2;
      
      const pulseDuration = 0.3 + Math.random() * 0.2;
      gain.gain.setValueAtTime(0, pulseTime);
      gain.gain.linearRampToValueAtTime(0.08, pulseTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + pulseDuration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain);
      
      osc.start(pulseTime);
      osc.stop(pulseTime + pulseDuration);
    }
  }

  /**
   * Звук нового события — удар колокола собора: низкий частотный «удар»
   * с экспоненциальным спадом + мягкая верхняя парциальная нота и
   * короткая шумовая атака (молоток по металлу).
   */
  playEventSound(tone: 'neutral' | 'grave' | 'bright' = 'neutral') {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const master = this.masterGain;
    const now = ctx.currentTime;

    // Лейтмотив года меняется по исходу выбора: нейтральный набат,
    // тревожно-нижний (рана) или светлый мажорный (удача/чудо).
    const fundamentals = { neutral: 138.59, grave: 110.0, bright: 174.61 } as const;
    const decayScale = tone === 'bright' ? 0.72 : tone === 'grave' ? 1.15 : 1;
    const fundamental = fundamentals[tone];
    const partials = [
      { ratio: 1, gain: 0.26, type: 'sine' as OscillatorType },
      { ratio: 2.0, gain: 0.12, type: 'sine' as OscillatorType },
      { ratio: 2.76, gain: 0.07, type: 'triangle' as OscillatorType },
      { ratio: 4.07, gain: 0.04, type: 'sine' as OscillatorType },
    ];

    partials.forEach((p, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();

      panner.pan.value = (i % 2 === 0 ? -1 : 1) * 0.25;

      osc.type = p.type;
      osc.frequency.setValueAtTime(fundamental * p.ratio, now);
      // Лёгкий «прогиб» строя вниз — как затухающий язык колокола
      osc.frequency.exponentialRampToValueAtTime(fundamental * p.ratio * 0.985, now + 1.1);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(p.gain, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (1.35 - i * 0.15) * decayScale);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(master);
      this.sendToReverb(gain, tone === 'bright' ? 0.4 : 0.5); // v0.4.3 колокол в соборе

      osc.start(now);
      osc.stop(now + 1.4 * decayScale + 0.1);
    });

    // Шумовая атака — звон молотка/цепи
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.09), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseData.length * 0.2));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1800;
    noiseFilter.Q.value = 1.2;

    noiseGain.gain.setValueAtTime(0.14, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);

    noise.start(now);
  }

  /**
   * Клик по варианту решения — короткий сухой барабанный стук (войс),
   * даёт тактильную обратную связь до наступления результата года.
   */
  playChoiceClick() {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const master = this.masterGain;
    const now = ctx.currentTime;

    // Тело удара — быстрый спад частоты (мембрана барабана)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(196, now); // G3
    osc.frequency.exponentialRampToValueAtTime(98, now + 0.12);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(master);
    this.sendToReverb(gain, 0.12); // v0.4.3 лёгкий «зал», клик остаётся сухим и быстрым
    osc.start(now);
    osc.stop(now + 0.2);

    // Суб-поддержка на октаву ниже — тёплый «напольный том»
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(98, now);
    sub.frequency.exponentialRampToValueAtTime(65, now + 0.14);
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.12, now + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    sub.connect(subGain);
    subGain.connect(master);
    sub.start(now);
    sub.stop(now + 0.25);

    // Атака — шумовой щелчок палочки, срезаный сверху, чтобы не «пилить»
    const clickBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
    const clickData = clickBuffer.getChannelData(0);
    for (let i = 0; i < clickData.length; i++) {
      clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickData.length * 0.25));
    }
    const click = ctx.createBufferSource();
    click.buffer = clickBuffer;
    const clickGain = ctx.createGain();
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.value = 1800;
    clickFilter.Q.value = 0.8;
    clickGain.gain.setValueAtTime(0.08, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(master);
    click.start(now);
  }

  /**
   * Перелистывание года — лёгкий «пергаментный» шорох: отфильтрованный
   * шум с медленной огибающей, тише клика выбора.
   */
  playYearTick() {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const master = this.masterGain;
    const now = ctx.currentTime;

    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.22), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      const env = Math.sin(Math.PI * t); // плавная «волна» шороха
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(900, now);
    band.frequency.linearRampToValueAtTime(2400, now + 0.22);
    band.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    src.connect(band);
    band.connect(gain);
    gain.connect(master);
    src.start(now);
  }

  /**
   * Серьёзная рана при выборе — короткий диссонансный удар.
   * Намного короче и тише смерти: «укол тревоги», а не финальный набат.
   */
  playWoundHit() {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const master = this.masterGain;
    const now = ctx.currentTime;

    // Низкий удар + тритон («diabolus in musica») поверх — тревожный акцент
    const layers = [
      { freq: 82.41, end: 55, type: 'sawtooth' as OscillatorType, gain: 0.2, dur: 0.7 },
      { freq: 116.54, end: 110, type: 'triangle' as OscillatorType, gain: 0.12, dur: 0.55 },
    ];

    layers.forEach((l, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const panner = ctx.createStereoPanner();

      panner.pan.value = i === 0 ? -0.2 : 0.25;
      osc.type = l.type;
      osc.frequency.setValueAtTime(l.freq, now);
      osc.frequency.exponentialRampToValueAtTime(l.end, now + l.dur);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + l.dur);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(l.gain, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + l.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(master);
      this.sendToReverb(gain, 0.3); // v0.4.3 удар отзывается эхом в зале
      osc.start(now);
      osc.stop(now + l.dur + 0.05);
    });

    // Короткий шумовой «удар металла»
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseData.length * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 700;
    noiseFilter.Q.value = 0.9;
    noiseGain.gain.setValueAtTime(0.1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);
  }

  playAchievementSound() {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const master = this.masterGain;
    const now = ctx.currentTime;
    
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    const panPositions = [-0.6, -0.3, 0, 0.3, 0.6];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const panner = ctx.createStereoPanner();
      
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      
      panner.pan.value = panPositions[i];
      
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;
      
      const startTime = now + i * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.24, startTime + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(master);
      this.sendToReverb(gain, 0.35); // v0.4.3 фанфара в соборных сводах
      
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });

    const chordNotes = [523.25, 659.25, 783.99];
    const chordPans = [-0.5, 0, 0.5];
    const finalTime = now + 0.6;
    
    chordNotes.forEach((freq, i) => {
      const chord = ctx.createOscillator();
      const chordGain = ctx.createGain();
      const chordFilter = ctx.createBiquadFilter();
      const chordPanner = ctx.createStereoPanner();
      
      chord.type = i === 0 ? 'triangle' : 'sine';
      chord.frequency.value = freq;
      
      chordPanner.pan.value = chordPans[i];
      
      chordFilter.type = 'lowpass';
      chordFilter.frequency.value = 1500;
      chordFilter.Q.value = 1.2;
      
      chordGain.gain.setValueAtTime(0, finalTime);
      chordGain.gain.linearRampToValueAtTime(0.2 - i * 0.04, finalTime + 0.1);
      chordGain.gain.linearRampToValueAtTime(0.001, finalTime + 1.5);
      
      chord.connect(chordFilter);
      chordFilter.connect(chordGain);
      chordGain.connect(chordPanner);
      chordPanner.connect(master);
      this.sendToReverb(chordGain, 0.4); // v0.4.3 финальный аккорд — с хвостом собора
      
      chord.start(finalTime);
      chord.stop(finalTime + 1.5);
    });

    // Эхо фанфары раньше шло мимо masterGain прямо в destination — ползунок
    // громкости на него не влиял, и при наложении на амбиент слышен клиппинг.
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.2;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.25;
    const echoSend = ctx.createGain();
    echoSend.gain.value = 0.4;

    echoSend.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(master);

    // «хвост» фанфары: последняя нота аккорда подзвучивается в эхо-шину
    const tailOsc = ctx.createOscillator();
    const tailGain = ctx.createGain();
    tailOsc.type = 'sine';
    tailOsc.frequency.value = 783.99;
    tailGain.gain.setValueAtTime(0, finalTime + 1.3);
    tailGain.gain.linearRampToValueAtTime(0.05, finalTime + 1.4);
    tailGain.gain.exponentialRampToValueAtTime(0.001, finalTime + 2.6);
    tailOsc.connect(tailGain);
    tailGain.connect(echoSend);
    tailGain.connect(master);
    tailOsc.start(finalTime + 1.3);
    tailOsc.stop(finalTime + 2.6);
  }

  /** «Звон чуда» — восходящие колокола при заступничестве Императора. */
  playMiracleChime() {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const master = this.masterGain;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const panner = ctx.createStereoPanner();
      panner.pan.value = (i - 1.5) * 0.3;

      osc.type = 'sine';
      osc.frequency.value = freq;

      const t0 = now + i * 0.14;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 2.2);

      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type = 'sine';
      shimmer.frequency.value = freq * 2.01;
      shimmerGain.gain.setValueAtTime(0, t0);
      shimmerGain.gain.linearRampToValueAtTime(0.04, t0 + 0.03);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.4);

      osc.connect(g); g.connect(panner);
      shimmer.connect(shimmerGain); shimmerGain.connect(panner);
      panner.connect(master);
      this.sendToReverb(g, 0.5); // v0.4.3 колокольчики чуда — на весь собор

      osc.start(t0); osc.stop(t0 + 2.3);
      shimmer.start(t0); shimmer.stop(t0 + 1.5);
    });
  }

  playDeathSound() {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    const filter1 = this.audioContext.createBiquadFilter();
    const panner1 = this.audioContext.createStereoPanner();
    
    panner1.pan.value = 0;
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(60, now);
    osc1.frequency.exponentialRampToValueAtTime(25, now + 5);
    
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(400, now);
    filter1.frequency.exponentialRampToValueAtTime(60, now + 5);
    filter1.Q.value = 4;
    
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.4, now + 0.6);
    gain1.gain.linearRampToValueAtTime(0.3, now + 2.5);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 5);
    
    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(panner1);
    panner1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 5);

    const osc1b = this.audioContext.createOscillator();
    const gain1b = this.audioContext.createGain();
    const panner1b = this.audioContext.createStereoPanner();
    
    panner1b.pan.value = -0.3;
    
    osc1b.type = 'sine';
    osc1b.frequency.setValueAtTime(40, now);
    osc1b.frequency.exponentialRampToValueAtTime(20, now + 5);
    
    gain1b.gain.setValueAtTime(0, now);
    gain1b.gain.linearRampToValueAtTime(0.3, now + 0.8);
    gain1b.gain.exponentialRampToValueAtTime(0.001, now + 5);
    
    osc1b.connect(gain1b);
    gain1b.connect(panner1b);
    panner1b.connect(this.masterGain);
    osc1b.start(now);
    osc1b.stop(now + 5);

    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    const vibrato = this.audioContext.createOscillator();
    const vibratoGain = this.audioContext.createGain();
    const panner2 = this.audioContext.createStereoPanner();
    
    panner2.pan.value = 0.4;
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(44, now + 4);
    
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(5, now);
    vibrato.frequency.linearRampToValueAtTime(8, now + 2);
    vibratoGain.gain.value = 15;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc2.frequency);
    
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.24, now + 0.4);
    gain2.gain.linearRampToValueAtTime(0.16, now + 2.5);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 4);
    
    osc2.connect(gain2);
    gain2.connect(panner2);
    panner2.connect(this.masterGain);
    
    osc2.start(now);
    vibrato.start(now);
    osc2.stop(now + 4);
    vibrato.stop(now + 4);

    const osc3 = this.audioContext.createOscillator();
    const gain3 = this.audioContext.createGain();
    const panner3 = this.audioContext.createStereoPanner();
    
    panner3.pan.value = -0.4;
    
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(440, now);
    osc3.frequency.exponentialRampToValueAtTime(22, now + 4);
    
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.12, now + 0.5);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 4);
    
    osc3.connect(gain3);
    gain3.connect(panner3);
    panner3.connect(this.masterGain);
    osc3.start(now);
    osc3.stop(now + 4);

    const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 4, this.audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseData.length * 0.35));
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.audioContext.createGain();
    const noiseFilter = this.audioContext.createBiquadFilter();
    const noisePanner = this.audioContext.createStereoPanner();
    
    noisePanner.pan.value = 0;
    
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 4);
    noiseFilter.Q.value = 2;
    
    noiseGain.gain.setValueAtTime(0.14, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 4);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(noisePanner);
    noisePanner.connect(this.masterGain);
    
    noise.start(now);

    const delay = this.audioContext.createDelay();
    delay.delayTime.value = 0.25;
    const feedback = this.audioContext.createGain();
    feedback.gain.value = 0.35;
    const delayFilter = this.audioContext.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 600;
    
    gain1.connect(delay);
    delay.connect(delayFilter);
    delayFilter.connect(feedback);
    feedback.connect(delay);
    delayFilter.connect(this.masterGain);
  }

  /**
   * Параметры звуковой среды для одного настроения. Чистая таблица —
   * сама маршрутизация состояния жизни в настроение вынесена в reducer.ts
   * (computeAmbienceMood) и покрыта тестами без Web Audio API.
   */
  private static readonly MOOD_SETTINGS = {
    normal: { lfoFreq: 0.05, lfoDepth: 0.02,  noiseGain: 0.02,  filterFreq: 250, filterQ: 0.8, padScale: 0.025, whisperGain: 0.004, transition: 2.5 },
    tense:  { lfoFreq: 0.18, lfoDepth: 0.035, noiseGain: 0.025, filterFreq: 320, filterQ: 1.1, padScale: 0.035, whisperGain: 0.010, transition: 2.5 },
    danger: { lfoFreq: 0.3,  lfoDepth: 0.05,  noiseGain: 0.04,  filterFreq: 560, filterQ: 2.2, padScale: 0.04,  whisperGain: 0.016, transition: 1.5 },
    epic:   { lfoFreq: 0.1,  lfoDepth: 0.04,  noiseGain: 0.025, filterFreq: 210, filterQ: 0.7, padScale: 0.035, whisperGain: 0.006, transition: 2.5 },
  } as const;

  setMood(mood: 'normal' | 'tense' | 'danger' | 'epic') {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const s = GrimdarkAmbience.MOOD_SETTINGS[mood];
    const transitionTime = s.transition;
    this.currentMood = mood;
    // Новая тема: сбрасываем ротацию оборотов, чтобы настроение начиналось
    // с тоники своей ладовой темы (v0.3.75).
    this.themeIndex = 0;

    // v0.3.83 «Полноценный трек»: сетка трека перестраивается под новый темп —
    // гасим текущий бар-таймер и отложенные удары, перезапускаем с сильной доли.
    if (this.isPlaying) {
      if (this.intervalId) {
        clearTimeout(this.intervalId);
        this.intervalId = null;
      }
      this.trackBar = 0;
      this.phraseUntilBar = 0;
      this.nextPhraseAtBar = 1;
      this.lastPhraseBar = -1;
      this.bassBeat = 0;
      this.playTrackBar();
      this.scheduleBarTick();
    }

    // Смена настроения перезапускает цикл далёких взрывов: он живёт
    // только в danger (см. scheduleArtillery / playDistantBlast).
    if (this.artilleryTimer) {
      clearTimeout(this.artilleryTimer);
      this.artilleryTimer = null;
    }

    if (this.lfo) {
      this.lfo.frequency.linearRampToValueAtTime(s.lfoFreq, now + transitionTime);
    }
    if (this.lfoGain) {
      this.lfoGain.gain.linearRampToValueAtTime(s.lfoDepth, now + transitionTime);
    }
    if (this.noiseGain) {
      this.noiseGain.gain.linearRampToValueAtTime(s.noiseGain, now + transitionTime);
    }
    // «Гул улья»: тембр шумового слоя по настроению — danger поднимает гул
    // вверх по спектру и делает звонче, epic — ниже и мягче.
    if (this.noiseFilter) {
      this.noiseFilter.frequency.linearRampToValueAtTime(s.filterFreq, now + transitionTime);
      this.noiseFilter.Q.linearRampToValueAtTime(s.filterQ, now + transitionTime);
    }
    // «Хор шёпотов»: при опасности рассудок теряет хватку — шёпот проступает
    // сквозь гул; в спокойные годы почти растворяется в тишине.
    if (this.whisperGainNode) {
      this.whisperGainNode.gain.linearRampToValueAtTime(s.whisperGain, now + transitionTime);
    }
    this.gains.forEach((gain, i) => {
      // В tense трогаем только первые три подушечных слоя (как раньше)
      if (mood !== 'tense' || i < 3) {
        gain.gain.linearRampToValueAtTime(s.padScale / (i + 1), now + transitionTime);
      }
    });

    if (mood === 'danger') this.scheduleArtillery();
  }

  /** Текущее настроение саундтрека (для индикатора в HUD, v0.3.73) */
  getMood(): 'normal' | 'tense' | 'danger' | 'epic' {
    return this.currentMood;
  }

  // ---------- Danger-слой: далёкая артиллерия ----------
  private currentMood: 'normal' | 'tense' | 'danger' | 'epic' = 'normal';
  private artilleryTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Далёкий взрыв (артиллерийский залп / орбитальная бомбардировка):
   * низкий «бум» с проседающей частотой + шумовой треск через lowpass,
   * слегка расведённый по стерео. Звучит только пока mood = danger.
   */
  private playDistantBlast(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime + 0.05;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.5);
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.16, now + 0.015);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.0);

    const dur = 0.35 + Math.random() * 0.25;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.12));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(500, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(120, now + dur);
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.09;
    const panner = ctx.createStereoPanner();
    panner.pan.value = (Math.random() - 0.5) * 1.2;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(panner);
    panner.connect(this.masterGain);
    noise.start(now);
  }

  private scheduleArtillery(): void {
    if (!this.audioContext) return;
    const delay = 2000 + Math.random() * 4000;
    this.artilleryTimer = setTimeout(() => {
      this.artilleryTimer = null;
      // Удары звучат, только пока опасность активна и музыка играет
      if (this.currentMood === 'danger' && this.isPlaying) {
        this.playDistantBlast();
        this.scheduleArtillery();
      }
    }, delay);
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(GrimdarkAmbience.VOLUME_KEY, String(this.volume));
      }
    } catch { /* приватный режим — не страшно */ }
  }

  getVolume(): number {
    return this.volume;
  }

  stop() {
    this.isPlaying = false;
    this.disarmGestureAutostart();
    
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }

    // v0.3.83: гасим сетку трека — бар-таймер не должен продолжать игру
    // после выключения музыки или перезапуска.

    // Далёкие взрывы — тоже таймерный слой: гасим при остановке музыки
    if (this.artilleryTimer) {
      clearTimeout(this.artilleryTimer);
      this.artilleryTimer = null;
    }

    this.oscillators.forEach(osc => {
      try { osc.stop(); } catch (e) { /* already stopped */ }
    });
    this.oscillators = [];
    this.gains = [];

    if (this.lfo) {
      try { this.lfo.stop(); } catch (e) { /* */ }
      this.lfo = null;
    }
    this.lfoGain = null;

    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch (e) { /* */ }
      this.noiseNode = null;
    }
    this.noiseGain = null;

    // v0.3.69: останавливаем и слои «ветер»/«шёпоты» — раньше они продолжали
    // играть после stop(), и каждый вкл/выкл добавлял новый слой поверх
    // старых → звук дублировался.
    if (this.windNode) {
      try { this.windNode.stop(); } catch (e) { /* */ }
      this.windNode = null;
    }
    if (this.whisperNode) {
      try { this.whisperNode.stop(); } catch (e) { /* */ }
      this.whisperNode = null;
    }

    this.whisperGainNode = null;
  }

  toggle(): boolean {
    if (this.isPlaying) {
      // Игрок выключил музыку кнопкой — запоминаем это, чтобы автозапуск от
      // жестов пользователя не включал её обратно.
      this.userPaused = true;
      this.stop();
      return false;
    } else {
      this.userPaused = false;
      if (!this.audioContext) {
        this.init();
      }
      this.start();
      return true;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.masterGain = null;
    this.compressor = null;
  }
}

let ambienceInstance: GrimdarkAmbience | null = null;

export function getAmbience(): GrimdarkAmbience {
  if (!ambienceInstance) {
    ambienceInstance = new GrimdarkAmbience();
  }
  return ambienceInstance;
}
