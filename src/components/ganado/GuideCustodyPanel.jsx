import { useState, useEffect, useCallback } from "react";
import {
  FileText, User, ArrowRight, Clock, CheckCircle2,
  AlertTriangle, Plus, MapPin, Shield,
} from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import PageHeader from "../common/PageHeader";
import { getGuideCustodyChain, recordCustodyTransfer } from "../../lib/hacendaService";
import { useAuth } from "../../context/AuthContext";

/* ── helpers ───────────────────────────────────────────────── */

function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PY", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const ROLE_LABELS = {
  chofer: "Chofer",
  capataz: "Capataz",
  admin_campo: "Admin. Campo",
  admin_santiago: "Admin. Santiago",
  veterinario: "Veterinario",
  senacsa: "SENACSA",
  otro: "Otro",
};

const ROLE_COLORS = {
  chofer: "#8b5cf6",
  capataz: "#f59e0b",
  admin_campo: "#3b82f6",
  admin_santiago: "#10b981",
  veterinario: "#ef4444",
  senacsa: "#06b6d4",
};

/* ── Sub-components ─────────────────────────────────────────── */

function CustodyNode({ event, isFirst, isLast }) {
  const roleColor = ROLE_COLORS[event.to_role] || "#94a3b8";

  return (
    <div className="relative flex gap-3">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className="w-3 h-3 rounded-full border-2 shrink-0 z-10"
          style={{ borderColor: roleColor, backgroundColor: isLast ? roleColor : "transparent" }}
        />
        {!isLast && (
          <div className="w-px flex-1 bg-white/[0.08] min-h-[40px]" />
        )}
      </div>

      {/* Content */}
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-bold text-white">
            {event.to_person}
          </span>
          <Badge variant="default" size="xs">
            {ROLE_LABELS[event.to_role] || event.to_role}
          </Badge>
        </div>
        <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3">
          <span className="flex items-center gap-1">
            <Clock size={10} /> {fmtDateTime(event.event_date)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin size={10} /> {event.location}
            </span>
          )}
        </div>
        {event.notes && (
          <div className="text-[11px] text-slate-400 mt-1 italic">{event.notes}</div>
        )}
        {event.from_person && (
          <div className="text-[10px] text-slate-600 mt-0.5">
            Recibido de: {event.from_person} ({ROLE_LABELS[event.from_role] || event.from_role})
          </div>
        )}
      </div>
    </div>
  );
}

function TransferForm({ movimientoId, currentHolder, onTransferred }) {
  const { currentUser } = useAuth();
  const [toPerson, setToPerson] = useState("");
  const [toRole, setToRole] = useState("capataz");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!toPerson.trim()) return;
    setSubmitting(true);
    try {
      await recordCustodyTransfer({
        movimiento_id: movimientoId,
        from_person: currentHolder?.to_person || null,
        from_role: currentHolder?.to_role || null,
        to_person: toPerson.trim(),
        to_role: toRole,
        event_date: new Date().toISOString(),
        location: location.trim() || null,
        notes: notes.trim() || null,
        recorded_by: currentUser?.id,
      });
      setToPerson("");
      setLocation("");
      setNotes("");
      onTransferred?.();
    } catch (err) {
      console.error("[GuideCustody] transfer error:", err);
    }
    setSubmitting(false);
  };

  return (
    <Card hover={false} className="p-4">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Plus size={12} /> Registrar Transferencia
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">
            Persona que recibe *
          </label>
          <input
            value={toPerson}
            onChange={(e) => setToPerson(e.target.value)}
            placeholder="Nombre completo"
            className="w-full bg-[#0a0b0f] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-300 focus:outline-none focus:border-[#C8A03A]/40"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">
            Rol
          </label>
          <select
            value={toRole}
            onChange={(e) => setToRole(e.target.value)}
            className="w-full bg-[#0a0b0f] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-300 focus:outline-none focus:border-[#C8A03A]/40"
          >
            {Object.entries(ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">
            Ubicación
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Oficina, campo, etc."
            className="w-full bg-[#0a0b0f] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-300 focus:outline-none focus:border-[#C8A03A]/40"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">
            Observaciones
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas opcionales"
            className="w-full bg-[#0a0b0f] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-300 focus:outline-none focus:border-[#C8A03A]/40"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!toPerson.trim() || submitting}
        className={`mt-3 w-full py-2.5 rounded-xl font-bold text-[12px] transition-colors ${
          toPerson.trim() && !submitting
            ? "bg-[#C8A03A] text-black hover:bg-[#d4ad48] cursor-pointer"
            : "bg-white/[0.04] text-slate-600 cursor-not-allowed"
        }`}
      >
        {submitting ? "Registrando..." : "Registrar Transferencia"}
      </button>
    </Card>
  );
}

/* ── Main component ─────────────────────────────────────────── */

export default function GuideCustodyPanel({ movimientoId, guideNumber, onBack }) {
  const [chain, setChain] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChain = useCallback(async () => {
    if (!movimientoId) return;
    setLoading(true);
    try {
      const data = await getGuideCustodyChain(movimientoId);
      setChain(data);
    } catch (err) {
      console.error("[GuideCustody] fetch error:", err);
      setChain([]);
    }
    setLoading(false);
  }, [movimientoId]);

  useEffect(() => { fetchChain(); }, [fetchChain]);

  const currentHolder = chain.length > 0 ? chain[chain.length - 1] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <PageHeader
        title="Custodia de Guía"
        subtitle={guideNumber ? `Guía N° ${guideNumber}` : "Cadena de custodia del documento físico"}
        onBack={onBack}
      />

      <div className="space-y-4 mt-6 px-5 sm:px-0">
        {/* Current holder banner */}
        {currentHolder && (
          <div className="bg-[#C8A03A]/[0.06] border border-[#C8A03A]/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C8A03A]/10 flex items-center justify-center shrink-0">
              <Shield size={20} className="text-[#C8A03A]" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                Custodia Actual
              </div>
              <div className="text-[14px] font-bold text-white">
                {currentHolder.to_person}
              </div>
              <div className="text-[11px] text-slate-400">
                {ROLE_LABELS[currentHolder.to_role] || currentHolder.to_role}
                {currentHolder.location ? ` — ${currentHolder.location}` : ""}
              </div>
            </div>
          </div>
        )}

        {/* Custody chain timeline */}
        <Card hover={false} className="p-5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <FileText size={12} /> Historial de Custodia
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-3 h-3 bg-white/[0.04] rounded-full animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <span className="block w-1/3 h-3 bg-white/[0.04] rounded animate-pulse" />
                    <span className="block w-1/2 h-2.5 bg-white/[0.04] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : chain.length > 0 ? (
            <div>
              {chain.map((event, i) => (
                <CustodyNode
                  key={event.id || i}
                  event={event}
                  isFirst={i === 0}
                  isLast={i === chain.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield size={32} className="text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Sin registros de custodia</p>
              <p className="text-xs text-slate-600 mt-1">
                Registrá la primera transferencia para iniciar la cadena
              </p>
            </div>
          )}
        </Card>

        {/* Transfer form */}
        <TransferForm
          movimientoId={movimientoId}
          currentHolder={currentHolder}
          onTransferred={fetchChain}
        />
      </div>
    </div>
  );
}
