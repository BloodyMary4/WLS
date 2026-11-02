import { describe, it, expect } from 'vitest';
import {
  AUGMETIC_CATALOG,
  availableAugmetics,
  findAugmetic,
  getRaceFaction,
  isAugmeticAllowed,
} from '../game/augmetics';
import { pickAugmeticForEvent, getAugmeticEvent } from '../game/events/augmeticEvents';
import { installAugmetic } from '../game/utils';
import { applyChoiceEffects } from '../game/utils';
import { makeCharacter } from '../game/testHelpers';
import { getEventForAge } from '../game/data';
import type { Augmetic } from '../game/augmetics';

describe('Каталог аугметики (лорная целостность)', () => {
  it('все импланты имеют уникальные id и заполненные поля', () => {
    const ids = new Set<string>();
    for (const list of Object.values(AUGMETIC_CATALOG)) {
      for (const aug of list) {
        expect(aug.id).toBeTruthy();
        expect(ids.has(aug.id)).toBe(false);
        ids.add(aug.id);
        expect(aug.name.length).toBeGreaterThan(3);
        expect(aug.description.length).toBeGreaterThan(10);
        expect(aug.minAge).toBeGreaterThanOrEqual(8);
        expect(aug.price).toBeGreaterThanOrEqual(0);
        expect(aug.effects).toBeTruthy();
      }
    }
  });

  it('расы соответствуют фракциям каталога', () => {
    expect(getRaceFaction('human')).toBe('imperium');
    expect(getRaceFaction('ork')).toBe('ork');
    expect(getRaceFaction('eldar')).toBe('eldar');
    expect(getRaceFaction('dark_eldar')).toBe('drukhari');
    expect(getRaceFaction('tau')).toBe('tau');
    expect(getRaceFaction('gretchin')).toBe('gretchin');
    // У каждой расы есть хотя бы один имплант
    (['human', 'ork', 'eldar', 'dark_eldar', 'tau', 'gretchin'] as const).forEach(race => {
      expect(availableAugmetics(race).length).toBeGreaterThan(0);
    });
  });

  it('isAugmeticAllowed: чужой имплант запрещён, по возрасту — проверяется', () => {
    const orkArm = findAugmetic('choppa_hand')!;
    const human = makeCharacter({ race: 'human', age: 40 });
    expect(isAugmeticAllowed(human, orkArm)).toBe(false);
    const youngOrk = makeCharacter({ race: 'ork', age: 5 });
    expect(isAugmeticAllowed(youngOrk, orkArm)).toBe(false);
    const oldOrk = makeCharacter({ race: 'ork', age: 15 });
    expect(isAugmeticAllowed(oldOrk, orkArm)).toBe(true);
  });

  it('findAugmetic находит по id во всех фракциях и возвращает null для мусора', () => {
    expect(findAugmetic('black_carapace')?.faction).toBe('imperium');
    expect(findAugmetic('ethereal_bond')?.faction).toBe('tau');
    expect(findAugmetic('no_such_augmetic')).toBeNull();
  });
});

describe('Выбор импланта для события', () => {
  it('детерминирован и не повторяет уже установленные', () => {
    const c = makeCharacter({ race: 'human', age: 25, augmentics: [] });
    const first = pickAugmeticForEvent(c);
    const second = pickAugmeticForEvent(c);
    expect(first).not.toBeNull();
    expect(first!.id).toBe(second!.id); // без RNG — одинаково
    if (first) {
      const afterInstall = { ...c, augmentics: [first.id] };
      const next = pickAugmeticForEvent(afterInstall);
      expect(next === null || next.id !== first.id).toBe(true);
    }
  });

  it('учитывает minAge: ребёнку-человеку ничего не предлагается', () => {
    const kid = makeCharacter({ race: 'human', age: 10 });
    expect(pickAugmeticForEvent(kid)).toBeNull();
  });
});

