import { WindowPane } from '../Dashboard';

interface GalaxyWindowProps {
  worldEvent: string;
  seenCount?: number;
}

/**
 * Окно «Состояние Галактики» — глобальный фон эпохи (v0.3.32).
 * Мировые события (крестовины, разломы Варпа, WAAAGH!) видны отдельным
 * блоком: игрок понимает, в какой галактике крутится его жизнь.
 */
export function GalaxyWindow({ worldEvent, seenCount = 0 }: GalaxyWindowProps) {
  return (
    <WindowPane title="Состояние Галактики" icon="🌍"
      extra={seenCount > 1 ? <span className="text-[10px] text-gray-400 tabular-nums">{seenCount} зап.</span> : undefined}>
      <p className="text-xs text-blue-200/90 italic leading-snug">{worldEvent}</p>
    </WindowPane>
  );
}
