import type { ReactNode } from 'react';

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
