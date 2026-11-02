import { describe, it, expect } from 'vitest';
import { getInquisitionBranchEvent } from '../game/events/inquisitionBranch';
import { getEventForAge } from '../game/data';
import { makeCharacter } from '../game/testHelpers';

describe('Лорная ветвка «Служба Инквизиции»', () => {
  it('без ключевых выборов возвращает null', () => {
    const c = makeCharacter({ race: 'human', keyChoices: [] });
    expect(getInquisitionBranchEvent(25, c)).toBeNull();
    expect(getInquisitionBranchEvent(40, c)).toBeNull();
  });

  it('шаг 1 (вербовка) открывается с 25 лет при inquisition_contact', () => {
    const c = makeCharacter({ race: 'human', keyChoices: ['found_artifact', 'inquisition_contact'] });
    expect(getInquisitionBranchEvent(24, c)).toBeNull();
    const ev = getInquisitionBranchEvent(25, c);
    expect(ev).not.toBeNull();
    expect(ev!.text).toContain('сером плаще');
    expect(ev!.choices).toHaveLength(4);
    // выбор А ведёт дальше по ветке
    expect(ev!.choices.some(ch => ch.effects.keyChoice === 'inquisition_first_case')).toBe(true);
  });

  it('шаг 2 (первое дело) — с 35 лет после inquisition_first_case', () => {
    const c = makeCharacter({ race: 'human', keyChoices: ['inquisition_contact', 'inquisition_first_case'] });
    const ev = getInquisitionBranchEvent(35, c);
    expect(ev).not.toBeNull();
    expect(ev!.text).toContain('первое самостоятельное дело');
    expect(getInquisitionBranchEvent(34, c)?.text ?? '').not.toContain('первое самостоятельное дело');
  });

  it('шаг 3 (допрос наставника) — приоритет над шагом 2 с 45 лет', () => {
    const c = makeCharacter({ race: 'human', keyChoices: ['inquisition_contact', 'inquisition_first_case', 'inquisition_heresity'] });
    const ev = getInquisitionBranchEvent(45, c);
    expect(ev!.text).toContain('наставник');
  });

  it('маршрутизатор вставляет ветку только на "пятые" годы у человека', () => {
    const c = makeCharacter({ race: 'human', keyChoices: ['found_artifact', 'inquisition_contact'] });
    expect(getEventForAge(25, c).text).toContain('сером плаще');
    expect(getEventForAge(26, c).text).not.toContain('сером плаще');
    expect(getEventForAge(30, c).text).toContain('сером плаще');
  });

  it('не-человек никогда не получает ветку', () => {
    const c = makeCharacter({ race: 'ork', keyChoices: ['found_artifact', 'inquisition_contact'] });
    expect(getEventForAge(25, c).text).not.toContain('сером плаще');
  });

  it('после контакта с Инквизицией эхо-линия артефакта освобождает слот', () => {
    const handedOver = makeCharacter({ race: 'human', keyChoices: ['found_artifact', 'inquisition_contact'], inventory: [] });
    expect(getEventForAge(7, handedOver).text).not.toContain('начинает проявлять странные свойства');
    const kept = makeCharacter({ race: 'human', keyChoices: ['found_artifact'], inventory: ['Загадочный артефакт'] });
    expect(getEventForAge(7, kept).text).toContain('начинает проявлять странные свойства');
  });

  it('все выборы валидны: непустой текст и description', () => {
    const c = makeCharacter({ race: 'human', keyChoices: ['inquisition_contact', 'inquisition_first_case', 'inquisition_heresity'] });
    for (const age of [25, 35, 45, 50]) {
      const ev = getInquisitionBranchEvent(age, c);
      if (!ev) continue;
      for (const ch of ev.choices) {
        expect(ch.text.length).toBeGreaterThan(3);
        expect(ch.effects.description.length).toBeGreaterThan(3);
        expect(['А', 'Б', 'В', 'Г']).toContain(ch.letter);
      }
    }
  });
});
