import { formatGuaranies } from "../../constants/budgets";
import ModalBackdrop from "../common/ModalBackdrop";

export default function BudgetFormModal({
  form, editingId, establishments, sectors, saving,
  onUpdate, onSave, onDeactivate, onClose,
}) {
  const PROYECTO_OPTIONS = ["TI", "Oficina ADM", "Infraestructura", "Veterinaria", "Agricultura", "Logistica"];

  return (
    <ModalBackdrop onClose={onClose} variant="center">
      <div className="bg-[#111218] rounded-2xl px-5 pt-5 pb-6 max-w-[520px] w-full max-h-[85vh] overflow-y-auto animate-fadeIn">

        <h3 className="text-xl font-semibold text-white mb-4 mt-0">
          {editingId ? "Editar Presupuesto" : "Nuevo Presupuesto"}
        </h3>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Nombre</label>
            <input
              value={form.name}
              onChange={e => onUpdate("name", e.target.value)}
              placeholder="Ej: Taller Ypoti"
              className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-sm text-white outline-none transition-colors focus:border-[#C8A03A]/50"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Establecimiento</label>
              <select
                value={form.establishment}
                onChange={e => onUpdate("establishment", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-sm text-white outline-none transition-colors focus:border-[#C8A03A]/50"
              >
                <option value="">Seleccionar...</option>
                {establishments.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Sector</label>
              <select
                value={form.sector}
                onChange={e => onUpdate("sector", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-sm text-white outline-none transition-colors focus:border-[#C8A03A]/50"
              >
                <option value="">Seleccionar...</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Per{"í"}odo</label>
              <input
                value={form.period}
                onChange={e => onUpdate("period", e.target.value)}
                placeholder="2026"
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-sm text-white outline-none transition-colors focus:border-[#C8A03A]/50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Inicio</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => onUpdate("startDate", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-sm text-white outline-none transition-colors focus:border-[#C8A03A]/50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Fin</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => onUpdate("endDate", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-sm text-white outline-none transition-colors focus:border-[#C8A03A]/50"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Proyecto</label>
              <select
                value={form.proyecto}
                onChange={e => onUpdate("proyecto", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-sm text-white outline-none transition-colors focus:border-[#C8A03A]/50"
              >
                <option value="">Seleccionar...</option>
                {PROYECTO_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Centro de Costos</label>
              <input
                value={form.centroCostos}
                onChange={e => onUpdate("centroCostos", e.target.value)}
                placeholder="Ej: CC-001"
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-sm text-white outline-none transition-colors focus:border-[#C8A03A]/50"
              />
            </div>
          </div>

          {/* Split between establishments */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.splitEnabled}
                onChange={e => onUpdate("splitEnabled", e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-500"
              />
              Dividir entre establecimientos
            </label>
            {form.splitEnabled && (
              <div className="bg-[#F8F9FB]/[0.02] rounded-lg border border-white/[0.06] p-3 flex flex-col gap-2">
                {establishments.map(est => (
                  <div key={est} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!form.splits[est]}
                      onChange={e => {
                        const newSplits = { ...form.splits };
                        if (e.target.checked) newSplits[est] = form.splits[est] || 0;
                        else delete newSplits[est];
                        onUpdate("splits", newSplits);
                      }}
                      className="w-3.5 h-3.5 accent-emerald-500"
                    />
                    <span className="text-xs text-slate-300 flex-1">{est}</span>
                    {form.splits[est] !== undefined && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={form.splits[est] || ""}
                          onChange={e => {
                            const newSplits = { ...form.splits, [est]: parseInt(e.target.value) || 0 };
                            onUpdate("splits", newSplits);
                          }}
                          className="w-16 px-2 py-1 rounded border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-xs text-white outline-none text-right"
                          min={0}
                          max={100}
                        />
                        <span className="text-[10px] text-slate-500">%</span>
                      </div>
                    )}
                  </div>
                ))}
                {Object.keys(form.splits).length > 0 && (
                  <div className="text-[10px] text-right mt-1" style={{
                    color: Object.values(form.splits).reduce((s, v) => s + v, 0) === 100 ? '#22c55e' : '#f59e0b'
                  }}>
                    Total: {Object.values(form.splits).reduce((s, v) => s + v, 0)}%
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Monto Planificado ({"₲"})</label>
              <input
                type="number"
                value={form.planned || ""}
                onChange={e => onUpdate("planned", parseInt(e.target.value) || 0)}
                placeholder="100000000"
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-sm text-white outline-none transition-colors focus:border-[#C8A03A]/50"
                min={0}
              />
              {form.planned > 0 && (
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {formatGuaranies(form.planned)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Consumido ({"₲"})</label>
              <input
                type="number"
                value={form.consumed || ""}
                onChange={e => onUpdate("consumed", parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-sm text-white outline-none transition-colors focus:border-[#C8A03A]/50"
                min={0}
              />
              {form.consumed > 0 && (
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {formatGuaranies(form.consumed)}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-2">
            {editingId && (
              <button
                onClick={() => onDeactivate(editingId)}
                disabled={saving}
                className={`px-4 py-3 rounded-lg border border-red-500/[0.12] bg-red-500/[0.06] text-red-400 text-xs font-semibold ${saving ? 'cursor-default' : 'cursor-pointer'}`}
              >
                Desactivar
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-white/[0.06] bg-[#F8F9FB]/[0.03] text-white text-[13px] font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={!form.name || !form.establishment || !form.planned || saving}
              className={`flex-1 py-3 rounded-lg border-none text-[13px] font-semibold ${
                form.name && form.establishment && form.planned && !saving
                  ? 'bg-gradient-to-br from-emerald-500 to-[#C8A03A] text-white cursor-pointer shadow-md shadow-emerald-500/20'
                  : 'bg-[#F8F9FB]/[0.06] text-slate-500 cursor-default'
              }`}
            >
              {saving ? "Guardando..." : editingId ? "Guardar" : "Crear"}
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}
