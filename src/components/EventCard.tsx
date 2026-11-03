import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { GameEvent, Choice, ChoiceEffects } from '../game/types';
import { useFit } from '../game/useFit';
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

/** Меряет число строк, на которые разбивается текст при данной ширине.
 *  Используется для авторегулировки кегля: чем длиннее текст, тем мельче
 *  он рисуется — до тех пор, пока целиком не помещается БЕЗ прокрутки. */
let measureCtx: CanvasRenderingContext2D | null | undefined;
function countWrappedLines(text: string, fontSize: number, widthPx: number): number {
  if (measureCtx === undefined) {
    try {
      const c = document.createElement('canvas');
      measureCtx = c.getContext('2d');
    } catch {
      measureCtx = null;
    }
  }
  if (!measureCtx) return Math.ceil(text.length / 60);
  measureCtx.font = `${fontSize}px "IM Fell English", Georgia, serif`;
  const words = String(text).split(/\s+/).filter(Boolean);
  let lines = 1;
  let cur = '';
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (measureCtx.measureText(cand).width > widthPx && cur) {
      lines += 1;
      cur = w;
    } else {
      cur = cand;
    }
  }
  return lines;
}

/** Подбор кегля текста (15→11px), чтобы он уместился в maxLines строк. */
function fittedFontSize(text: string, widthPx: number, maxLines: number): number {
  for (const fs of [15, 14, 13, 12, 11]) {
    if (countWrappedLines(text, fs, widthPx) <= maxLines) return fs;
  }
  return 11;
}

/** Ширина колонки текста по фактическому размеру окна (эвристика). */
function useTextWidth(): number {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? Math.min(Math.max(window.innerWidth * 0.42, 320), 760) : 560));
  useEffect(() => {
    const update = () => setW(Math.min(Math.max(window.innerWidth * 0.42, 320), 760));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return w;
}

/**
 * Пергамент с текстом, который ВСЕГДА показывается целиком — без прокрутки.
 * Кегль автоматически уменьшается (15→11px), чтобы текст вместился в
 * отведённое число строк; если совсем не влезает — обрезка многоточием
 * (-webkit-line-clamp), но полоса прокрутки не появляется никогда
 * (требование игрока v0.3.42: «убери вообще скроллинг в решениях»).
 */
function FitParchment({ text, maxLines, icon, extra, miracle }: {
  text: string;
  maxLines: number;
  icon?: string;
  extra?: ReactNode;
  miracle?: boolean;
}) {
  const width = useTextWidth();
  const fs = fittedFontSize(text, width - 40, maxLines);
  return (
    <div
      className={`event-parchment wh-parchment-simple rounded-sm px-4 py-3 overflow-hidden ${miracle ? 'wh-miracle' : ''}`}
      style={{ borderColor: miracle || icon === '⚔️' || icon === '🕊️' ? 'rgba(201,162,39,0.7)' : undefined }}
    >
      <div className="flex items-start gap-3">
        {icon && <span className="text-xl leading-none pt-0.5 shrink-0">{icon}</span>}
        <p
          className="result-text font-event leading-snug text-[#e8d9b0] flex-1 min-w-0 overflow-hidden"
          style={{
            fontSize: `${fs}px`,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: maxLines,
          }}
        >
          {richText(text)}
        </p>
      </div>
      {extra}
    </div>
  );
}

/** Центральная карточка события: текст года или результат выбора.
 *  v0.3.42: ВСЯ карточка умещается в экран ЦЕЛИКОМ — прокрутка убрана
 *  полностью (по требованию игрока: скролл в решениях неудобен). Текст
 *  года и исход решения печатаются компактным кеглем, вписанным в окно;
 *  выборы всегда видны внизу без колеса мыши. */
export function EventCard({ event, age, phase, resultText, lastChoice, lastDeltas, onChoice, onProceed }: EventCardProps) {
  const isResult = phase === 'result' && lastChoice;
  const fit = useFit();
  /* Сколько строк доступно тексту при плотной раскладке — зависит от
     высоты окна: считаем грубо по высоте вьюпорта. */
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const eventMaxLines = fit ? Math.max(5, Math.round((vh * 0.34) / 17)) : 8;
  const resultMaxLines = fit ? Math.max(6, Math.round((vh * 0.42) / 17)) : 10;
  return (
    <div key={`${age}-${event.text.slice(0, 24)}`} className="wh-event-card flex flex-col min-h-full animate-parchment">
      {!isResult && (
      <div className="event-head mb-2 shrink-0 min-h-0">
        <div className="event-label-row flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
          <span className="font-gothic text-sm font-bold text-[#e07a7a] uppercase tracking-[0.18em] animate-candle">
            Судьба &bull; М41.{String(age).padStart(3, '0')}
          </span>
        </div>
        <FitParchment text={event.text} maxLines={eventMaxLines} />
      </div>
      )}

      {phase === 'result' && lastChoice ? (
        <div className="result-block flex flex-col space-y-2.5 animate-fade-in" aria-live="polite">
          <FitParchment
            text={resultText}
            maxLines={resultMaxLines}
            icon={isMiracle(resultText) ? '🕊️' : '⚔️'}
            miracle={isMiracle(resultText)}
            extra={<DeltaSummary deltas={lastDeltas} />}
          />
          <button
            onClick={onProceed}
            className="btn-wh-primary btn-modern w-full font-bold py-2.5 rounded-sm text-base transition-all hover:scale-[1.02]"
          >
            Продолжить → Год {age}
            <span className="hidden md:inline text-sm font-normal opacity-70 ml-2">(Пробел)</span>
          </button>
          {/* Мобильный липкий HUD-экшен: большая тач-кнопка всегда под пальцем */}
          <button
            onClick={onProceed}
            className="lg:hidden sticky bottom-2 z-30 w-full mt-2 font-gothic font-bold py-4 rounded-sm text-lg shadow-[0_-4px_20px_rgba(0,0,0,0.6)]"
            style={{ background: 'linear-gradient(180deg, #c9a227 0%, #8a6d15 100%)', color: '#14110a' }}
          >
            ⏭ Дальше → Год {age}
          </button>
        </div>
      ) : (
        /* v0.3.42: прокрутка в выборах убрана полностью (требование игрока).
           padding-bottom снят, overflow-y:auto удалён — кнопки всегда на
           экране; если блок не умещается, он просто прижат к низу колонки. */
        <div className="choices-block min-h-0 space-y-2">
          <p className="font-gothic text-sm font-bold text-[#e8c85a] uppercase tracking-[0.15em] mb-2 flex items-center gap-3 sticky top-0 z-10" style={{ background: 'linear-gradient(180deg, rgba(24,21,14,0.98) 70%, rgba(24,21,14,0))', padding: '2px 0 6px' }}>
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
              className="choice-btn btn-modern w-full min-h-[44px] text-left px-3 py-2 bg-gradient-to-br from-[#1c1913] to-[#12100b] hover:from-[#2a2517] hover:to-[#1c1913] border border-[#c9a227]/40 hover:border-[#e8c85a] rounded-sm transition-all shadow-lg hover:shadow-[0_0_18px_rgba(201,162,39,0.3)] hover:scale-[1.01] active:scale-[0.99] animate-slide-in-left"
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
