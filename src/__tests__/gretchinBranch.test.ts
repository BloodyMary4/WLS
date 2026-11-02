import { describe, it, expect } from 'vitest';
import { getGretchinBranchEvent } from '../game/events/gretchinBranch';
import { getEventForAge } from '../game/data';
import { makeCharacter } from '../game/testHelpers';

describe('Лорная ветка «Путь Гретчина»', () => {
  it('до 15 лет без ключевых выборов — null', () => {
    const c = makeCharacter({ race: 'gretchin', keyChoices: [] });
    expect(getGretchinBranchEvent(14, c)).toBeNull();
    expect(getGretchinBranchEvent(10, c)).toBeNull();
  });

  it('шаг 1 (искра восстания) открывается с 15 лет без grot_uprising', () => {
    const c = makeCharacter({ race: 'gretchin', keyChoices: [] });
    expect(getGretchinBranchEvent(14, c)).toBeNull();
    const ev = getGretchinBranchEvent(15, c);
    expect(ev).not.toBeNull();
    expect(ev!.text).toContain('Хнык');
    expect(ev!.choices).toHaveLength(4);
    expect(ev!.choices.some(ch => ch.effects.keyChoice === 'grot_uprising')).toBe(true);
  });

  it('шаг 1 не повторяется после grot_uprising / grot_leader_path', () => {
    const c1 = makeCharacter({ race: 'gretchin', keyChoices: ['grot_uprising'] });
    expect(getGretchinBranchEvent(20, c1)?.text ?? '').not.toContain('Хнык');
    const c2 = makeCharacter({ race: 'gretchin', keyChoices: ['grot_leader_path'] });
    expect(getGretchinBranchEvent(20, c2)).toBeNull();
  });

  it('шаг 2 (племя) — с 25 лет после grot_uprising', () => {
    const c = makeCharacter({ race: 'gretchin', keyChoices: ['grot_uprising'] });
    expect(getGretchinBranchEvent(24, c)).toBeNull();
    const ev = getGretchinBranchEvent(25, c);
    expect(ev!.text).toContain('Восстание удалось');
    expect(ev!.choices.some(ch => ch.effects.keyChoice === 'grot_chieftain')).toBe(true);
  });

  it('шаг 3 (испытание вожака) — приоритет над шагом 2 с 35 лет', () => {
    const c = makeCharacter({ race: 'gretchin', keyChoices: ['grot_uprising', 'grot_chieftain'] });
    const ev = getGretchinBranchEvent(35, c);
    expect(ev!.text).toContain('Грозлык');
  });

  it('все выборы валидны: буква/текст/effects.description', () => {
    for (const kc of [[], ['grot_uprising'], ['grot_uprising', 'grot_chieftain']] as string[][]) {
      const c = makeCharacter({ race: 'gretchin', keyChoices: kc });
      for (const age of [15, 25, 35]) {
        const ev = getGretchinBranchEvent(age, c);
        if (!ev) continue;
        expect(ev.text.startsWith(`Возраст ${age}.`)).toBe(true);
        for (const ch of ev.choices) {
          expect(ch.letter).toBeTruthy();
          expect(ch.text.length).toBeGreaterThan(3);
          expect((ch.effects as { description?: string }).description).toBeTruthy();
        }
      }
    }
  });

  it('маршрутизатор отдаёт ветку только гретчинам и не даёт её другим расам', () => {
    const g = makeCharacter({ race: 'gretchin', keyChoices: ['grot_uprising'] });
    expect(getEventForAge(25, g).text).toContain('Восстание удалось');
    const h = makeCharacter({ race: 'human', keyChoices: ['grot_uprising'] });
    expect(getEventForAge(25, h).text).not.toContain('Восстание удалось');
    const o = makeCharacter({ race: 'ork', keyChoices: [] });
    expect(getEventForAge(15, o).text).not.toContain('Хнык');
  });
});
