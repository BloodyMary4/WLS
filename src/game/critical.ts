/**
 * Пороги критичности показателей — единый источник правды для «всё на экране».
 * Используется шапкой (подсветка плиток), сайдбаром (красные полосы скрытых
 * параметров) и экраном события (предупреждение о риске выбора).
 */

export type CriticalLabel = 'Здоровье' | 'Рассудок' | 'Порча' | 'Мутация' | 'Подозрение';

/** Опасно ли значение показателя (health задаётся долей 0..1 от maxHealth). */
export function isCritical(label: CriticalLabel, value: number): boolean {
  switch (label) {
    case 'Здоровье': return value <= 0.25;
    case 'Рассудок': return value <= 20;
    case 'Порча': return value >= 80;
    case 'Мутация': return value >= 7;
    case 'Подозрение': return value >= 7;
  }
}

/** Список критичных показателей персонажа для компактного баннера-предупреждения. */
export function listCriticalStats(c: {
  health: number;
  maxHealth: number;
  sanity: number;
  warpCorruption: number;
  hiddenParams?: { mutation?: number; suspicion?: number };
}): CriticalLabel[] {
  const out: CriticalLabel[] = [];
  if (isCritical('Здоровье', c.health / Math.max(1, c.maxHealth))) out.push('Здоровье');
  if (isCritical('Рассудок', c.sanity)) out.push('Рассудок');
  if (isCritical('Порча', c.warpCorruption)) out.push('Порча');
  if (typeof c.hiddenParams?.mutation === 'number' && isCritical('Мутация', c.hiddenParams.mutation)) out.push('Мутация');
  if (typeof c.hiddenParams?.suspicion === 'number' && isCritical('Подозрение', c.hiddenParams.suspicion)) out.push('Подозрение');
  return out;
}
