import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Choice } from '../game/types';
import { GameUiState } from '../game/reducer';
import { RACE_INFO } from '../game/data';
import { GAME_CONFIG } from '../game/config';
import { ACHIEVEMENTS } from '../game/achievements';
import { AudioController } from './AudioController';
import { AchievementToast } from './AchievementToast';
import { GameHeader } from './GameHeader';
import { useFit } from '../game/useFit';
import { ChroniclePanel } from './ChroniclePanel';
import { EventWindow } from './EventWindow';
import { DeathScreen } from './DeathScreen';
/* Модули информационных окон экрана (v0.3.32): каждое окно — самостоятельный
   обновляемый компонент со своим адекватным размером в сетке. */
import { DossierWindow } from './windows/DossierWindow';
import { HiddenStatsWindow } from './windows/HiddenStatsWindow';
import { SuppliesWindow } from './windows/SuppliesWindow';
import { GalaxyWindow } from './windows/GalaxyWindow';
import { CompanionsWindow } from './windows/CompanionsWindow';
import { QuestsWindow } from './windows/QuestsWindow';
import { InventoryWindow } from './windows/InventoryWindow';

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

  /** Прокрутка ленты хроники вниз. Защита от сред без matchMedia/scrollTo
   *  (jsdom, старые webview): иначе исключение роняет весь React-дерево
   *  и игрок видит пустой экран. */
  const scrollChronicleToBottom = (smooth: boolean) => {
    const el = logRef.current;
    if (!el) return;
    const reduceMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (smooth && !reduceMotion && typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  // Автоскролл хроники к последней записи (уважает prefers-reduced-motion).
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom > 160) {
      setChroniclePinned(false);
      return;
    }
    scrollChronicleToBottom(true);
    setChroniclePinned(true);
  }, [history]);

  /** Вернуть хронику к последней записи (кнопка в шапке окна). */
  const jumpToLatest = () => {
    scrollChronicleToBottom(true);
    setChroniclePinned(true);
  };

  const fit = useFit();

  /** Активные испытания судьбы (квесты) — для отдельного окна левого отсека. */
  const activeQuests = game.activeQuests ?? [];

  /* Строгая двухколоночная компоновка (v0.3.59, по ТЗ игрока):
     ЛЕВая колонка (фикс. ширина, сайдбар): сверху «Досье», снизу «Снабжение».
     ПРАВАЯ главная область: верхний ряд — «Хроника жизни» слева и
     «Состояние Галактики» справа бок о бок; посередине — большое текстовое
     окно события (главный фокус экрана); внизу — «Твоё решение» строго под
     текстом. Всё на одном экране, без вертикальной бесконечной прокрутки,
     блоки не растягиваются длинным списком. Стиль сохранён: уголь + золото,
     Cinzel на заголовках, чистый sans в тексте. */
  const bayGrid = (center: ReactNode) => (
    <main className={`flex-1 ${fit ? 'min-h-0 py-1.5' : 'py-3'}`}>
      <div className={`mx-auto w-full max-w-[1700px] px-2 xl:px-3 ${fit ? 'h-full' : ''}`}>
        <div className={`fit-grid bridge-2col grid grid-cols-1 md:grid-cols-12 gap-2 ${fit ? 'h-full min-h-0' : ''}`}>
          {/* ЛЕВая колонка — сайдбар фиксированной ширины: Досье сверху,
              Снабжение снизу. Ниже — второстепенные отсеки (компаньоны,
              квесты, инвентарь, скрытые свойства), когда они появляются. */}
          <aside className="md:col-span-4 lg:col-span-3 col-span-1 fit-col animate-slide-in-left min-h-0">
            <div className="codex-sheet flex-1 min-h-0">
              <DossierWindow character={character} raceInfo={raceInfo} />
              <SuppliesWindow character={character} />
              {(character.npcs.length > 0 || activeQuests.length > 0 ||
                character.inventory.length > 0 || character.augmentics.length > 0 || character.traits.length > 0) && (
                <div className="codex-pair">
                  {character.npcs.length > 0 ? <CompanionsWindow npcs={character.npcs} /> : <span className="codex-pair-fill" aria-hidden="true" />}
                  {activeQuests.length > 0 ? <QuestsWindow quests={activeQuests} /> : <span className="codex-pair-fill" aria-hidden="true" />}
                </div>
              )}
              {(character.inventory.length > 0 || character.augmentics.length > 0 || character.traits.length > 0) && (
                <InventoryWindow character={character} />
              )}
              <HiddenStatsWindow character={character} />
            </div>
          </aside>

          {/* ПРАВАя главная область: [Хроника | Галактика] → событие →
              выборы уже внутри окна события, прижаты к низу. */}
          <div className="md:col-span-8 lg:col-span-9 col-span-1 fit-col min-h-0 gap-2">
            {/* Верхний ряд: бортовой журнал слева, состояние галактики справа */}
            <div className="bridge-toprow shrink-0">
              <div className="bridge-chronicle min-h-0">
                <ChroniclePanel
                  history={history}
                  logRef={logRef}
                  chroniclePinned={chroniclePinned}
                  onJumpToLatest={jumpToLatest}
                />
              </div>
              <div className="bridge-galaxy min-h-0">
                {character.worldEvent ? (
                  <GalaxyWindow worldEvent={character.worldEvent} seenCount={character.worldEventsSeen?.length ?? 0} />
                ) : (
                  <section className="wh-window h-full" aria-label="Состояние Галактики">
                    <header className="wh-window-head px-2 py-1 border-b border-[#c9a227]/40">
                      <h3 className="font-gothic text-[11px] uppercase tracking-[0.14em] text-[#e8c85a]">Состояние Галактики</h3>
                    </header>
                    <p className="p-2 text-xs text-[#b8a878]/80">Тишина варпа — ничего не происходит.</p>
                  </section>
                )}
              </div>
            </div>

            {/* Центральный блок: главное текстовое окно события на всю
                оставшуюся высоту; «Твоё решение» — внизу того же окна */}
            <div className="fit-col flex-1 min-h-0 gap-1.5">
              {center}
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  const centerContent = gameOver ? (
    <div className="fit-scroll flex-1 min-h-0 pr-1">
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
  );

  // Fit-экран: страница не прокручивается вовсе — вертикаль делят окна,
  // «Путь жизни» живёт в тонком футере вместо отдельной панели над событием.
  if (fit) {
    return (
      <div className="game-fit flex flex-col wh-grain wh-vignette" style={{ background: 'radial-gradient(ellipse at 50% -10%, #241d10 0%, #0b0a08 45%, #060504 100%)' }}>
        <AudioController />
        <AchievementToast achievementId={uiState.newAchievement} />
        <GameHeader character={character} raceInfo={raceInfo} lastDeltas={uiState.lastDeltas} onNewGame={onNewGame} />

        {bayGrid(centerContent)}

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

  /* Обычный поток (узкие/низкие экраны): тот же осток окон, но страница
     прокручивается целиком — схлопывания колонок больше невозможно. */
  return (
    <div className="game-container wh-grain wh-vignette min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse at 50% -10%, #241d10 0%, #0b0a08 45%, #060504 100%)' }}>
      <AudioController />
      <AchievementToast achievementId={uiState.newAchievement} />
      <GameHeader character={character} raceInfo={raceInfo} lastDeltas={uiState.lastDeltas} onNewGame={onNewGame} />

      {bayGrid(centerContent)}

      {/* Футер: путь жизни + горячие клавиши */}
      <footer className="wh-footer border-t border-[#c9a227]/30 py-1.5" style={{ background: 'rgba(11,10,8,0.9)' }}>
        <div className="mx-auto w-full max-w-[1700px] px-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#b8a878]/80">
          <span className="font-gothic uppercase tracking-widest text-[#c9a227]/70">⚜ Warhammer Life Simulator</span>
          <span className="flex items-center gap-2 whitespace-nowrap tabular-nums">
            ⏳ {character.age} / ~{maxExpectedAge} лет
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap tabular-nums cursor-help" title={`Достижения: открыто ${uiState.unlockedAchievements.length} из ${ACHIEVEMENTS.length}`}>
            🏆 {uiState.unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-[#1c1913] border border-[#c9a227]/40 rounded-sm text-[#e8c85a] font-mono text-[10px]">1–4</kbd>
            выбор
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-[#1c1913] border border-[#c9a227]/40 rounded-sm text-[#e8c85a] font-mono text-[10px]">Space</kbd>
            дальше
          </span>
        </div>
      </footer>
    </div>
  );
}
