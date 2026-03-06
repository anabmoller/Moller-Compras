import { useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Scale, Calendar,
  BarChart3, ArrowRight, RefreshCw, Info,
} from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import PageHeader from "../common/PageHeader";
import {
  calcRecriaPasto, calcConfinamento, calcFullLifecycle,
  RECRIA_DEFAULTS, CONFINAMENTO_DEFAULTS,
  FORMULA_VERSIONS,
} from "../../lib/cattleEconomics";

/* ── helpers ───────────────────────────────────────────────── */

function fmtUSD(n) {
  if (n == null) return "—";
  return `US$ ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function fmtPct(n) {
  if (n == null) return "—";
  return `${n.toFixed(2)}%`;
}

function fmtKg(n) {
  if (n == null) return "—";
  return `${n.toFixed(1)} kg`;
}

/* ── Shared input component ───────────────────────────────── */

function ParamInput({ label, value, onChange, suffix, step = "any" }) {
  return (
    <div>
      <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-[#0a0b0f] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-300 focus:outline-none focus:border-[#C8A03A]/40 pr-12"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Result card ──────────────────────────────────────────── */

function ResultMetric({ label, value, color, small }) {
  return (
    <div className={small ? "text-center" : ""}>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-0.5">{label}</div>
      <div className={`font-bold ${small ? "text-[14px]" : "text-[18px]"}`} style={{ color: color || "#fff" }}>
        {value}
      </div>
    </div>
  );
}

/* ── Tab selector ─────────────────────────────────────────── */

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-[12px] font-bold cursor-pointer transition-colors ${
        active
          ? "bg-[#C8A03A]/10 text-[#C8A03A] border border-[#C8A03A]/30"
          : "text-slate-400 hover:text-slate-300 hover:bg-white/[0.03]"
      }`}
    >
      {label}
    </button>
  );
}

/* ── RECRIA PASTO TAB ─────────────────────────────────────── */

function RecriaTab() {
  const [params, setParams] = useState({ ...RECRIA_DEFAULTS });
  const update = (key, val) => setParams(p => ({ ...p, [key]: val }));

  const result = useMemo(() => calcRecriaPasto(params), [params]);
  const profitable = result.lucro > 0;

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <Card hover={false} className="p-5">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
          Parámetros de Recría a Pasto
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <ParamInput label="Peso Inicial" value={params.peso_inicial} onChange={v => update('peso_inicial', v)} suffix="kg" />
          <ParamInput label="Precio Compra" value={params.preco_compra_pyg} onChange={v => update('preco_compra_pyg', v)} suffix="₲/kg" />
          <ParamInput label="Tipo Cambio" value={params.cambio} onChange={v => update('cambio', v)} suffix="₲/US$" />
          <ParamInput label="Días en Pasto" value={params.dias} onChange={v => update('dias', v)} suffix="días" />
          <ParamInput label="GMD" value={params.gmd} onChange={v => update('gmd', v)} suffix="kg/d" step="0.01" />
          <ParamInput label="Alquiler Pasto" value={params.custo_aluguel} onChange={v => update('custo_aluguel', v)} suffix="US$/m" step="0.1" />
          <ParamInput label="Costo Nutricional" value={params.custo_nutricional} onChange={v => update('custo_nutricional', v)} suffix="US$/m" step="0.1" />
          <ParamInput label="Costo Operacional" value={params.custo_operacional} onChange={v => update('custo_operacional', v)} suffix="US$/m" step="0.1" />
          <ParamInput label="Flete" value={params.frete} onChange={v => update('frete', v)} suffix="US$/cab" />
          <ParamInput label="Comisión" value={params.comissao} onChange={v => update('comissao', v)} suffix="US$/cab" />
          <ParamInput label="Interés Anual" value={params.juros_anual} onChange={v => update('juros_anual', v)} suffix="frac." step="0.005" />
          <ParamInput label="Precio Venta" value={params.preco_venda_kg} onChange={v => update('preco_venda_kg', v)} suffix="US$/kg" step="0.01" />
        </div>
        <div className="mt-2 text-[10px] text-slate-600 flex items-center gap-1">
          <Info size={10} /> Fórmula v{FORMULA_VERSIONS.RECRIA_PASTO} — sim_recria.py
        </div>
      </Card>

      {/* Results */}
      <Card hover={false} className="p-5">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
          Resultados
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <ResultMetric label="Lucro/Cabeza" value={fmtUSD(result.lucro)} color={profitable ? "#10b981" : "#ef4444"} />
          <ResultMetric label="Ingresos" value={fmtUSD(result.receita)} color="#3b82f6" />
          <ResultMetric label="Costo Total" value={fmtUSD(result.custo_total)} color="#f59e0b" />
          <ResultMetric label="ROI Período" value={fmtPct(result.roi_pct)} color={profitable ? "#10b981" : "#ef4444"} />
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-4 border-t border-white/[0.06]">
          <ResultMetric label="Peso Final" value={fmtKg(result.peso_final)} small />
          <ResultMetric label="GPV" value={fmtKg(result.gpv)} small />
          <ResultMetric label="Meses" value={result.meses.toFixed(1)} small />
          <ResultMetric label="Margen %" value={fmtPct(result.margem_periodo_pct)} color={profitable ? "#10b981" : "#ef4444"} small />
          <ResultMetric label="ROI Mensual" value={fmtPct(result.roi_mensal_pct)} small />
          <ResultMetric label="Ágio %" value={fmtPct(result.agio_pct)} color={result.agio_pct > 0 ? "#f59e0b" : "#10b981"} small />
        </div>
      </Card>
    </div>
  );
}

