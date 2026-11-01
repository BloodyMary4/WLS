import { describe, it, expect } from 'vitest';
import { applyChoiceEffects, updateAgeStatus, getHealthColor, getSanityColor } from '../game/utils';
import { makeCharacter } from '../game/testHelpers';
import { GAME_CONFIG } from '../game/config';

describe('applyChoiceEffects', () => {
  it('не мутирует исходный объект', () => {
    const char = makeCharacter();
    const result = applyChoiceEffects(char, { health: -10, description: '' });
    expect(char.health).toBe(80);
    expect(result.health).toBe(70);
    expect(result).not.toBe(char);
  });

  it('клампит health в диапазоне [0, maxHealth]', () => {
    const char = makeCharacter({ health: 95 });
    expect(applyChoiceEffects(char, { health: 50 , description: '' }).health).toBe(100);
    expect(applyChoiceEffects(char, { health: -500 , description: '' }).health).toBe(0);
  });

  it('не даёт уйти credits/food/ammo в минус', () => {
    const char = makeCharacter({ credits: 10, food: 2, ammo: 3 });
    const r = applyChoiceEffects(char, { credits: -100, food: -100, ammo: -100 , description: '' });
    expect(r.credits).toBe(0);
    expect(r.food).toBe(0);
    expect(r.ammo).toBe(0);
  });

  it('клампит sanity/warpCorruption в [0,100], luck в [1,10]', () => {
    const char = makeCharacter();
    expect(applyChoiceEffects(char, { sanity: 999 , description: '' }).sanity).toBe(100);
    expect(applyChoiceEffects(char, { sanity: -999 , description: '' }).sanity).toBe(0);
    expect(applyChoiceEffects(char, { warpCorruption: 999 , description: '' }).warpCorruption).toBe(100);
    expect(applyChoiceEffects(char, { luck: 999 , description: '' }).luck).toBe(10);
    expect(applyChoiceEffects(char, { luck: -999 , description: '' }).luck).toBe(1);
  });

  it('изменяет скрытые параметры в пределах [MIN_VALUE, MAX_VALUE]', () => {
    const char = makeCharacter();
    const r = applyChoiceEffects(char, { faith: 100 , description: '' });
    expect(r.hiddenParams.faith).toBe(GAME_CONFIG.STAT_THRESHOLDS.MAX_VALUE);
  });

  it('добавляет/удаляет трейты без дубликатов', () => {
    let char = makeCharacter({ traits: ['Солдат'] });
    char = applyChoiceEffects(char, { addTrait: 'Еретик' , description: '' });
    char = applyChoiceEffects(char, { addTrait: 'Еретик' , description: '' });
    expect(char.traits).toEqual(['Солдат', 'Еретик']);
    char = applyChoiceEffects(char, { removeTrait: 'Солдат' , description: '' });
    expect(char.traits).toEqual(['Еретик']);
  });

  it('добавляет/удаляет предметы инвентаря и keyChoice', () => {
    let char = makeCharacter();
    char = applyChoiceEffects(char, { addItem: 'Лазгун' , description: '' });
    expect(char.inventory).toContain('Лазгун');
    char = applyChoiceEffects(char, { removeItem: 'Лазгун' , description: '' });
    expect(char.inventory).not.toContain('Лазгун');
    char = applyChoiceEffects(char, { keyChoice: 'Присягнул Инквизиции' , description: '' });
    expect(char.keyChoices).toContain('Присягнул Инквизиции');
  });

  it('нулевые эффекты не меняют состояние', () => {
    const char = makeCharacter();
    const r = applyChoiceEffects(char, { health: 0, credits: 0 , description: '' });
    expect(r).toEqual(char);
  });
});

describe('updateAgeStatus', () => {
  it('увеличивает возраст на 1', () => {
    const char = makeCharacter({ age: 20 });
    expect(updateAgeStatus(char).age).toBe(21);
  });

  it('переход статуса Ребёнок -> Подросток в 13 лет', () => {
    const char = makeCharacter({ age: 12, status: 'Ребёнок' });
    const r = updateAgeStatus(char);
    expect(r.age).toBe(13);
    expect(r.status).toBe('Подросток');
  });

  it('переход статуса Подросток -> Взрослый в 18 лет', () => {
    const char = makeCharacter({ age: 17, status: 'Подросток' });
    expect(updateAgeStatus(char).status).toBe('Взрослый');
  });

  it('взрослый статус не меняется с возрастом', () => {
    const char = makeCharacter({ age: 40, status: 'Ветеран' });
    expect(updateAgeStatus(char).status).toBe('Ветеран');
  });

  it('высокая мутация наносит урон здоровью каждый год', () => {
    const base = makeCharacter();
    const char = makeCharacter({
      health: 80,
      hiddenParams: { ...base.hiddenParams, mutation: GAME_CONFIG.STAT_THRESHOLDS.MUTATION_DAMAGE },
    });
    const r = updateAgeStatus(char);
    expect(r.health).toBe(80 - GAME_CONFIG.HEALTH.MUTATION_DAMAGE_PER_YEAR);
  });

  it('голод (food=0) вредит здоровью, иначе еда убывает', () => {
    const starving = makeCharacter({ food: 0, health: 50 });
    expect(updateAgeStatus(starving).health).toBe(45);
    const fed = makeCharacter({ food: 5, health: 50 });
    const r = updateAgeStatus(fed);
    expect(r.health).toBe(50);
    expect(r.food).toBe(4);
  });

  it('сильная порча варпа снижает рассудок', () => {
    const char = makeCharacter({ warpCorruption: 60, sanity: 50, warpAttention: 0 });
    const r = updateAgeStatus(char);
    expect(r.sanity).toBeLessThan(50);
  });

  it('низкий рассудок повышает внимание варпа', () => {
    const char = makeCharacter({ sanity: 10, warpAttention: 1 });
    expect(updateAgeStatus(char).warpAttention).toBe(2);
  });

  it('генерирует мировое событие каждые 5 лет', () => {
    const char = makeCharacter({ age: 24 }); // станет 25
    expect(updateAgeStatus(char).worldEvent).toBeTruthy();
  });
});

describe('цвета состояний', () => {
  it('getHealthColor: полный HP зелёный, критический красный', () => {
    expect(getHealthColor(100, 100)).toBe('text-green-400');
    expect(getHealthColor(10, 100)).toBe('text-red-400');
    expect(getHealthColor(30, 100)).toBe('text-yellow-400');
  });

  it('getSanityColor: границы корректны', () => {
    expect(getSanityColor(90)).toBe('text-blue-400');
    expect(getSanityColor(50)).toBe('text-yellow-400');
    expect(getSanityColor(10)).toBe('text-red-400');
  });
});
