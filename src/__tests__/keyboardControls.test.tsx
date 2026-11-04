/**
 * Тест горячих клавиш выборов (v0.3.81).
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import type { Choice } from '../game/types';

const mk = (letter: string): Choice => ({ letter, text: `Вариант ${letter}`, effects: { description: '' } });
const CHOICES = [mk('А'), mk('Б'), mk('В'), mk('Г')];

function press(init: KeyboardEventInit & { code?: string }) {
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Unidentified', ...init }));
}

describe('useKeyboardControls (v0.3.81)', () => {
  let onChoice: (...args: any[]) => void;
  let onProceed: (...args: any[]) => void;

  beforeEach(() => {
    cleanup();
    onChoice = vi.fn();
    onProceed = vi.fn();
    renderHook(() =>
      useKeyboardControls({ enabled: true, choices: CHOICES, onChoice, onProceed }),
    );
  });

  it('цифры 1–4 выбирают соответствующий вариант', () => {
    press({ key: '2' });
    expect(onChoice).toHaveBeenCalledWith(CHOICES[1]);
  });

  it('Shift-символы верхнего ряда (! @ # $) тоже выбирают 1–4', () => {
    press({ key: '!', shiftKey: true, code: 'Digit1' });
    press({ key: '$', shiftKey: true, code: 'Digit4' });
    expect(onChoice).toHaveBeenNthCalledWith(1, CHOICES[0]);
    expect(onChoice).toHaveBeenNthCalledWith(2, CHOICES[3]);
  });

  it('русская раскладка (key="!" при физическом Digit3) выбирает вариант 3 по e.code', () => {
    press({ key: '№', code: 'Digit3' }); // RU-раскладка даёт «№» на клавише 3
    expect(onChoice).toHaveBeenCalledWith(CHOICES[2]);
  });

  it('нумпад работает (Numpad1 → вариант 1)', () => {
    press({ key: 'End', code: 'Numpad1' }); // NumLock выключен: key="End"
    expect(onChoice).toHaveBeenCalledWith(CHOICES[0]);
  });

  it('пробел и Enter продолжают год', () => {
    press({ key: ' ', code: 'Space' });
    press({ key: 'Enter', code: 'Enter' });
    expect(onProceed).toHaveBeenCalledTimes(2);
  });

  it('цифра больше числа выборов игнорируется', () => {
    press({ key: '5' });
    expect(onChoice).not.toHaveBeenCalled();
  });

  it('ввод в текстовом поле не перехватывается', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    // событие должно прийти из input — эмулируем через dispatch на самом поле
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: '2', code: 'Digit2', bubbles: true }));
    expect(onChoice).not.toHaveBeenCalled();
    input.remove();
  });
});
