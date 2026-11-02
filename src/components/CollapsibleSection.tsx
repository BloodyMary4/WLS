import { useState } from 'react';
import type { ReactNode } from 'react';

interface CollapsibleSectionProps {
  /** Заголовок панели (с эмодзи/геральдикой внутри). */
  title: ReactNode;
  /** По умолчанию свёрнута? Для длинных второстепенных секций. */
  defaultOpen?: boolean;
  /** Дочерний контент. */
  children: ReactNode;
  /** Дополнительный правый элемент в шапке (счётчик и т.п.). */
  badge?: ReactNode;
}

/**
 * Универсальная сворачиваемая панель сайдбара — единый модуль интерфейса.
 * Все секции («Характеристики», «Снаряжение», «Встреченные души», «Квесты»,
 * «Галактика») используют один паттерн: клик по заголовку скрывает/показывает
 * содержимое, стрелка ▾ поворачивается, состояние доступно скринридерам.
 * Игрок управляет плотностью экрана сам, ничего не теряя.
 */
export function CollapsibleSection({ title, defaultOpen = true, badge, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`wh-panel wh-side-panel p-3 xl:p-3.5 ${open ? '' : 'wh-side-collapsed'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 text-left group cursor-pointer"
      >
        <span className="wh-panel-title wh-side-title font-bold pb-0 flex items-center gap-2 min-w-0">
          {title}
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {badge}
          <span
            className={`text-xs text-[#c9a227]/60 group-hover:text-[#c9a227] transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </span>
      </button>
      {open && <div className="mt-2.5 pt-2 border-t border-[#c9a227]/15">{children}</div>}
    </div>
  );
}
