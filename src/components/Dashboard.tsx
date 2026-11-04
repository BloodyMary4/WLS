import { useState, type ReactNode } from 'react';
import { GameIcon, resolveIcon } from './icons';

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
  /** v0.3.47: контент растягивается на всю высоту тела окна (flex-колонка),
   *  вместо минимальной планки 160px — нужно окну события, где текст и
   *  выборы делят вертикаль по flex. */
  fillBody?: boolean;
}

/** Одно окно приборного отсека: золотая рамка + тонкая плашка заголовка.
 *  v0.3.43: параметр scroll оставлен для совместимости — теперь ВСЕ окна
 *  показывают контент полностью (прокрутка внутри окна при переполнении),
 *  ничего не обрезается молча. */
export function WindowPane({ title, icon, extra, children, className = '', stretch = false, scroll = true, fillBody = false }: WindowPaneProps) {
  const noScroll = scroll === false;
  return (
    <section
      className={`wh-window flex flex-col min-h-0 overflow-hidden ${stretch ? 'h-full' : ''} ${className}`}
      aria-label={title}
    >
      <header className="wh-window-head shrink-0 flex items-stretch gap-1.5 px-2 py-1 border-b border-[#c9a227]/40">
        {/* v0.3.86: иконка окна — плашка во всю высоту заголовка, глиф
            центрирован по объёму колонки (вертикаль и горизонталь), тонкая
            золотая грань отделяет его от названия. Композиция 25/50/25 не
            затронута — меняется только оформление шапки окна.
            v0.3.89 «Реликварий»: реликтовая ниша — утопленный медальон с
            эмалевой интарсией, золотой ободок, янтарное свечение; глиф
            печатается системным цветным шрифтом (только JSX, без CSS-контента). */}
        {icon && (
          <span
            aria-hidden="true"
            className="wh-pane-icon shrink-0 grid place-items-center rounded-full"
          >
            {/* v0.3.90 «Гравировка»: SVG-глиф вместо эмодзи — единый штрих,
                цвет наследуется от медальона (currentColor). */}
            <GameIcon name={resolveIcon(icon)} />
          </span>
        )}
        <h3 className="self-center font-gothic text-[11px] uppercase tracking-[0.14em] text-[#e8c85a] truncate">{title}</h3>
        <span className="ml-auto flex items-center gap-1.5 shrink-0">{extra}</span>
      </header>
      {/* Базовая высота контента (v0.3.32): даже без растянутого родителя
          в окне всегда видна содержательная часть — экран физически не может
          стать «пустым». v0.3.44: окна-приборы скроллят список, а окно события
          (scroll={false}) НЕ скроллится никогда — контент сам разрастается
          («документ»), поэтому информация нигде не прячется за полосами
          прокрутки и не наползает на соседние панели. */}
      {/* v0.3.44: контент окна всегда виден ЦЕЛИКОМ. Окно тянется на всю
          ячейку сетки, но никогда не обрезает содержимое молча: при
          переполнении показывается тонкий золотой скроллбар (wh-scroll),
          а в окне события — контент разрастается сам («документ»). */}
      <div className={`wh-window-body flex-1 min-h-0 p-2 ${fillBody ? "flex flex-col" : "min-h-[160px]"} ${noScroll ? "" : "overflow-y-auto wh-scroll overscroll-contain"}`}>{children}</div>
    </section>
  );
}

/** Строка показателя «метка — число» для тесных окон-приборов.
 *  v0.3.43: значение больше не усекается посреди слова — перенос по словам,
 *  метка занимает минимум ширины, длинное значение читается целиком. */
export function ReadoutRow({ label, value, icon, hint, tone = 'default' }: {
  label: ReactNode;
  value: ReactNode;
  /** v0.3.89 «Реликварий»: глиф показателя в медальоне реликтовой ниши. */
  icon?: string;
  hint?: string;
  tone?: 'good' | 'bad' | 'default';
}) {
  const cls = tone === 'good' ? 'text-[#7fc97f]' : tone === 'bad' ? 'text-[#e07a7a]' : 'text-[#e8d9b0]';
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs leading-snug py-0.5" title={hint}>
      <span className="flex items-center gap-1.5 text-[#b8a878] shrink-0">
        {icon && (
          <span aria-hidden="true" className="wh-bar-icon shrink-0 grid place-items-center rounded-full">
            <GameIcon name={resolveIcon(icon)} />
          </span>
        )}
        {label}
      </span>
      <span className={`font-bold tabular-nums text-right break-words ${cls}`}>{value}</span>
    </div>
  );
}

/** Полоска-шкала 0..max с подписью и подсказкой (окна характеристик).
 *  v0.3.53: метка занимает фиксированную колонку — шкалы идут ровной лесенкой,
 *  а не «раскиданы» по окну; эмодзи из меток убраны (чистый HUD). */
export function BarStat({ label, value, max = 10, icon, color, hint, danger }: {
  label: string;
  value: number;
  max?: number;
  /** v0.3.89 «Реликварий»: тематический глиф шкалы — печатается в медальоне
   *  реликтовой ниши перед меткой (эмодзи из JSX, без CSS-контента). */
  icon?: string;
  color: string; // tailwind bg-* класс заполнения
  hint?: string;
  danger?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="py-1" title={hint}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_64px] items-center gap-2 text-[11px] leading-tight mb-1">
        <span className={`flex items-center gap-1.5 min-w-0 font-gothic tracking-wide truncate ${danger ? 'text-[#e07a7a] font-bold' : 'text-[#b8a878]'}`}>
          {icon && (
            <span aria-hidden="true" className="wh-bar-icon shrink-0 grid place-items-center rounded-full">
              <GameIcon name={resolveIcon(icon)} />
            </span>
          )}
          {label}
        </span>
        <span className={`font-bold tabular-nums text-right ${danger ? 'text-[#e07a7a]' : 'text-[#e8d9b0]'}`}>
          {value}/{max}
        </span>
        <span className="wh-bar overflow-hidden block" style={{ height: '5px' }} aria-hidden="true">
          <span className={`wh-bar-fill block h-full ${color}`} style={{ width: `${pct}%` }} />
        </span>
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
