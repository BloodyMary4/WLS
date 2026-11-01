import { describe, it, expect } from 'vitest';
import { MICRO_EVENTS, pickMicroEvent, triggerMicroEvent, canTriggerMicroEvent } from '../game/microEvents';
import { makeCharacter } from '../game/testHelpers';
import { setGlobalSeed } from '../game/rng';

describe('micro events', () => {
  it('все эффекты микро-событий валидны (описание есть)', () => {
    for (const e of MICRO_EVENTS) {
      expect(e.effects.description.length).toBeGreaterThan(0);
      expect(e.probability).toBeGreaterThan(0);
      expect(e.probability).toBeLessThanOrEqual(1);
    }
  });

  it('расовые события не выпадают чужим расам', () => {
    setGlobalSeed(42);
    const tau = makeCharacter({ race: 'tau', planetType: 'Родной мир Тау' });
    for (let i = 0; i < 200; i++) {
      const picked = pickMicroEvent(tau);
      if (picked?.race) {
        const races = Array.isArray(picked.race) ? picked.race : [picked.race];
        expect(races).toContain('tau');
      }
    }
  });

  it('cooldown блокирует событие, затем срабатывает', () => {
    setGlobalSeed(7);
    const c = makeCharacter({ microEventCooldown: 3 });
    const r1 = triggerMicroEvent(c);
    expect(r1.triggered).toBe(false);
    expect(r1.nextCooldown).toBe(2);
    expect(canTriggerMicroEvent(makeCharacter({ microEventCooldown: 1 }))).toBe(false);
    expect(canTriggerMicroEvent(makeCharacter({ microEventCooldown: 0 }))).toBe(true);
  });

  it('детерминированность: один seed даёт одну последовательность', () => {
    const human = makeCharacter({ race: 'human' });
    setGlobalSeed(123);
    const a = triggerMicroEvent(human).event.text + '|' + String(triggerMicroEvent(human).triggered);
    setGlobalSeed(123);
    const b = triggerMicroEvent(human).event.text + '|' + String(triggerMicroEvent(human).triggered);
    expect(a).toBe(b);
  });

  it('new race fields are valid strings', () => {
    for (const e of MICRO_EVENTS) {
      if (Array.isArray(e.race)) {
        for (const r of e.race) expect(typeof r).toBe('string');
      } else if (e.race) {
        expect(typeof e.race).toBe('string');
      }
    }
  });
});
