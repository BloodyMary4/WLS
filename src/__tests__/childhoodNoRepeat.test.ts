/**
 * v0.4.1 «Колода детства»: базовые расовые события человека (2–5 лет и др.)
 * раньше выбирались случайным индексом С ВОЗВРАТОМ — в первые же годы игрок
 * видел повторы. Теперь перед шаблоном пробуется анти-повторная колода лорного
 * пула с той же возрастной рамкой/планетой.
 */
import { describe, it, expect } from 'vitest';
import { getEventForAge } from '../game/data';
import { applyChoiceEffects, updateAgeStatus } from '../game/utils';
import { loreMarkerIndex, markLoreSeen } from '../game/events/humanLoreEvents';
import { commitChildhoodSeen } from '../game/events/humanEvents';

const mk = (over: any = {}): any => ({
  race: 'human', name: 'Иван', age: 0, planet: 'Хив', planetType: 'Улей-мир',
  health: 70, maxHealth: 100, sanity: 80, warpCorruption: 0, warpAttention: 0,
  luck: 5, credits: 300, food: 10, ammo: 5, influence: 0, status: '',
  inventory: [], factionRelations: {}, npcs: [],
  hiddenParams: { faith: 1, cunning: 1, strength: 1, willpower: 1, mutation: 0, suspicion: 0 },
  traits: [], body: '', augmentics: [], microEventCooldown: 0, keyChoices: [], ...over,
});

const strip = (t: string) => t.replace(/^\u200B\d+\u200B/, '').replace(/^Возраст \d+\.\s*/, '');

describe('колода детства: нет повторов событий 0–5 лет', () => {
  it('полный честный проход reducer-подобно: все показы 0..5 уникальны', () => {
    for (let trial = 0; trial < 40; trial++) {
      let c = mk({ name: 'Тест-' + trial });
      const shown: string[] = [];
      for (let age = 0; age <= 5; age++) {
        c.age = age;
        const ev = getEventForAge(age, c);
        shown.push(strip(ev.text));
        // как reducer: выбор → отметить лорный маркер → применить эффекты
        const idx = loreMarkerIndex(ev.text);
        if (idx !== null) markLoreSeen(c, idx);
        commitChildhoodSeen(c, ev.text);
        c = applyChoiceEffects(c, ev.choices[trial % ev.choices.length].effects);
        c = updateAgeStatus(c).character;
      }
      expect(new Set(shown).size).toBe(shown.length);
    }
  });

  it('детерминизм: тот же персонаж+возраст → то же событие (re-render безопасен)', () => {
    const c = mk({ name: 'Детермин' });
    for (let age = 0; age <= 5; age++) {
      c.age = age;
      expect(getEventForAge(age, c).text).toBe(getEventForAge(age, c).text);
    }
  });

  it('после исчерпания подходящих лоров возвращается шаблон без падения', () => {
    const c = mk({ name: 'Исчерпан' });
    for (let i = 0; i < 200; i++) markLoreSeen(c, i);
    const ev = getEventForAge(3, c);
    expect(ev.choices.length).toBeGreaterThanOrEqual(3);
    expect(ev.text).toContain('Возраст 3');
  });
});
