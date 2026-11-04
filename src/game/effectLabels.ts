/**
 * Расшифровка последствий выборов в понятные игроку метки («каждая деталь
 * интерфейса объяснима без догадок»). Пороги подобраны так, чтобы не пугать
 * косметическими ±1: показывается только значимое.
 */
import { ChoiceEffects } from './types';

export interface EffectChip {
  icon: string;
  label: string;
  tone: 'good' | 'bad' | 'neutral';
}

/** Иконки и подписи для числовых эффектов (в порядке показа). */
const NUMERIC_META: Array<{ key: keyof ChoiceEffects; icon: string; name: string; good: string; bad: string }> = [
  { key: 'health', icon: 'heart', name: 'Здоровье', good: 'здоровье', bad: 'ранен(а)' },
  { key: 'sanity', icon: 'brain', name: 'Рассудок', good: 'рассудок', bad: 'ужас' },
  { key: 'warpCorruption', icon: 'biohazard', name: 'Порча', good: 'порча', bad: 'порча' },
  { key: 'credits', icon: 'coin', name: 'Кредиты', good: 'нажива', bad: 'убыток' },
  { key: 'food', icon: 'bread', name: 'Провизия', good: 'паёк', bad: 'паёк' },
  { key: 'ammo', icon: 'ammo', name: 'Боезапас', good: 'заряды', bad: 'заряды' },
  { key: 'influence', icon: 'star', name: 'Влияние', good: 'влияние', bad: 'влияние' },
  { key: 'luck', icon: 'dice', name: 'Удача', good: 'удача', bad: 'невезение' },
];

/** Значимые пороги: ниже — косметика, не показываем. */
const THRESHOLDS: Partial<Record<keyof ChoiceEffects, number>> = {
  health: 5,
  sanity: 4,
  warpCorruption: 4,
  credits: 20,
  food: 1,
  ammo: 1,
  influence: 3,
  luck: 1,
};

/** Порог предупреждения о росте Порчи (слишком заметная метка Хаосу). */
const CORRUPTION_WARN = 8;

/**
 * Человекочитаемые метки последствий выбора.
 * @param effects эффекты выбора
 * @param full true — развёрнутый вид для экрана результата («+10 ❤️ к Здоровью»)
 */
export function describeEffectChips(effects: ChoiceEffects, full = false): EffectChip[] {
  const chips: EffectChip[] = [];

  for (const meta of NUMERIC_META) {
    const raw = effects[meta.key];
    if (typeof raw !== 'number' || raw === 0) continue;
    const threshold = THRESHOLDS[meta.key] ?? 1;
    if (Math.abs(raw) < threshold) continue;
    const positive = raw > 0;
    // Порча растёт «в минус» для героя: положительное изменение — зло.
    const isCorruption = meta.key === 'warpCorruption';
    const tone: EffectChip['tone'] = isCorruption
      ? positive ? 'bad' : 'good'
      : positive ? 'good' : 'bad';
    const sign = positive ? '+' : '−';
    const word = positive ? meta.good : meta.bad;
    chips.push({
      icon: meta.icon,
      label: full ? `${sign}${Math.abs(raw)} ${word}` : `${sign}${Math.abs(raw)} ${meta.name}`,
      tone,
    });
  }

  // Предупреждение: заметный прирост Порчи Варпа
  const corruptionGain = effects.warpCorruption ?? 0;
  if (corruptionGain >= CORRUPTION_WARN) {
    chips.push({ icon: 'warning', label: 'Варп замечает тебя', tone: 'bad' });
  }

  // Качественные изменения (без чисел — всегда показываем)
  if (effects.addItem) chips.push({ icon: 'sword', label: effects.addItem, tone: 'good' });
  if (effects.addAugmentic) chips.push({ icon: 'gear', label: 'Аугметика установлена', tone: 'good' });
  if (effects.removeItem) chips.push({ icon: 'clipboard', label: `Потеря: ${effects.removeItem}`, tone: 'bad' });
  if (effects.removeAugmentic) chips.push({ icon: 'clipboard', label: 'Аугметика утрачена', tone: 'bad' });
  if (effects.addTrait) chips.push({ icon: 'person', label: `Черта: ${effects.addTrait}`, tone: 'neutral' });
  if (effects.removeTrait) chips.push({ icon: 'person', label: `Утрачено: ${effects.removeTrait}`, tone: 'neutral' });
  if (effects.newStatus) chips.push({ icon: 'medal', label: effects.newStatus, tone: 'neutral' });

  return chips;
}
