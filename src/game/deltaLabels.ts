/**
 * Понятные подписи дельт хода — «что именно стоил выбор».
 *
 * Игрок не должен сравнивать числа глазами: после исхода события каждая
 * изменившаяся характеристика получает человекочитаемую метку (+25 ❤️ / −10 ☣️).
 * Модуль обновляемый: достаточно расширить DELTA_META, чтобы подпись
 * появилась и в сводке результата, и в баннере шапки.
 */
import { PublicStatKey } from './utils';

export interface DeltaMeta {
  icon: string;
  /** Имя показателя для подписи (всегда понятно, без аббревиатур). */
  name: string;
}

/** Порядок показа дельт = порядок важности для игрока. */
export const DELTA_META: Record<PublicStatKey, DeltaMeta> = {
  health: { icon: '❤️', name: 'Здоровье' },
  sanity: { icon: '🧠', name: 'Рассудок' },
  warpCorruption: { icon: '☣️', name: 'Порча' },
  credits: { icon: '💰', name: 'Кредиты' },
  food: { icon: '🍖', name: 'Провизия' },
  ammo: { icon: '🔫', name: 'Боезапас' },
  influence: { icon: '⭐', name: 'Влияние' },
  luck: { icon: '🍀', name: 'Удача' },
};

/** Одна понятная строка-дельта: «−10 Здоровье» (красным) или «+25 Кредиты» (зелёным). */
export interface DeltaLine {
  key: PublicStatKey;
  text: string;
  tone: 'good' | 'bad';
}

const ORDER = Object.keys(DELTA_META) as PublicStatKey[];

/**
 * Сводка изменений за ход из lastDeltas reducer'а.
 * Порча — единственный показатель, где рост «плохой»: её тон инвертирован.
 */
export function describeDeltas(deltas: Partial<Record<PublicStatKey, number>> | null | undefined): DeltaLine[] {
  if (!deltas) return [];
  const out: DeltaLine[] = [];
  for (const key of ORDER) {
    const d = deltas[key];
    if (typeof d !== 'number' || d === 0) continue;
    const meta = DELTA_META[key];
    const positive = d > 0;
    const badGain = key === 'warpCorruption';
    const tone: DeltaLine['tone'] = badGain ? (positive ? 'bad' : 'good') : positive ? 'good' : 'bad';
    out.push({ key, tone, text: `${positive ? '+' : '−'}${Math.abs(d)} ${meta.icon} ${meta.name}` });
  }
  return out;
}

/**
 * Дельты, видимые в баннере шапки: только значимые изменения (порог по модулю),
 * чтобы не засорять интерфейс косметикой вроде ±1 удачи.
 */
const DELTA_BANNER_MIN: Partial<Record<PublicStatKey, number>> = {
  health: 5, sanity: 4, warpCorruption: 4, credits: 20, influence: 3, luck: 1, food: 1, ammo: 1,
};

export function significantDeltas(deltas: Partial<Record<PublicStatKey, number>> | null | undefined): DeltaLine[] {
  return describeDeltas(deltas).filter((line) => {
    const raw = deltas?.[line.key] ?? 0;
    return Math.abs(raw) >= (DELTA_BANNER_MIN[line.key] ?? 1);
  });
}
