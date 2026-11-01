/**
 * Единый reducer игры — единственный источник истины для всего состояния.
 *
 * Раньше состояние было размазано по 8 useState в useGameState (gameState,
 * resultText, showResult, lastChoice, unlockedAchievements, newAchievement,
 * activeQuests, completedQuests), причём квесты дублировались и в UI-слое,
 * и внутри GameState — из-за этого загрузка сейва молча роняла прогресс квестов.
 *
 * Теперь: весь переходный код — чистые функции (computeChoose / computeProceedToNextYear /
 * computeStartNewGame / computeLoadSavedGame), а побочные эффекты (звук, сохранение,
 * таймеры) вынесены в слой "effects" — результат хода содержит список эффектов,
 * которые хук исполняет после диспатча. Это делает логику тестируемой без React.
 */
import { GameState, Choice, CharacterStats } from './types';
import { rng, setGlobalSeed, hashSeed } from './rng';
import { generateCharacter, getEventForAge, getDeathMessage } from './data';
import { checkAchievements } from './achievements';
import { triggerMicroEvent } from './microEvents';
import { getLegacy, updateLegacyOnDeath, getLegacyBonuses } from './legacy';
import {
  applyChoiceEffects,
  updateAgeStatus,
  applyMicroEventEffects,
  rollImperialIntercession,
} from './utils';
import { GAME_CONFIG, DEATH_CAUSES } from './config';
import { validateEvent, validateGameState, createDefaultEvent } from './validation';
import { randomNPCEncounter, addNPC, generateNPCEvent, updateNPCRelationship } from './npcSystem';
import { checkQuests, applyQuestRewards, getAvailableQuests, createQuest, Quest } from './questSystem';

// ---------- Состояние ----------

export interface GameUiState {
  /** null = на главном экране */
  game: GameState | null;
  phase: 'menu' | 'event' | 'result' | 'dead';
  resultText: string;
  lastChoice: Choice | null;
  unlockedAchievements: string[];
  newAchievement: string | null;
}

export const initialUiState: GameUiState = {
  game: null,
  phase: 'menu',
  resultText: '',
  lastChoice: null,
  unlockedAchievements: [],
  newAchievement: null,
};

// ---------- Действия ----------

export type GameAction =
  | { type: 'START_NEW_GAME'; seedStr?: string }
  | { type: 'LOAD_SAVED_GAME'; game: GameState; unlockedAchievements: string[] }
  | { type: 'CHOOSE'; choice: Choice }
  | { type: 'PROCEED_TO_NEXT_YEAR' }
  | { type: 'CLEAR_ACHIEVEMENT_TOAST' };

// ---------- Побочные эффекты (исполняются вне reducer) ----------

export type GameEffect =
  | { kind: 'unlockAudio' }
  | { kind: 'playSound'; sound: 'event' | 'death' | 'achievement' }
  | { kind: 'save' }
  | { kind: 'achievementToast'; durationMs: number };

export interface GameOutcome {
  state: GameUiState;
  effects: GameEffect[];
}

// ---------- Утилиты перехода ----------

interface DeathCondition {
  check: (c: CharacterStats) => boolean;
  getMessage: (c: CharacterStats) => string;
  cause: string;
}

