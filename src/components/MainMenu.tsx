import { RACE_INFO } from '../game/data';
import type { Race } from '../game/types';
import { AudioController } from './AudioController';
import { RaceEmblem } from './RaceEmblem';

interface MainMenuProps {
  hasSave: boolean;
  onStartNewGame: () => void;
  onLoadSavedGame: () => void;
}

/** Экран заглавия: описание вселенной, расы, кнопки старта. */
export function MainMenu({ hasSave, onStartNewGame, onLoadSavedGame }: MainMenuProps) {
  return (
    <div className="wh-grain wh-vignette min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% -10%, #241d10 0%, #0b0a08 45%, #060504 100%)' }}>
      <AudioController />

      {/* Фоновые эффекты */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-700/10 rounded-full blur-3xl animate-candle"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-900/15 rounded-full blur-3xl animate-candle" style={{ animationDelay: '1.3s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-[1600px] mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="font-gothic text-5xl xl:text-6xl font-bold mb-4 tracking-[0.15em] uppercase bg-gradient-to-b from-[#f0d878] via-[#c9a227] to-[#7a5c10] bg-clip-text text-transparent animate-gold-sheen">
              WARHAMMER LIFE
            </h1>
            <p className="font-event text-xl text-[#b8a878] mb-3 italic">
              Симулятор жизни в вселенной Warhammer 40,000
            </p>
            <p className="font-event text-sm text-gray-500 uppercase tracking-[0.3em] mb-4">
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

          {/* Расы */}
          <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h2 className="font-gothic text-3xl font-bold text-center mb-8 uppercase tracking-[0.15em] text-[#e8c85a]">Выбери свою судьбу</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(RACE_INFO).map(([key, info], index) => (
                <div
                  key={key}
                  className="wh-panel hover-lift p-6 animate-scale-in cursor-pointer"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="mb-3 w-10 h-10 mx-auto">
                    <RaceEmblem race={key as Race} className="w-full h-full opacity-90" />
                  </div>
                  <h3 className="font-gothic text-xl font-bold text-[#e8c85a] mb-2 uppercase tracking-wide">{info.name}</h3>
                  <p className="font-event text-base text-[#a89870] leading-relaxed">{info.description}</p>
                </div>
              ))}
            </div>
          </div>

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
              onClick={onStartNewGame}
              className="btn-wh-primary btn-modern font-bold py-5 px-16 rounded-sm text-2xl hover:scale-105"
            >
              ⚔️&nbsp;&nbsp;Начать новую игру
            </button>
          </div>

          {/* Подсказка */}
          <div className="text-center animate-fade-in" style={{ animationDelay: '1.2s' }}>
            <p className="text-base text-gray-500 mb-3">
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
    </div>
  );
}
