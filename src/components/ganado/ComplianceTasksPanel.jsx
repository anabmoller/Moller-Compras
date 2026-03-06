import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, AlertTriangle, Clock, Calendar, Shield,
  FileText, Filter, MapPin, ChevronRight,
} from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import PageHeader from "../common/PageHeader";
import { ESTABLECIMIENTOS_PROPIOS } from "../../constants/establecimientos";
import { getComplianceTasks, completeComplianceTask } from "../../lib/hacendaService";
import { useAuth } from "../../context/AuthContext";

/* ── helpers ───────────────────────────────────────────────── */

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PY", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

const TASK_TYPE_LABELS = {
  siap_verification: "Verificación SIAP",
  senacsa_protocol: "Protocolo SENACSA",
  guide_expiry: "Vencimiento Guía",
  vaccination: "Vacunación",
  health_check: "Control Sanitario",
  weight_check: "Pesaje de Control",
  movement_report: "Reporte de Movimiento",
  audit: "Auditoría",
  other: "Otro",
};

const TASK_TYPE_ICONS = {
  siap_verification: <Shield size={16} />,
  senacsa_protocol: <FileText size={16} />,
  guide_expiry: <AlertTriangle size={16} />,
  vaccination: <CheckCircle2 size={16} />,
  health_check: <CheckCircle2 size={16} />,
  weight_check: <CheckCircle2 size={16} />,
  movement_report: <FileText size={16} />,
  audit: <Shield size={16} />,
};

const STATUS_CONFIG = {
  pending:   { label: "Pendiente", variant: "warning", icon: <Clock size={12} /> },
  overdue:   { label: "Vencida", variant: "error", icon: <AlertTriangle size={12} /> },
  completed: { label: "Completada", variant: "success", icon: <CheckCircle2 size={12} /> },
};

/* ── Sub-components ─────────────────────────────────────────── */

