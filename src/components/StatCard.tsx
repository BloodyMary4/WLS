import React, { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  valueClassName?: string;
  showBar?: boolean;
  barValue?: number;
  barMax?: number;
  barColor?: string;
  /** Тревожное красное свечение заполненной полосы (критические значения). */
  danger?: boolean;
  children?: React.ReactNode;
}

export function StatCard({ 
  label, 
  value, 
  valueClassName = '',
  showBar = false,
  barValue = 0,
  barMax = 100,
  barColor = 'bg-blue-500',
  danger = false,
  children 
}: StatCardProps) {
  const barPercentage = showBar ? Math.min(100, (barValue / barMax) * 100) : 0;

  // Вспышка при изменении значения: зелёная — улучшение, багровая — урон.
  // Первый рендер не анимируется (prev === null).
  const prevRef = useRef<number | null>(null);
  const [delta, setDelta] = useState<'up' | 'down' | null>(null);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = barValue;
    if (prev === null || prev === barValue) return;
    setDelta(barValue > prev ? 'up' : 'down');
    const t = setTimeout(() => setDelta(null), 700);
    return () => clearTimeout(t);
  }, [barValue]);

  return (
    <div className={`wh-panel p-2.5 xl:p-3${danger ? ' wh-stat-critical' : ''}`}>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="font-gothic text-xs xl:text-sm text-[#b8a878] tracking-wide truncate">
          {danger && <span aria-hidden="true" className="mr-1">⚠</span>}
          {label}
        </span>
        <span className={`text-xs xl:text-sm font-bold whitespace-nowrap ${valueClassName}`}>
          {value}
        </span>
      </div>
      {showBar && (
        <div className="wh-bar w-full overflow-hidden">
          <div
            className={`wh-bar-fill ${barColor} ${danger ? 'wh-bar-fill-danger' : ''} ${
              delta === 'up' ? 'wh-bar-flash-up' : delta === 'down' ? 'wh-bar-flash-down' : ''
            }`}
            style={{ width: `${barPercentage}%` }}
          ></div>
        </div>
      )}
      {children}
    </div>
  );
}
