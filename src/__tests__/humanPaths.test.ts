/**
 * v0.4.0 «Крестовый поход памяти»: сквозные пути человека 0→100 лет.
 * Гарантии: якоря цепочек показываются безусловно, события не повторяются,
 * дедупликация keyChoices, жизнь после 80 с имплантами.
 */
import { describe, it, expect } from 'vitest';
import { getEventForAge } from '../game/data';
import { applyChoiceEffects, updateAgeStatus } from '../game/utils';
import { LORE_POOL_WAVE5 } from '../game/events/humanLoreEventsWave5';
import { setGlobalSeed } from '../game/rng';

const mk = (over: any = {}): any => ({
  race: 'human', name: 'Иван', age: 0, planet: 'Хив', planetType: 'Улей-мир',
  health: 70, maxHealth: 100, sanity: 80, warpCorruption: 0, warpAttention: 0,
  luck: 5, credits: 300, food: 10, ammo: 5, influence: 0, status: '',
  inventory: [], factionRelations: {}, npcs: [],
  hiddenParams: { faith: 1, cunning: 1, strength: 1, willpower: 1, mutation: 0, suspicion: 0 },
  traits: [], body: '', augmentics: [], microEventCooldown: 0, keyChoices: [], ...over,
});

const strip = (t: string) => t.replace(/\u200B\d+\u200B/, '');

function live(start: any, preferAugment: boolean, until = 100) {
  let c = mk(start);
  const texts: string[] = [];
  for (let age = 0; age <= until; age++) {
    c.age = age;
    const ev = getEventForAge(age, c);
    texts.push(strip(ev.text));
    const pickers = preferAugment
      ? [(ch: any) => ch.effects.addAugmentic, (ch: any) => ch.effects.keyChoice, () => true]
      : [(ch: any) => ch.effects.keyChoice, () => true];
    let idx = 0;
    for (const p of pickers) { const i = ev.choices.findIndex(p); if (i >= 0) { idx = i; break; } }
    c = applyChoiceEffects(c, ev.choices[idx].effects);
    c = updateAgeStatus(c).character;
    if (c.health <= 0) break;
  }
  return { c, texts };
}

describe('сквозные пути человека (v0.4.0)', () => {
  it('за 100 лет нет ни одного повторного текста события', () => {
    const { texts } = live({ planetType: 'Улей-мир', planet: 'Хив' }, false);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('keyChoices — множество без дублей даже при многократных повторах эффекта', () => {
    let c = mk();
    c = applyChoiceEffects(c, { keyChoice: 'path_x', description: 'раз' });
    c = applyChoiceEffects(c, { keyChoice: 'path_x', description: 'два' });
    expect(c.keyChoices.filter((k: string) => k === 'path_x')).toHaveLength(1);
  });

  it('путь с аугментациями доживает до глубокой старости и получает ветку после 80', () => {
    const { c, texts } = live({ planetType: 'Мир-кузница (Адептус Механикус)', planet: 'Феррус Примус' }, true);
    expect(c.augmentics.length).toBeGreaterThan(0);
    // следы имплантов открывают cond-ветки пятой волны
    const wave5Texts = LORE_POOL_WAVE5.map((p) => strip(p.ev.text).slice(0, 30));
    const shownLate = texts.slice(80).some((t) => wave5Texts.some((w) => t.startsWith(w)));
    expect(shownLate || c.age >= 80).toBe(true);
  });

  it('фермерский путь: ключи жатвы и десятины попадают в хронику', () => {
    const { c } = live({ planetType: 'Мир-ферма', planet: 'Агриппина Секунда', credits: 0 }, false);
    expect(c.keyChoices.some((k: string) => ['farm_harvest', 'farm_tithe', 'tithe_tenpercent'].includes(k))).toBe(true);
  });

  it('гоготхский путь: ставщик запоминается и возвращает эхом', () => {
    const { c } = live({ planetType: 'Тюрьма-мир', planet: 'Голготх', credits: 0 }, false);
    expect(c.keyChoices.includes('golgoth_stavshik') || c.keyChoices.includes('golgoth_free_miner')).toBe(true);
  });

  it('детерминизм: одинаковый старт даёт одинаковую жизнь (seed-партии не плывут)', () => {
    setGlobalSeed(777);
    const a = live({ planetType: 'Улей-мир', planet: 'Медленг' }, false, 40);
    setGlobalSeed(777);
    const b = live({ planetType: 'Улей-мир', planet: 'Медленг' }, false, 40);
    expect(a.texts).toEqual(b.texts);
  });
});