/* ── CONFINAMENTO TAB ─────────────────────────────────────── */

function ConfinamentoTab() {
  const [params, setParams] = useState({ ...CONFINAMENTO_DEFAULTS });
  const update = (key, val) => setParams(p => ({ ...p, [key]: val }));

  const result = useMemo(() => calcConfinamento(params), [params]);
  const profitable = result.lucro > 0;

  return (
    <div className="space-y-4">
      <Card hover={false} className="p-5">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
          Parámetros de Confinamiento
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <ParamInput label="Peso Inicial" value={params.peso_inicial} onChange={v => update('peso_inicial', v)} suffix="kg" />
          <ParamInput label="Ganancia/Día" value={params.ganho_dia} onChange={v => update('ganho_dia', v)} suffix="kg/d" step="0.01" />
          <ParamInput label="Días Conf." value={params.dias} onChange={v => update('dias', v)} suffix="días" />
          <ParamInput label="Rend. Inicial" value={params.rendimento_ini} onChange={v => update('rendimento_ini', v)} suffix="frac." step="0.01" />
          <ParamInput label="Rend. Final" value={params.rendimento_fim} onChange={v => update('rendimento_fim', v)} suffix="frac." step="0.01" />
          <ParamInput label="Precio Compra" value={params.preco_compra_kg} onChange={v => update('preco_compra_kg', v)} suffix="US$/kg" step="0.1" />
          <ParamInput label="Precio Venta" value={params.preco_venda_kg} onChange={v => update('preco_venda_kg', v)} suffix="US$/kg" step="0.1" />
          <ParamInput label="Diaria" value={params.diaria} onChange={v => update('diaria', v)} suffix="US$/d" step="0.1" />
          <ParamInput label="Servicios Op." value={params.servicos_operacionais} onChange={v => update('servicos_operacionais', v)} suffix="US$/d" step="0.1" />
          <ParamInput label="Extras" value={params.custos_extras} onChange={v => update('custos_extras', v)} suffix="US$" />
          <ParamInput label="Interés Mes" value={params.juros_mes} onChange={v => update('juros_mes', v)} suffix="frac." step="0.001" />
        </div>
        <div className="mt-2 text-[10px] text-slate-600 flex items-center gap-1">
          <Info size={10} /> Fórmula v{FORMULA_VERSIONS.CONFINAMENTO} — analise-confinamento/App.py
        </div>
      </Card>

      <Card hover={false} className="p-5">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
          Resultados
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <ResultMetric label="Lucro/Cabeza" value={fmtUSD(result.lucro)} color={profitable ? "#10b981" : "#ef4444"} />
          <ResultMetric label="Ingresos" value={fmtUSD(result.receita)} color="#3b82f6" />
          <ResultMetric label="Costo Total" value={fmtUSD(result.custo_total)} color="#f59e0b" />
          <ResultMetric label="ROI Período" value={fmtPct(result.roi_pct)} color={profitable ? "#10b981" : "#ef4444"} />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-4 border-t border-white/[0.06]">
          <ResultMetric label="Peso Final" value={fmtKg(result.peso_final)} small />
          <ResultMetric label="Carcasa Final" value={fmtKg(result.carcaca_final)} small />
          <ResultMetric label="Ganho Carcasa" value={fmtKg(result.ganho_carcaca)} small />
          <ResultMetric label="Margen %" value={fmtPct(result.margem_lucro_pct)} color={profitable ? "#10b981" : "#ef4444"} small />
          <ResultMetric label="ROI Mensual" value={fmtPct(result.roi_mensal_pct)} small />
          <ResultMetric label="Carcasa/día" value={`${result.carcaca_dia.toFixed(3)} kg`} small />
        </div>
      </Card>
    </div>
  );
}

/* ── LIFECYCLE TAB ────────────────────────────────────────── */