const DEATH_CONDITIONS: DeathCondition[] = [
  {
    check: (c) => c.health <= 0,
    getMessage: (c) => getDeathMessage(c),
    cause: DEATH_CAUSES.HEALTH,
  },
  {
    check: (c) => c.sanity <= 0,
    getMessage: (c) => `Разум ${c.name} не выдержал ужасов этого мира. Безумие поглотило его. Теперь он бродит по ${c.planet} как пустая оболочка, бормоча проклятия на забытых языках.`,
    cause: 'sanity',
  },
  {
    check: (c) => c.warpCorruption >= 100,
    getMessage: (c) => `Порча Варпа полностью поглотила ${c.name}. Его тело изменилось до неузнаваемости, а душа стала игрушкой для демонов. Инквизиция нашла лишь груду мяса, шепчущую имена богов Хаоса.`,
    cause: 'warp_corruption',
  },
  {
    check: (c) => c.warpAttention >= 10,
    getMessage: (c) => `Внимание Варпа привлекло демонов к ${c.name}. Разрыв в реальности поглотил его, утащив в Имматериум. Его крики echoing в Варпе будут вечны.`,
    cause: 'warp_attention',
  },
  {
    check: (c) => c.hiddenParams.mutation >= GAME_CONFIG.STAT_THRESHOLDS.PSI_OVERLOAD && c.race === 'human',
    getMessage: (c) => `Мутации ${c.name} стали очевидны. Инквизиция пришла ночью. Очищающее пламя — последний дар Императора.`,
    cause: DEATH_CAUSES.MUTATION,
  },
  {
    check: (c) => c.race === 'eldar' && (c.hiddenParams.psi || 0) >= GAME_CONFIG.STAT_THRESHOLDS.PSI_OVERLOAD,
    getMessage: (c) => `Разум ${c.name} не выдержал мощи Варпа. Псионический шторм поглотил его душу. Теперь он — часть бесконечного крика.`,
    cause: DEATH_CAUSES.PSI_OVERLOAD,
  },
  {
    check: (c) => c.race === 'dark_eldar' && (c.hiddenParams.cruelty || 0) <= GAME_CONFIG.STAT_THRESHOLDS.CRUELTY_MINIMUM && c.age > 5,
    getMessage: (c) => `ГОЛОД поглотил ${c.name}. Без боли и страданий Друкхаари угасает. Тело рассыпается в прах Коммагота.`,
    cause: DEATH_CAUSES.HUNGER,
  },
  {
    check: (c) => c.hiddenParams.suspicion >= GAME_CONFIG.STAT_THRESHOLDS.SUSPICION_CRITICAL && c.age > 10 && c.race === 'human',
    getMessage: (c) => `Подозрения Инквизиции пали на ${c.name}. Чёрные корабли прибыли. Сопротивление бесполезно.`,
    cause: DEATH_CAUSES.INQUISITION,
  },
];

/**
 * Проверяет условия смерти. Возвращает обновлённое состояние, если смерть
 * наступила (или чудом отвведена — «Император защищает»), либо null, если
 * персонаж жив и ход продолжается обычным путём.
 */
function resolveDeathOrIntercession(
  state: GameUiState,
  character: CharacterStats,
  history: string[],
  effects: GameEffect[],
): GameUiState | null {
  const game = state.game!;

  for (const condition of DEATH_CONDITIONS) {
    if (!condition.check(character)) continue;

    // «Император защищает»: высокая Верность людей может отвратить смерть от ран.
    if (condition.cause === DEATH_CAUSES.HEALTH && rollImperialIntercession(character)) {
      const savedChar: CharacterStats = { ...character, health: 1 };
      return {
        ...state,
        game: {
          ...game,
          character: savedChar,
          history: [
            ...history,
            `[Год ${savedChar.age}] Смерть смотрела ${savedChar.name} в глаза — но Верность его была велика. Император защищает.`,
          ],
        },
      };
    }

    const legacy = getLegacy();
    updateLegacyOnDeath(legacy, character.age, character.race, condition.cause, state.unlockedAchievements);
    effects.push({ kind: 'playSound', sound: 'death' });

    return {
      ...state,
      phase: 'dead',
      game: {
        ...game,
        character,
        history,
        gameOver: true,
        deathMessage: condition.getMessage(character),
      },
    };
  }
  return null;
}

// ---------- Чистые переходы ----------

export function computeStartNewGame(state: GameUiState, seedStr?: string): GameOutcome {
  const effects: GameEffect[] = [{ kind: 'unlockAudio' }];

  // Seed партии: детерминированность для тестов и баг-репортов.
  const seed = seedStr && seedStr.trim() ? hashSeed(seedStr.trim()) : (rng().next() * 2 ** 32) >>> 0;
  setGlobalSeed(seed);

  const character = generateCharacter();
  if (!character) {
    console.error('Failed to generate character');
    return { state, effects: [] };
  }

  const legacy = getLegacy();
  const bonuses = getLegacyBonuses(legacy);

  character.credits += bonuses.startingCredits;
  character.health = Math.min(character.maxHealth, character.health + bonuses.startingHealthBonus);

  let event = getEventForAge(GAME_CONFIG.AGE_THRESHOLDS.BABY, character);
  if (!validateEvent(event)) {
    console.warn('Invalid event generated, using default event');
    event = createDefaultEvent();
  }

  const initialHistory: string[] = [];
  if (bonuses.startingCredits > 0 || bonuses.startingHealthBonus > 0) {
    initialHistory.push(`[Наследие] ${bonuses.description}`);
  }

  const game: GameState = {
    character,
    currentEvent: event,
    history: initialHistory,
    gameOver: false,
    deathMessage: '',
    activeQuests: [],
    completedQuests: [],
    seed,
  };

  if (!validateGameState(game)) {
    console.error('Invalid game state created');
    return { state, effects: [] };
  }

  const next: GameUiState = {
    ...initialUiState,
    game,
    phase: 'event',
  };
  effects.push({ kind: 'save' });
  return { state: next, effects };
}

