import { describe, expect, it } from 'vitest';
import { buildLegacySummary, RACE_LABELS_RU } from '../game/legacySummary';
import type { LegacyData } from '../game/types';

function makeLegacy(overrides: Partial<LegacyData> = {}): LegacyData {
  return {
    totalGamesPlayed: 0,
    totalYearsLived: 0,
    bestAge: 0,
    achievementsEverUnlocked: [],
    racesPlayed: [],
    deathsByCause: {},
    ...overrides,
  };
}

describe('buildLegacySummary (стартовый экран, дорожная карта UI/UX п.2)', () => {
  it('пустая legacy — нули и null-строки', () => {
    const s = buildLegacySummary(makeLegacy());
    expect(s.totalGamesPlayed).toBe(0);
    expect(s.bestLifeText).toBeNull();
    expect(s.racesPlayedText).toBeNull();
    expect(s.achievementsCount).toBe(0);
  });

  it('рекорд жизни форматируется как «до N лет»', () => {
    const s = buildLegacySummary(makeLegacy({ totalGamesPlayed: 3, bestAge: 47 }));
    expect(s.bestLifeText).toBe('до 47 лет');
    expect(s.totalGamesPlayed).toBe(3);
  });

  it('расы отображаются русскими названиями через запятую', () => {
    const s = buildLegacySummary(
      makeLegacy({ racesPlayed: ['human', 'ork', 'dark_eldar', 'tau', 'gretchin'] }),
    );
    expect(s.racesPlayedText).toBe('Человек, Орк, Друкхаари, Тау, Гретчин');
  });

  it('аэльдар подписаны по лору (самоназвание), а не «эльдары»', () => {
    const s = buildLegacySummary(makeLegacy({ racesPlayed: ['eldar'] }));
    expect(s.racesPlayedText).toBe('Аэльдар');
    expect(RACE_LABELS_RU.eldar).toBe('Аэльдар');
  });

  it('счётчик достижений считает уникальные id', () => {
    const s = buildLegacySummary(
      makeLegacy({ achievementsEverUnlocked: ['a', 'b', 'c'] }),
    );
    expect(s.achievementsCount).toBe(3);
  });
});
