import { useEffect, useRef } from 'react';
import { Choice } from '../game/types';
import { GameUiState } from '../game/reducer';
import { RACE_INFO } from '../game/data';
import { GAME_CONFIG } from '../game/config';
import { ACHIEVEMENTS } from '../game/achievements';
import { AudioController } from './AudioController';
import { AchievementToast } from './AchievementToast';
import { GameHeader } from './GameHeader';
import { Sidebar } from './Sidebar';
import { EventCard } from './EventCard';
import { DeathScreen } from './DeathScreen';

interface GameScreenProps {
  uiState: GameUiState;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onChoice: (choice: Choice) => void;
  onProceed: () => void;
  onNewGame: () => void;
}

/** Игровой экран: шапка + сайдбар + карточка события/смерти + футер. */
export function GameScreen({ uiState, sidebarOpen, onToggleSidebar, onChoice, onProceed, onNewGame }: GameScreenProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const game = uiState.game!;
  const { character, currentEvent, history, gameOver, deathMessage } = game;

  const raceInfo = RACE_INFO[character.race];
  // Расовый предел ожидаемой жизни (эльдар — столетия, гретчин — полвека)
  const maxExpectedAge = GAME_CONFIG.AGE_THRESHOLDS.MAX_EXPECTED_BY_RACE[character.race]
    ?? GAME_CONFIG.AGE_THRESHOLDS.MAX_EXPECTED;

  // Автоскролл хроники к последней записи.
  // Уважение prefers-reduced-motion: без плавной анимации прокрутки, сразу в конец.
  useEffect(() => {
    if (logRef.current) {
      const reduceMotion = typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      } else {
        logRef.current.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [history]);

  if (!currentEvent || !currentEvent.text || !currentEvent.choices) {
    return <div className="text-white p-8">Error: Invalid game state</div>;
  }

  return (
    <div className="game-container wh-grain wh-vignette" style={{ background: 'radial-gradient(ellipse at 50% -10%, #241d10 0%, #0b0a08 45%, #060504 100%)' }}>
      <AudioController />

      <AchievementToast achievementId={uiState.newAchievement} />

      <GameHeader character={character} raceInfo={raceInfo} onNewGame={onNewGame} />

      <main className="py-6">
        <div className="mx-auto w-full max-w-[1700px] px-4 xl:px-6">
          <button
            onClick={onToggleSidebar}
            aria-expanded={sidebarOpen}
            className="lg:hidden mb-4 w-full min-h-[48px] bg-[#1c1913] hover:bg-[#2a2517] text-[#c9a227] border border-[#c9a227]/40 font-gothic py-2 px-4 rounded-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>{sidebarOpen ? '✕ Скрыть характеристики' : '📜 Характеристики и хроника'}</span>
            <span className="text-xs text-gray-500">({sidebarOpen ? 'скрыть' : 'открыть'})</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <Sidebar
              character={character}
              raceInfo={raceInfo}
              activeQuests={game.activeQuests}
              history={history}
              logRef={logRef}
              open={sidebarOpen}
            />

            <div className="lg:col-span-9 animate-slide-in-right">
              {/* Прогресс жизни */}
              <div className="wh-panel p-6 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base text-gray-400 font-semibold flex items-center gap-2">
                    <span className="text-2xl">⏳</span>
                    Прогресс жизни
                  </span>
                  <span className="text-base text-gray-400 font-bold">{character.age} / ~{maxExpectedAge} лет</span>
                </div>
                <div className="wh-bar w-full overflow-hidden" style={{ height: '10px' }}>
                  <div
                    className="wh-bar-fill bg-gradient-to-r from-[#6e5a12] via-[#c9a227] to-[#a30000] shimmer"
                    style={{ width: `${Math.min(100, (character.age / maxExpectedAge) * 100)}%`, height: '100%', transition: 'width 0.6s ease-out' }}
                  ></div>
                </div>
              </div>

              {gameOver ? (
                <div className="wh-panel wh-frame p-8">
                  <DeathScreen
                    character={character}
                    raceInfo={raceInfo}
                    deathMessage={deathMessage}
                    history={history}
                    onNewLife={onNewGame}
                  />
                </div>
              ) : (
                <EventCard
                  event={currentEvent}
                  age={character.age}
                  phase={uiState.phase === 'result' ? 'result' : 'event'}
                  resultText={uiState.resultText}
                  lastChoice={uiState.lastChoice}
                  onChoice={onChoice}
                  onProceed={onProceed}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#c9a227]/30 py-4 mt-8" style={{ background: 'rgba(11,10,8,0.9)' }}>
        <div className="mx-auto w-full max-w-[1700px] px-6 text-center">
          <div className="flex justify-center gap-3 mb-3">
            <span className="text-xl animate-pulse">⚔️</span>
            <span className="text-xl animate-pulse" style={{ animationDelay: '0.2s' }}>☠️</span>
            <span className="text-xl animate-pulse" style={{ animationDelay: '0.4s' }}>⚜️</span>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            Warhammer Life Simulator • Warhammer 40,000 • 6 рас
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <kbd className="px-2.5 py-1 bg-gray-800 border border-yellow-600/30 rounded text-yellow-400 font-mono">A-D</kbd>
              выбор
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <kbd className="px-2.5 py-1 bg-gray-800 border border-yellow-600/30 rounded text-yellow-400 font-mono">Space</kbd>
              продолжение
            </span>
            <span>•</span>
            <span className="text-yellow-500 font-bold">
              🏆 Достижения: {uiState.unlockedAchievements.length}/{ACHIEVEMENTS.length}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