export function computeLoadSavedGame(
  state: GameUiState,
  game: GameState,
  unlockedAchievements: string[],
): GameOutcome {
  const next: GameUiState = {
    ...initialUiState,
    game,
    phase: game.gameOver ? 'dead' : 'event',
    unlockedAchievements,
  };
  return { state: next, effects: [{ kind: 'unlockAudio' }] };
}

export function computeChoose(state: GameUiState, choice: Choice): GameOutcome {
  const game = state.game;
  if (!game || game.gameOver) return { state, effects: [] };

  const effects: GameEffect[] = [{ kind: 'unlockAudio' }, { kind: 'playSound', sound: 'event' }];

  let newChar = applyChoiceEffects(game.character, choice.effects);
  newChar = updateAgeStatus(newChar);

  const newlyUnlocked = checkAchievements(newChar, state.unlockedAchievements);
  let unlockedList = state.unlockedAchievements;
  let newAchievement = state.newAchievement;
  if (newlyUnlocked.length > 0) {
    unlockedList = [...unlockedList, ...newlyUnlocked];
    newAchievement = newlyUnlocked[0];
    effects.push({ kind: 'playSound', sound: 'achievement' });
    effects.push({ kind: 'achievementToast', durationMs: GAME_CONFIG.ACHIEVEMENTS.DISPLAY_DURATION });
  }

  const historyEntry = `[Год ${newChar.age - 1}] ${game.currentEvent.text.substring(0, 60)}... → ${choice.text}`;
  const newHistory = [...game.history, historyEntry];

  const intermediate: GameUiState = {
    ...state,
    game: { ...game, character: newChar, history: newHistory },
    unlockedAchievements: unlockedList,
    newAchievement,
    phase: 'result',
    resultText: choice.effects.description,
    lastChoice: choice,
  };

  const afterDeath = resolveDeathOrIntercession(intermediate, newChar, newHistory, effects);
  if (afterDeath) {
    if (afterDeath.game && !afterDeath.game.gameOver) {
      // Чудо заступничества: событие исчерпано, но персонаж жив — идём дальше.
      let nextEvent = getEventForAge(newChar.age, newChar);
      if (!validateEvent(nextEvent)) nextEvent = createDefaultEvent();
      afterDeath.game = { ...afterDeath.game!, currentEvent: nextEvent };
    }
    effects.push({ kind: 'save' });
    return { state: afterDeath, effects };
  }

  let nextEvent = getEventForAge(newChar.age, newChar);
  if (!validateEvent(nextEvent)) {
    nextEvent = createDefaultEvent();
  }

  const next: GameUiState = {
    ...intermediate,
    game: {
      ...intermediate.game!,
      currentEvent: nextEvent,
      gameOver: false,
      deathMessage: '',
    },
  };
  effects.push({ kind: 'save' });
  return { state: next, effects };
}