describe('getAugmeticEvent — событие предложения импланта', () => {
  it('на пятых годах взрослому человеку даёт событие с выбором установки', () => {
    const c = makeCharacter({ race: 'human', age: 25, credits: 100 });
    const ev = getAugmeticEvent(25, c);
    expect(ev).not.toBeNull();
    expect(ev!.text).toContain('Аугметическая рука Mk.III'); // index age%5 среди доступных
    const install = ev!.choices.find(ch => ch.effects?.addAugmentic);
    expect(install).toBeTruthy();
    expect(install!.effects!.keyChoice).toMatch(/^augmetic_/);
  });

  it('вне «пятых» годов и для персонажа без доступных имплантов — null', () => {
    const c = makeCharacter({ race: 'human', age: 26, credits: 100 });
    expect(getAugmeticEvent(26, c)).toBeNull();
    const oldInstalled = makeCharacter({
      race: 'tau',
      age: 25,
      augmentics: availableAugmetics('tau').map(a => a.id),
    });
    expect(getAugmeticEvent(25, oldInstalled)).toBeNull();
  });

  it('выбор «вдвое дороже» появляется только при достатке', () => {
    const poor = makeCharacter({ race: 'human', age: 25, credits: 1 });
    const rich = makeCharacter({ race: 'human', age: 25, credits: 500 });
    const poorEv = getAugmeticEvent(25, poor)!;
    const richEv = getAugmeticEvent(25, rich)!;
    expect(poorEv.choices.some(ch => /вдвое/.test(ch.text))).toBe(false);
    expect(richEv.choices.some(ch => /вдвое/.test(ch.text))).toBe(true);
  });
});

describe('installAugmetic — пассивные бонусы применяются один раз', () => {
  it('панцирный имплант добавляет +10 maxHealth и лечит на столько же', () => {
    const before = makeCharacter({ race: 'human', health: 80, maxHealth: 100, augmentics: [] });
    const after = installAugmetic(before, 'carapace_implant');
    expect(after.augmentics).toEqual(['carapace_implant']);
    expect(after.maxHealth).toBe(110);
    expect(after.health).toBe(90);
    // исходный объект не мутируется
    expect(before.maxHealth).toBe(100);
  });

  it('неизвестный id всё равно попадает в список (совместимость сохранений)', () => {
    const after = installAugmetic(makeCharacter({ augmentics: [] }), 'legacy_unknown');
    expect(after.augmentics).toEqual(['legacy_unknown']);
  });
});

describe('applyChoiceEffects — интеграция addAugmentic/removeAugmentic', () => {
  it('addAugmentic устанавливает имплант и применяет эффекты операции', () => {
    const aug: Augmetic = findAugmetic('augmetic_arm_mk3')!;
    const c = makeCharacter({ race: 'human', age: 20, hiddenParams: { ...makeCharacter().hiddenParams, strength: 5 }, augmentics: [] });
    const res = applyChoiceEffects(c, { ...aug.effects, addAugmentic: aug.id, credits: -40 });
    expect(res.augmentics).toEqual(['augmetic_arm_mk3']);
    expect(res.hiddenParams.strength).toBe(7); // +2 из эффектов операции
    expect(res.maxHealth).toBe(c.maxHealth + 5); // пассив
    expect(res.credits).toBe(c.credits - 40);
  });

  it('повторная установка того же импланта игнорируется (идемпотентность)', () => {
    const c = makeCharacter({ race: 'human', augmentics: ['bigteeth'] });
    const before = { ...c };
    const res = applyChoiceEffects(c, { addAugmentic: 'bigteeth', description: 'Тест.' });
    expect(res.augmentics).toEqual(['bigteeth']);
    expect(res.maxHealth).toBe(before.maxHealth);
  });

  it('removeAugmentic вычёркивает имплант из списка', () => {
    const c = makeCharacter({ race: 'human', augmentics: ['optin_mechanicus', 'bigteeth'] });
    const res = applyChoiceEffects(c, { removeAugmentic: 'bigteeth', description: 'Тест.' });
    expect(res.augmentics).toEqual(['optin_mechanicus']);
  });
});

describe('Маршрутизация getEventForAge — приоритеты аугметики', () => {
  it('человек 25 лет с кредитами получает событие импланта (оптический сервитор)', () => {
    const c = makeCharacter({ race: 'human', age: 25, credits: 100, augmentics: [] });
    const ev = getEventForAge(25, c);
    expect(ev.text).toContain('Аугметическая рука Mk.III');
  });

  it('после установки всех человеческих имплантов человек 25 лет возвращается к обычным событиям', () => {
    const all = availableAugmetics('human').map(a => a.id);
    const c = makeCharacter({ race: 'human', age: 25, credits: 100, augmentics: all });
    const ev = getEventForAge(25, c);
    expect(ev.text).not.toContain('имплант')
  });

  it('орк 15 лет получает орочью гризник-аугметику, а не имперскую', () => {
    const c = makeCharacter({ race: 'ork', age: 15, credits: 100, augmentics: [] });
    const ev = getEventForAge(15, c);
    const install = ev.choices.find(ch => ch.effects?.addAugmentic);
    expect(install).toBeTruthy();
    expect(['choppa_hand', 'gork_eye', 'bigteeth']).toContain(install!.effects!.addAugmentic);
  });
});
