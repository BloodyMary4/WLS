export class GrimdarkAmbience {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  /** Слой «хор шёпотов» (см. createWhisperLayer) — громкость зависит от настроения */
  private whisperGainNode: GainNode | null = null;
  // Ссылка на bandpass-фильтр шумового слоя — чтобы mood-переходы могли
  // сдвигать тембр «гула улья» (danger = выше и резче, normal = ниже и мягче).
  private noiseFilter: BiquadFilterNode | null = null;
  private isPlaying = false;
  private volume = 0.55;
  private intervalId: ReturnType<typeof setTimeout> | null = null;
  // Мастер-шейпер: защищает от клиппинга при наложении мелодических событий
  // поверх плотного амбиент-дроуна (раньше все слои шли напрямую в destination).
  private compressor: DynamicsCompressorNode | null = null;

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

  // Универсальная разблокировка звука: вызывать из обработчиков реальных
  // пользовательских жестов (клик/нажатие клавиши). Идемпотентно.
  unlockOnUserGesture(): void {
    if (!this.init()) return;
    const ctx = this.audioContext;
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (!this.isPlaying) this.start();
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
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      this.audioContext = null;
      this.masterGain = null;
      return false;
    }
  }

  private armGestureAutostart() {
    if (typeof window === 'undefined' || this.pendingGestureStart) return;
    this.pendingGestureStart = true;
    this.gestureListener = () => {
      this.disarmGestureAutostart();
      if (!this.isPlaying) {
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

  private startMelodicEvents() {
    const scheduleNext = () => {
      if (!this.isPlaying) return;
      const delay = 2500 + Math.random() * 4500;
      this.intervalId = setTimeout(() => {
        if (!this.isPlaying || !this.audioContext || !this.masterGain) return;
        
        const eventType = Math.random();
        if (eventType < 0.45) {
          this.playDarkNote();
        } else if (eventType < 0.65) {
          this.playChord();
        } else if (eventType < 0.82) {
          this.playAtmospheric();
        } else if (eventType < 0.92) {
          this.playBellTone();
        } else {
          this.playDeepPulse();
        }
        
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  private playDarkNote() {
    if (!this.audioContext || !this.masterGain) return;

    const scales = [
      [55, 61.74, 65.41, 73.42, 82.41, 87.31, 98, 110],
      [73.42, 82.41, 87.31, 98, 110, 116.54, 130.81, 146.83],
      [82.41, 92.50, 98, 110, 123.47, 130.81, 146.83, 164.81],
      [55, 58.27, 65.41, 73.42, 82.41, 87.31, 98, 110],
      [55, 58.27, 65.41, 73.42, 77.78, 87.31, 98, 110]
    ];
    
    const scale = scales[Math.floor(Math.random() * scales.length)];
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
    
    const chords = [
      [55, 65.41, 82.41],
      [73.42, 87.31, 110],
      [82.41, 98, 123.47],
      [65.41, 82.41, 98],
      [55, 65.41, 77.78],
      [73.42, 92.50, 110],
      [82.41, 98, 116.54],
    ];
    
    const chord = chords[Math.floor(Math.random() * chords.length)];
    
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

    this.whisperGainNode = null;
  }

  toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
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
