import { describe, it, expect } from 'vitest';
import { buildLifeChronicle } from '../components/DeathScreen';

const fateEntry = '[Год 12] **судьба** Ты нашёл странный предмет... → Спрятать и оставить себе';
const plainEntry = (n: number) => `[Год ${n}] Обычное событие... → Ничего не делать`;
const nonChoice = '[МИР] Война в секторе Октариус';

describe('buildLifeChronicle: выборка итоговой летописи', () => {
  it('пустая хроника даёт пустую летопись', () => {
    expect(buildLifeChronicle([])).toEqual([]);
  });

  it('включает судьбоносные выборы', () => {
    const history = [plainEntry(1), fateEntry, plainEntry(2)];
    const chronicle = buildLifeChronicle(history);
    expect(chronicle).toContain(fateEntry);
  });

  it('игнорирует записи вне формата событийных выборов ([МИР], [Микро], [NPC])', () => {
    const history = [nonChoice, plainEntry(1)];
    const chronicle = buildLifeChronicle(history);
    expect(chronicle).not.toContain(nonChoice);
    expect(chronicle).toContain(plainEntry(1));
  });

  it('последние 4 записи включаются даже без метки судьбы', () => {
    const history = [plainEntry(1), plainEntry(2), plainEntry(3), plainEntry(4), plainEntry(5)];
    const chronicle = buildLifeChronicle(history);
    expect(chronicle).not.toContain(plainEntry(1));
    expect(chronicle).toContain(plainEntry(2));
    expect(chronicle).toContain(plainEntry(5));
  });

  it('объём ограничен maxEntries и без дублей', () => {
    const history = Array.from({ length: 30 }, (_, i) =>
      i % 3 === 0 ? fateEntry.replace('12', String(i)) : plainEntry(i),
    );
    const chronicle = buildLifeChronicle(history, 8);
    expect(chronicle.length).toBeLessThanOrEqual(8);
    expect(new Set(chronicle).size).toBe(chronicle.length);
  });

  it('сортировка сохраняется: порядок записей в летописи совпадает с порядком в хронике', () => {
    const h1 = plainEntry(1);
    const history = [h1, fateEntry, plainEntry(2)];
    const chronicle = buildLifeChronicle(history);
    const idxFate = chronicle.indexOf(fateEntry);
    const idxTail = chronicle.indexOf(plainEntry(2));
    expect(idxFate).toBeGreaterThanOrEqual(0);
    expect(idxTail).toBeGreaterThan(idxFate);
  });
});
