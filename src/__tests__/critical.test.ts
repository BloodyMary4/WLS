import { describe, it, expect } from 'vitest';
import { isCritical, listCriticalStats } from '../game/critical';

describe('critical: пороги критичности «всё на экране» (v0.3.21)', () => {
  it('Здоровье: критично при ≤25% запаса', () => {
    expect(isCritical('Здоровье', 0.25)).toBe(true);
    expect(isCritical('Здоровье', 0.24)).toBe(true);
    expect(isCritical('Здоровье', 0.26)).toBe(false);
  });

  it('Рассудок ≤20 и Порча ≥80 — критичны', () => {
    expect(isCritical('Рассудок', 20)).toBe(true);
    expect(isCritical('Рассудок', 21)).toBe(false);
    expect(isCritical('Порча', 80)).toBe(true);
    expect(isCritical('Порча', 79)).toBe(false);
  });

  it('Мутация и Подозрение критичны с 7 (пороги Инквизиции)', () => {
    expect(isCritical('Мутация', 7)).toBe(true);
    expect(isCritical('Мутация', 6)).toBe(false);
    expect(isCritical('Подозрение', 7)).toBe(true);
    expect(isCritical('Подозрение', 6)).toBe(false);
  });

  it('listCriticalStats собирает список по персонажу', () => {
    const healthy = { health: 80, maxHealth: 100, sanity: 90, warpCorruption: 10, hiddenParams: { mutation: 1, suspicion: 2 } };
    expect(listCriticalStats(healthy)).toEqual([]);

    const dying = { health: 20, maxHealth: 100, sanity: 15, warpCorruption: 85, hiddenParams: { mutation: 8, suspicion: 3 } };
    expect(listCriticalStats(dying)).toEqual(['Здоровье', 'Рассудок', 'Порча', 'Мутация']);
  });

  it('скрытые параметры у не-людей отсутствуют — в список не попадают', () => {
    const ork = { health: 100, maxHealth: 100, sanity: 100, warpCorruption: 0, hiddenParams: {} };
    expect(listCriticalStats(ork)).toEqual([]);
    // maxHealth=0 не должен делить на ноль
    expect(listCriticalStats({ ...ork, health: 0, maxHealth: 0 })).toEqual(['Здоровье']);
  });
});
