import { describe, it, expect } from 'vitest';
import { choiceRiskMark } from '../components/EventCard';
import type { ChoiceEffects } from '../game/types';

const base: ChoiceEffects = { description: '' };

describe('choiceRiskMark: маркер «веса» решения на кнопках выбора (UI/UX п.5)', () => {
  it('судьбоносный выбор (keyChoice) даёт метку fate в приоритете над опасностью', () => {
    expect(choiceRiskMark({ ...base, keyChoice: 'fate_id', health: -20 })).toBe('fate');
  });

  it('сильный урон здоровью или рассудку (≤ −8) даёт метку danger', () => {
    expect(choiceRiskMark({ ...base, health: -10 })).toBe('danger');
    expect(choiceRiskMark({ ...base, sanity: -8 })).toBe('danger');
    // суммарный урон тоже считается: −4 + −5 = −9
    expect(choiceRiskMark({ ...base, health: -4, sanity: -5 })).toBe('danger');
  });

  it('обычные и положительные выборы остаются без метки', () => {
    expect(choiceRiskMark(base)).toBeNull();
    expect(choiceRiskMark({ ...base, health: -7 })).toBeNull();
    expect(choiceRiskMark({ ...base, health: 5, strength: 2 })).toBeNull();
  });

  it('прочие эффекты (заражение Варпа, подозрение) сами по себе не ставят danger', () => {
    expect(choiceRiskMark({ ...base, warpCorruption: 10, suspicion: 20 })).toBeNull();
  });
});
