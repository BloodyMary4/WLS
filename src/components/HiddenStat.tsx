import { useEffect, useRef, useState } from 'react';
interface HiddenStatProps {
  label: string;
  value: number;
  icon: string;
  color: string;
  /** Подсказка о скрытом параметре (появляется при наведении). */
  hint?: string;
}

export function HiddenStat({ label, value, icon, color, hint }: HiddenStatProps) {
  // Вспышка полосы при изменении значения (первый рендер — без анимации)
  const prevRef = useRef<number | null>(null);
  const [delta, setDelta] = useState<'up' | 'down' | null>(null);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (prev === null || prev === value) return;
    setDelta(value > prev ? 'up' : 'down');
    const t = setTimeout(() => setDelta(null), 700);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div
      className="relative flex items-center gap-3 group hover:bg-[#c9a227]/5 rounded-sm p-2 transition-all"
      title={hint}
    >
      <span className="text-xl w-8 text-center transform group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-gothic text-sm text-[#b8a878] w-28 tracking-wide">{label}</span>
      <div className="wh-bar flex-1 overflow-hidden" style={{ height: '8px' }}>
        <div
          className={`wh-bar-fill ${color} ${
            delta === 'up' ? 'wh-bar-flash-up' : delta === 'down' ? 'wh-bar-flash-down' : ''
          }`}
          style={{ width: `${value * 10}%`, height: '100%' }}
        ></div>
      </div>
      <span className="text-base text-[#d8c9a3] w-10 text-right font-bold">{value}</span>
      {hint && (
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full z-30 mb-1 hidden group-hover:block">
          <div className="wh-parchment rounded-sm px-3 py-2 text-xs text-[#d8c9a3] font-event max-w-[240px] shadow-xl whitespace-normal">
            {hint}
          </div>
        </div>
      )}
    </div>
  );
}
