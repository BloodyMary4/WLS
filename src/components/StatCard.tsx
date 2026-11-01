import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  valueClassName?: string;
  showBar?: boolean;
  barValue?: number;
  barMax?: number;
  barColor?: string;
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
  children 
}: StatCardProps) {
  const barPercentage = showBar ? Math.min(100, (barValue / barMax) * 100) : 0;
  
  return (
    <div className="card-modern p-2.5 xl:p-3">
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="text-xs xl:text-sm text-gray-400 font-semibold truncate">{label}</span>
        <span className={`text-xs xl:text-sm font-bold whitespace-nowrap ${valueClassName}`}>
          {value}
        </span>
      </div>
      {showBar && (
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
          <div 
            className={`h-2 rounded-full ${barColor} transition-all duration-500`}
            style={{ width: `${barPercentage}%` }}
          ></div>
        </div>
      )}
      {children}
    </div>
  );
}
