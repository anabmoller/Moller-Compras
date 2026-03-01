import { PRIORITY_LEVELS } from "../../constants";

export default function RequestStepDetails({ form, errors, onUpdateForm, FieldError }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Prioridad</label>
        <div className="flex gap-2">
          {PRIORITY_LEVELS.map(u => (
            <button
              key={u.value}
              onClick={() => onUpdateForm("urgency", u.value)}
              className="flex-1 px-1.5 py-3 rounded-lg text-center transition-all duration-150 cursor-pointer"
              style={{
                border: form.urgency === u.value ? `2px solid ${u.color}` : '1px solid rgba(255,255,255,0.06)',
                background: form.urgency === u.value ? (u.colorLight || u.color + "10") : 'rgba(255,255,255,0.03)',
              }}
            >
              <div className="text-base">{u.icon}</div>
              <div className="text-[11px] font-semibold mt-1" style={{ color: form.urgency === u.value ? u.color : '#94a3b8' }}>
                {u.label}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">{u.days ? `${u.days}d` : `${u.hours}h`}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">{"¿"}Por qu{"é"} necesitas estos productos? *</label>
        <textarea
          value={form.reason}
          onChange={e => onUpdateForm("reason", e.target.value)}
          placeholder="Justificación de la compra..."
          rows={3}
          className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 resize-y ${errors.reason ? 'border-red-500' : 'border-white/[0.1]'}`}
        />
        <FieldError field="reason" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Notas adicionales</label>
        <textarea
          value={form.notes}
          onChange={e => onUpdateForm("notes", e.target.value)}
          placeholder="Observaciones, especificaciones técnicas..."
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 resize-y"
        />
      </div>
    </div>
  );
}
