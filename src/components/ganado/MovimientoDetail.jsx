import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../constants/users";
import { getEstablishments, getCompanies } from "../../constants/parameters";
import {
  GANADO_STATUS_FLOW, GANADO_EXTRA_STATUSES,
  FINALIDAD_OPTIONS, TIPO_OPERACION_OPTIONS,
  getCategorias, getFrigorificos,
  fetchSingleMovimiento, validateMovimiento, advanceGanadoStatus,
  addDivergencia, anularMovimiento, updateMovimiento,
} from "../../constants/ganado";

function getStatusInfo(estado) {
  const all = [...GANADO_STATUS_FLOW, ...GANADO_EXTRA_STATUSES];
  return all.find(s => s.key === estado) || { label: estado, color: "#64748b", icon: "?" };
}

function InfoCard({ label, children }) {
  return (
    <div className="bg-[#0d0e14] border border-white/[0.04] rounded-lg p-3">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5">{label}</div>
      {children}
    </div>
  );
}

export default function MovimientoDetail({ movimientoUuid, onBack }) {
  const { currentUser } = useAuth();
  const [mov, setMov] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Divergencia form
  const [showDivForm, setShowDivForm] = useState(false);
  const [divForm, setDivForm] = useState({ tipo: "cantidad", descripcion: "", cantidadDiferencia: "", pesoDiferenciaKg: "" });

  // Anular reason
  const [showAnularDialog, setShowAnularDialog] = useState(false);
  const [anularReason, setAnularReason] = useState("");

  const canValidate = hasPermission(currentUser, "validate_movimiento_ganado");
  const canCreate = hasPermission(currentUser, "create_movimiento_ganado");

  async function load() {
    setLoading(true);
    const data = await fetchSingleMovimiento(movimientoUuid);
    setMov(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [movimientoUuid]);

  const establishments = getEstablishments();
  const categorias = getCategorias();
  const frigorificos = getFrigorificos();

  const origen = useMemo(() => establishments.find(e => e._uuid === mov?.establecimientoOrigenId), [mov, establishments]);
  const destino = useMemo(() => {
    if (mov?.destinoNombre) return { name: mov.destinoNombre };
    if (mov?.empresaDestinoId) return getCompanies().find(c => c._uuid === mov.empresaDestinoId);
    if (mov?.establecimientoDestinoId) return establishments.find(e => e._uuid === mov.establecimientoDestinoId);
    return null;
  }, [mov, establishments]);
  const categoria = useMemo(() => categorias.find(c => c.id === mov?.categoriaId), [mov, categorias]);
  const status = mov ? getStatusInfo(mov.estado) : null;

  // Next status in flow
  const nextStatus = useMemo(() => {
    if (!mov) return null;
    const idx = GANADO_STATUS_FLOW.findIndex(s => s.key === mov.estado);
    if (idx >= 0 && idx < GANADO_STATUS_FLOW.length - 1) return GANADO_STATUS_FLOW[idx + 1];
    return null;
  }, [mov]);

  async function handleValidate() {
    setActionLoading(true);
    try {
      await validateMovimiento(movimientoUuid);
      await load();
    } catch (err) {
      console.error("[Detail] Validate failed:", err);
    }
    setActionLoading(false);
  }

  async function handleAdvance() {
    if (!nextStatus) return;
    setActionLoading(true);
    try {
      await advanceGanadoStatus(movimientoUuid, nextStatus.key);
      await load();
    } catch (err) {
      console.error("[Detail] Advance failed:", err);
    }
    setActionLoading(false);
  }

  async function handleAddDivergencia() {
    setActionLoading(true);
    try {
      await addDivergencia(movimientoUuid, {
        tipo: divForm.tipo,
        descripcion: divForm.descripcion,
        cantidadDiferencia: divForm.cantidadDiferencia ? Number(divForm.cantidadDiferencia) : null,
        pesoDiferenciaKg: divForm.pesoDiferenciaKg ? Number(divForm.pesoDiferenciaKg) : null,
      });
      setShowDivForm(false);
      setDivForm({ tipo: "cantidad", descripcion: "", cantidadDiferencia: "", pesoDiferenciaKg: "" });
      await load();
    } catch (err) {
      console.error("[Detail] Add divergence failed:", err);
    }
    setActionLoading(false);
  }

  async function handleAnular() {
    setActionLoading(true);
    try {
      await anularMovimiento(movimientoUuid, anularReason);
      setShowAnularDialog(false);
      await load();
    } catch (err) {
      console.error("[Detail] Anular failed:", err);
    }
    setActionLoading(false);
  }

  const formatCurrency = (val, mon) => {
    if (!val) return "—";
    const symbol = mon === "USD" ? "US$" : mon === "BRL" ? "R$" : "Gs.";
    return `${symbol} ${Number(val).toLocaleString("es-PY")}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-16">
          <div className="w-8 h-8 rounded-lg bg-[#1F2A44] inline-flex items-center justify-center shadow-lg shadow-black/20 animate-pulse mb-3">
            <span className="text-white text-sm font-bold">🐄</span>
          </div>
          <p className="text-slate-500 text-sm">Cargando movimiento...</p>
        </div>
      </div>
    );
  }

  if (!mov) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white text-sm mb-4">← Volver</button>
        <p className="text-slate-400 text-center py-12">Movimiento no encontrado</p>
      </div>
    );
  }

  const isTerminal = mov.estado === "cerrado" || mov.estado === "anulado";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm transition-colors">←</button>
          <div>
            <h2 className="text-lg font-bold text-white">{mov.id || "Movimiento"}</h2>
            <span className="text-xs text-slate-500">{mov.fechaEmision} · Creado por {mov.createdBy}</span>
          </div>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: status.color + "20", color: status.color }}
        >
          {status.icon} {status.label}
        </span>
      </div>

      {/* Action buttons */}
      {!isTerminal && (
        <div className="flex flex-wrap gap-2 mb-6">
          {canValidate && (mov.estado === "borrador" || mov.estado === "pendiente_validacion") && (
            <button
              onClick={handleValidate}
              disabled={actionLoading}
              className="px-4 py-2 bg-[#3b82f6] text-white text-sm font-semibold rounded-lg hover:bg-[#2563eb] transition-colors disabled:opacity-50"
            >
              Validar
            </button>
          )}
          {canCreate && nextStatus && mov.estado !== "borrador" && mov.estado !== "pendiente_validacion" && (
            <button
              onClick={handleAdvance}
              disabled={actionLoading}
              className="px-4 py-2 bg-[#C8A03A] text-white text-sm font-semibold rounded-lg hover:bg-[#b8922f] transition-colors disabled:opacity-50"
            >
              Avanzar → {nextStatus.label}
            </button>
          )}
          <button
            onClick={() => setShowAnularDialog(true)}
            className="px-4 py-2 bg-red-600/10 text-red-400 text-sm font-semibold rounded-lg hover:bg-red-600/20 transition-colors"
          >
            Anular
          </button>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <InfoCard label="Origen">
          <p className="text-sm font-medium text-white">{origen?.name || "—"}</p>
          {origen?.manager && <p className="text-xs text-slate-500">Gerente: {origen.manager}</p>}
        </InfoCard>
        <InfoCard label="Destino">
          <p className="text-sm font-medium text-white">{destino?.name || "—"}</p>
        </InfoCard>
        <InfoCard label="Operación">
          <p className="text-sm text-slate-300">
            {TIPO_OPERACION_OPTIONS.find(o => o.value === mov.tipoOperacion)?.label || mov.tipoOperacion}
          </p>
          <p className="text-xs text-slate-500">
            Finalidad: {FINALIDAD_OPTIONS.find(o => o.value === mov.finalidad)?.label || mov.finalidad}
          </p>
        </InfoCard>
        <InfoCard label="Animales">
          <p className="text-sm text-white font-semibold">{mov.cantidad} cabezas</p>
          <p className="text-xs text-slate-400">{categoria?.nombre || "—"} ({categoria?.codigo || ""})</p>
          {mov.pesoTotalKg > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Peso: {mov.pesoTotalKg} kg total · {mov.pesoPromedioKg} kg/cab
            </p>
          )}
        </InfoCard>
      </div>

      {/* Financial + SENACSA docs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <InfoCard label="Financiero">
          {mov.precioPorKg > 0 && <p className="text-xs text-slate-400">Precio/kg: {formatCurrency(mov.precioPorKg, mov.moneda)}</p>}
          <p className="text-sm font-semibold text-[#C8A03A]">Total: {formatCurrency(mov.precioTotal, mov.moneda)}</p>
        </InfoCard>
        <InfoCard label="Documentos SENACSA">
          <p className="text-xs text-slate-300">Guía: <span className="text-white">{mov.nroGuia || "—"}</span></p>
          <p className="text-xs text-slate-300">COTA: <span className="text-white">{mov.nroCota || "—"}</span></p>
          <p className="text-xs text-slate-300">Emisión: <span className="text-white">{mov.fechaEmision}</span></p>
        </InfoCard>
      </div>

      {/* Validation checks */}
      <InfoCard label="Verificaciones">
        <div className="flex flex-wrap gap-3 mt-1">
          <CheckItem label="Marca verificada" checked={mov.marcaVerificada} />
          <CheckItem label="SENACSA verificado" checked={mov.senascaVerificado} />
          <CheckItem label="Guía conforme" checked={mov.guiaConforme} />
        </div>
      </InfoCard>

      {/* Observaciones */}
      {mov.observaciones && (
        <div className="mt-4">
          <InfoCard label="Observaciones">
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{mov.observaciones}</p>
          </InfoCard>
        </div>
      )}

      {/* Validation info */}
      {mov.validatedBy && (
        <div className="mt-4">
          <InfoCard label="Validación">
            <p className="text-xs text-slate-300">Validado por: <span className="text-white">{mov.validatedBy}</span></p>
            <p className="text-xs text-slate-500">{mov.validatedAt ? new Date(mov.validatedAt).toLocaleString("es-PY") : ""}</p>
          </InfoCard>
        </div>
      )}

      {/* Divergencias */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Divergencias ({mov.divergencias?.length || 0})</h3>
          {!isTerminal && (
            <button
              onClick={() => setShowDivForm(!showDivForm)}
              className="text-xs text-[#C8A03A] hover:text-[#b8922f] transition-colors"
            >
              {showDivForm ? "Cancelar" : "+ Agregar"}
            </button>
          )}
        </div>

        {showDivForm && (
          <div className="bg-[#13141a] border border-white/[0.06] rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                <select
                  className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-2"
                  value={divForm.tipo}
                  onChange={e => setDivForm(p => ({ ...p, tipo: e.target.value }))}
                >
                  {["cantidad", "peso", "categoria", "marca", "documento", "otro"].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Diferencia cantidad</label>
                <input
                  className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-2"
                  type="number"
                  value={divForm.cantidadDiferencia}
                  onChange={e => setDivForm(p => ({ ...p, cantidadDiferencia: e.target.value }))}
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-slate-500 mb-1">Descripción *</label>
              <textarea
                className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-2 h-16 resize-none"
                value={divForm.descripcion}
                onChange={e => setDivForm(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Describa la discrepancia..."
              />
            </div>
            <button
              onClick={handleAddDivergencia}
              disabled={!divForm.descripcion || actionLoading}
              className="px-4 py-2 bg-[#C8A03A] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
            >
              Guardar Divergencia
            </button>
          </div>
        )}

        {mov.divergencias?.length > 0 && (
          <div className="space-y-2">
            {mov.divergencias.map(d => (
              <div key={d.id} className="bg-[#13141a] border border-white/[0.06] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-red-400 uppercase">{d.tipo}</span>
                  <span className={`text-[10px] ${d.resuelto ? "text-green-400" : "text-yellow-400"}`}>
                    {d.resuelto ? "Resuelto" : "Pendiente"}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{d.descripcion}</p>
                {d.cantidadDiferencia && <p className="text-[10px] text-slate-500 mt-1">Diferencia: {d.cantidadDiferencia} cab.</p>}
                <p className="text-[10px] text-slate-600 mt-1">Por: {d.reportadoPor} · {new Date(d.createdAt).toLocaleDateString("es-PY")}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archivos */}
      {mov.archivos?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-white mb-3">Archivos ({mov.archivos.length})</h3>
          <div className="space-y-2">
            {mov.archivos.map(a => (
              <div key={a.id} className="bg-[#13141a] border border-white/[0.06] rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white">{a.nombre}</p>
                  <p className="text-[10px] text-slate-500">{a.tipo} · {a.uploadedBy}</p>
                </div>
                <span className="text-[10px] text-slate-500">{a.sizeBytes ? `${(a.sizeBytes / 1024).toFixed(1)} KB` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anular dialog */}
      {showAnularDialog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#13141a] border border-white/[0.06] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-sm font-bold text-white mb-3">Anular Movimiento</h3>
            <p className="text-xs text-slate-400 mb-4">Esta acción no se puede deshacer. Indique el motivo:</p>
            <textarea
              className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-sm rounded-lg px-3 py-2 h-20 resize-none mb-4"
              value={anularReason}
              onChange={e => setAnularReason(e.target.value)}
              placeholder="Motivo de anulación..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAnularDialog(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">
                Cancelar
              </button>
              <button
                onClick={handleAnular}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckItem({ label, checked }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${checked ? "bg-green-500/20 text-green-400" : "bg-white/[0.04] text-slate-600"}`}>
        {checked ? "✓" : "—"}
      </div>
      <span className={`text-xs ${checked ? "text-green-400" : "text-slate-500"}`}>{label}</span>
    </div>
  );
}
