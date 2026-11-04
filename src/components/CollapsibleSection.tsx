import { GameIcon } from './icons';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

/** Сохранение состояния панелей между сессиями — «обновляемые модули» интерфейса:
 *  игрок один раз настроил плотность экрана, и его выбор живёт до сброса игры. */
const STORAGE_PREFIX = 'wh-panel:';

function loadOpenState(id: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    if (raw === '1') return true;
    if (raw === '0') return false;
  } catch {
    /* storage недоступен (SSR/приватный режим) — работаем по умолчанию */
  }
  return fallback;
}

function saveOpenState(id: string, open: boolean): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, open ? '1' : '0');
  } catch {
    /* молча: настройка плотности — не критичные данные */
  }
}

interface CollapsibleSectionProps {
  /** Заголовок панели (с эмодзи/геральдикой внутри). */
  title: ReactNode;
  /** По умолчанию свёрнута? Для длинных второстепенных секций. */
  defaultOpen?: boolean;
  /** Стабильный id: состояние сворачивания запоминается между сессиями. */
  persistId?: string;
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
export function CollapsibleSection({ title, defaultOpen = true, persistId, badge, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(() => (persistId ? loadOpenState(persistId, defaultOpen) : defaultOpen));
  // Вторичная синхронизация: если секция сменила дефолт/id — не теряем запись
  useEffect(() => {
    if (persistId) saveOpenState(persistId, open);
  }, [persistId, open]);
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
            className={`w-3.5 h-3.5 text-[#c9a227]/60 group-hover:text-[#c9a227] transition-transform flex items-center ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <GameIcon name="chevron" className="w-3.5 h-3.5" />
          </span>
        </span>
      </button>
      {open && <div className="mt-2.5 pt-2 border-t border-[#c9a227]/15">{children}</div>}
    </div>
  );
}
