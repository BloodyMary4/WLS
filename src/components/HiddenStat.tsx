interface HiddenStatProps {
  label: string;
  value: number;
  icon: string;
  color: string;
}

export function HiddenStat({ label, value, icon, color }: HiddenStatProps) {
  return (
    <div className="flex items-center gap-3 group hover:bg-[#c9a227]/5 rounded-sm p-2 transition-all">
      <span className="text-xl w-8 text-center transform group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-gothic text-sm text-[#b8a878] w-28 tracking-wide">{label}</span>
      <div className="wh-bar flex-1 overflow-hidden" style={{ height: '8px' }}>
        <div
          className={`wh-bar-fill ${color}`}
          style={{ width: `${value * 10}%`, height: '100%' }}
        ></div>
      </div>
      <span className="text-base text-[#d8c9a3] w-10 text-right font-bold">{value}</span>
    </div>
  );
}
