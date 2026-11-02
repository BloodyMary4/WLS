import { useState, type ReactNode } from 'react';

/**
 * Модуль оконной раскладки игрового экрана (v0.3.26).
 * Экран собирается из «иллюминаторов» — прямоугольных окон в бронированных
 * рамах, как мостик имперского корабля или пульт готического собора-машин.
 * Каждое окно занимает строго свою ячейку сетки и никогда не растягивается
 * содержимым: длинные списки прокручиваются только внутри своего окна.
 */

interface WindowPaneProps {
  title: string;
  icon?: string;
  /** Правый слот заголовка: счётчики, кнопки, живой индикатор. */
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Контент прокручивается внутри окна (ленты, инвентари). */
  scroll?: boolean;
  /** Окно тянется на всю высоту ряда (главное окно события). */
  stretch?: boolean;
}

/** Одно окно приборного отсека: золотая рамка + тонкая плашка заголовка. */
export function WindowPane({ title, icon, extra, children, className = '', scroll = false, stretch = false }: WindowPaneProps) {
  return (
    <section
      className={`wh-window flex flex-col min-h-0 overflow-hidden ${stretch ? 'h-full' : ''} ${className}`}
      aria-label={title}
    >
      <header className="wh-window-head shrink-0 flex items-center gap-1.5 px-2 py-1 border-b border-[#c9a227]/40">
        {icon && <span className="text-sm leading-none" aria-hidden="true">{icon}</span>}
        <h3 className="font-gothic text-[11px] uppercase tracking-[0.14em] text-[#e8c85a] truncate">{title}</h3>
        <span className="ml-auto flex items-center gap-1.5 shrink-0">{extra}</span>
      </header>
      <div className={`flex-1 min-h-0 p-2 ${scroll ? 'overflow-y-auto wh-scroll' : ''}`}>{children}</div>
    </section>
  );
}

/** Строка показателя «метка — число» для тесных окон-приборов. */
export function ReadoutRow({ label, value, hint, tone = 'default' }: {
  label: ReactNode;
  value: ReactNode;
  hint?: string;
  tone?: 'good' | 'bad' | 'default';
}) {
  const cls = tone === 'good' ? 'text-[#7fc97f]' : tone === 'bad' ? 'text-[#e07a7a]' : 'text-[#e8d9b0]';
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs leading-tight py-0.5" title={hint}>
      <span className="text-[#b8a878] truncate">{label}</span>
      <span className={`font-bold tabular-nums whitespace-nowrap ${cls}`}>{value}</span>
    </div>
  );
}

/** Полоска-шкала 0..max с подписью и подсказкой (окна характеристик). */
export function BarStat({ label, value, max = 10, icon, color, hint, danger }: {
  label: string;
  value: number;
  max?: number;
  icon?: string;
  color: string; // tailwind bg-* класс заполнения
  hint?: string;
  danger?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="py-1" title={hint}>
      <div className="flex items-center justify-between text-[11px] leading-tight mb-0.5">
        <span className={`font-gothic tracking-wide truncate ${danger ? 'text-[#e07a7a] font-bold' : 'text-[#b8a878]'}`}>
          {icon && <span aria-hidden="true" className="mr-1">{icon}</span>}
          {label}
        </span>
        <span className={`font-bold tabular-nums shrink-0 ml-1.5 ${danger ? 'text-[#e07a7a]' : 'text-[#e8d9b0]'}`}>
          {value}/{max}
        </span>
      </div>
      <div className="wh-bar w-full overflow-hidden" style={{ height: '5px' }} aria-hidden="true">
        <div className={`wh-bar-fill ${color}`} style={{ width: `${pct}%`, height: '100%' }} />
      </div>
    </div>
  );
}

interface WindowCardProps {
  title: ReactNode;
  /** Открыто по умолчанию (важные окна) или свёрнуто (второстепенные). */
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}

/** Окно-карточка со встроенным заголовком-кнопкой: клик по плашке раскрывает/сворачивает.
 *  Пустого места между окнами нет — они прижаты друг к другу в колонке отсека. */
export function WindowCard({ title, defaultOpen = false, badge, children }: WindowCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`wh-window ${open ? '' : 'wh-window-closed'}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="wh-window-head w-full flex items-center gap-1.5 px-2 py-1 border-b border-[#c9a227]/30 text-left hover:bg-[#c9a227]/10 transition-colors"
      >
        <span className="font-gothic text-[11px] uppercase tracking-[0.14em] text-[#e8c85a] flex-1 min-w-0 truncate">{title}</span>
        {badge != null && <span className="shrink-0 text-[10px] text-gray-400 tabular-nums">{badge}</span>}
        <span className="shrink-0 text-[#b8a878] text-[10px]" aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="p-2">{children}</div>}
    </section>
  );
}
