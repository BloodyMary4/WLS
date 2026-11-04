import { useState } from 'react';
import { WindowPane } from './Dashboard';

/** Метка судьбоносного выбора в хронике (effects.keyChoice в reducer). */
const FATE_MARK = '**судьба**';

/**
 * Отделяет служебную markdown-метку судьбы от текста записи хроники.
 * Совместимо со старыми сейвами: строка без метки возвращается как есть.
 */
export function splitFateMark(entry: string): { isFate: boolean; text: string } {
  const idx = entry.indexOf(FATE_MARK);
  if (idx === -1) return { isFate: false, text: entry };
  const text = (entry.slice(0, idx) + entry.slice(idx + FATE_MARK.length))
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { isFate: true, text };
}

/** Фильтры хроники: все записи / только великие события / только выборы игрока / только мир. */
export type ChronicleFilter = 'all' | 'fate' | 'choices' | 'world';

export const FILTER_LABELS: Record<ChronicleFilter, string> = {
  all: 'Все',
  fate: 'Судьбоносные',
  choices: 'Выборы',
  world: 'Мир',
};

/** Запись глобального мирового события в хронике помечается префиксом [МИР]. */
export function isWorldEntry(entry: string): boolean {
  return entry.startsWith('[МИР]') || /^\[Год \d+\] \[МИР\]/.test(entry);
}

export function filterChronicle(history: string[], filter: ChronicleFilter): string[] {
  if (filter === 'all') return history;
  if (filter === 'fate') return history.filter((h) => h.includes(FATE_MARK));
  if (filter === 'world') return history.filter(isWorldEntry);
  return history.filter((h) => !isWorldEntry(h) && /^\[Год \d+\]/.test(h));
}

interface ChroniclePanelProps {
  history: string[];
  logRef: React.RefObject<HTMLDivElement>;
  /** Хроника следует за новыми записями (не отлистана вверх). */
  chroniclePinned?: boolean;
  /** Вернуть прокрутку хроники к последней записи. */
  onJumpToLatest?: () => void;
}

/**
 * Окно «Хроника жизни» — самостоятельный обновляемый модуль правого отсека (v0.3.26):
 * окно на всю высоту колонки, счётчик записей, фильтры, кнопка возврата
 * к последнему году. Лента скроллится только внутри окна — страница не гуляет.
 */
export function ChroniclePanel({ history, logRef, chroniclePinned = true, onJumpToLatest }: ChroniclePanelProps) {
  const [chronicleFilter, setChronicleFilter] = useState<ChronicleFilter>('all');
  const shownHistory = filterChronicle(history, chronicleFilter);
  const fateCount = filterChronicle(history, 'fate').length;

  return (
    <WindowPane
      title="Хроника жизни"
      icon="chronicle"
      stretch
      className="flex-1 min-h-[240px]"
      extra={
        <>
          <span className="text-[10px] text-gray-400 tabular-nums whitespace-nowrap">
            {shownHistory.length}/{history.length}
          </span>
          {/* Игрок отлистал вверх — подсказка вернуться к последнему году */}
          {!chroniclePinned && history.length > 0 && (
            <button
              type="button"
              onClick={onJumpToLatest}
              title="Вернуть прокрутку к последней записи"
              className="px-1.5 py-0.5 rounded-sm border border-[#c9a227]/60 bg-[#c9a227]/15 text-[#e8c85a] text-xs font-gothic leading-none hover:bg-[#c9a227]/25 transition-colors"
            >
              ↓
            </button>
          )}
        </>
      }
    >
      {/* Фильтр записей: судьбоносные выделены золотом, но их легко найти и отдельно */}
      <div role="group" aria-label="Фильтр хроники" className="flex flex-wrap gap-1 mb-2 shrink-0">
        {(Object.keys(FILTER_LABELS) as ChronicleFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setChronicleFilter(f)}
            aria-pressed={chronicleFilter === f}
            className={`px-1.5 py-0.5 rounded-sm text-[10px] font-gothic uppercase tracking-wider border transition-colors ${
              chronicleFilter === f
                ? 'border-[#c9a227] bg-[#c9a227]/15 text-[#e8c85a]'
                : 'border-[#c9a227]/25 text-[#b8a878]/70 hover:border-[#c9a227]/60 hover:text-[#d8c9a3]'
            }`}
          >
            {FILTER_LABELS[f]}
            {f === 'fate' && fateCount > 0 ? ` (${fateCount})` : ''}
          </button>
        ))}
      </div>
      <div ref={logRef} role="log" aria-live="polite" aria-label="Хроника жизни" className="wh-chronicle space-y-1.5 overflow-y-auto min-h-0">
        {history.length === 0 ? (
          <p className="text-gray-400 italic text-sm text-center py-4">Жизнь только начинается...</p>
        ) : shownHistory.length === 0 ? (
          <p className="text-gray-400 italic text-sm text-center py-4">
            {chronicleFilter === 'fate'
              ? 'Судьба пока молчит — великих решений ещё не было.'
              : chronicleFilter === 'world'
                ? 'Мир вокруг пока без глобальных потрясений.'
                : 'Выборов игрока пока нет.'}
          </p>
        ) : (
          shownHistory.map((entry, i) => {
            const { isFate, text } = splitFateMark(entry);
            return (
              <p
                key={`${chronicleFilter}-${i}`}
                title={text}
                className={`wh-chron-entry text-xs leading-snug pl-2.5 py-0.5 transition-colors animate-fade-in ${
                  isFate ? 'wh-chron-entry-fate' : ''
                }`}
              >
                {isFate && (
                  <span aria-hidden="true" className="wh-chron-seal" title="Судьбоносный выбор"></span>
                )}
                {text}
              </p>
            );
          })
        )}
      </div>
    </WindowPane>
  );
}
