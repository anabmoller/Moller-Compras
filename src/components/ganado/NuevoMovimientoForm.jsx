import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getEstablishments, getCompanies } from "../../constants/parameters";
import {
  FINALIDAD_OPTIONS, TIPO_OPERACION_OPTIONS,
  getCategorias, getFrigorificos,
  insertMovimiento,
} from "../../constants/ganado";

const STEPS = [
  { num: 1, label: "Origen y Destino" },
  { num: 2, label: "Animales y Documentos" },
  { num: 3, label: "Revisión" },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center gap-1">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              current >= s.num
                ? "bg-[#C8A03A] text-white"
                : "bg-white/[0.04] text-slate-500 border border-white/[0.06]"
            }`}
          >
            {s.num}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-0.5 ${current > s.num ? "bg-[#C8A03A]" : "bg-white/[0.06]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function FormField({ label, required, children, error }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-red-400 text-[10px] mt-1">{error}</p>}
    </div>
  );
}

const inputClass = "w-full bg-[#13141a] border border-white/[0.06] text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:border-[#C8A03A] focus:ring-1 focus:ring-[#C8A03A]/30 outline-none transition-colors";
const selectClass = inputClass;

export default function NuevoMovimientoForm({ onCancel, onCreated }) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    tipoOperacion: "compra",
    finalidad: "faena",
    establecimientoOrigenId: "",
    empresaDestinoId: "",
    establecimientoDestinoId: "",
    destinoNombre: "",
    categoriaId: "",
    cantidad: "",
    pesoTotalKg: "",
    nroGuia: "",
    nroCota: "",
    fechaEmision: new Date().toISOString().slice(0, 10),
    precioPorKg: "",
    precioTotal: "",
    moneda: "PYG",
    observaciones: "",
  });

  const establishments = getEstablishments();
  const frigorificos = getFrigorificos();
  const categorias = getCategorias();

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // Auto-calculate
  const pesoPromedio = useMemo(() => {
    const c = Number(form.cantidad);
    const p = Number(form.pesoTotalKg);
    return c > 0 && p > 0 ? (p / c).toFixed(2) : "—";
  }, [form.cantidad, form.pesoTotalKg]);

  const precioTotalCalc = useMemo(() => {
    const ppk = Number(form.precioPorKg);
    const pt = Number(form.pesoTotalKg);
    return ppk > 0 && pt > 0 ? Math.round(ppk * pt) : null;
  }, [form.precioPorKg, form.pesoTotalKg]);

  // Show destination selector based on tipo_operacion
  const isInternal = form.tipoOperacion === "transferencia_interna";

  // Validation
  function validateStep1() {
    const e = {};
    if (!form.establecimientoOrigenId) e.establecimientoOrigenId = "Seleccione un origen";
    if (!isInternal && !form.empresaDestinoId && !form.destinoNombre) e.empresaDestinoId = "Seleccione o escriba un destino";
    if (isInternal && !form.establecimientoDestinoId) e.establecimientoDestinoId = "Seleccione un destino";
    if (isInternal && form.establecimientoDestinoId === form.establecimientoOrigenId) {
      e.establecimientoDestinoId = "Origen y destino deben ser diferentes";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e = {};
    if (!form.categoriaId) e.categoriaId = "Seleccione una categoría";
    if (!form.cantidad || Number(form.cantidad) < 1) e.cantidad = "Mínimo 1 cabeza";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(prev => Math.min(prev + 1, 3));
  }

  function handleBack() {
    setErrors({});
    setStep(prev => Math.max(prev - 1, 1));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        cantidad: Number(form.cantidad),
        pesoTotalKg: form.pesoTotalKg ? Number(form.pesoTotalKg) : null,
        precioPorKg: form.precioPorKg ? Number(form.precioPorKg) : null,
        precioTotal: form.precioTotal ? Number(form.precioTotal) : precioTotalCalc,
        establecimientoOrigenId: form.establecimientoOrigenId || null,
        empresaDestinoId: isInternal ? null : (form.empresaDestinoId || null),
        establecimientoDestinoId: isInternal ? (form.establecimientoDestinoId || null) : null,
        destinoNombre: isInternal ? "" : form.destinoNombre,
      };
      await insertMovimiento(payload);
      onCreated?.();
    } catch (err) {
      console.error("[NuevoMovimiento] Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Helpers for review display ----
  const getLabel = (arr, val) => arr.find(o => o.value === val)?.label || val;
  const origenName = establishments.find(e => e._uuid === form.establecimientoOrigenId)?.name || "—";
  const destinoName = isInternal
    ? (establishments.find(e => e._uuid === form.establecimientoDestinoId)?.name || "—")
    : (frigorificos.find(f => f.id === form.empresaDestinoId)?.name || form.destinoNombre || "—");
  const categoriaName = categorias.find(c => c.id === form.categoriaId)?.nombre || "—";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Nuevo Movimiento</h2>
        <button
          onClick={onCancel}
          className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>

      <StepIndicator current={step} />

      {/* STEP 1 — Origen y Destino */}
      {step === 1 && (
        <div className="bg-[#13141a] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Origen y Destino</h3>

          <FormField label="Tipo de Operación" required>
            <select className={selectClass} value={form.tipoOperacion} onChange={e => set("tipoOperacion", e.target.value)}>
              {TIPO_OPERACION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>

          <FormField label="Finalidad" required>
            <select className={selectClass} value={form.finalidad} onChange={e => set("finalidad", e.target.value)}>
              {FINALIDAD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>

          <FormField label="Establecimiento Origen" required error={errors.establecimientoOrigenId}>
            <select className={selectClass} value={form.establecimientoOrigenId} onChange={e => set("establecimientoOrigenId", e.target.value)}>
              <option value="">Seleccionar...</option>
              {establishments.map(e => <option key={e._uuid} value={e._uuid}>{e.name}</option>)}
            </select>
          </FormField>

          {isInternal ? (
            <FormField label="Establecimiento Destino" required error={errors.establecimientoDestinoId}>
              <select className={selectClass} value={form.establecimientoDestinoId} onChange={e => set("establecimientoDestinoId", e.target.value)}>
                <option value="">Seleccionar...</option>
                {establishments.filter(e => e._uuid !== form.establecimientoOrigenId).map(e => (
                  <option key={e._uuid} value={e._uuid}>{e.name}</option>
                ))}
              </select>
            </FormField>
          ) : (
            <>
              <FormField label="Empresa Destino (Frigorífico)" error={errors.empresaDestinoId}>
                <select className={selectClass} value={form.empresaDestinoId} onChange={e => set("empresaDestinoId", e.target.value)}>
                  <option value="">Seleccionar o escribir abajo...</option>
                  {frigorificos.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </FormField>
              {!form.empresaDestinoId && (
                <FormField label="Destino (nombre libre)">
                  <input className={inputClass} value={form.destinoNombre} onChange={e => set("destinoNombre", e.target.value)} placeholder="Ej: Frigorífico Guaraní" />
                </FormField>
              )}
            </>
          )}
        </div>
      )}

      {/* STEP 2 — Animales y Documentos */}
      {step === 2 && (
        <div className="bg-[#13141a] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Animales y Documentos</h3>

          <FormField label="Categoría Animal" required error={errors.categoriaId}>
            <select className={selectClass} value={form.categoriaId} onChange={e => set("categoriaId", e.target.value)}>
              <option value="">Seleccionar...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cantidad (cabezas)" required error={errors.cantidad}>
              <input className={inputClass} type="number" min="1" value={form.cantidad} onChange={e => set("cantidad", e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Peso Total (kg)">
              <input className={inputClass} type="number" min="0" step="0.01" value={form.pesoTotalKg} onChange={e => set("pesoTotalKg", e.target.value)} placeholder="0.00" />
            </FormField>
          </div>

          {pesoPromedio !== "—" && (
            <div className="text-xs text-slate-400 mb-4 -mt-2">
              Peso promedio: <span className="text-white font-medium">{pesoPromedio} kg/cab</span>
            </div>
          )}

          <div className="border-t border-white/[0.04] pt-4 mt-2">
            <h4 className="text-xs font-medium text-slate-400 mb-3">Documentos SENACSA</h4>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nro. Guía">
                <input className={inputClass} value={form.nroGuia} onChange={e => set("nroGuia", e.target.value)} placeholder="Nro. guía" />
              </FormField>
              <FormField label="Nro. COTA">
                <input className={inputClass} value={form.nroCota} onChange={e => set("nroCota", e.target.value)} placeholder="Nro. COTA" />
              </FormField>
            </div>
            <FormField label="Fecha de Emisión">
              <input className={inputClass} type="date" value={form.fechaEmision} onChange={e => set("fechaEmision", e.target.value)} />
            </FormField>
          </div>

          <div className="border-t border-white/[0.04] pt-4 mt-2">
            <h4 className="text-xs font-medium text-slate-400 mb-3">Datos Financieros</h4>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Precio/kg">
                <input className={inputClass} type="number" min="0" step="0.01" value={form.precioPorKg} onChange={e => set("precioPorKg", e.target.value)} placeholder="0" />
              </FormField>
              <FormField label="Precio Total">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={form.precioTotal || precioTotalCalc || ""}
                  onChange={e => set("precioTotal", e.target.value)}
                  placeholder={precioTotalCalc ? String(precioTotalCalc) : "0"}
                />
              </FormField>
              <FormField label="Moneda">
                <select className={selectClass} value={form.moneda} onChange={e => set("moneda", e.target.value)}>
                  <option value="PYG">Guaraníes</option>
                  <option value="USD">USD</option>
                  <option value="BRL">BRL</option>
                </select>
              </FormField>
            </div>
          </div>

          <FormField label="Observaciones">
            <textarea className={inputClass + " h-20 resize-none"} value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Notas adicionales..." />
          </FormField>
        </div>
      )}

      {/* STEP 3 — Review */}
      {step === 3 && (
        <div className="bg-[#13141a] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Revisión del Movimiento</h3>

          <div className="space-y-3">
            <ReviewRow label="Tipo Operación" value={getLabel(TIPO_OPERACION_OPTIONS, form.tipoOperacion)} />
            <ReviewRow label="Finalidad" value={getLabel(FINALIDAD_OPTIONS, form.finalidad)} />
            <ReviewRow label="Origen" value={origenName} />
            <ReviewRow label="Destino" value={destinoName} />
            <div className="border-t border-white/[0.04] my-2" />
            <ReviewRow label="Categoría" value={categoriaName} />
            <ReviewRow label="Cantidad" value={`${form.cantidad} cabezas`} highlight />
            {form.pesoTotalKg && <ReviewRow label="Peso Total" value={`${form.pesoTotalKg} kg`} />}
            {pesoPromedio !== "—" && <ReviewRow label="Peso Promedio" value={`${pesoPromedio} kg/cab`} />}
            <div className="border-t border-white/[0.04] my-2" />
            {form.nroGuia && <ReviewRow label="Nro. Guía" value={form.nroGuia} />}
            {form.nroCota && <ReviewRow label="Nro. COTA" value={form.nroCota} />}
            <ReviewRow label="Fecha Emisión" value={form.fechaEmision} />
            {(form.precioTotal || precioTotalCalc) && (
              <ReviewRow
                label="Precio Total"
                value={`${form.moneda === "USD" ? "US$" : form.moneda === "BRL" ? "R$" : "Gs."} ${Number(form.precioTotal || precioTotalCalc).toLocaleString("es-PY")}`}
                highlight
              />
            )}
            {form.observaciones && <ReviewRow label="Observaciones" value={form.observaciones} />}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <button onClick={handleBack} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            ← Anterior
          </button>
        ) : <div />}

        {step < 3 ? (
          <button onClick={handleNext} className="px-6 py-2.5 bg-[#C8A03A] text-white text-sm font-semibold rounded-lg hover:bg-[#b8922f] transition-colors">
            Siguiente →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 bg-[#C8A03A] text-white text-sm font-semibold rounded-lg hover:bg-[#b8922f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creando..." : "Crear Movimiento"}
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value, highlight }) {
  return (
    <div className="flex items-start justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right max-w-[60%] ${highlight ? "text-[#C8A03A] font-semibold" : "text-slate-200"}`}>{value}</span>
    </div>
  );
}
