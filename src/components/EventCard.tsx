import type { ReactNode } from 'react';
import { GameEvent, Choice, ChoiceEffects } from '../game/types';
import { describeEffectChips, EffectChip } from '../game/effectLabels';
import { describeDeltas } from '../game/deltaLabels';
import { PublicStatKey } from '../game/utils';

/** Стиль метки последствия по «тону» (понятность без догадок). */
const CHIP_TONE_CLS: Record<EffectChip['tone'], string> = {
  good: 'text-[#7fc97f] border-[#7fc97f]/40 bg-[#7fc97f]/10',
  bad: 'text-[#e07a7a] border-[#e07a7a]/40 bg-[#e07a7a]/10',
  neutral: 'text-[#b8a878] border-[#b8a878]/40 bg-[#b8a878]/10',
};

/** Ряд понятных меток последствий: −10 Здоровье, +50 Кредиты, 🗡️ предмет… */
function EffectChipRow({ chips, compact }: { chips: EffectChip[]; compact?: boolean }) {
  if (chips.length === 0) return null;
  const shown = compact ? chips.slice(0, 3) : chips;
  const rest = chips.length - shown.length;
  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? 'mt-1.5' : 'mt-3'}`} aria-hidden="true">
      {shown.map((chip, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-xs font-semibold tracking-wide ${CHIP_TONE_CLS[chip.tone]} ${compact ? 'opacity-80' : ''}`}
        >
          <span>{chip.icon}</span>
          {chip.label}
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 text-xs text-gray-400">
          +{rest} ещё
        </span>
      )}
    </div>
  );
}

/** Маркер «веса» решения для кнопки выбора: судьба ⚡ или опасность 💀. */
const RISK_BADGE: Record<'fate' | 'danger', { icon: string; label: string; cls: string }> = {
  fate: { icon: '⚡', label: 'Судьбоносный выбор', cls: 'text-[#e8c85a] border-[#e8c85a]/60 bg-[#e8c85a]/10' },
  danger: { icon: '💀', label: 'Опасно для жизни', cls: 'text-[#e07a7a] border-[#e07a7a]/60 bg-[#e07a7a]/10' },
};

interface EventCardProps {
  event: GameEvent;
  age: number;
  phase: 'event' | 'result';
  resultText: string;
  lastChoice: Choice | null;
  /** Фактические изменения характеристик за ход — понятная сводка «+/−» в исходе. */
  lastDeltas?: Partial<Record<PublicStatKey, number>> | null;
  onChoice: (choice: Choice) => void;
  onProceed: () => void;
}

/**
 * «Вес» решения для визуального маркера на кнопке выбора (дорожная карта UI/UX):
 * судьбоносный выбор с меткой ⚡, опасный (грозящий здоровью/рассудку) — с 💀.
 */
export function choiceRiskMark(effects: ChoiceEffects): 'fate' | 'danger' | null {
  if (effects.keyChoice) return 'fate';
  const harm = (effects.health ?? 0) + (effects.sanity ?? 0);
  return harm <= -8 ? 'danger' : null;
}

/** Помечает карточку золотым чудом, если текст содержит запись о заступничестве. */
function isMiracle(text: string): boolean {
  return typeof text === 'string' && text.includes('Император защищает');
}

/**
 * Мини-разметка лорных акцентов: **жирное золото**, _курсив бледный_.
 * Текст событий — основа симулятора, поэтому ключевые имена и термины
 * теперь подсвечиваются прямо в хронике (безопасно: никакого HTML).
 * Подчёркивания внутри слов (M41.999_0, дата_год) не считаются курсивом.
 */
function richText(text: string): ReactNode[] {
  const parts = String(text).split(/(\*\*[^*]+\*\*|(?<![\wА-Яа-яЁё])_[^_]+_(?![\wА-Яа-яЁё]))/g);
  const out: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      out.push(
        <strong key={i} className="text-[#e8c85a] font-semibold">
          {part.slice(2, -2)}
        </strong>,
      );
    } else if (/^_[^_]+_$/.test(part)) {
      out.push(
        <em key={i} className="text-[#b8a878] italic">
          {part.slice(1, -1)}
        </em>,
      );
    } else if (part) {
      out.push(<span key={i}>{part}</span>);
    }
  });
  return out;
}

