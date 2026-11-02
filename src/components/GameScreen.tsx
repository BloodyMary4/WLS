import { useEffect, useRef, useState } from 'react';
import { Choice } from '../game/types';
import { GameUiState } from '../game/reducer';
import { RACE_INFO } from '../game/data';
import { GAME_CONFIG } from '../game/config';
import { ACHIEVEMENTS } from '../game/achievements';
import { AudioController } from './AudioController';
import { AchievementToast } from './AchievementToast';
import { GameHeader } from './GameHeader';
import { useFit } from '../game/useFit';
import { CodexPanel } from './CodexPanel';
import { ChroniclePanel } from './ChroniclePanel';
import { EventWindow } from './EventWindow';
import { DeathScreen } from './DeathScreen';

interface GameScreenProps {
  uiState: GameUiState;
  onChoice: (choice: Choice) => void;
  onProceed: () => void;
  onNewGame: () => void;
}

/** Игровой экран-«мостик» (v0.3.26): собран из окон-иллюминаторов.
 *  Верх — приборная панель статов; ниже три колонки отсеков: бортовой журнал
 *  слева, главное окно события в центре, хроника жизни справа. Страница не
 *  прокручивается целиком — длинные ленты скроллятся только внутри своих окон. */
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

  // Автоскролл хроники к последней записи (уважает prefers-reduced-motion).
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
    if (reduceMotion) el.scrollTop = el.scrollHeight;
    else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setChroniclePinned(true);
  }, [history]);

  /** Вернуть хронику к последней записи (кнопка в шапке окна). */
  const jumpToLatest = () => {
    const el = logRef.current;
    if (!el) return;
    const reduceMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) el.scrollTop = el.scrollHeight;
    else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setChroniclePinned(true);
  };

  const fit = useFit();

  // Fit-экран: страница не прокручивается вовсе — вертикаль делят окна,
  // «Путь жизни» живёт в тонком футере вместо отдельной панели над событием.
  if (fit) {
    return (
      <div className="game-fit flex flex-col wh-grain wh-vignette" style={{ background: 'radial-gradient(ellipse at 50% -10%, #241d10 0%, #0b0a08 45%, #060504 100%)' }}>
        <AudioController />
        <AchievementToast achievementId={uiState.newAchievement} />
        <GameHeader character={character} raceInfo={raceInfo} lastDeltas={uiState.lastDeltas} onNewGame={onNewGame} />

        <main className="flex-1 min-h-0 py-1.5">
          <div className="mx-auto w-full max-w-[1700px] h-full px-2 xl:px-3">
            <div className="fit-grid grid grid-cols-12 gap-2 h-full min-h-0">
              {/* Левый отсек: «Кодекс» — стопка окон-карточек, умещается без скролла */}
              <div className="col-span-3 fit-col animate-slide-in-left min-h-0">
                <CodexPanel
                  character={character}
                  raceInfo={raceInfo}
                  activeQuests={game.activeQuests}
                />
              </div>

              {/* Центр: главное окно события занимает всю высоту — решения всегда на экране */}
              <div className="col-span-6 fit-col gap-1.5 min-h-0">
                {gameOver ? (
                  <div className="fit-scroll flex-1 pr-1">
                    <div className="wh-panel wh-frame p-6 xl:p-8">
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
                  <EventWindow
                    event={currentEvent}
                    age={character.age}
                    phase={uiState.phase === 'result' ? 'result' : 'event'}
                    resultText={uiState.resultText}
                    lastChoice={uiState.lastChoice}
                    lastDeltas={uiState.lastDeltas}
                    onChoice={onChoice}
                    onProceed={onProceed}
                  />
                )}
              </div>

              {/* Правый отсек: хроника жизни — окно на всю высоту, скролл только внутри ленты */}
              <div className="col-span-3 fit-col animate-slide-in-right min-h-0">
                <ChroniclePanel
                  history={history}
                  logRef={logRef}
                  chroniclePinned={chroniclePinned}
                  onJumpToLatest={jumpToLatest}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Футер-прибор: путь жизни + горячие клавиши одной строкой */}
        <footer className="shrink-0 border-t border-[#c9a227]/30 py-1" style={{ background: 'rgba(11,10,8,0.9)' }}>
          <div className="mx-auto w-full max-w-[1700px] px-3 flex items-center gap-3 text-xs text-[#b8a878]/80">
            <span className="font-gothic uppercase tracking-widest text-[#c9a227]/70 hidden lg:inline whitespace-nowrap">⚜ Warhammer Life Simulator</span>
            <span className="text-sm shrink-0" aria-hidden="true">⏳</span>
            <span className="sr-only">Прогресс жизни</span>
            <div className="wh-bar flex-1 overflow-hidden" style={{ height: '6px' }} title={`Возраст ${character.age} из ожидаемых ~${maxExpectedAge} лет — за чертой начинается стариковская пора`}>
              <div
                className="wh-bar-fill bg-gradient-to-r from-[#6e5a12] via-[#c9a227] to-[#a30000] shimmer"
                style={{ width: `${Math.min(100, (character.age / maxExpectedAge) * 100)}%`, height: '100%', transition: 'width 0.6s ease-out' }}
              ></div>
            </div>
            <span className="text-gray-300 font-bold whitespace-nowrap tabular-nums">{character.age} / ~{maxExpectedAge} лет</span>
            <span
              className="text-[#b8a878] whitespace-nowrap tabular-nums cursor-help"
              title={`Достижения: открыто ${uiState.unlockedAchievements.length} из ${ACHIEVEMENTS.length}`}
            >
              🏆 {uiState.unlockedAchievements.length}/{ACHIEVEMENTS.length}
            </span>
            <span className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
              <kbd className="px-1.5 py-0.5 bg-[#1c1913] border border-[#c9a227]/40 rounded-sm text-[#e8c85a] font-mono text-[10px]">1–4</kbd>
              выбор
            </span>
            <span className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
              <kbd className="px-1.5 py-0.5 bg-[#1c1913] border border-[#c9a227]/40 rounded-sm text-[#e8c85a] font-mono text-[10px]">Space</kbd>
              дальше
            </span>
          </div>
        </footer>
      </div>
    );
  }

  if (!currentEvent || !currentEvent.text || !currentEvent.choices) {
    return <div className="text-white p-8">Error: Invalid game state</div>;
  }

  return (
    <div className="game-container game-fit wh-grain wh-vignette" style={{ background: 'radial-gradient(ellipse at 50% -10%, #241d10 0%, #0b0a08 45%, #060504 100%)' }}>
      <AudioController />

      <AchievementToast achievementId={uiState.newAchievement} />

      <GameHeader character={character} raceInfo={raceInfo} lastDeltas={uiState.lastDeltas} onNewGame={onNewGame} />

      <main className="flex-1 min-h-0 py-1.5">
        <div className="mx-auto w-full max-w-[1700px] h-full px-2 xl:px-3">
          <div className="fit-grid grid grid-cols-12 gap-2 h-full min-h-0 items-stretch">
            {/* Левый отсек: «Кодекс» — стопка окон-карточек */}
            <div className="col-span-3 fit-col animate-slide-in-left">
              <CodexPanel
                character={character}
                raceInfo={raceInfo}
                activeQuests={game.activeQuests}
              />
            </div>

            {/* Центральный иллюминатор: путь жизни + событие/смерть */}
            <div className="col-span-6 fit-col gap-2">
              {/* Прогресс жизни и достижения — тонкая строка-прибор над главным окном */}
              <div className="wh-panel wh-lifebar px-3 py-1.5 shrink-0">
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
                  <div className="wh-panel wh-frame p-6 xl:p-8">
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
                <div className="flex-1 min-h-0 flex">
                  <EventWindow
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

            {/* Правый отсек: хроника жизни — окно на всю высоту, скролл только внутри ленты */}
            <div className="col-span-3 fit-col animate-slide-in-right">
              <ChroniclePanel
                history={history}
                logRef={logRef}
                chroniclePinned={chroniclePinned}
                onJumpToLatest={jumpToLatest}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Футер: тонкая строка-подсказка */}
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
