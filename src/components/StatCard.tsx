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
    <div className="bg-gray-900 rounded px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-sm font-bold ${valueClassName}`}>
          {value}
        </span>
      </div>
      {showBar && (
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${barColor}`}
            style={{ width: `${barPercentage}%` }}
          ></div>
        </div>
      )}
      {children}
    </div>
  );
}
