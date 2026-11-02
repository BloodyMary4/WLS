import { useEffect } from 'react';
import { Choice } from '../game/types';

interface UseKeyboardControlsParams {
  enabled: boolean;
  choices: Choice[];
  onChoice: (choice: Choice) => void;
  onProceed: () => void;
}

/**
 * Горячие клавиши: A–D (и латинские эквиваленты, и цифры 1–4) — выбор варианта,
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

      const choiceKeys = ['a', 'b', 'c', 'd'];
      const index = choiceKeys.indexOf(e.key.toLowerCase());
      if (index !== -1 && index < choices.length) {
        e.preventDefault();
        onChoice(choices[index]);
        return;
      }

      // Русская раскладка: а/б/в/г → 1-й..4-й вариант (без привязки к индексу в массиве)
      const ruToIndex: Record<string, number> = { 'а': 0, 'б': 1, 'в': 2, 'г': 3 };
      const ruIndex = ruToIndex[e.key.toLowerCase()];
      if (ruIndex !== undefined && ruIndex < choices.length) {
        e.preventDefault();
        onChoice(choices[ruIndex]);
        return;
      }

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
