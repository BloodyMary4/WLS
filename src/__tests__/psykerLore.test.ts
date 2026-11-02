import { describe, it, expect } from 'vitest';
import { updateAgeStatus, applyChoiceEffects } from '../game/utils';
import { getEventForAge } from '../game/data';
import { makeCharacter } from '../game/testHelpers';

// Лор Warhammer 40K (warhammer40k.fandom.com/ru): псайкеры — «маяки для
// нечестивых»; их судьбой ведает Ордо Малипус (отдел Инквизиции). Игра
// отражает это двумя механиками:
//  1) psi >= PSI_BEACON каждый год привлекает внимание Варпа и подозрение;
//  2) у проявившегося псайкера-человека на «пятых» годах приходит событие
//     регистрации/бегства с судьбоносными выборами.

describe('Лор: псайкер = маяк для Варпа и Ордо Малипус', () => {
  it('psi >= 5 ежегодно повышает warpAttention', () => {
    const char = makeCharacter({ age: 20, hiddenParams: { ...makeCharacter().hiddenParams, psi: 5 } });
    const { character } = updateAgeStatus(char);
    expect(character.warpAttention).toBe(1);
  });

  it('psi < 5 не привлекает внимание Варпа сама по себе', () => {
    const char = makeCharacter({ age: 20, sanity: 70, hiddenParams: { ...makeCharacter().hiddenParams, psi: 4 } });
    const { character } = updateAgeStatus(char);
    expect(character.warpAttention).toBe(0);
  });

  it('у человека psi >= 5 растёт подозрение (Ордо Малипус следит), psi >= 10 — быстрее', () => {
    const mid = makeCharacter({ age: 20, hiddenParams: { ...makeCharacter().hiddenParams, psi: 6 } });
    expect(updateAgeStatus(mid).character.hiddenParams.suspicion).toBe(1);

    const strong = makeCharacter({ age: 20, hiddenParams: { ...makeCharacter().hiddenParams, psi: 10 } });
    expect(updateAgeStatus(strong).character.hiddenParams.suspicion).toBe(2);
  });

  it('у не-людей psi-маяк не раздувает подозрение Империума напрямую', () => {
    const eldar = makeCharacter({
      race: 'eldar', age: 20,
      hiddenParams: { ...makeCharacter().hiddenParams, psi: 7 },
    });
    const { character } = updateAgeStatus(eldar);
    expect(character.hiddenParams.suspicion).toBe(0); // маяк есть, подозрения нет
    expect(character.warpAttention).toBe(1);
  });

  it('warpAttention и suspicion клампятся максимумом (10)', () => {
    const char = makeCharacter({
      age: 20, warpAttention: 10,
      hiddenParams: { ...makeCharacter().hiddenParams, psi: 10, suspicion: 10 },
    });
    const { character } = updateAgeStatus(char);
    expect(character.warpAttention).toBe(10);
    expect(character.hiddenParams.suspicion).toBe(10);
  });
});

describe('Лор: событие Ордо Малипус для людей-псайкеров', () => {
  const psyker = (overrides = {}) => makeCharacter({
    race: 'human', caste: 'Рабочий', planetType: 'Улей-мир',
    hiddenParams: { ...makeCharacter().hiddenParams, psi: 6 },
    ...overrides,
  });

  it('приходит на «пятых» годах при проявленном даре (age >= 16)', () => {
    const ev = getEventForAge(20, psyker());
    expect(ev.text).toContain('Ордо Малипус');
    expect(ev.choices.map((c) => c.text).join(' ')).toContain('псайкер');
  });

  it('не приходит до 16 лет и на не-«пятых» годах', () => {
    expect(getEventForAge(15, psyker()).text).not.toContain('Ордо Малипус');
    expect(getEventForAge(21, psyker()).text).not.toContain('Ордо Малипус');
  });

  it('не приходит к普通人 без дара (psi < 5)', () => {
    const normal = makeCharacter({
      race: 'human', age: 20,
      hiddenParams: { ...makeCharacter().hiddenParams, psi: 2 },
    });
    expect(getEventForAge(20, normal).text).not.toContain('Ордо Малипус');
  });

  it('не повторяется после регистрации или бегства (keyChoice)', () => {
    expect(getEventForAge(25, psyker({ keyChoices: ['ordo_malice_registered'] })).text).not.toContain('Ордо Малипус');
    expect(getEventForAge(25, psyker({ keyChoices: ['ordo_malice_fled'] })).text).not.toContain('Ордо Малипус');
  });

  it('не приходит другим расам (эльдар идут своим путём — Провидцы)', () => {
    const eldar = makeCharacter({
      race: 'eldar', age: 20,
      hiddenParams: { ...makeCharacter().hiddenParams, psi: 6 },
    });
    expect(getEventForAge(20, eldar).text).not.toContain('Ордо Малипус');
  });

  it('регистрация снимает подозрение, бегство — повышает и даёт маяк Варпу', () => {
    const char = psyker();
    const registered = applyChoiceEffects(char, {
      ...getEventForAge(20, char).choices[0].effects,
    });
    expect(registered.status).toBe('Псайкер Империума');
    expect(registered.hiddenParams.suspicion).toBeLessThan(char.hiddenParams.suspicion + 5);

    const fled = applyChoiceEffects(char, {
      ...getEventForAge(20, char).choices[1].effects,
    });
    expect(fled.status).toBe('Неучтённый псайкер');
    expect(fled.warpAttention).toBe(char.warpAttention + 1);
  });

  it('выбор «сжечь видения» ослабляет дар (psi падает ниже маяка возможен)', () => {
    const char = psyker({ hiddenParams: { ...makeCharacter().hiddenParams, psi: 6 } });
    const burned = applyChoiceEffects(char, { ...getEventForAge(20, char).choices[3].effects });
    expect(burned.hiddenParams.psi).toBe(3);
    expect(burned.sanity).toBe(char.sanity - 8);
  });
});
