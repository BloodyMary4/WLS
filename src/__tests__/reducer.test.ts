import { describe, it, expect, beforeEach, vi } from 'vitest';

// Простой mock localStorage для node-окружения (legacy/saveSystem обращаются к нему)
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string) { return this.map.has(key) ? this.map.get(key)! : null; }
  setItem(key: string, value: string) { this.map.set(key, value); }
  removeItem(key: string) { this.map.delete(key); }
  clear() { this.map.clear(); }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
});
import {
  initialUiState,
  dispatchGameAction,
  computeStartNewGame,
  computeChoose,
  computeProceedToNextYear,
  computeLoadSavedGame,
  computeAmbienceMood,
  GameUiState,
} from '../game/reducer';
import { makeCharacter, makeGameState } from '../game/testHelpers';
import { setGlobalSeed } from '../game/rng';
import { Choice } from '../game/types';

const harmlessChoice: Choice = {
  letter: 'А',
  text: 'Ничего не делать',
  effects: { description: 'Ты просто стоял и смотрел на звёзды.' },
};

const lethalChoice: Choice = {
  letter: 'Б',
  text: 'Прыгнуть в жерло реактора',
  effects: { health: -200, description: 'Пламя поглотило тебя.' },
};

describe('reducer: START_NEW_GAME', () => {
  beforeEach(() => setGlobalSeed(42));

  it('создаёт валидное состояние и переходит в фазу event', () => {
    const outcome = computeStartNewGame(initialUiState, 'test-seed');
    expect(outcome.state.phase).toBe('event');
    expect(outcome.state.game).not.toBeNull();
    expect(outcome.state.game!.gameOver).toBe(false);
    expect(outcome.state.game!.currentEvent.choices.length).toBeGreaterThan(0);
  });

  it('детерминирован при одинаковом seed', () => {
    const a = computeStartNewGame(initialUiState, 'same-seed');
    const b = computeStartNewGame(initialUiState, 'same-seed');
    expect(a.state.game!.character.name).toBe(b.state.game!.character.name);
    expect(a.state.game!.seed).toBe(b.state.game!.seed);
    expect(a.state.game!.currentEvent.text).toBe(b.state.game!.currentEvent.text);
  });

  it('выдаёт эффект save и unlockAudio', () => {
    const outcome = computeStartNewGame(initialUiState, 'fx-seed');
    expect(outcome.effects.some((e) => e.kind === 'save')).toBe(true);
    expect(outcome.effects.some((e) => e.kind === 'unlockAudio')).toBe(true);
  });
});

