import { describe, it, expect } from 'vitest';
import { describeEffectChips } from '../game/effectLabels';
import type { ChoiceEffects } from '../game/types';

const base: ChoiceEffects = { description: '' };

describe('describeEffectChips — понятные метки последствий', () => {
  it('показывает значимые числовые эффекты с тонировкой', () => {
    const chips = describeEffectChips({ ...base, health: -10, credits: 50 });
    expect(chips).toHaveLength(2);
    const hp = chips.find((c) => c.icon === '❤️');
    expect(hp?.label).toBe('−10 Здоровье');
    expect(hp?.tone).toBe('bad');
    const cr = chips.find((c) => c.icon === '💰');
    expect(cr?.label).toBe('+50 Кредиты');
    expect(cr?.tone).toBe('good');
  });

  it('скрывает косметические изменения ниже порогов', () => {
    expect(describeEffectChips({ ...base, health: -3, luck: 0, sanity: 2 })).toHaveLength(0);
  });

  it('Порча Варпа: рост — плохой тон, +8 и выше даёт предупреждение', () => {
    const chips = describeEffectChips({ ...base, warpCorruption: 10 });
    const corruption = chips.find((c) => c.icon === '☣️');
    expect(corruption?.tone).toBe('bad');
    expect(chips.some((c) => c.label === 'Варп замечает тебя')).toBe(true);
    // слабый прирост порчи — без паники
    const mild = describeEffectChips({ ...base, warpCorruption: 5 });
    expect(mild.some((c) => c.label === 'Варп замечает тебя')).toBe(false);
  });

  it('качественные изменения (предметы, черты, статус) видны всегда', () => {
    const chips = describeEffectChips({ ...base, addItem: 'Плазменный пистолет', addTrait: 'Хладнокровный', newStatus: 'Розыск' });
    expect(chips.map((c) => c.label)).toEqual(['Плазменный пистолет', 'Черта: Хладнокровный', 'Розыск']);
  });

  it('развёрнутый режим для экрана результата использует лорные слова', () => {
    const chips = describeEffectChips({ ...base, health: -12, sanity: -6 }, true);
    expect(chips.find((c) => c.icon === '❤️')?.label).toBe('−12 ранен(а)');
    expect(chips.find((c) => c.icon === '🧠')?.label).toBe('−6 ужас');
  });
});
