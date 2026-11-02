import { describe, it, expect } from 'vitest';
import { filterChronicle } from '../components/Sidebar';

const fateEntry = '[Год 12] **судьба** Ты нашёл странный предмет... → Спрятать и оставить себе';
const plainEntry = '[Год 3] Обычное событие... → Ничего не делать';
const worldEntry = '[МИР] Война в секторе Октариус';
const microEntry = '[Микро] Слухи о еретиках ходят по планете';

describe('filterChronicle: фильтр записей в сайдбаре (UI/UX п.5)', () => {
  const history = [worldEntry, plainEntry, fateEntry, microEntry];

  it('«all» возвращает все записи без изменений', () => {
    expect(filterChronicle(history, 'all')).toEqual(history);
  });

  it('«fate» оставляет только судьбоносные записи', () => {
    expect(filterChronicle(history, 'fate')).toEqual([fateEntry]);
  });

  it('«choices» оставляет только выборы игрока ([Год N]), отсекая МИР/Микро', () => {
    expect(filterChronicle(history, 'choices')).toEqual([plainEntry, fateEntry]);
  });

  it('«world» оставляет только глобальные мировые события [МИР]', () => {
    expect(filterChronicle(history, 'world')).toEqual([worldEntry]);
    // мировой ивент может быть записан и с годом — тоже попадает в фильтр
    expect(filterChronicle(['[Год 15] [МИР] Падение сектора'], 'world')).toEqual([
      '[Год 15] [МИР] Падение сектора',
    ]);
  });

  it('пустой результат допустим: пустая хроника даёт пустой массив при любом фильтре', () => {
    expect(filterChronicle([], 'fate')).toEqual([]);
    expect(filterChronicle([], 'choices')).toEqual([]);
    expect(filterChronicle([], 'world')).toEqual([]);
    expect(filterChronicle([worldEntry], 'fate')).toEqual([]);
    expect(filterChronicle([worldEntry], 'choices')).toEqual([]);
    expect(filterChronicle([plainEntry], 'world')).toEqual([]);
  });
});
