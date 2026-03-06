import { useState, useEffect, useCallback } from "react";
import {
  Truck, FileText, CheckCircle2, AlertTriangle, Clock,
  Calendar, Scale, BarChart3, ChevronRight,
} from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import PageHeader from "../common/PageHeader";
import { getSlaughterShipments, getProfitabilityRecords, getSupplierScores } from "../../lib/slaughterService";

/* ── helpers ───────────────────────────────────────────────── */

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PY", { day: "numeric", month: "short", year: "numeric" });
}

function fmtNumber(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  return String(Math.round(n * 100) / 100);
}

const STATUS_MAP = {
  planned:   { label: "Planificado", variant: "default" },
  in_transit: { label: "En tránsito", variant: "warning" },
  at_plant:  { label: "En planta", variant: "info" },
  audited:   { label: "Auditado", variant: "success" },
  completed: { label: "Completado", variant: "success" },
  cancelled: { label: "Cancelado", variant: "error" },
};

/* ── Sub-components ─────────────────────────────────────────── */

function ShipmentRow({ shipment }) {
  const s = STATUS_MAP[shipment.status] || { label: shipment.status, variant: "default" };
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors">
      <span className="shrink-0"><Truck size={16} className="text-slate-500" /></span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-white truncate">
            {shipment.batch?.batch_code || "—"} — {shipment.head_count || 0} cab.
          </span>
          <Badge variant={s.variant} size="xs">{s.label}</Badge>
        </div>
        <div className="text-[11px] text-slate-500">
          {fmtDate(shipment.planned_date)}
          {shipment.destination_plant ? ` · ${shipment.destination_plant}` : ""}
          {shipment.guide_number ? ` · Guía: ${shipment.guide_number}` : ""}
        </div>
      </div>
    </div>
  );
}

function ProfitRow({ record }) {
  const profitable = record.profit > 0;
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors">
      <span className="shrink-0">
        <BarChart3 size={16} className={profitable ? "text-emerald-400" : "text-red-400"} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {record.scope_type}: {record.scope_id?.slice(0, 8) || "—"} · {record.formula_type}
        </div>
        <div className="text-[11px] text-slate-500">
          {fmtDate(record.computed_at)} · {record.is_actual ? "Real" : "Proyección"}
        </div>
      </div>
      <div className={`text-[12px] font-bold ${profitable ? "text-emerald-400" : "text-red-400"}`}>
        US$ {fmtNumber(record.profit)}
      </div>
    </div>
  );
}

function SupplierScoreRow({ score }) {
  const color = score.overall_score >= 80 ? "#10b981" : score.overall_score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors">
      <span className="shrink-0"><FileText size={16} className="text-slate-500" /></span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {score.supplier?.name || "—"}
        </div>
        <div className="text-[11px] text-slate-500">
          {fmtDate(score.period_start)} – {fmtDate(score.period_end)}
          {score.total_head ? ` · ${score.total_head} cab.` : ""}
        </div>
      </div>
      <div className="text-[14px] font-bold" style={{ color }}>
        {score.overall_score?.toFixed(0) || "—"}
      </div>
    </div>
  );
}

function SkeletonRows({ count = 3 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="flex items-center gap-3 px-4 py-3">
      <span className="w-4 h-4 bg-white/[0.04] rounded animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <span className="block w-3/4 h-3 bg-white/[0.04] rounded animate-pulse" />
        <span className="block w-1/2 h-2.5 bg-white/[0.04] rounded animate-pulse" />
      </div>
    </div>
  ));
}

/* ── Main component ─────────────────────────────────────────── */

export default function SlaughterScreen({ onBack }) {
  const [shipments, setShipments] = useState([]);
  const [profitRecords, setProfitRecords] = useState([]);
  const [scores, setScores] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [loadingProfit, setLoadingProfit] = useState(true);
  const [loadingScores, setLoadingScores] = useState(true);

  useEffect(() => {
    getSlaughterShipments({ limit: 10 })
      .then(d => { setShipments(d); setLoadingShipments(false); })
      .catch(() => { setShipments([]); setLoadingShipments(false); });

    getProfitabilityRecords({ limit: 10 })
      .then(d => { setProfitRecords(d); setLoadingProfit(false); })
      .catch(() => { setProfitRecords([]); setLoadingProfit(false); });

    getSupplierScores({ limit: 10 })
      .then(d => { setScores(d); setLoadingScores(false); })
      .catch(() => { setScores([]); setLoadingScores(false); });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      <PageHeader
        title="Faena"
        subtitle="Envíos, auditoría, rentabilidad y scoring de proveedores"
        onBack={onBack}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6 px-5 sm:px-0">
        {/* Shipments */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Envíos a Faena
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
            {loadingShipments ? <SkeletonRows count={4} /> :
              shipments.length > 0 ? shipments.map(s => <ShipmentRow key={s.id} shipment={s} />) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-500">Sin envíos registrados</p>
                </div>
              )}
          </Card>
        </div>

        {/* Supplier Scores */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Scoring de Proveedores Ganaderos
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
            {loadingScores ? <SkeletonRows count={4} /> :
              scores.length > 0 ? scores.map(s => <SupplierScoreRow key={s.id} score={s} />) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-500">Sin evaluaciones de proveedores</p>
                </div>
              )}
          </Card>
        </div>
      </div>

      {/* Profitability Records */}
      <div className="mt-4 px-5 sm:px-0">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
          Registros de Rentabilidad
        </div>
        <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
          {loadingProfit ? <SkeletonRows count={3} /> :
            profitRecords.length > 0 ? profitRecords.map(r => <ProfitRow key={r.id} record={r} />) : (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500">Sin registros de rentabilidad</p>
                <p className="text-xs text-slate-600 mt-1">Usá el simulador de Economía Ganadera para calcular</p>
              </div>
            )}
        </Card>
      </div>
    </div>
  );
}
