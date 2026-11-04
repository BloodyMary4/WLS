import { useEffect } from 'react';
import { Choice } from '../game/types';

interface UseKeyboardControlsParams {
  enabled: boolean;
  choices: Choice[];
  onChoice: (choice: Choice) => void;
  onProceed: () => void;
}

/**
 * Горячие клавиши: ТОЛЬКО цифры 1–4 — выбор варианта (по просьбе игрока,
 * v0.3.70; буквы A–D/А–Б–В–Г больше не перехватываются),
 * Space/Enter — «продолжить год». Ввод в текстовых полях не перехватывается.
 * v0.3.81: поддержаны и Shift-символы верхнего цифрового ряда (! @ # $) —
 * на раскладках/клавиатурах без отдельного цифрового блока игрок физически
 * печатает «1…4» именно так; раньше e.key === '!' не парсился и кнопка
 * мыши оставалась единственным способом. Нумпад (e.code === 'Numpad1')
 * тоже работает даже при заблокированном NumLock-режиме символов.
 */
const SHIFT_DIGIT: Record<string, number> = { '!': 1, '@': 2, '#': 3, '$': 4 };

export function useKeyboardControls({ enabled, choices, onChoice, onProceed }: UseKeyboardControlsParams) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Не перехватываем ввод в текстовых полях и нажатия с модификаторами
      // (Ctrl/Cmd+R, Alt+Tab и т.п. — браузерные комбинации священны).
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      let digit = parseInt(e.key, 10);
      // Shift+цифра с верхнего ряда (англ. раскладка даёт ! @ # $ вместо 1–4)
      if (!(digit >= 1 && digit <= choices.length)) {
        digit = SHIFT_DIGIT[e.key] ?? NaN;
      }
      // Русская раскладка / альтернативные клавиатуры: смотрим на физическую
      // клавишу цифрового ряда или нумпада (Digit1…Digit9, Numpad1…Numpad9).
      if (!(digit >= 1 && digit <= choices.length)) {
        const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
        if (m) digit = parseInt(m[1], 10);
      }
      if (digit >= 1 && digit <= choices.length) {
        e.preventDefault();
        onChoice(choices[digit - 1]);
        return;
      }

      if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        onProceed();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, choices, onChoice, onProceed]);
}
