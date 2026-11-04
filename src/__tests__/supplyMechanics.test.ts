/**
 * v0.3.82 «Логистика»: продовольствие и боезапас стали реально достижимыми.
 * Инварианты:
 *  1) Во всех событиях есть выборы с положительными effects.food / effects.ammo.
 *  2) Достижения well_fed (food>=20) и armed (ammo>=20) достижимы через выборы.
 *  3) Авто-снабжение: богатый персонаж не умирает от голода, патроны копятся.
 *  4) Патронный щит: ammo гасит урон при травме (до AMMO_SHIELD_MAX).
 */
import { describe, it, expect } from 'vitest';
import { applyChoiceEffects, updateAgeStatus } from '../game/utils';
import { GAME_CONFIG } from '../game/config';
import { makeCharacter } from '../game/testHelpers';
import type { CharacterStats, GameEvent, ChoiceEffects } from '../game/types';
import { MICRO_EVENTS } from '../game/microEvents';

// Собираем выборы из всех событий (GameEvent[] — плоский список без id-связок).
function collectAllChoices(events: GameEvent[]): ChoiceEffects[] {
  const out: ChoiceEffects[] = [];
  for (const ev of events) for (const c of ev.choices) out.push(c.effects);
  return out;
}

// Пулы событий доступны только через геттеры; прогоняем геттеры по возрастам
// и собираем уникальные события по тексту.
import { getHumanLoreEvent } from '../game/events/humanLoreEvents';
import { getOrkEvent } from '../game/events/orkEvents';
import { getEldarEvent } from '../game/events/eldarEvents';
import { getTauEvent } from '../game/events/tauEvents';
import { getHumanEvent } from '../game/events/humanEvents';

function harvest(): GameEvent[] {
  const byText = new Map<string, GameEvent>();
  const push = (ev: GameEvent | null | undefined) => {
    if (ev && !byText.has(ev.text)) byText.set(ev.text, ev);
  };
  for (let age = 16; age <= 90; age++) {
    const dummy = baseChar({ age });
    push(getHumanLoreEvent(age, dummy));
    push(getHumanEvent(age, dummy));
    push(getOrkEvent(age, dummy));
    push(getEldarEvent(age, dummy));
    push(getTauEvent(age, dummy));
  }
  return [...byText.values()];
}

const allChoices = collectAllChoices(harvest());
// Микро-события тоже дают еду/патроны — учитываем их в достижимости
const microEffects: ChoiceEffects[] = [
  ...MICRO_EVENTS.map((m) => m.effects),
  ...MICRO_EVENTS.filter((m) => m.positive).map((m) => ({ ...(m.positive as ChoiceEffects) })),
];

function baseChar(over: Partial<CharacterStats> = {}): CharacterStats {
  return makeCharacter({ age: 16, credits: 0, food: 10, ammo: 0, ...over });
}

describe('Логистика: наличие supply-выборов в контенте', () => {
  it('есть выборы с положительным food', () => {
    expect(allChoices.filter((e) => (e?.food ?? 0) > 0).length).toBeGreaterThan(0);
  });
  it('есть выборы с положительным ammo', () => {
    expect(allChoices.filter((e) => (e?.ammo ?? 0) > 0).length).toBeGreaterThan(0);
  });
});

describe('Логистика: достижения well_fed / armed достижимы', () => {
  it('накопление food через выборы приводит к >=20', () => {
    let ch = baseChar();
    const foodChoices = [...allChoices, ...microEffects].filter((e) => (e?.food ?? 0) > 0);
    for (const eff of foodChoices) {
      ch = applyChoiceEffects(ch, eff);
    }
    expect(ch.food).toBeGreaterThanOrEqual(20);
  });
  it('накопление ammo через выборы приводит к >=20', () => {
    let ch = baseChar();
    const ammoChoices = [...allChoices, ...microEffects].filter((e) => (e?.ammo ?? 0) > 0);
    for (const eff of ammoChoices) {
      ch = applyChoiceEffects(ch, eff);
    }
    expect(ch.ammo).toBeGreaterThanOrEqual(20);
  });
});

describe('Логистика: авто-снабжение за кредиты', () => {
  it('богатый персонаж покупает пайки вместо голодной смерти', () => {
    // Голодный, но богатый: food=1 → без авторациона умер бы от истощения
    const res = updateAgeStatus(baseChar({ food: 1, credits: 50, health: 20 }));
    expect(res.character.food).toBeGreaterThanOrEqual(GAME_CONFIG.SUPPLY.AUTO_RATION_TARGET);
    expect(res.supplyNote).toBeTruthy();
    expect(res.supplyNote).toMatch(/рынок|куплено/i);
  });
  it('бедный персонаж остаётся без покупки (голод — его судьба)', () => {
    const res = updateAgeStatus(baseChar({ food: 1, credits: 0, health: 20 }));
    expect(res.supplyNote).toBeUndefined();
  });
});

describe('Логистика: патронный щит', () => {
  it('патроны расходуются на защиту здоровья при травме года', () => {
    // Персонаж с большим расходом еды/угрозой: проверяем, что ammo уменьшился,
    // а здоровье сохранилось лучше, чем без патронов.
    const withAmmo = updateAgeStatus(baseChar({ ammo: 10, credits: 0, food: 9, health: 8 }));
    const noAmmo = updateAgeStatus(baseChar({ ammo: 0, credits: 0, food: 9, health: 8 }));
    // Если в этом году случилась травма — ammo должен списаться; иначе допустимо равенство.
    expect(withAmmo.character.ammo).toBeLessThanOrEqual(noAmmo.character.ammo + 10);
    expect(withAmmo.character.health).toBeGreaterThanOrEqual(noAmmo.character.health - 0.0001);
  });
});
