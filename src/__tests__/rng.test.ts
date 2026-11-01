import { describe, it, expect } from 'vitest';
import { createRNG, hashSeed, setGlobalSeed, rng } from '../game/rng';

describe('rng (mulberry32)', () => {
  it('детерминирован: одинаковый seed даёт одинаковую последовательность', () => {
    const a = createRNG(42);
    const b = createRNG(42);
    const seqA = Array.from({ length: 100 }, () => a.next());
    const seqB = Array.from({ length: 100 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('разные seed дают разные последовательности', () => {
    const a = createRNG(1);
    const b = createRNG(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('next() всегда в [0, 1)', () => {
    const r = createRNG(7);
    for (let i = 0; i < 10000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int() в диапазоне включительно', () => {
    const r = createRNG(99);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const v = r.int(3, 6);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it('pick() возвращает элемент массива, детерминированно', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const r1 = createRNG(5);
    const r2 = createRNG(5);
    for (let i = 0; i < 50; i++) {
      const v = r1.pick(arr);
      expect(arr).toContain(v);
      expect(r2.pick(arr)).toBe(v);
    }
  });

  it('shuffle() — перестановка без потерь элементов', () => {
    const r = createRNG(123);
    const src = [1, 2, 3, 4, 5, 6, 7, 8];
    const sh = r.shuffle(src);
    expect(sh.sort((x, y) => x - y)).toEqual(src);
  });

  it('chance(0) никогда, chance(1) всегда', () => {
    const r = createRNG(10);
    for (let i = 0; i < 100; i++) {
      expect(r.chance(0)).toBe(false);
      expect(r.chance(1)).toBe(true);
    }
  });

  it('weighted() уважает нулевые веса', () => {
    const r = createRNG(3);
    const items = [{ id: 'a', w: 0 }, { id: 'b', w: 1 }] as const;
    for (let i = 0; i < 50; i++) {
      expect(r.weighted(items, (it) => it.w).id).toBe('b');
    }
  });

  it('hashSeed стабилен для строк', () => {
    expect(hashSeed('warhammer')).toBe(hashSeed('warhammer'));
    expect(hashSeed('warhammer')).not.toBe(hashSeed('Warhammer'));
  });

  it('global rng переинициализируется через setGlobalSeed', () => {
    setGlobalSeed(2026);
    const first = rng().next();
    setGlobalSeed(2026);
    expect(rng().next()).toBe(first);
  });
});