/** Ряд фактических итогов хода: «−10 ❤️ Здоровье» — без сравнения чисел глазами. */
const DELTA_TONE_CLS: Record<'good' | 'bad', string> = {
  good: 'text-[#7fc97f] border-[#7fc97f]/40 bg-[#7fc97f]/10',
  bad: 'text-[#e07a7a] border-[#e07a7a]/40 bg-[#e07a7a]/10',
};

function DeltaSummary({ deltas }: { deltas: Partial<Record<PublicStatKey, number>> | null | undefined }) {
  const lines = describeDeltas(deltas);
  if (lines.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Итог выбора">
      <span
        className="text-xs font-gothic uppercase tracking-wider text-[#b8a878]/80 mr-1 cursor-help"
        title="Точный результат твоего выбора: как изменились показатели. Зелёное — приобретение, красное — потеря."
      >Итог:</span>
      {lines.map((line) => (
        <span key={line.key} className={`inline-flex items-center px-2 py-0.5 rounded-sm border text-xs font-semibold tabular-nums ${DELTA_TONE_CLS[line.tone]}`}>
          {line.text}
        </span>
      ))}
    </div>
  );
}

/**
 * Пергамент с текстом события/исхода (v0.3.45): текст печатается полным
 * читаемым кеглем (16px, Spectral). Если текста больше, чем вмещает окно,
 * пергамент прокручивается ВНУТРИ своей рамки (золотой скроллбар .wh-scroll) —
 * он физически не может наползти на кнопки выборов или выйти за окно.
 */
function EventParchment({ text, icon, extra, miracle }: {
  text: string;
  icon?: string;
  extra?: ReactNode;
  miracle?: boolean;
}) {
  return (
    <div
      className={`event-parchment wh-parchment-simple rounded-sm px-4 py-3 ${miracle ? 'wh-miracle' : ''} ${extra ? '' : 'flex-1 min-h-0'}`}
      style={{ borderColor: miracle || icon === '⚔️' || icon === '🕊️' ? 'rgba(201,162,39,0.7)' : undefined }}
    >
      {/* v0.3.47: строка «иконка + текст» растянута на всю высоту пергамента
          (items-stretch), а скролл живёт ВНУТРИ текстового блока — раньше
          скроллилась вся колонка, из-за чего в фазе результата иконка ⚔️
          уезжала вверх и обрезалась, а текст уходил за нижнюю рамку прямо
          под кнопки («не читается, текст уходит за выборы»). */}
      <div className="flex items-stretch gap-3 flex-1 min-h-0">
        {icon && <span className="text-xl leading-none pt-0.5 shrink-0">{icon}</span>}
        <p className="result-text font-event leading-relaxed text-[#e8d9b0] event-scroll flex-1 min-w-0 min-h-0 pr-2 wh-scroll">
          {richText(text)}
        </p>
      </div>
      {extra && <div className="shrink-0">{extra}</div>}
    </div>
  );
}

/** Центральная карточка события: текст года или результат выбора.
 *  v0.3.45 (оконный layout): карточка живёт ВНУТРИ окна-иллюминатора и
 *  занимает всю его высоту; если текста много — окно прокручивается само
 *  (золотой скроллбар), кнопки выборов при этом всегда остаются доступными.
 *  Текст печатается полным читаемым кеглем, ничего не обрезается и не
 *  наползает: рамка окна держит границы, содержимое скроллится внутри. */
