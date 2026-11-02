import { useMemo, useState } from 'react';
import type { Race } from '../game/types';
import { getLegacy } from '../game/legacy';
import { buildLegacySummary } from '../game/legacySummary';
import { AudioController } from './AudioController';
import { RaceEmblem } from './RaceEmblem';
import { RacePicker } from './RacePicker';

interface MainMenuProps {
  hasSave: boolean;
  onStartNewGame: (race?: Race) => void;
  onLoadSavedGame: () => void;
}

/** Экран заглавия: описание вселенной, выбор расы, кнопки старта. */
export function MainMenu({ hasSave, onStartNewGame, onLoadSavedGame }: MainMenuProps) {
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  // Сводка прошлых жизней из localStorage — только для отображения.
  const legacy = useMemo(() => buildLegacySummary(getLegacy()), []);
  return (
    <div className="game-container game-fit wh-grain wh-vignette min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% -10%, #241d10 0%, #0b0a08 45%, #060504 100%)' }}>
      <AudioController />

      {/* Фоновые эффекты */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-700/10 rounded-full blur-3xl animate-candle"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-900/15 rounded-full blur-3xl animate-candle" style={{ animationDelay: '1.3s' }}></div>
      </div>

      <main className="fit-scroll relative z-10 container mx-auto px-6 py-12">
      <div className="flex-1">
        <div className="max-w-[1600px] mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="font-gothic text-5xl xl:text-6xl font-bold mb-4 tracking-[0.15em] uppercase bg-gradient-to-b from-[#f0d878] via-[#c9a227] to-[#7a5c10] bg-clip-text text-transparent animate-gold-sheen">
              WARHAMMER LIFE
            </h1>
            <p className="font-event text-xl text-[#b8a878] mb-3 italic">
              Симулятор жизни в вселенной Warhammer 40,000
            </p>
            <p className="font-event text-sm text-gray-400 uppercase tracking-[0.3em] mb-4">
              Во тьме далёкого будущего есть только война
            </p>
            <div className="wh-divider max-w-md mx-auto mt-4"></div>
          </div>

          {/* Описание */}
          <div className="wh-panel wh-frame p-8 mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 shrink-0 mt-1 opacity-80">
                <RaceEmblem race="human" className="w-full h-full" />
              </div>
              <div className="flex-1">
                <p className="text-lg leading-relaxed text-gray-200 mb-4">
                  В мрачном будущем тридцать первого тысячелетия нет мира. Есть лишь бесконечная бойня.
                </p>
                <p className="text-lg leading-relaxed text-gray-200 mb-4">
                  Ты можешь родиться человеком, орком, эльдар, тёмным эльдар, тау или гретчином.
                  Твоё происхождение случайно. Твоя смерть — почти гарантирована.
                </p>
                <p className="text-xl leading-relaxed font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Но пока ты дышишь — ты можешь бороться.
                </p>
              </div>
            </div>
          </div>

          {/* Расы: интерактивный выбор */}
          <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h2 className="font-gothic text-3xl font-bold text-center mb-8 uppercase tracking-[0.15em] text-[#e8c85a]">Выбери свою судьбу</h2>
            <RacePicker race={selectedRace} onSelect={setSelectedRace} />
          </div>

          {/* Рекорды прошлых жизней (legacy) */}
          {legacy.totalGamesPlayed > 0 && (
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="wh-panel p-4 max-w-3xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-2 text-center">
                <span className="text-sm uppercase tracking-[0.2em] text-gray-400 font-gothic">Прошлые жизни</span>
                <span className="text-[#d8c9a3]">Жизней прожито: <b className="text-[#e8c85a]">{legacy.totalGamesPlayed}</b></span>
                {legacy.bestLifeText && (
                  <span className="text-[#d8c9a3]">Рекорд: <b className="text-[#e8c85a]">{legacy.bestLifeText}</b></span>
                )}
                {legacy.achievementsCount > 0 && (
                  <span className="text-[#d8c9a3]">Достижений: <b className="text-[#e8c85a]">{legacy.achievementsCount}</b></span>
                )}
                {legacy.racesPlayedText && (
                  <span className="text-[#d8c9a3]">Рас познано: <b className="text-[#e8c85a]">{legacy.racesPlayedText}</b></span>
                )}
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex flex-col gap-4 items-center mb-8 animate-fade-in" style={{ animationDelay: '1s' }}>
            {hasSave && (
              <button
                onClick={onLoadSavedGame}
                className="btn-modern bg-gradient-to-r from-[#1c1913] to-[#2a2517] hover:from-[#2a2517] hover:to-[#38301e] text-[#c9a227] font-gothic font-bold py-4 px-12 rounded-sm text-xl border border-[#c9a227]/50 hover:border-[#e8c85a] transition-all shadow-lg"
              >
                📜&nbsp;&nbsp;Продолжить игру
              </button>
            )}

            <button
              onClick={() => onStartNewGame(selectedRace ?? undefined)}
              className="btn-wh-primary btn-modern font-bold py-5 px-16 rounded-sm text-2xl hover:scale-105"
            >
              ⚔️&nbsp;&nbsp;{selectedRace ? `Начать жизнь за ${selectedRace === 'dark_eldar' ? 'друкхаари' : selectedRace === 'tau' ? 'тау' : selectedRace === 'gretchin' ? 'гретчина' : { human: 'человека', ork: 'орка', eldar: 'эльдар' }[selectedRace]}` : 'Начать новую игру'}
            </button>

            <button
              onClick={() => setHelpOpen((v) => !v)}
              aria-expanded={helpOpen}
              className="text-gray-400 hover:text-[#e8c85a] underline decoration-dotted underline-offset-4 transition-colors font-event"
            >
              {helpOpen ? 'Скрыть справку' : 'Как играть'}
            </button>
          </div>

          {/* Шпаргалка «Как играть» (пункт 2 дорожной карты UI/UX) */}
          {helpOpen && (
            <div className="wh-panel wh-frame p-6 max-w-2xl mx-auto mb-8 animate-fade-in" role="region" aria-label="Как играть">
              <h3 className="font-gothic text-xl font-bold text-[#e8c85a] uppercase tracking-[0.15em] mb-4">Как выжить (или хотя бы попытаться)</h3>
              <ul className="space-y-2 text-[#d8c9a3] font-event leading-relaxed list-disc list-inside">
                <li>Каждый ход — один год жизни. Смерть почти гарантирована, но её можно отсрочить.</li>
                <li>Выбирайте действие клавишами <kbd className="px-1.5 py-0.5 bg-gray-800 border border-[#c9a227]/50 rounded-sm text-[#e8c85a] font-mono text-sm">A</kbd>–<kbd className="px-1.5 py-0.5 bg-gray-800 border border-[#c9a227]/50 rounded-sm text-[#e8c85a] font-mono text-sm">D</kbd> или мышью.</li>
                <li>Здоровье и рассудок — ваши главные щиты. Ранения накапливаются, безумие искажает восприятие.</li>
                <li>Псайкеры с высоким психическим даром привлекают внимание Имматериума — и Инквизиции.</li>
                <li>Судьбоносные выборы помечаются золотом в хронике и попадают в летопись на экране смерти.</li>
              </ul>
              <p className="mt-4 text-sm text-gray-400 italic font-event">
                Пример: «Человек в сером плаще предлагает вам жетон Ордо…» → выбор A может изменить всю жизнь.
              </p>
            </div>
          )}

          {/* Подсказка */}
          <div className="text-center animate-fade-in" style={{ animationDelay: '1.2s' }}>
            <p className="text-base text-gray-400 mb-3">
              Каждый ход = 1 год жизни • 6 рас • Клавиши A-D для выбора
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <kbd className="px-4 py-2 bg-gray-800 border border-[#c9a227]/50 rounded-sm text-[#e8c85a] text-base font-mono">A</kbd>
              <kbd className="px-4 py-2 bg-gray-800 border border-[#c9a227]/50 rounded-sm text-[#e8c85a] text-base font-mono">B</kbd>
              <kbd className="px-4 py-2 bg-gray-800 border border-[#c9a227]/50 rounded-sm text-[#e8c85a] text-base font-mono">C</kbd>
              <kbd className="px-4 py-2 bg-gray-800 border border-[#c9a227]/50 rounded-sm text-[#e8c85a] text-base font-mono">D</kbd>
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
