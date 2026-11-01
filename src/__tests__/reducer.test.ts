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

  it('«Император защищает»: высокая Верность спасает от смерти (статистически)', () => {
    let saved = 0;
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
