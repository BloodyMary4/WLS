import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeHapticPattern, vibrate } from '../game/haptics';

describe('computeHapticPattern', () => {
  it('возвращает паттерны для всех событий', () => {
    for (const ev of ['choice', 'fate', 'wound', 'miracle', 'death'] as const) {
      const p = computeHapticPattern(ev);
      expect(p.durationMs).toBeGreaterThan(0);
      expect(p.intensity).toBeGreaterThan(0);
      expect(p.intensity).toBeLessThanOrEqual(1);
    }
  });

  it('смерть — самый сильный и долгий импульс', () => {
    const death = computeHapticPattern('death');
    const choice = computeHapticPattern('choice');
    expect(death.durationMs).toBeGreaterThan(choice.durationMs);
    expect(death.intensity).toBeGreaterThan(choice.intensity);
  });

  it('судьба сильнее обычного выбора и использует dual-rumble', () => {
    expect(computeHapticPattern('fate').dualMode).toBe(true);
    expect(computeHapticPattern('fate').intensity).toBeGreaterThan(
      computeHapticPattern('choice').intensity
    );
  });
});

describe('vibrate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('no-op без Gamepad API (Safari / нет геймпада)', () => {
    vi.stubGlobal('navigator', {});
    expect(vibrate('choice')).toBe(false);
  });

  it('no-op, если геймпады не подключены', () => {
    vi.stubGlobal('navigator', { getGamepads: () => [] });
    expect(vibrate('death')).toBe(false);
  });

  it('играет dual-rumble на первом доступном актуаторе', () => {
    const playEffect = vi.fn();
    const pad = { vibrationActuator: { playEffect } };
    vi.stubGlobal('navigator', { getGamepads: () => [null, pad] });
    expect(vibrate('fate')).toBe(true);
    expect(playEffect).toHaveBeenCalledWith('dual-rumble', {
      duration: 160,
      strongMagnitude: 0.7,
      weakMagnitude: 0.35,
    });
  });

  it('играет pulse для лёгких событий', () => {
    const playEffect = vi.fn();
    const pad = { vibrationActuator: { playEffect } };
    vi.stubGlobal('navigator', { getGamepads: () => [pad] });
    expect(vibrate('choice')).toBe(true);
    expect(playEffect).toHaveBeenCalledWith('pulse', {
      duration: 40,
      strongMagnitude: 0.25,
    });
  });

  it('пропускает геймпады без актуатора и возвращает false, если актуаторов нет', () => {
    vi.stubGlobal('navigator', { getGamepads: () => [{}, null] });
    expect(vibrate('wound')).toBe(false);
  });

  it('не падает, если playEffect бросает исключение', () => {
    const pad = {
      vibrationActuator: {
        playEffect: () => {
          throw new Error('busy');
        },
      },
    };
    vi.stubGlobal('navigator', { getGamepads: () => [pad] });
    expect(vibrate('death')).toBe(false);
  });
});
