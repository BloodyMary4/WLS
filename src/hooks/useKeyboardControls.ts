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
 */
export function useKeyboardControls({ enabled, choices, onChoice, onProceed }: UseKeyboardControlsParams) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Не перехватываем ввод в текстовых полях и нажатия с модификаторами
      // (Ctrl/Cmd+R, Alt+Tab и т.п. — браузерные комбинации священны).
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const digit = parseInt(e.key, 10);
      if (digit >= 1 && digit <= choices.length) {
        e.preventDefault();
        onChoice(choices[digit - 1]);
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onProceed();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, choices, onChoice, onProceed]);
}
