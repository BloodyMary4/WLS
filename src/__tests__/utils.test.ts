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
    expect(updateAgeStatus(char).character.age).toBe(21);
  });

  it('переход статуса Ребёнок -> Подросток в 13 лет', () => {
    const char = makeCharacter({ age: 12, status: 'Ребёнок' });
    const { character: r } = updateAgeStatus(char);
    expect(r.age).toBe(13);
    expect(r.status).toBe('Подросток');
  });

  it('переход статуса Подросток -> Взрослый в 18 лет', () => {
    const char = makeCharacter({ age: 17, status: 'Подросток' });
    expect(updateAgeStatus(char).character.status).toBe('Взрослый');
  });

  it('взрослый статус не меняется с возрастом', () => {
    const char = makeCharacter({ age: 40, status: 'Ветеран' });
    expect(updateAgeStatus(char).character.status).toBe('Ветеран');
  });

  it('высокая мутация наносит урон здоровью каждый год', () => {
    const base = makeCharacter();
    const char = makeCharacter({
      health: 80,
      food: 0, // исключаем регенерацию — проверяем именно урон от мутаций
      hiddenParams: { ...base.hiddenParams, mutation: GAME_CONFIG.STAT_THRESHOLDS.MUTATION_DAMAGE },
    });
    const { character: r } = updateAgeStatus(char);
    expect(r.health).toBe(80 - GAME_CONFIG.HEALTH.MUTATION_DAMAGE_PER_YEAR - 5);
  });

  it('голод (food=0) вредит здоровью, иначе еда убывает и раны затягиваются', () => {
    const starving = makeCharacter({ food: 0, health: 50 });
    expect(updateAgeStatus(starving).character.health).toBe(45);
    const fed = makeCharacter({ food: 5, health: 50 });
    const { character: r } = updateAgeStatus(fed);
    // Естественная регенерация: здоровое тело восстанавливается, если есть пища
    expect(r.health).toBeGreaterThan(50);
    expect(r.health).toBeLessThanOrEqual(r.maxHealth);
    expect(r.food).toBe(4);
  });

  it('сильная порча варпа снижает рассудок', () => {
    const char = makeCharacter({ warpCorruption: 60, sanity: 50, warpAttention: 0 });
    const { character: r } = updateAgeStatus(char);
    expect(r.sanity).toBeLessThan(50);
  });

  it('низкий рассудок повышает внимание варпа', () => {
    const char = makeCharacter({ sanity: 10, warpAttention: 1 });
    expect(updateAgeStatus(char).character.warpAttention).toBe(2);
  });

  it('не уменьшает кулдаун микро-событий (это делает triggerMicroEvent)', () => {
    const char = makeCharacter({ microEventCooldown: 2 });
    expect(updateAgeStatus(char).character.microEventCooldown).toBe(2);
  });

  it('генерирует мировое событие каждые 5 лет', () => {
    const char = makeCharacter({ age: 24 }); // станет 25
    const res = updateAgeStatus(char);
    expect(res.newWorldEvent).toBeTruthy();
    expect(res.character.worldEvent).toBe(res.newWorldEvent);
    expect(res.character.worldEventsSeen).toContain(res.newWorldEvent!);
  });

  it('старение зависит от расы: эльдар живёт дольше человека, гретчин — меньше', () => {
    const humanOld = makeCharacter({ race: 'human', age: 95, health: 100, food: 10 });
    const eldarOld = makeCharacter({ race: 'eldar', age: 95, health: 100, food: 10 });
    expect(updateAgeStatus(humanOld).character.health).toBeLessThan(100);
    expect(updateAgeStatus(eldarOld).character.health).toBe(100);
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
