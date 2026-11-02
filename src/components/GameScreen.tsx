import { useEffect, useRef, useState } from 'react';
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
  onChoice: (choice: Choice) => void;
  onProceed: () => void;
  onNewGame: () => void;
}

/** Игровой экран: шапка + сайдбар + карточка события/смерти + футер.
 *  Сайдбар всегда видим (единый стиль «всё на экране»): панель характеристик
 *  сворачивается внутри сайдара кнопкой-заголовком, а не кнопкой «Скрыть». */
export function GameScreen({ uiState, onChoice, onProceed, onNewGame }: GameScreenProps) {
  const logRef = useRef<HTMLDivElement>(null);
  /** true — хроника «пришпилена» к последней записи; false — игрок читает старое. */
  const [chroniclePinned, setChroniclePinned] = useState(true);
  const game = uiState.game!;
  const { character, currentEvent, history, gameOver, deathMessage } = game;

  const raceInfo = RACE_INFO[character.race];
  // Расовый предел ожидаемой жизни (эльдар — столетия, гретчин — полвека)
  const maxExpectedAge = GAME_CONFIG.AGE_THRESHOLDS.MAX_EXPECTED_BY_RACE[character.race]
    ?? GAME_CONFIG.AGE_THRESHOLDS.MAX_EXPECTED;

  // Автоскролл хроники к последней записи.
  // Уважение prefers-reduced-motion: без плавной анимации прокрутки, сразу в конец.
  // Если игрок сам отлистал вверх («читаю старое») — не уводим взгляд с новой записи,
  // вместо этого показываем кнопку-подсказку «к последнему году».
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom > 160) {
      setChroniclePinned(false);
      return;
    }
    const reduceMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
    setChroniclePinned(true);
  }, [history]);

  /** Вернуть хронику к последней записи (кнопка над скроллом). */
  const jumpToLatest = () => {
    const el = logRef.current;
    if (!el) return;
    const reduceMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) el.scrollTop = el.scrollHeight;
    else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setChroniclePinned(true);
  };

  if (!currentEvent || !currentEvent.text || !currentEvent.choices) {
    return <div className="text-white p-8">Error: Invalid game state</div>;
  }

  return (
    <div className="game-container game-fit wh-grain wh-vignette" style={{ background: 'radial-gradient(ellipse at 50% -10%, #241d10 0%, #0b0a08 45%, #060504 100%)' }}>
      <AudioController />

      <AchievementToast achievementId={uiState.newAchievement} />

      <GameHeader character={character} raceInfo={raceInfo} lastDeltas={uiState.lastDeltas} onNewGame={onNewGame} />

      <main>
        <div className="mx-auto w-full max-w-[1700px] px-4 xl:px-6">
          <div className="fit-grid grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <Sidebar
              character={character}
              raceInfo={raceInfo}
              activeQuests={game.activeQuests}
              history={history}
              logRef={logRef}
              chroniclePinned={chroniclePinned}
              onJumpToLatest={jumpToLatest}
            />

            <div className="fit-col lg:col-span-9 animate-slide-in-right">
              {/* Прогресс жизни — компактная строка */}
              <div className="wh-panel px-4 py-2.5 mb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg shrink-0" aria-hidden="true">⏳</span>
                  <span className="sr-only">Прогресс жизни</span>
                  <div className="wh-bar flex-1 overflow-hidden" style={{ height: '8px' }}>
                    <div
                      className="wh-bar-fill bg-gradient-to-r from-[#6e5a12] via-[#c9a227] to-[#a30000] shimmer"
                      style={{ width: `${Math.min(100, (character.age / maxExpectedAge) * 100)}%`, height: '100%', transition: 'width 0.6s ease-out' }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-400 font-bold whitespace-nowrap tabular-nums">{character.age} / ~{maxExpectedAge} лет</span>
                </div>
              </div>

              {gameOver ? (
                <div className="fit-scroll flex-1 pr-1">
                  <div className="wh-panel wh-frame p-8">
                    <DeathScreen
                      character={character}
                      raceInfo={raceInfo}
                      deathMessage={deathMessage}
                      history={history}
                      onNewLife={onNewGame}
                    />
                  </div>
                </div>
              ) : (
                <div className="fit-scroll flex-1 pr-1">
                  <EventCard
                    event={currentEvent}
                    age={character.age}
                    phase={uiState.phase === 'result' ? 'result' : 'event'}
                    resultText={uiState.resultText}
                    lastChoice={uiState.lastChoice}
                    lastDeltas={uiState.lastDeltas}
                    onChoice={onChoice}
                    onProceed={onProceed}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="wh-footer border-t border-[#c9a227]/30 py-4 mt-8" style={{ background: 'rgba(11,10,8,0.9)' }}>
        <div className="mx-auto w-full max-w-[1700px] px-6 text-center">
          <div className="footer-decor flex justify-center gap-3 mb-3">
            <span className="text-xl animate-pulse">⚔️</span>
            <span className="text-xl animate-pulse" style={{ animationDelay: '0.2s' }}>☠️</span>
            <span className="text-xl animate-pulse" style={{ animationDelay: '0.4s' }}>⚜️</span>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            Warhammer Life Simulator • Warhammer 40,000 • 6 рас
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-400">
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
