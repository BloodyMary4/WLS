// Детерминированный генератор псевдослучайных чисел (mulberry32).
// Позволяет воспроизводить партии по seed: одна и та же последовательность
// событий/NPC/проверок при одинаковом seed.

export type RNG = {
  /** Следующее число в [0, 1) */
  next(): number;
  /** Целое в диапазоне [min, max] включительно */
  int(min: number, max: number): number;
  /** Случайный элемент массива */
  pick<T>(arr: readonly T[]): T;
  /** Случайный элемент с вероятностью появления weights (не нормализуется) */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T;
  /** Перемешивание Фишера–Йетса (возвращает новый массив) */
  shuffle<T>(arr: readonly T[]): T[];
  /** true с вероятностью p */
  chance(p: number): boolean;
  /** Текущий seed (состояние) — для сохранения в сейв */
  getState(): number;
};

export function hashSeed(str: string): number {
  // xmur3
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export function createRNG(seed: number): RNG {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    weighted: (items, weight) => {
      const total = items.reduce((s, it) => s + Math.max(0, weight(it)), 0);
      if (total <= 0) return items[Math.floor(next() * items.length)];
      let r = next() * total;
      for (const it of items) {
        r -= Math.max(0, weight(it));
        if (r < 0) return it;
      }
      return items[items.length - 1];
    },
    shuffle: (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    chance: (p) => next() < p,
    getState: () => a >>> 0,
  };
}

/** Глобальный RNG по умолчанию. Инициализируется случайным seed. */
let globalRNG: RNG = createRNG((Math.random() * 2 ** 32) >>> 0);

export function setGlobalSeed(seed: number): void {
  globalRNG = createRNG(seed);
}

export function getGlobalSeedState(): number {
  return globalRNG.getState();
}

/** Точка входа для всей игровой случайности. Заменяет Math.random(). */
export function rng(): RNG {
  return globalRNG;
}
