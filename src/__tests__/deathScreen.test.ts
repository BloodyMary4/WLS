import { describe, it, expect } from 'vitest';
import { buildLifeChronicle, buildChronicleExport, cleanChronicleEntry } from '../components/DeathScreen';

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

describe('buildChronicleExport: экспорт летописи в буфер обмена (UI/UX п.5)', () => {
  const character = { raceName: 'Кадийский солдат', age: 42, planet: 'Кадия', caste: 'Солдат', status: 'Ветеран' };

  it('содержит итоги жизни, гибель и записи без markdown-метки судьбы', () => {
    const text = buildChronicleExport(character, 'Погиб в бою за Стену.', [fateEntry, plainEntry(3)]);
    expect(text).toContain('Кадийский солдат • 42 лет • Кадия');
    expect(text).toContain('Гибель: Погиб в бою за Стену.');
    expect(text).toContain('🏵 СУДЬБА:');
    expect(text).not.toContain('**судьба**');
    expect(text).toContain('[Год 12] Ты нашёл странный предмет...');
    expect(text).toContain('[Год 3] Обычное событие...');
  });

  it('пустая летопись всё равно даёт корректный заголовок', () => {
    const text = buildChronicleExport(character, 'Старость.', []);
    expect(text.startsWith('⚔️ WARHAMMER LIFE SIMULATOR')).toBe(true);
    expect(text.split('\n').length).toBeGreaterThanOrEqual(4);
  });
});

describe('cleanChronicleEntry', () => {
  it('убирает метку судьбы и лишние пробелы', () => {
    expect(cleanChronicleEntry(fateEntry)).toBe('[Год 12] Ты нашёл странный предмет... → Спрятать и оставить себе');
    expect(cleanChronicleEntry(plainEntry(1))).toBe(plainEntry(1));
  });
});