export function EventCard({ event, age, phase, resultText, lastChoice, lastDeltas, onChoice, onProceed }: EventCardProps) {
  const isResult = phase === 'result' && lastChoice;
  return (
    <div key={`${age}-${event.text.slice(0, 24)}`} className="wh-event-card flex flex-col min-h-0 flex-1 animate-parchment">
      {!isResult && (
      <div className="event-head mb-2 flex flex-col flex-1 min-h-0">
        <div className="event-label-row flex items-center gap-2 mb-1.5 shrink-0">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
          <span className="font-gothic text-sm font-bold text-[#e07a7a] uppercase tracking-[0.18em] animate-candle">
            Судьба &bull; М41.{String(age).padStart(3, '0')}
          </span>
        </div>
        <EventParchment text={event.text} />
      </div>
      )}

      {phase === 'result' && lastChoice ? (
        <div className="result-block flex flex-col flex-1 min-h-0 space-y-2.5 animate-fade-in" aria-live="polite">
          <EventParchment
            text={resultText}
            icon={isMiracle(resultText) ? '🕊️' : '⚔️'}
            miracle={isMiracle(resultText)}
            extra={<DeltaSummary deltas={lastDeltas} />}
          />
          {/* v0.3.47: пергамент результата занимает всю свободную высоту и
              скроллит текст ВНУТРИ рамки; кнопка — фиксированная внизу блока,
              поэтому она больше никогда не наезжает на текст (и наоборот). */}
          <button
            onClick={onProceed}
            className="btn-wh-primary btn-modern w-full shrink-0 font-bold py-2.5 rounded-sm text-base transition-all hover:scale-[1.02] lg:hidden"
            style={{ background: 'linear-gradient(180deg, #c9a227 0%, #8a6d15 100%)', color: '#14110a' }}
          >
            ⏭ Дальше → Год {age}
          </button>
          <button
            onClick={onProceed}
            className="btn-wh-primary btn-modern w-full shrink-0 font-bold py-2.5 rounded-sm text-base transition-all hover:scale-[1.02] hidden lg:block"
          >
            Продолжить → Год {age}
            <span className="text-sm font-normal opacity-70 ml-2">(Пробел)</span>
          </button>
        </div>
      ) : (
        /* Блок выборов: отдельная панель со своим внутренним скроллом.
           v0.3.48: заголовок «Твоё решение» sticky — всегда видно, где выборы;
           список кнопок скроллится внутри панели и физически не может
           наползть на пергамент текста события. */
        <div className="choices-block wh-scroll min-h-0 space-y-2 lg:flex-1 lg:flex lg:flex-col">
          <p className="choices-title font-gothic text-sm font-bold text-[#e8c85a] uppercase tracking-[0.15em] mb-2 flex items-center gap-3 shrink-0">
            Твоё решение:
            <span className="text-xs font-normal normal-case tracking-normal text-gray-400">клавиши 1–{event.choices.length}{event.choices.length <= 4 ? ' / A–D' : ''}</span>
          </p>
          {event.choices.map((choice, index) => {
            const mark = choiceRiskMark(choice.effects);
            const badge = mark ? RISK_BADGE[mark] : null;
            const chips = describeEffectChips(choice.effects);
            return (
            <button
              key={choice.letter}
              onClick={() => onChoice(choice)}
              className="choice-btn btn-modern animate-slide-in-left"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-2.5">
                <div className="wh-choice-letter flex-shrink-0 w-8 h-8 flex flex-col items-center justify-center shadow-lg leading-none" title={`Клавиши выбора: ${index + 1} или ${choice.letter}`}>
                  <span className="font-bold tabular-nums text-sm">{index + 1}</span>
                  <span className="text-[9px] opacity-70 font-gothic">{choice.letter}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="choice-text font-event text-[15px] text-[#d8c9a3] block leading-snug">{choice.text}</span>
                  {/* Заранее понятные последствия выбора (компактно, максимум 3 метки) */}
                  <EffectChipRow chips={chips} compact />
                </div>
                {badge && (
                  <span
                    title={badge.label}
                    aria-label={badge.label}
                    className={`flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded-sm border text-sm leading-none ${badge.cls}`}
                  >
                    {badge.icon}
                  </span>
                )}
              </div>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
