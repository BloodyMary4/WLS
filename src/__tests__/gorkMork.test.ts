import { describe, it, expect } from 'vitest';
import { getOrkEvent } from '../game/events/orkEvents';
import { makeCharacter } from '../game/testHelpers';
import { findAugmetic } from '../game/augmetics';

describe('Лор: Горг и Морк — боги орков', () => {
  it('событие Горка и Морка выдаётся орку 14–49 лет без keyChoice gork_mork', () => {
    const c = makeCharacter({ race: 'ork', keyChoices: [] });
    const ev = getOrkEvent(14, c);
    expect(ev.text).toContain('Горг');
    expect(ev.text).toContain('Морк');
    expect(ev.choices).toHaveLength(4);
    // все выборы помечены как судьбоносные и закрывают ветку повтором
    for (const ch of ev.choices) {
      expect(ch.effects.keyChoice).toBe('gork_mork');
    }
  });

  it('после пережитого выбора событие не повторяется', () => {
    const c = makeCharacter({ race: 'ork', keyChoices: ['gork_mork'] });
    const ev = getOrkEvent(20, c);
    expect(ev.text).not.toContain('два голоса из темноты');
  });

  it('до 14 лет события о богах нет', () => {
    const c = makeCharacter({ race: 'ork', keyChoices: [] });
    const ev = getOrkEvent(13, c);
    expect(ev.text).not.toContain('Горг и Морк');
  });

  it('выбор А — чемпион Морка (сила), выбор Б — хитрован Горка (хитрость)', () => {
    const c = makeCharacter({ race: 'ork', keyChoices: [] });
    const ev = getOrkEvent(20, c);
    expect(ev.choices[0].effects.strength).toBeGreaterThan(0);
    expect(ev.choices[0].effects.addTrait).toBe('Чемпион Морка');
    expect(ev.choices[1].effects.cunning).toBeGreaterThan(0);
    expect(ev.choices[1].effects.addTrait).toBe('Хитрован Горка');
  });

  it('в каталоге нет «Глаза Горка» — есть лорный «Глаз Морка» с пассивной удачей', () => {
    expect(findAugmetic('gork_eye')).toBeNull();
    const eye = findAugmetic('mork_eye');
    expect(eye).toBeDefined();
    expect(eye!.name).toBe('Глаз Морка');
    expect(eye!.description).toContain('Морк');
    expect(eye!.passive).toEqual({ luck: 1 });
  });
});