export function computeProceedToNextYear(state: GameUiState): GameOutcome {
  const game = state.game;
  if (!game) return { state, effects: [] };

  const effects: GameEffect[] = [{ kind: 'unlockAudio' }];

  let newChar = game.character;
  const newHistory = [...game.history];

  // Микро-события
  const microEventResult = triggerMicroEvent(newChar);
  if (microEventResult.triggered) {
    const microEvent = microEventResult.event;
    newChar = applyMicroEventEffects(newChar, microEvent.effects);
    newHistory.push(`[Микро] ${microEvent.text} → ${microEvent.effects.description}`);
  }

  // Встреча с NPC (20% шанс)
  if (rng().next() < 0.2) {
    const encounter = randomNPCEncounter(newChar);
    if (encounter.npc) {
      if (encounter.type === 'new') {
        newChar = addNPC(newChar, encounter.npc);
        const eventText = generateNPCEvent(newChar, encounter.npc);
        newHistory.push(`[NPC] ${eventText}`);
        const relationshipChange = Math.floor(rng().next() * 20) - 10;
        newChar = updateNPCRelationship(newChar, encounter.npc.id, relationshipChange);
      } else {
        const eventText = generateNPCEvent(newChar, encounter.npc);
        newHistory.push(`[NPC] ${eventText}`);
        const relationshipChange = Math.floor(rng().next() * 10) - 5;
        newChar = updateNPCRelationship(newChar, encounter.npc.id, relationshipChange);
      }
    }
  }

  // Квесты живут в game.* — единый источник истины (без дублей в UI-слое).
  const { updatedQuests, completedQuests: newlyCompleted } = checkQuests(newChar, game.activeQuests);

  let finalChar = newChar;
  const finalCompletedQuests: Quest[] = [...game.completedQuests];

  for (const quest of newlyCompleted) {
    finalChar = applyQuestRewards(finalChar, quest);
    finalCompletedQuests.push(quest);

    const completionMessages = [
      `[ИСПЫТАНИЕ] ${quest.name} завершено. Судьба отметила тебя.`,
      `[СУДЬБА] ${quest.name} - твоё имя теперь выжжено в хрониках.`,
      `[РОК] ${quest.name} - ты прошёл через тьму и вышел... изменённым.`,
      `[ЛЕГЕНДА] ${quest.name} - твои деяния будут помнить, даже когда звёзды погаснут.`,
    ];
    newHistory.push(completionMessages[Math.floor(rng().next() * completionMessages.length)]);
  }

  const availableQuests = getAvailableQuests(finalChar, updatedQuests);
  const newActiveQuests: Quest[] = updatedQuests.filter((q) => !q.completed);

  if (newActiveQuests.length === 0 && availableQuests.length > 0) {
    const newQuest = createQuest(availableQuests[0], finalChar.age);
    newActiveQuests.push(newQuest);

    const questMessages = [
      `[СУДЬБА] Новое испытание: ${newQuest.name}. ${newQuest.description}`,
      `[РОК] ${newQuest.name} - путь, который ты должен пройти.`,
      `[ИСПЫТАНИЕ] ${newQuest.name} - тьма ждёт тебя.`,
    ];
    newHistory.push(questMessages[Math.floor(rng().next() * questMessages.length)]);
  }

  const intermediate: GameUiState = {
    ...state,
    game: {
      ...game,
      character: finalChar,
      history: newHistory,
      activeQuests: newActiveQuests,
      completedQuests: finalCompletedQuests,
    },
  };

  const afterDeath = resolveDeathOrIntercession(intermediate, finalChar, newHistory, effects);
  if (afterDeath) {
    effects.push({ kind: 'save' });
    return { state: afterDeath, effects };
  }

  const next: GameUiState = {
    ...intermediate,
    phase: 'event',
    resultText: '',
    lastChoice: null,
  };
  effects.push({ kind: 'save' });
  return { state: next, effects };
}

// ---------- Reducer ----------

export function gameReducer(state: GameUiState, action: GameAction): GameUiState {
  return dispatchGameAction(state, action).state;
}

/**
 * Основной переход: возвращает и новое состояние, и список побочных эффектов.
 * gameReducer — тонкая обёртка для useReducer (эффекты исполняет хук).
 */
export function dispatchGameAction(state: GameUiState, action: GameAction): GameOutcome {
  switch (action.type) {
    case 'START_NEW_GAME':
      return computeStartNewGame(state, action.seedStr);
    case 'LOAD_SAVED_GAME':
      return computeLoadSavedGame(state, action.game, action.unlockedAchievements);
    case 'CHOOSE':
      return computeChoose(state, action.choice);
    case 'PROCEED_TO_NEXT_YEAR':
      return computeProceedToNextYear(state);
    case 'CLEAR_ACHIEVEMENT_TOAST':
      return { state: { ...state, newAchievement: null }, effects: [] };
    default:
      return { state, effects: [] };
  }
}
