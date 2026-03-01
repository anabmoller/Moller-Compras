export default function KPICard({ label, value, color, icon }) {
  return (
    <div className="bg-white/[0.03] rounded-xl px-4 py-3.5 border border-white/[0.06] shadow-sm">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <div
          className="text-[26px] font-bold leading-none"
          style={color ? { color } : undefined}
        >
          {value}
        </div>
      </div>
      <div className="text-[11px] text-slate-400 mt-1.5 font-medium tracking-wide">
        {label}
      </div>
    </div>
  );
}