describe('reducer: CHOOSE', () => {
  beforeEach(() => setGlobalSeed(7));

  function stateWithGame() {
    const game = makeGameState();
    return { ...initialUiState, game, phase: 'event' as const };
  }

  it('безопасный выбор переводит в фазу result с текстом эффекта', () => {
    const outcome = computeChoose(stateWithGame(), harmlessChoice);
    expect(outcome.state.phase).toBe('result');
    expect(outcome.state.resultText).toBe(harmlessChoice.effects.description);
    expect(outcome.state.lastChoice).toEqual(harmlessChoice);
    expect(outcome.state.game!.history).toHaveLength(1);
  });

  it('смертельный выбор приводит к фазе dead и gameOver', () => {
    const outcome = computeChoose(stateWithGame(), lethalChoice);
    // Персонаж человек с creed < 5 — чуда не будет (детерминировано seed 7)
    expect(outcome.state.phase).toBe('dead');
    expect(outcome.state.game!.gameOver).toBe(true);
    expect(outcome.state.game!.deathMessage.length).toBeGreaterThan(0);
    expect(outcome.effects.some((e) => e.kind === 'playSound' && e.sound === 'death')).toBe(true);
  });

  it('игнорирует выбор в мёртвой игре', () => {
    const dead: GameUiState = {
      ...stateWithGame(),
      phase: 'dead',
      game: { ...makeGameState(), gameOver: true },
    };
    const outcome = computeChoose(dead, harmlessChoice);
    expect(outcome.state).toBe(dead);
    expect(outcome.effects).toHaveLength(0);
  });

  it('лейтмотив года: ранящий выбор — удар раны + низкий набат, удачный — чудо + светлый звон', () => {
    const woundChoice: Choice = { letter: 'А', text: 'Принять удар', effects: { health: -30, description: 'Больно.' } };
    const fortuneChoice: Choice = { letter: 'Б', text: 'Найти клад', effects: { credits: 50, description: 'Повезло!' } };

    const woundFx = computeChoose(stateWithGame(), woundChoice).effects.filter((e) => e.kind === 'playSound');
    expect(woundFx.some((e) => e.sound === 'wound')).toBe(true);
    expect(woundFx.some((e) => e.sound === 'event' && (e as { tone?: string }).tone === 'grave')).toBe(true);

    const fortuneFx = computeChoose(stateWithGame(), fortuneChoice).effects.filter((e) => e.kind === 'playSound');
    expect(fortuneFx.some((e) => e.sound === 'miracle')).toBe(true);
    expect(fortuneFx.some((e) => e.sound === 'event' && (e as { tone?: string }).tone === 'bright')).toBe(true);

    const neutralFx = computeChoose(stateWithGame(), harmlessChoice).effects.filter((e) => e.kind === 'playSound');
    expect(neutralFx.some((e) => e.sound === 'choice')).toBe(true);
    expect(neutralFx.some((e) => e.sound === 'event' && !(e as { tone?: string }).tone)).toBe(true);
    expect(neutralFx.some((e) => e.sound === 'wound' || e.sound === 'miracle')).toBe(false);
  });

  it('«Император защищает»: высокая Верность спасает от смерти (статистически)', () => {    let saved = 0;
    for (let seed = 0; seed < 60; seed++) {
      setGlobalSeed(seed);
      const game = makeGameState({ imperialCreed: 10, health: 50 });
      const st: GameUiState = { ...initialUiState, game, phase: 'event' };
      const outcome = computeChoose(st, lethalChoice);
      if (!outcome.state.game!.gameOver) saved++;
    }
    // creed 10 → шанс 30% за попытку; за 60 попыток вероятность 0 спасений ничтожна
    expect(saved).toBeGreaterThan(0);
  });

  it('чудо заступничества сопровождается звуком «miracle» и лорной записью хроники', () => {
    let found = false;
    for (let seed = 0; seed < 60 && !found; seed++) {
      setGlobalSeed(seed);
      const game = makeGameState({ imperialCreed: 10, health: 50 });
      const st: GameUiState = { ...initialUiState, game, phase: 'event' };
      const outcome = computeChoose(st, lethalChoice);
      if (!outcome.state.game!.gameOver) {
        found = true;
        expect(outcome.effects.some((e) => e.kind === 'playSound' && e.sound === 'miracle')).toBe(true);
        const last = outcome.state.game!.history[outcome.state.game!.history.length - 1];
        expect(last).toContain('Император защищает');
        expect(last).toMatch(/Чудес за жизнь: 1 \(чудо\)/);
      }
    }
    expect(found).toBe(true);
  });

  it('низкая Верность не спасает от смерти', () => {
    for (let seed = 0; seed < 30; seed++) {
      setGlobalSeed(seed);
      const game = makeGameState({ imperialCreed: 0, health: 50 });
      const st: GameUiState = { ...initialUiState, game, phase: 'event' };
      const outcome = computeChoose(st, lethalChoice);
      expect(outcome.state.game!.gameOver).toBe(true);
    }
  });
});

