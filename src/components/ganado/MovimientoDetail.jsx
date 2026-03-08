import { useState, useEffect, useMemo } from "react";
import { BullIcon } from "../icons";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../constants/users";
import { useEntityScope } from "../../hooks/useEntityScope";
import {
  GANADO_STATUS_FLOW, GANADO_EXTRA_STATUSES,
  FINALIDAD_OPTIONS, TIPO_OPERACION_OPTIONS,
  getCategorias,
  fetchSingleMovimiento, validateMovimiento, advanceGanadoStatus,
  addDivergencia, resolveDivergencia, anularMovimiento, updateMovimiento,
  addPesaje, deletePesaje, invalidateGanadoMetrics,
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

export default function MovimientoDetail({ movimientoUuid, onBack, onNavigate }) {
  const { currentUser } = useAuth();
  const [mov, setMov] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Divergencia form
  const [showDivForm, setShowDivForm] = useState(false);
  const [divForm, setDivForm] = useState({ tipo: "cantidad", descripcion: "", cantidadDiferencia: "", pesoDiferenciaKg: "" });

  // Resolve divergence
  const [resolvingDivId, setResolvingDivId] = useState(null);
  const [resolveText, setResolveText] = useState("");

  // Anular reason
  const [showAnularDialog, setShowAnularDialog] = useState(false);
  const [anularReason, setAnularReason] = useState("");

  // Advance status comment
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [advanceComment, setAdvanceComment] = useState("");

  // Pesaje form
  const [showPesajeForm, setShowPesajeForm] = useState(false);
  const [pesajeForm, setPesajeForm] = useState({
    cantidadPesada: "", pesoBrutoKg: "", pesoTaraKg: "",
    nroTropa: "", ticketNro: "", tipoPesaje: "recepcion",
    cantidadEsperada: "", pesoEsperadoKg: "",
    balanzaNombre: "", conforme: false, observaciones: "",
  });

  const canValidate = hasPermission(currentUser, "validate_movimiento_ganado");
  const canCreate = hasPermission(currentUser, "create_movimiento_ganado");

  async function load() {
    setLoading(true);
    const data = await fetchSingleMovimiento(movimientoUuid);
    setMov(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [movimientoUuid]);

  const { scopedEstablishments: establishments, scopedCompanies: companies } = useEntityScope();
  const allCategorias = getCategorias();

  const origen = useMemo(() => establishments.find(e => e._uuid === mov?.establecimientoOrigenId), [mov, establishments]);
  const destino = useMemo(() => {
    if (mov?.destinoNombre) return { name: mov.destinoNombre };
    if (mov?.empresaDestinoId) return companies.find(c => c._uuid === mov.empresaDestinoId);
    if (mov?.establecimientoDestinoId) return establishments.find(e => e._uuid === mov.establecimientoDestinoId);
    return null;
  }, [mov, establishments, companies]);
  const status = mov ? getStatusInfo(mov.estado) : null;

  // Build category display list
  const catDisplay = useMemo(() => {
    if (!mov?.categorias?.length) return [];
    return mov.categorias.map(d => {
      const cat = allCategorias.find(c => c.id === d.categoriaId);
      return {
        ...d,
        codigo: cat?.codigo || "—",
        nombre: cat?.nombre || "—",
      };
    });
  }, [mov, allCategorias]);

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
      invalidateGanadoMetrics();
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
      await advanceGanadoStatus(movimientoUuid, nextStatus.key, advanceComment || undefined);
      invalidateGanadoMetrics();
      setShowAdvanceDialog(false);
      setAdvanceComment("");
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

  async function handleResolveDivergencia(divId) {
    if (!resolveText.trim()) return;
    setActionLoading(true);
    try {
      await resolveDivergencia(divId, resolveText.trim());
      setResolvingDivId(null);
      setResolveText("");
      await load();
    } catch (err) {
      console.error("[Detail] Resolve divergence failed:", err);
    }
    setActionLoading(false);
  }

  async function handleAnular() {
    setActionLoading(true);
    try {
      await anularMovimiento(movimientoUuid, anularReason);
      invalidateGanadoMetrics();
      setShowAnularDialog(false);
      await load();
    } catch (err) {
      console.error("[Detail] Anular failed:", err);
    }
    setActionLoading(false);
  }

  async function handleAddPesaje() {
    setActionLoading(true);
    try {
      await addPesaje(movimientoUuid, {
        cantidadPesada: Number(pesajeForm.cantidadPesada),
        pesoBrutoKg: Number(pesajeForm.pesoBrutoKg),
        pesoTaraKg: pesajeForm.pesoTaraKg ? Number(pesajeForm.pesoTaraKg) : 0,
        nroTropa: pesajeForm.nroTropa || null,
        ticketNro: pesajeForm.ticketNro || null,
        tipoPesaje: pesajeForm.tipoPesaje,
        cantidadEsperada: pesajeForm.cantidadEsperada ? Number(pesajeForm.cantidadEsperada) : null,
        pesoEsperadoKg: pesajeForm.pesoEsperadoKg ? Number(pesajeForm.pesoEsperadoKg) : null,
        balanzaNombre: pesajeForm.balanzaNombre || null,
        conforme: pesajeForm.conforme,
        observaciones: pesajeForm.observaciones || null,
      });
      setShowPesajeForm(false);
      setPesajeForm({
        cantidadPesada: "", pesoBrutoKg: "", pesoTaraKg: "",
        nroTropa: "", ticketNro: "", tipoPesaje: "recepcion",
        cantidadEsperada: "", pesoEsperadoKg: "",
        balanzaNombre: "", conforme: false, observaciones: "",
      });
      await load();
    } catch (err) {
      console.error("[Detail] Add pesaje failed:", err);
    }
    setActionLoading(false);
  }

  async function handleDeletePesaje(pesajeId) {
    setActionLoading(true);
    try {
      await deletePesaje(pesajeId);
      await load();
    } catch (err) {
      console.error("[Detail] Delete pesaje failed:", err);
    }
    setActionLoading(false);
  }

  // Pesaje reconciliation summary
  const pesajeResumen = useMemo(() => {
    if (!mov?.pesajes?.length) return null;
    const totalPesado = mov.pesajes.reduce((s, p) => s + p.cantidadPesada, 0);
    const totalPesoNeto = mov.pesajes.reduce((s, p) => s + p.pesoNetoKg, 0);
    const difCantidad = totalPesado - (mov.cantidadTotal || 0);
    const difPeso = totalPesoNeto - (mov.pesoTotalKg || 0);
    const allConforme = mov.pesajes.every(p => p.conforme);
    return { totalPesado, totalPesoNeto, difCantidad, difPeso, allConforme };
  }, [mov]);

  // States where pesaje can be added
  const canAddPesaje = canCreate && mov && ["validado", "en_transito", "recibido"].includes(mov.estado);

  const formatCurrency = (val, mon) => {
    if (!val) return "—";
    const symbol = mon === "USD" ? "US$" : mon === "BRL" ? "R$" : "Gs.";
    return `${symbol} ${Number(val).toLocaleString("es-PY")}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-16">
          <div className="w-8 h-8 rounded-lg bg-[#1F2A44] inline-flex items-center justify-center shadow-lg shadow-black/20 animate-pulse mb-3 text-white">
            <BullIcon size={16} />
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
              onClick={() => setShowAdvanceDialog(true)}
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
          <p className="text-sm text-white font-semibold">{mov.cantidadTotal} cabezas</p>
          {mov.pesoTotalKg > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              Peso total: {mov.pesoTotalKg.toLocaleString("es-PY")} kg
            </p>
          )}
        </InfoCard>
      </div>

      {/* Multi-category detail table */}
      {catDisplay.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Detalle por Categoría</h3>
          <div className="bg-[#13141a] border border-white/[0.06] rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-white/[0.04] text-[10px] text-slate-500 uppercase tracking-wider font-medium">
              <span>Categoría</span>
              <span className="text-right">Cantidad</span>
              <span className="text-right">Peso (kg)</span>
              <span className="text-right">Prom. (kg)</span>
              <span className="text-right">Subtotal</span>
            </div>
            {/* Rows */}
            {catDisplay.map((d, i) => (
              <div
                key={d.id || i}
                className={`grid grid-cols-5 gap-2 px-4 py-2.5 text-xs ${i < catDisplay.length - 1 ? "border-b border-white/[0.03]" : ""}`}
              >
                <span className="text-slate-300 font-medium">{d.codigo} — {d.nombre}</span>
                <span className="text-right text-white font-semibold">{d.cantidad}</span>
                <span className="text-right text-slate-300">{d.pesoKg > 0 ? d.pesoKg.toLocaleString("es-PY") : "—"}</span>
                <span className="text-right text-slate-400">{d.pesoPromedioKg > 0 ? d.pesoPromedioKg.toLocaleString("es-PY") : "—"}</span>
                <span className="text-right text-[#C8A03A] font-semibold">
                  {d.precioSubtotal > 0 ? formatCurrency(d.precioSubtotal, mov.moneda) : "—"}
                </span>
              </div>
            ))}
            {/* Totals row */}
            <div className="grid grid-cols-5 gap-2 px-4 py-2.5 text-xs border-t border-white/[0.06] bg-white/[0.02]">
              <span className="text-slate-400 font-semibold">TOTALES</span>
              <span className="text-right text-white font-bold">{mov.cantidadTotal}</span>
              <span className="text-right text-white font-semibold">{mov.pesoTotalKg > 0 ? mov.pesoTotalKg.toLocaleString("es-PY") : "—"}</span>
              <span className="text-right text-slate-400">—</span>
              <span className="text-right text-[#C8A03A] font-bold">{formatCurrency(mov.precioTotal, mov.moneda)}</span>
            </div>
          </div>
        </div>
      )}

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

      {/* Status History */}
      {mov.statusLog?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-white mb-3">Historial de Estados</h3>
          <div className="relative pl-4">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.06]" />
            <div className="space-y-3">
              {mov.statusLog.map((log, i) => {
                const fromStatus = getStatusInfo(log.estadoAnterior);
                const toStatus = getStatusInfo(log.estadoNuevo);
                return (
                  <div key={log.id || i} className="relative flex items-start gap-3">
                    {/* Timeline dot */}
                    <div
                      className="w-3 h-3 rounded-full border-2 mt-0.5 shrink-0 -ml-[10px]"
                      style={{ borderColor: toStatus.color, backgroundColor: toStatus.color + "40" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: fromStatus.color + "15", color: fromStatus.color }}>
                          {fromStatus.icon} {fromStatus.label}
                        </span>
                        <span className="text-slate-600 text-[10px]">→</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: toStatus.color + "15", color: toStatus.color }}>
                          {toStatus.icon} {toStatus.label}
                        </span>
                      </div>
                      {log.comentario && (
                        <p className="text-xs text-slate-400 mt-0.5">{log.comentario}</p>
                      )}
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {log.changedBy} · {new Date(log.createdAt).toLocaleString("es-PY")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
                {d.resolucion && (
                  <p className="text-[10px] text-green-400/80 mt-1">Resolución: {d.resolucion}</p>
                )}
                <p className="text-[10px] text-slate-600 mt-1">Por: {d.reportadoPor} · {new Date(d.createdAt).toLocaleDateString("es-PY")}</p>

                {/* Resolve button */}
                {!d.resuelto && !isTerminal && canCreate && (
                  <>
                    {resolvingDivId === d.id ? (
                      <div className="mt-2 flex gap-2 items-end">
                        <input
                          className="flex-1 bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-1.5"
                          placeholder="Descripción de resolución..."
                          value={resolveText}
                          onChange={e => setResolveText(e.target.value)}
                        />
                        <button
                          onClick={() => handleResolveDivergencia(d.id)}
                          disabled={!resolveText.trim() || actionLoading}
                          className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-semibold rounded-lg disabled:opacity-50 shrink-0"
                        >
                          Resolver
                        </button>
                        <button
                          onClick={() => { setResolvingDivId(null); setResolveText(""); }}
                          className="px-2 py-1.5 text-slate-400 text-[10px] hover:text-white shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setResolvingDivId(d.id); setResolveText(""); }}
                        className="mt-2 text-[10px] text-green-400 hover:text-green-300 transition-colors"
                      >
                        Marcar como resuelto
                      </button>
                    )}
                  </>
                )}
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

      {/* Pesajes (weighing records) */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">
            Pesajes ({mov.pesajes?.length || 0})
          </h3>
          {canAddPesaje && (
            <button
              onClick={() => setShowPesajeForm(!showPesajeForm)}
              className="text-xs text-[#C8A03A] hover:text-[#b8922f] transition-colors"
            >
              {showPesajeForm ? "Cancelar" : "+ Registrar Pesaje"}
            </button>
          )}
        </div>

        {/* Reconciliation summary */}
        {pesajeResumen && (
          <div className={`border rounded-lg p-3 mb-3 ${
            pesajeResumen.allConforme && pesajeResumen.difCantidad === 0
              ? "bg-green-500/5 border-green-500/20"
              : "bg-yellow-500/5 border-yellow-500/20"
          }`}>
            <div className="flex items-center gap-4 flex-wrap text-xs">
              <div>
                <span className="text-slate-500">Pesado: </span>
                <span className="text-white font-semibold">{pesajeResumen.totalPesado} cab.</span>
              </div>
              <div>
                <span className="text-slate-500">Peso neto: </span>
                <span className="text-white font-medium">{pesajeResumen.totalPesoNeto.toLocaleString("es-PY")} kg</span>
              </div>
              {pesajeResumen.difCantidad !== 0 && (
                <div>
                  <span className="text-slate-500">Dif. cant.: </span>
                  <span className={pesajeResumen.difCantidad > 0 ? "text-green-400" : "text-red-400"}>
                    {pesajeResumen.difCantidad > 0 ? "+" : ""}{pesajeResumen.difCantidad}
                  </span>
                </div>
              )}
              {Math.abs(pesajeResumen.difPeso) > 1 && (
                <div>
                  <span className="text-slate-500">Dif. peso: </span>
                  <span className={pesajeResumen.difPeso > 0 ? "text-green-400" : "text-red-400"}>
                    {pesajeResumen.difPeso > 0 ? "+" : ""}{pesajeResumen.difPeso.toLocaleString("es-PY")} kg
                  </span>
                </div>
              )}
              <span className={`text-[10px] font-semibold ${pesajeResumen.allConforme ? "text-green-400" : "text-yellow-400"}`}>
                {pesajeResumen.allConforme ? "✓ Conforme" : "⚠ Pendiente"}
              </span>
            </div>
          </div>
        )}

        {/* Pesaje form */}
        {showPesajeForm && (
          <div className="bg-[#13141a] border border-white/[0.06] rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Cantidad pesada *</label>
                <input
                  className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-2"
                  type="number" min="1"
                  value={pesajeForm.cantidadPesada}
                  onChange={e => setPesajeForm(p => ({ ...p, cantidadPesada: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Peso bruto (kg) *</label>
                <input
                  className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-2"
                  type="number" min="0" step="0.01"
                  value={pesajeForm.pesoBrutoKg}
                  onChange={e => setPesajeForm(p => ({ ...p, pesoBrutoKg: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tara (kg)</label>
                <input
                  className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-2"
                  type="number" min="0" step="0.01"
                  value={pesajeForm.pesoTaraKg}
                  onChange={e => setPesajeForm(p => ({ ...p, pesoTaraKg: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tipo pesaje</label>
                <select
                  className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-2"
                  value={pesajeForm.tipoPesaje}
                  onChange={e => setPesajeForm(p => ({ ...p, tipoPesaje: e.target.value }))}
                >
                  <option value="recepcion">Recepción</option>
                  <option value="despacho">Despacho</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="verificacion">Verificación</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nro. Tropa</label>
                <input
                  className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-2"
                  value={pesajeForm.nroTropa}
                  onChange={e => setPesajeForm(p => ({ ...p, nroTropa: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ticket Nro.</label>
                <input
                  className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-2"
                  value={pesajeForm.ticketNro}
                  onChange={e => setPesajeForm(p => ({ ...p, ticketNro: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Cant. esperada (guía)</label>
                <input
                  className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-2"
                  type="number" min="0"
                  value={pesajeForm.cantidadEsperada}
                  onChange={e => setPesajeForm(p => ({ ...p, cantidadEsperada: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Peso esperado (kg)</label>
                <input
                  className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-2"
                  type="number" min="0" step="0.01"
                  value={pesajeForm.pesoEsperadoKg}
                  onChange={e => setPesajeForm(p => ({ ...p, pesoEsperadoKg: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Balanza</label>
                <input
                  className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-xs rounded-lg px-3 py-2"
                  value={pesajeForm.balanzaNombre}
                  onChange={e => setPesajeForm(p => ({ ...p, balanzaNombre: e.target.value }))}
                  placeholder="Nombre de la balanza"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pesajeForm.conforme}
                  onChange={e => setPesajeForm(p => ({ ...p, conforme: e.target.checked }))}
                  className="rounded border-white/10"
                />
                Pesaje conforme
              </label>
            </div>
            <button
              onClick={handleAddPesaje}
              disabled={!pesajeForm.cantidadPesada || !pesajeForm.pesoBrutoKg || actionLoading}
              className="px-4 py-2 bg-[#C8A03A] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
            >
              Guardar Pesaje
            </button>
          </div>
        )}

        {/* Pesaje list */}
        {mov.pesajes?.length > 0 && (
          <div className="space-y-2">
            {mov.pesajes.map(p => (
              <div key={p.id} className="bg-[#13141a] border border-white/[0.06] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] font-semibold uppercase">
                      {p.tipoPesaje}
                    </span>
                    {p.conforme ? (
                      <span className="text-[10px] text-green-400">✓ Conforme</span>
                    ) : (
                      <span className="text-[10px] text-yellow-400">Pendiente</span>
                    )}
                  </div>
                  {canAddPesaje && (
                    <button
                      onClick={() => handleDeletePesaje(p.id)}
                      disabled={actionLoading}
                      className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Cantidad: </span>
                    <span className="text-white font-semibold">{p.cantidadPesada}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Bruto: </span>
                    <span className="text-slate-300">{p.pesoBrutoKg.toLocaleString("es-PY")} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Neto: </span>
                    <span className="text-white font-medium">{p.pesoNetoKg.toLocaleString("es-PY")} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Prom: </span>
                    <span className="text-slate-300">{p.pesoPromedioKg > 0 ? p.pesoPromedioKg.toLocaleString("es-PY") : "—"} kg</span>
                  </div>
                </div>
                {/* Differences vs expected */}
                {(p.diferenciaCantidad !== null || p.diferenciaPesoKg !== null) && (
                  <div className="flex gap-3 mt-1.5 text-[10px]">
                    {p.diferenciaCantidad !== null && (
                      <span className={p.diferenciaCantidad === 0 ? "text-slate-500" : p.diferenciaCantidad > 0 ? "text-green-400" : "text-red-400"}>
                        Dif. cant: {p.diferenciaCantidad > 0 ? "+" : ""}{p.diferenciaCantidad}
                      </span>
                    )}
                    {p.diferenciaPesoKg !== null && Math.abs(p.diferenciaPesoKg) > 0.5 && (
                      <span className={p.diferenciaPesoKg > 0 ? "text-green-400" : "text-red-400"}>
                        Dif. peso: {p.diferenciaPesoKg > 0 ? "+" : ""}{p.diferenciaPesoKg.toLocaleString("es-PY")} kg
                      </span>
                    )}
                  </div>
                )}
                <div className="flex gap-3 mt-1.5 text-[10px] text-slate-600">
                  {p.nroTropa && <span>Tropa: {p.nroTropa}</span>}
                  {p.ticketNro && <span>Ticket: {p.ticketNro}</span>}
                  {p.balanzaNombre && <span>Balanza: {p.balanzaNombre}</span>}
                  <span>{p.fechaPesaje}</span>
                  {p.pesadoPor && <span>Por: {p.pesadoPor}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advance status dialog */}
      {showAdvanceDialog && nextStatus && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#13141a] border border-white/[0.06] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-sm font-bold text-white mb-3">
              Avanzar a: {nextStatus.icon} {nextStatus.label}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Opcionalmente, agregue un comentario:</p>
            <textarea
              className="w-full bg-[#0d0e14] border border-white/[0.06] text-slate-200 text-sm rounded-lg px-3 py-2 h-20 resize-none mb-4"
              value={advanceComment}
              onChange={e => setAdvanceComment(e.target.value)}
              placeholder="Comentario (opcional)..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowAdvanceDialog(false); setAdvanceComment(""); }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdvance}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#C8A03A] text-white text-sm font-semibold rounded-lg hover:bg-[#b8922f] disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
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
