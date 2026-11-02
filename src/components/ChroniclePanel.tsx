import { useState } from 'react';

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
 * Панель «Хроника» — обновляемый модуль игрового интерфейса:
 * счётчик записей, фильтры, кнопка возврата к последнему году и лента событий.
 * Вынесен из Sidebar в собственный файл: секции экрана легко менять независимо.
 */
export function ChroniclePanel({ history, logRef, chroniclePinned = true, onJumpToLatest }: ChroniclePanelProps) {
  const [chronicleFilter, setChronicleFilter] = useState<ChronicleFilter>('all');
  const shownHistory = filterChronicle(history, chronicleFilter);
  const fateCount = filterChronicle(history, 'fate').length;

  return (
    <div className="wh-panel wh-side-panel p-4 xl:p-5">
      <h3 className="wh-panel-title wh-side-title font-bold pb-0 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">📜</span>
          Хроника
        </span>
        <span className="text-[11px] font-normal text-gray-400 tabular-nums whitespace-nowrap">
          {shownHistory.length} из {history.length}
        </span>
      </h3>
      {/* Фильтр записей: судьбоносные выделены золотом, но их легко найти и отдельно */}
      <div role="group" aria-label="Фильтр хроники" className="flex flex-wrap gap-1.5 mb-3">
        {(Object.keys(FILTER_LABELS) as ChronicleFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setChronicleFilter(f)}
            aria-pressed={chronicleFilter === f}
            className={`px-2 py-1 rounded-sm text-[11px] font-gothic uppercase tracking-wider border transition-colors ${
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
      {/* Игрок отлистал вверх — подсказка вернуться к последнему году */}
      {!chroniclePinned && shownHistory.length > 0 && (
        <button
          type="button"
          onClick={onJumpToLatest}
          className="mb-2 w-full px-2 py-1.5 rounded-sm border border-[#c9a227]/50 bg-[#c9a227]/10 text-[#e8c85a] text-xs font-gothic uppercase tracking-wider hover:bg-[#c9a227]/20 transition-colors"
        >
          ↓ К последнему году
        </button>
      )}
      <div ref={logRef} role="log" aria-live="polite" aria-label="Хроника жизни" className="wh-chronicle space-y-2">
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
                className={`text-sm border-l-2 pl-3 py-1 transition-colors animate-fade-in ${
                  isFate
                    ? 'border-l-[#d4af37] text-[#e8d9a0] italic'
                    : 'border-yellow-600/50 text-gray-400 hover:border-yellow-500'
                }`}
              >
                {isFate && (
                  <span
                    aria-hidden="true"
                    className="mr-1 text-[#d4af37]"
                    title="Судьбоносный выбор"
                  >
                    🏵
                  </span>
                )}
                {text}
              </p>
            );
          })
        )}
      </div>
    </div>
  );
}