describe('reducer: PROCEED_TO_NEXT_YEAR', () => {
  beforeEach(() => setGlobalSeed(101));

  it('из фазы result возвращает в фазу event и очищает результат', () => {
    const game = makeGameState();
    const st: GameUiState = {
      ...initialUiState,
      game,
      phase: 'result',
      resultText: 'Что-то произошло.',
      lastChoice: harmlessChoice,
    };
    const outcome = computeProceedToNextYear(st);
    expect(outcome.state.phase).toBe('event');
    expect(outcome.state.resultText).toBe('');
    expect(outcome.state.lastChoice).toBeNull();
    expect(outcome.effects.some((e) => e.kind === 'save')).toBe(true);
  });

  it('квесты живут только в game.* (единый источник истины)', () => {
    const game = makeGameState();
    const st: GameUiState = { ...initialUiState, game, phase: 'result' };
    let cur = st;
    for (let i = 0; i < 15; i++) {
      cur = computeProceedToNextYear(cur).state;
      if (cur.game!.gameOver) break;
    }
    const active = cur.game!.activeQuests;
    const completed = cur.game!.completedQuests;
    const ids = [...active, ...completed].map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length); // нет дублей
  });
});

describe('reducer: LOAD_SAVED_GAME / CLEAR_ACHIEVEMENT_TOAST', () => {
  it('загрузка сохраняет разблокированные достижения и фазу', () => {
    const game = makeGameState();
    const outcome = computeLoadSavedGame(initialUiState, game, ['first-blood']);
    expect(outcome.state.game).toBe(game);
    expect(outcome.state.unlockedAchievements).toEqual(['first-blood']);
    expect(outcome.state.phase).toBe('event');
  });

  it('загрузка мёртвого сейва → фаза dead', () => {
    const game = { ...makeGameState(), gameOver: true };
    const outcome = computeLoadSavedGame(initialUiState, game, []);
    expect(outcome.state.phase).toBe('dead');
  });

  it('CLEAR_ACHIEVEMENT_TOAST сбрасывает тост', () => {
    const st: GameUiState = { ...initialUiState, newAchievement: 'x' };
    const outcome = dispatchGameAction(st, { type: 'CLEAR_ACHIEVEMENT_TOAST' });
    expect(outcome.state.newAchievement).toBeNull();
  });

  it('dispatchGameAction маршрутизирует действия', () => {
    setGlobalSeed(1);
    const viaDispatch = dispatchGameAction(initialUiState, { type: 'START_NEW_GAME', seedStr: 'route-test' });
    expect(viaDispatch.state.phase).toBe('event');
    expect(makeCharacter().race).toBe('human'); // sanity helper smoke
  });
});

function makeStateWith(characterOverrides: Parameters<typeof makeCharacter>[0]): GameUiState {
  return { ...initialUiState, phase: 'result', game: makeGameState(characterOverrides) };
}

describe('«Император защищает» — расширяемые причины', () => {
  // Смерть от инквизиции: suspicion>=10, age>10, human. Creed 10 → шанс спасения 30%.
  it('высокая Верность спасает от смерти по приговору Инквизиции', () => {
    let saved = false;
    for (let seed = 1; seed <= 40 && !saved; seed++) {
      const state = makeStateWith({
        race: 'human', age: 25, imperialCreed: 10, hiddenParams: { ...makeCharacter().hiddenParams, suspicion: 10 },
      });
      setGlobalSeed(seed);
      const outcome = dispatchGameAction(state, { type: 'PROCEED_TO_NEXT_YEAR' });
      if (!outcome.state.game?.gameOver) saved = true;
    }
    expect(saved).toBe(true);
  });

  it('нулевая Верность никогда не спасает от Инквизиции', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const state = makeStateWith({
        race: 'human', age: 25, imperialCreed: 0, influence: 0, hiddenParams: { ...makeCharacter().hiddenParams, suspicion: 10 },
      });
      setGlobalSeed(seed);
      const outcome = dispatchGameAction(state, { type: 'PROCEED_TO_NEXT_YEAR' });
      const game = outcome.state.game!;
      expect(game.gameOver).toBe(true);
      expect(game.deathMessage).toContain('Инквизици');
    }
  });

  it('безумие (sanity<=0) не отводится чудом — даже с creed 10', () => {
    for (let seed = 1; seed <= 30; seed++) {
      // warpAttention 10 — гарантированное безумие: исцеление рассудка требует attention<=2,
      // а регенерация здоровья при этом остаётся активной (health>0, food>0).
      const state = makeStateWith({
        race: 'human', age: 25, imperialCreed: 10, sanity: 0, influence: 0, warpAttention: 10,
      });
      setGlobalSeed(seed);
      const outcome = dispatchGameAction(state, { type: 'PROCEED_TO_NEXT_YEAR' });
      expect(outcome.state.game?.gameOver).toBe(true);
      expect(outcome.state.phase).toBe('dead');
      expect(outcome.state.game?.deathMessage).toContain('Безумие');
    }
  });
});