function KpiCard({ label, value, icon, color, loading }) {
  return (
    <div className="bg-[#13141a] border border-white/[0.06] rounded-xl p-4 flex-1 min-w-[120px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: color || "#fff" }}>
        {loading ? (
          <span className="inline-block w-12 h-7 bg-white/[0.04] rounded animate-pulse" />
        ) : value}
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-[5px] rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
        active
          ? "bg-[#1F2A44]/10 text-[#C8A03A] border-2 border-[#C8A03A]"
          : "bg-[#F8F9FB]/[0.03] text-slate-400 border border-white/[0.06] hover:bg-[#F8F9FB]/[0.06]"
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
          active ? "bg-[#C8A03A]/20 text-[#C8A03A]" : "bg-white/[0.06] text-slate-500"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function TaskRow({ task, onComplete }) {
  const days = daysUntil(task.due_date);
  const isOverdue = days !== null && days < 0 && task.status !== "completed";
  const isUrgent = days !== null && days >= 0 && days <= 3 && task.status !== "completed";
  const effectiveStatus = isOverdue ? "overdue" : task.status;
  const cfg = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.pending;
  const typeIcon = TASK_TYPE_ICONS[task.task_type] || <FileText size={16} />;
  const [completing, setCompleting] = useState(false);

  const handleComplete = async (e) => {
    e.stopPropagation();
    setCompleting(true);
    try {
      await onComplete(task.id);
    } catch (err) {
      console.error("[Compliance] complete error:", err);
    }
    setCompleting(false);
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors ${
      isOverdue ? "bg-red-500/[0.03]" : isUrgent ? "bg-amber-500/[0.03]" : ""
    }`}>
      <span className={`shrink-0 ${isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-slate-500"}`}>
        {typeIcon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-white truncate">
            {TASK_TYPE_LABELS[task.task_type] || task.task_type}
          </span>
          <Badge variant={cfg.variant} size="xs" dot>{cfg.label}</Badge>
        </div>
        <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3">
          <span className="flex items-center gap-1">
            <Calendar size={10} /> Vence: {fmtDate(task.due_date)}
          </span>
          {days !== null && task.status !== "completed" && (
            <span className={`flex items-center gap-1 font-medium ${
              isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-slate-400"
            }`}>
              {isOverdue ? `${Math.abs(days)}d vencida` : `${days}d restantes`}
            </span>
          )}
          {task.establishment_id && (
            <span className="flex items-center gap-1">
              <MapPin size={10} /> {task.establishment_id}
            </span>
          )}
        </div>
        {task.description && (
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">{task.description}</div>
        )}
      </div>

      {task.status !== "completed" && (
        <button
          onClick={handleComplete}
          disabled={completing}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        >
          {completing ? "..." : "Completar"}
        </button>
      )}
    </div>
  );
}

function SkeletonRows({ count = 4 }) {
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

export default function ComplianceTasksPanel({ onBack, onNavigate }) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterEst, setFilterEst] = useState("todos");

  const estId = filterEst === "todos" ? null : filterEst;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { limit: 100 };
      if (filterStatus === "pending") filters.status = "pending";
      if (filterStatus === "completed") filters.status = "completed";
      if (filterStatus === "overdue") filters.overdue = true;
      if (estId) filters.establishmentId = estId;

      const data = await getComplianceTasks(filters);
      setTasks(data);
    } catch (err) {
      console.error("[Compliance] fetch error:", err);
      setTasks([]);
    }
    setLoading(false);
  }, [filterStatus, estId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleComplete = async (taskId) => {
    await completeComplianceTask(taskId, currentUser?.id);
    fetchTasks();
  };

  // Count tasks by effective status for filter pills
  const overdueCount = tasks.filter(t => {
    const d = daysUntil(t.due_date);
    return d !== null && d < 0 && t.status !== "completed";
  }).length;
  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <PageHeader
          title="Cumplimiento Regulatorio"
          subtitle="SENACSA, SIAP y tareas de verificación"
          onBack={onBack}
        />
        <div className="flex items-center gap-1.5 px-5 sm:px-0">
          <div className="relative">
            <select
              value={filterEst}
              onChange={(e) => setFilterEst(e.target.value)}
              className="appearance-none bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-lg pl-3 pr-8 py-1.5 text-[11px] font-semibold text-slate-300 cursor-pointer hover:bg-[#F8F9FB]/[0.06] hover:border-white/[0.12] transition-colors focus:outline-none focus:border-[#C8A03A]/40"
            >
              <option value="todos">Todos</option>
              {ESTABLECIMIENTOS_PROPIOS.map((e) => (
                <option key={e.key} value={e.key}>{e.nombre}</option>
              ))}
            </select>
            <svg className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-5 scrollbar-hide px-5 sm:px-0">
        <KpiCard
          label="Pendientes"
          value={loading ? 0 : pendingCount}
          icon={<Clock size={18} />}
          color="#f59e0b"
          loading={loading}
        />
        <KpiCard
          label="Vencidas"
          value={loading ? 0 : overdueCount}
          icon={<AlertTriangle size={18} />}
          color={overdueCount > 0 ? "#ef4444" : "#10b981"}
          loading={loading}
        />
        <KpiCard
          label="Completadas"
          value={loading ? 0 : completedCount}
          icon={<CheckCircle2 size={18} />}
          color="#10b981"
          loading={loading}
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide px-5 sm:px-0">
        <FilterPill label="Pendientes" active={filterStatus === "pending"} onClick={() => setFilterStatus("pending")} />
        <FilterPill label="Vencidas" active={filterStatus === "overdue"} onClick={() => setFilterStatus("overdue")} />
        <FilterPill label="Completadas" active={filterStatus === "completed"} onClick={() => setFilterStatus("completed")} />
        <FilterPill label="Todas" active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
      </div>

      {/* Task list */}
      <div className="px-5 sm:px-0">
        <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
          {loading ? (
            <SkeletonRows count={5} />
          ) : tasks.length > 0 ? (
            tasks.map(t => (
              <TaskRow key={t.id} task={t} onComplete={handleComplete} />
            ))
          ) : (
            <div className="p-8 text-center">
              <Shield size={32} className="text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                {filterStatus === "overdue"
                  ? "Sin tareas vencidas"
                  : filterStatus === "completed"
                  ? "Sin tareas completadas"
                  : "Sin tareas pendientes"}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Las tareas se crean automáticamente al registrar movimientos y guías
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Count footer */}
      {!loading && tasks.length > 0 && (
        <div className="text-center mt-4 px-5 sm:px-0">
          <span className="text-[11px] text-slate-600">
            {tasks.length} tarea{tasks.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
