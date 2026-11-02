/**
 * Тактильная отдача (Gamepad API vibration actuator).
 *
 * Чистая логика выбора паттерна вынесена в computeHapticPattern —
 * это позволяет тестировать её без реального геймпада. Исполнение
 * (navigator.getGamepads) отделено от решений.
 */

export type HapticEvent =
  | 'choice' // обычный выбор
  | 'fate' // судьбоносный выбор (keyChoice)
  | 'wound' // серьёзная рана / тяжёлые последствия
  | 'miracle' // чудо «Император защищает»
  | 'death'; // смерть персонажа

export interface HapticPattern {
  /** Длительность импульса, мс */
  durationMs: number;
  /** Интенсивность 0..1 */
  intensity: number;
  /** true — использовать dual-mode rumble (weak/strong), false — простой pulse */
  dualMode: boolean;
}

const PATTERNS: Record<HapticEvent, HapticPattern> = {
  choice: { durationMs: 40, intensity: 0.25, dualMode: false },
  fate: { durationMs: 160, intensity: 0.7, dualMode: true },
  wound: { durationMs: 90, intensity: 0.85, dualMode: true },
  miracle: { durationMs: 120, intensity: 0.45, dualMode: false },
  death: { durationMs: 400, intensity: 1.0, dualMode: true },
};

/** Чистый выбор паттерна по игровому событию. */
export function computeHapticPattern(event: HapticEvent): HapticPattern {
  return PATTERNS[event];
}

type VibrationActuatorLike = {
  playEffect?: (
    type: string,
    params: { duration: number; startDelay?: number; strongMagnitude?: number; weakMagnitude?: number }
  ) => Promise<boolean> | unknown;
  reset?: () => unknown;
};

/**
 * Вибрирует первый доступный gamepad с вибра-актуатором.
 * Возвращает true, если импульс удалось запросить.
 * Безопасно no-op, если Gamepad API недоступен (Safari, отсутствие геймпада).
 */
export function vibrate(event: HapticEvent): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
    return false;
  }
  const pattern = computeHapticPattern(event);
  const pads = navigator.getGamepads();
  for (const pad of pads) {
    const actuator = (pad as (Gamepad & { vibrationActuator?: VibrationActuatorLike }) | null)?.vibrationActuator;
    if (!actuator || typeof actuator.playEffect !== 'function') continue;
    try {
      if (pattern.dualMode) {
        void actuator.playEffect('dual-rumble', {
          duration: pattern.durationMs,
          strongMagnitude: pattern.intensity,
          weakMagnitude: pattern.intensity * 0.5,
        });
      } else {
        void actuator.playEffect('pulse', {
          duration: pattern.durationMs,
          strongMagnitude: pattern.intensity,
        });
      }
      return true;
    } catch {
      // актуатор может быть занят/недоступен — молча пропускаем
      return false;
    }
  }
  return false;
}