function LifecycleTab() {
  const [recriaParams, setRecriaParams] = useState({ ...RECRIA_DEFAULTS });
  const [confParams, setConfParams] = useState({ ...CONFINAMENTO_DEFAULTS });

  const result = useMemo(
    () => calcFullLifecycle(recriaParams, confParams, {}),
    [recriaParams, confParams]
  );
  const profitable = result.total_lucro > 0;

  const updateR = (key, val) => setRecriaParams(p => ({ ...p, [key]: val }));
  const updateC = (key, val) => setConfParams(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-4">
      {/* Combined main results */}
      <Card hover={false} className="p-5">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          Resultado Ciclo Completo
          <Badge variant={profitable ? "success" : "error"} size="xs" dot>
            {profitable ? "Rentable" : "No rentable"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <ResultMetric label="Lucro Total" value={fmtUSD(result.total_lucro)} color={profitable ? "#10b981" : "#ef4444"} />
          <ResultMetric label="Ingresos" value={fmtUSD(result.total_revenue)} color="#3b82f6" />
          <ResultMetric label="Costo Total" value={fmtUSD(result.total_cost)} color="#f59e0b" />
          <ResultMetric label="ROI Ciclo" value={fmtPct(result.roi_lifecycle_pct)} color={profitable ? "#10b981" : "#ef4444"} />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.06]">
          <ResultMetric label="Días Totales" value={result.total_dias} small />
          <ResultMetric label="Meses Totales" value={result.total_meses.toFixed(1)} small />
          <ResultMetric label="ROI Mensual" value={fmtPct(result.roi_lifecycle_mensal_pct)} small />
        </div>
      </Card>

      {/* Phase breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recria phase */}
        <Card hover={false} className="p-4">
          <div className="text-[10px] font-bold text-[#C8A03A] uppercase tracking-widest mb-3">
            Fase 1: Recría a Pasto
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <ParamInput label="Peso Inicial" value={recriaParams.peso_inicial} onChange={v => updateR('peso_inicial', v)} suffix="kg" />
            <ParamInput label="Días" value={recriaParams.dias} onChange={v => updateR('dias', v)} suffix="días" />
            <ParamInput label="GMD" value={recriaParams.gmd} onChange={v => updateR('gmd', v)} suffix="kg/d" step="0.01" />
            <ParamInput label="Precio Venta" value={recriaParams.preco_venda_kg} onChange={v => updateR('preco_venda_kg', v)} suffix="US$/kg" step="0.01" />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
            <ResultMetric label="Lucro" value={fmtUSD(result.recria.lucro)} color={result.recria.lucro > 0 ? "#10b981" : "#ef4444"} small />
            <ResultMetric label="Peso Final" value={fmtKg(result.recria.peso_final)} small />
            <ResultMetric label="ROI" value={fmtPct(result.recria.roi_pct)} small />
          </div>
        </Card>

        {/* Confinamento phase */}
        <Card hover={false} className="p-4">
          <div className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-3">
            Fase 2: Confinamiento
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <ParamInput label="Ganancia/Día" value={confParams.ganho_dia} onChange={v => updateC('ganho_dia', v)} suffix="kg/d" step="0.01" />
            <ParamInput label="Días" value={confParams.dias} onChange={v => updateC('dias', v)} suffix="días" />
            <ParamInput label="Diaria" value={confParams.diaria} onChange={v => updateC('diaria', v)} suffix="US$/d" step="0.1" />
            <ParamInput label="Precio Venta" value={confParams.preco_venda_kg} onChange={v => updateC('preco_venda_kg', v)} suffix="US$/kg" step="0.1" />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
            <ResultMetric label="Lucro" value={fmtUSD(result.confinamento.lucro)} color={result.confinamento.lucro > 0 ? "#10b981" : "#ef4444"} small />
            <ResultMetric label="Carcasa" value={fmtKg(result.confinamento.carcaca_final)} small />
            <ResultMetric label="ROI" value={fmtPct(result.confinamento.roi_pct)} small />
          </div>
        </Card>
      </div>

      <div className="text-[10px] text-slate-600 flex items-center gap-1 px-1">
        <Info size={10} /> Fórmula v{FORMULA_VERSIONS.FULL_LIFECYCLE} — El peso final de recría alimenta automáticamente el confinamiento
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */

export default function CattleEconomicsScreen({ onBack, onNavigate }) {
  const [tab, setTab] = useState("recria");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      <PageHeader
        title="Economía Ganadera"
        subtitle="Simulación de rentabilidad — Recría, Confinamiento, Ciclo Completo"
        onBack={onBack}
      />

      {/* Tab selector */}
      <div className="flex gap-2 mt-5 mb-6 overflow-x-auto scrollbar-hide px-5 sm:px-0">
        <TabButton label="Recría a Pasto" active={tab === "recria"} onClick={() => setTab("recria")} />
        <TabButton label="Confinamiento" active={tab === "confinamento"} onClick={() => setTab("confinamento")} />
        <TabButton label="Ciclo Completo" active={tab === "lifecycle"} onClick={() => setTab("lifecycle")} />
      </div>

      <div className="px-5 sm:px-0">
        {tab === "recria" && <RecriaTab />}
        {tab === "confinamento" && <ConfinamentoTab />}
        {tab === "lifecycle" && <LifecycleTab />}
      </div>
    </div>
  );
}
