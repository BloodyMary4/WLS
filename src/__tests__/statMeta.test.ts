import { describe, it, expect } from 'vitest';
import { STAT_HINTS, STATUS_HINTS, FOOD_CRITICAL, isStarving, foodCaption, clampStat } from '../game/statMeta';

describe('statMeta — пояснения к показателям шапки', () => {
  it('каждый показатель шапки имеет понятное пояснение', () => {
    const keys = ['health', 'sanity', 'warpCorruption', 'food', 'ammo', 'influence', 'luck'] as const;
    for (const k of keys) {
      expect(STAT_HINTS[k].length).toBeGreaterThan(20);
    }
  });

  it('пояснения написаны с названия показателя (игрок видит, о чём речь)', () => {
    expect(STAT_HINTS.health.startsWith('Здоровье')).toBe(true);
    expect(STAT_HINTS.sanity.startsWith('Рассудок')).toBe(true);
    expect(STAT_HINTS.warpCorruption.startsWith('Порча')).toBe(true);
    expect(STAT_HINTS.food.startsWith('Провизия')).toBe(true);
    expect(STAT_HINTS.ammo.startsWith('Боезапас')).toBe(true);
  });

  it('порог критичности еды = 1, голод — при 0 и ниже', () => {
    expect(FOOD_CRITICAL).toBe(1);
    expect(isStarving(0)).toBe(true);
    expect(isStarving(-1)).toBe(true);
    expect(isStarving(1)).toBe(false);
  });

  it('подпись еды объясняет смысл цифры', () => {
    expect(foodCaption(0)).toBe('Еды нет!');
    expect(foodCaption(1)).toBe('Последний паёк!');
    expect(foodCaption(2)).toBe('хватит на 2 года');
    expect(foodCaption(5)).toBe('хватит на 5 лет');
    expect(foodCaption(11)).toBe('хватит на 11 лет');
    expect(foodCaption(21)).toBe('хватит на 21 год');
  });
});

describe('STATUS_HINTS — статус «кто ты сейчас» не бывает загадкой', () => {
  it('базовые возрастные статусы объяснены', () => {
    for (const st of ['Младенец', 'Малыш', 'Ребёнок', 'Подросток', 'Взрослый']) {
      expect(STATUS_HINTS[st]?.length).toBeGreaterThan(20);
    }
  });
});

describe('clampStat — полоса скрытых характеристик всегда в шкале 0–10', () => {
  it('режет выбросы и спасает NaN', () => {
    expect(clampStat(-3)).toBe(0);
    expect(clampStat(14)).toBe(10);
    expect(clampStat(7)).toBe(7);
    expect(clampStat(NaN)).toBe(0);
  });
});
