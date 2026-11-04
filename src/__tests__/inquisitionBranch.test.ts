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

  it('эхо-линия артефакта показывается РОВНО ОДИН раз (v0.4.2 «Одно эхо»)', () => {
    // После любого из вариантов эха (done-след или inquisition_contact) слот
    // освобождается навсегда — раньше событие липло к каждому году с 6–7 лет.
    for (const done of ['artifact_echo_done', 'inquisition_contact']) {
      const c = makeCharacter({ race: 'human', keyChoices: ['found_artifact', done], inventory: ['Загадочный артефакт'] });
      for (const age of [7, 9, 12, 20]) {
        expect(getEventForAge(age, c).text).not.toContain('начинает проявлять странные свойства');
      }
    }
    // До показа — доступно (и не требует предмета в инвентаре: проверка
    // по inventory ломалась при загрузке старых сейвов).
    const fresh = makeCharacter({ race: 'human', keyChoices: ['found_artifact'], inventory: [] });
    expect(getEventForAge(7, fresh).text).toContain('начинает проявлять странные свойства');
  });

  it('каждый вариант эха артефакта пишет done-след (кроме 4 — он сам след)', () => {
    const c = makeCharacter({ race: 'human', keyChoices: ['found_artifact'] });
    const ev = getEventForAge(7, c);
    expect(ev.choices[0].effects.keyChoice).toBe('artifact_echo_done');
    expect(ev.choices[1].effects.keyChoice).toBe('artifact_echo_done');
    expect(ev.choices[2].effects.keyChoice).toBe('artifact_echo_done');
    expect(ev.choices[3].effects.keyChoice).toBe('inquisition_contact');
    // варианты 2/3 убирают артефакт из инвентаря — предмет больше не висит вечно
    expect(ev.choices[1].effects.removeItem).toBe('Загадочный артефакт');
    expect(ev.choices[2].effects.removeItem).toBe('Загадочный артефакт');
  });

  it('эхо повстанцев тоже однократное', () => {
    const open = makeCharacter({ race: 'human', keyChoices: ['helped_rebel'] });
    expect(getEventForAge(11, open).text).toContain('Повстанцы, которым ты помог');
    const done = makeCharacter({ race: 'human', keyChoices: ['helped_rebel', 'rebel_echo_done'] });
    expect(getEventForAge(11, done).text).not.toContain('Повстанцы, которым ты помог');
    expect(getEventForAge(15, done).text).not.toContain('Повстанцы, которым ты помог');
  });

  it('все выборы валидны: непустой текст и description', () => {
    const c = makeCharacter({ race: 'human', keyChoices: ['inquisition_contact', 'inquisition_first_case', 'inquisition_heresity'] });
    for (const age of [25, 35, 45, 50]) {
      const ev = getInquisitionBranchEvent(age, c);
      if (!ev) continue;
      for (const ch of ev.choices) {
        expect(ch.text.length).toBeGreaterThan(3);
        expect(ch.effects.description.length).toBeGreaterThan(3);
        expect(['1', '2', '3', '4']).toContain(ch.letter);
      }
    }
  });
});
