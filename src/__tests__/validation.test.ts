import { describe, it, expect } from 'vitest';
import {
  validateCharacter,
  validateEvent,
  validateGameState,
  validateLegacyData,
  createDefaultEvent,
} from '../game/validation';
import { makeCharacter, makeGameState } from '../game/testHelpers';

describe('validateCharacter', () => {
  it('валидный персонаж проходит проверку', () => {
    expect(validateCharacter(makeCharacter())).toBe(true);
  });

  it('отсутствующие name/race/planet — невалидно', () => {
    expect(validateCharacter(makeCharacter({ name: '' }))).toBe(false);
    expect(validateCharacter(makeCharacter({ race: '' as never }))).toBe(false);
    expect(validateCharacter(makeCharacter({ planet: '' }))).toBe(false);
  });

  it('health вне [0, maxHealth] — невалидно', () => {
    expect(validateCharacter(makeCharacter({ health: -1 }))).toBe(false);
    expect(validateCharacter(makeCharacter({ health: 101, maxHealth: 100 }))).toBe(false);
  });

  it('sanity/warpCorruption/luck/influence вне диапазона — невалидно', () => {
    expect(validateCharacter(makeCharacter({ sanity: 101 }))).toBe(false);
    expect(validateCharacter(makeCharacter({ warpCorruption: -5 }))).toBe(false);
    expect(validateCharacter(makeCharacter({ luck: 0 }))).toBe(false);
    expect(validateCharacter(makeCharacter({ luck: 11 }))).toBe(false);
    expect(validateCharacter(makeCharacter({ influence: 200 }))).toBe(false);
  });

  it('скрытые параметры вне [0,10] — невалидно', () => {
    const char = makeCharacter();
    char.hiddenParams.faith = 11;
    expect(validateCharacter(char)).toBe(false);
  });

  it('фракционные отношения в [-100,100] — валидно (единый диапазон с квестами)', () => {
    const char = makeCharacter();
    char.factionRelations.imperium = 15;
    expect(validateCharacter(char)).toBe(true);
    char.factionRelations.chaos = -100;
    expect(validateCharacter(char)).toBe(true);
  });

  it('фракционные отношения вне [-100,100] — невалидно', () => {
    const char = makeCharacter();
    char.factionRelations.imperium = 101;
    expect(validateCharacter(char)).toBe(false);
    char.factionRelations.imperium = -101;
    expect(validateCharacter(char)).toBe(false);
  });

  it('не-массивы в inventory/traits — невалидно', () => {
    const char = makeCharacter();
    (char as unknown as Record<string, unknown>).inventory = 'not-an-array';
    expect(validateCharacter(char)).toBe(false);
  });
});

describe('validateEvent', () => {
  it('валидное событие проходит', () => {
    expect(validateEvent(createDefaultEvent())).toBe(true);
  });

  it('пустой текст или без выборов — невалидно', () => {
    expect(validateEvent({ text: '', choices: [{ letter: 'А', text: 'x', effects: { description: 'y' } }] })).toBe(false);
    expect(validateEvent({ text: 'есть', choices: [] })).toBe(false);
  });

  it('выбор без effects.description — невалидно', () => {
    expect(
      validateEvent({
        text: 'событие',
        choices: [{ letter: 'А', text: 'действовать', effects: {} as never }],
      })
    ).toBe(false);
  });
});

describe('validateGameState', () => {
  it('валидное состояние проходит', () => {
    expect(validateGameState(makeGameState())).toBe(true);
  });

  it('битый персонаж ломает валидацию состояния', () => {
    const gs = makeGameState({ sanity: 999 });
    expect(validateGameState(gs)).toBe(false);
  });

  it('gameOver не boolean — невалидно', () => {
    const gs = makeGameState();
    (gs as unknown as Record<string, unknown>).gameOver = 'yes';
    expect(validateGameState(gs)).toBe(false);
  });
});

describe('validateLegacyData', () => {
  const valid = {
    totalGamesPlayed: 3,
    totalYearsLived: 120,
    bestAge: 45,
    achievementsEverUnlocked: ['a'],
    racesPlayed: ['human'],
    deathsByCause: { health: 1 },
  };

  it('валидные данные проходят', () => {
    expect(validateLegacyData(valid)).toBe(true);
  });

  it('null/не-объект — невалидно', () => {
    expect(validateLegacyData(null)).toBe(false);
    expect(validateLegacyData('string')).toBe(false);
  });

  it('отрицательные счётчики — невалидно', () => {
    expect(validateLegacyData({ ...valid, bestAge: -1 })).toBe(false);
    expect(validateLegacyData({ ...valid, totalGamesPlayed: -5 })).toBe(false);
  });

  it('отсутствующие поля — невалидно', () => {
    const { deathsByCause, ...rest } = valid;
    expect(validateLegacyData(rest)).toBe(false);
  });
});
