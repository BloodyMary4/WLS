import React from 'react';

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
  
  return (
    <div className="wh-panel p-2.5 xl:p-3">
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="font-gothic text-xs xl:text-sm text-[#b8a878] tracking-wide truncate">{label}</span>
        <span className={`text-xs xl:text-sm font-bold whitespace-nowrap ${valueClassName}`}>
          {value}
        </span>
      </div>
      {showBar && (
        <div className="wh-bar w-full overflow-hidden">
          <div 
            className={`wh-bar-fill ${barColor} ${danger ? 'wh-bar-fill-danger' : ''}`}
            style={{ width: `${barPercentage}%` }}
          ></div>
        </div>
      )}
      {children}
    </div>
  );
}
