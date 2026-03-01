export default function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-medium text-white text-right max-w-[60%]">
        {value || "—"}
      </span>
    </div>
  );
}
