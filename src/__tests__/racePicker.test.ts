/**
 * Тесты выбора расы на стартовом экране (v0.3.7):
 * generateCharacterByRace + проброс action.race через dispatchGameAction.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCharacterByRace, RACE_INFO } from '../game/data';
import { dispatchGameAction, initialUiState } from '../game/reducer';
import type { Race } from '../game/types';

// Mock localStorage для node-окружения (legacy/saveSystem обращаются к нему)
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

const ALL_RACES: Race[] = ['human', 'ork', 'eldar', 'dark_eldar', 'tau', 'gretchin'];

describe('generateCharacterByRace', () => {
  it.each(ALL_RACES)('создаёт персонажа с расой %s', (race) => {
    const c = generateCharacterByRace(race);
    expect(c).not.toBeNull();
    expect(c!.race).toBe(race);
    expect(RACE_INFO[race]).toBeDefined();
  });

  it('орк получает повышенное здоровье (лор: 130 HP)', () => {
    const ork = generateCharacterByRace('ork');
    expect(ork!.maxHealth).toBe(130);
  });

  it('детерминированность: один seed даёт одну и ту же фамилию/планету', () => {
    const a = dispatchGameAction(initialUiState, { type: 'START_NEW_GAME', seedStr: 'test-seed', race: 'eldar' });
    const b = dispatchGameAction(initialUiState, { type: 'START_NEW_GAME', seedStr: 'test-seed', race: 'eldar' });
    expect(a.state.game?.character.name).toBe(b.state.game?.character.name);
    expect(a.state.game?.character.planet).toBe(b.state.game?.character.planet);
  });
});

describe('START_NEW_GAME с race', () => {
  it.each(ALL_RACES)('race=%s доходит до персонажа через reducer', (race) => {
    const outcome = dispatchGameAction(initialUiState, { type: 'START_NEW_GAME', seedStr: 'fixed', race });
    expect(outcome.state.game).not.toBeNull();
    expect(outcome.state.game!.character.race).toBe(race);
  });

  it('без race — случайная судьба (раса валидна)', () => {
    const outcome = dispatchGameAction(initialUiState, { type: 'START_NEW_GAME', seedStr: 'random-roll' });
    const race = outcome.state.game!.character.race;
    expect(ALL_RACES).toContain(race);
  });

  it('выбранная раса влияет на стартовые события (орк ≠ человек)', () => {
    const human = dispatchGameAction(initialUiState, { type: 'START_NEW_GAME', seedStr: 'same', race: 'human' });
    const ork = dispatchGameAction(initialUiState, { type: 'START_NEW_GAME', seedStr: 'same', race: 'ork' });
    // Событие первого года генерируется по расе — у орка не может быть человеческой планеты.
    expect(human.state.game!.character.planet).not.toBe(ork.state.game!.character.planet);
  });
});
