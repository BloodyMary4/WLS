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
        <div className="mx-auto w-full max-w-[1700px] px-3 xl:px-4">
          <div className="fit-grid grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
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
              {/* Прогресс жизни и достижения — одна плотная строка-прибор (v0.3.25) */}
              <div className="wh-panel px-3 py-1.5 mb-2 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm shrink-0" aria-hidden="true">⏳</span>
                  <span className="sr-only">Прогресс жизни</span>
                  <span className="text-xs font-gothic uppercase tracking-wider text-[#b8a878]/90 whitespace-nowrap hidden sm:inline">Путь жизни</span>
                  <div className="wh-bar flex-1 overflow-hidden" style={{ height: '8px' }} title={`Возраст ${character.age} из ожидаемых ~${maxExpectedAge} лет — за чертой начинается стариковская пора`}>
                    <div
                      className="wh-bar-fill bg-gradient-to-r from-[#6e5a12] via-[#c9a227] to-[#a30000] shimmer"
                      style={{ width: `${Math.min(100, (character.age / maxExpectedAge) * 100)}%`, height: '100%', transition: 'width 0.6s ease-out' }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-300 font-bold whitespace-nowrap tabular-nums">{character.age} / ~{maxExpectedAge} лет</span>
                  <span
                    className="hidden md:inline-block text-xs text-[#b8a878] whitespace-nowrap tabular-nums cursor-help"
                    title={`Достижения: открыто ${uiState.unlockedAchievements.length} из ${ACHIEVEMENTS.length}`}
                  >
                    🏆 {uiState.unlockedAchievements.length}/{ACHIEVEMENTS.length}
                  </span>
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

      {/* Футер: тонкая строка-подсказка вместо блока с эмодзи (v0.3.25) */}
      <footer className="wh-footer border-t border-[#c9a227]/30 py-1.5" style={{ background: 'rgba(11,10,8,0.9)' }}>
        <div className="mx-auto w-full max-w-[1700px] px-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#b8a878]/80">
          <span className="font-gothic uppercase tracking-widest text-[#c9a227]/70">⚜ Warhammer Life Simulator</span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-[#1c1913] border border-[#c9a227]/40 rounded-sm text-[#e8c85a] font-mono text-[10px]">1–4</kbd>
            выбор
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-[#1c1913] border border-[#c9a227]/40 rounded-sm text-[#e8c85a] font-mono text-[10px]">Space</kbd>
            дальше
          </span>
          <span className="md:hidden">🏆 {uiState.unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
        </div>
      </footer>
    </div>
  );
}