describe('computeAmbienceMood: маршрутизация состояния жизни в настроение звука', () => {
  const hp = (percent: number) => ({ health: Math.round(percent * 100), maxHealth: 100 });

  it('спокойная жизнь — normal', () => {
    expect(computeAmbienceMood(makeCharacter({ ...hp(0.8), sanity: 70, age: 25 }))).toBe('normal');
  });

  it('критическое здоровье (<25%) — danger', () => {
    expect(computeAmbienceMood(makeCharacter({ ...hp(0.2), sanity: 70 }))).toBe('danger');
  });

  it('высокая порча (>=7) и подозрение (>=10) — danger', () => {
    const base = makeCharacter(hp(0.8));
    expect(computeAmbienceMood({ ...base, hiddenParams: { ...base.hiddenParams, mutation: 7 } })).toBe('danger');
    expect(computeAmbienceMood({ ...base, hiddenParams: { ...base.hiddenParams, suspicion: 10 } })).toBe('danger');
  });

  it('рассудок <30 — danger, 30..54 — tense, >=55 не тревожит', () => {
    expect(computeAmbienceMood(makeCharacter({ ...hp(0.8), sanity: 29 }))).toBe('danger');
    expect(computeAmbienceMood(makeCharacter({ ...hp(0.8), sanity: 30 }))).toBe('tense');
    expect(computeAmbienceMood(makeCharacter({ ...hp(0.8), sanity: 54 }))).toBe('tense');
    expect(computeAmbienceMood(makeCharacter({ ...hp(0.8), sanity: 55 }))).toBe('normal');
  });

  it('умеренно раненый (<50% здоровья) — tense', () => {
    expect(computeAmbienceMood(makeCharacter(hp(0.4)))).toBe('tense');
  });

  it('долгая жизнь (возраст > 2.5× совершеннолетия при прочих показателях в норме) — epic', () => {
    expect(computeAmbienceMood(makeCharacter({ ...hp(0.8), sanity: 70, age: 60 }))).toBe('epic');
  });

  it('danger приоритетнее epic: старый, но критически раненый персонаж звучит тревожно', () => {
    expect(computeAmbienceMood(makeCharacter({ ...hp(0.1), sanity: 70, age: 60 }))).toBe('danger');
  });

  it('переход к следующему году выдаёт эффект setMood по итоговому состоянию', () => {
    vi.stubGlobal('localStorage', new MemoryStorage());
    const state = dispatchGameAction(initialUiState, { type: 'START_NEW_GAME', seedStr: 'mood-test' }).state;
    const outcome = dispatchGameAction(state, { type: 'PROCEED_TO_NEXT_YEAR' });
    const fx = outcome.effects.find((e) => e.kind === 'setMood');
    expect(fx).toBeDefined();
    expect(fx!.kind === 'setMood' && fx!.mood).toBe(computeAmbienceMood(outcome.state.game!.character));
  });
});
