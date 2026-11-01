import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveGame, loadGame, hasSave } from '../game/saveSystem';
import { makeGameState } from '../game/testHelpers';

// Простой mock localStorage для node/jsdom окружения
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string) { return this.map.has(key) ? this.map.get(key)! : null; }
  setItem(key: string, value: string) { this.map.set(key, value); }
  removeItem(key: string) { this.map.delete(key); }
  clear() { this.map.clear(); }
}

beforeEach(() => {
  const storage = new MemoryStorage();
  vi.stubGlobal('localStorage', storage);
});

describe('saveSystem', () => {
  it('hasSave возвращает false на пустом хранилище', () => {
    expect(hasSave()).toBe(false);
  });

  it('save -> load сохраняет состояние и ачивки', () => {
    const gs = makeGameState({ age: 33 });
    expect(saveGame(gs, ['ach1', 'ach2'])).toBe(true);
    expect(hasSave()).toBe(true);
    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.gameState.character.age).toBe(33);
    expect(loaded!.unlockedAchievements).toEqual(['ach1', 'ach2']);
  });

  it('load при битом JSON чистит сохранение и возвращает null', () => {
    localStorage.setItem('grimdark_save', '{broken json');
    expect(loadGame()).toBeNull();
    expect(localStorage.getItem('grimdark_save')).toBeNull();
  });

  it('load при неверной версии чистит сейв', () => {
    localStorage.setItem('grimdark_save', JSON.stringify({ version: 999, gameState: {} }));
    expect(loadGame()).toBeNull();
    expect(localStorage.getItem('grimdark_save')).toBeNull();
  });

  it('load при отсутствии character/currentEvent чистит сейв', () => {
    localStorage.setItem('grimdark_save', JSON.stringify({ version: 1, timestamp: 1, gameState: {}, unlockedAchievements: [] }));
    expect(loadGame()).toBeNull();
  });

  it('save возвращает false при переполнении localStorage', () => {
    const failing = {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError'); },
      removeItem: () => {},
    };
    vi.stubGlobal('localStorage', failing);
    expect(saveGame(makeGameState(), [])).toBe(false);
  });
});
