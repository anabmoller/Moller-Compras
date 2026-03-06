/**
 * CustomTab — Tab 6: Mis Analisis
 * CreateAnalysisModal, CustomChart renderer, CustomTab listing
 */
import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import Card from '../shared/Card';
import {
  C, GRID, TICK, TICK_DIM,
  CHART_TYPES, DIMENSIONS, METRICS, PERIODS,
  generateSampleData,
} from './analysisData';
import { DarkTooltip, ChartCard, legendFmt } from './ChartComponents';

/* ------------------------------------------------------------------ */
/*  CREATE ANALYSIS MODAL                                              */
/* ------------------------------------------------------------------ */
export function CreateAnalysisModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [dimension, setDimension] = useState('establecimiento');
  const [metric, setMetric] = useState('monto');
  const [period, setPeriod] = useState('Q1 2026');

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({
      id: Date.now(),
      title: title.trim(),
      chartType,
      dimension,
      metric,
      period,
      data: generateSampleData(dimension, metric),
    });
    onClose();
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-sm text-white outline-none focus:border-[#C8A03A]/50";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1.5 tracking-wide";

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center px-5">
      <div className="bg-[var(--color-modal)] rounded-2xl max-w-[420px] w-full shadow-xl border border-[var(--color-border)]">
        <div className="px-5 pt-5 pb-3 flex justify-between items-center border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold text-white">Nuevo Analisis</h3>
          <button onClick={onClose} className="bg-[#F8F9FB]/[0.06] border-none w-8 h-8 rounded-lg cursor-pointer text-base text-white flex items-center justify-center">
            ✕
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div>
            <label className={labelCls}>Titulo</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Compras por establecimiento Q1" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tipo de grafico</label>
            <div className="flex gap-2">
              {CHART_TYPES.map(ct => (
                <button
                  key={ct.key}
                  onClick={() => setChartType(ct.key)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                    chartType === ct.key
                      ? 'bg-[#1F2A44]/[0.12] text-[#C8A03A] border-[#C8A03A]/30'
                      : 'bg-[#F8F9FB]/[0.03] text-slate-400 border-white/[0.06]'
                  }`}
                >
                  {ct.icon} {ct.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={labelCls}>Dimension (eje X)</label>
              <select value={dimension} onChange={e => setDimension(e.target.value)} className={inputCls}>
                {DIMENSIONS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className={labelCls}>Metrica (eje Y)</label>
              <select value={metric} onChange={e => setMetric(e.target.value)} className={inputCls}>
                {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Periodo</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className={inputCls}>
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/[0.06] bg-[#F8F9FB]/[0.03] text-white text-[13px] font-semibold cursor-pointer">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className={`flex-1 py-3 rounded-xl border-none text-[13px] font-semibold ${
              title.trim()
                ? 'bg-gradient-to-br from-[#1F2A44] to-[#C8A03A] text-white cursor-pointer'
                : 'bg-[#F8F9FB]/[0.06] text-slate-500 cursor-default'
            }`}
          >
            Crear Analisis
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SINGLE CUSTOM CHART RENDERER                                       */
/* ------------------------------------------------------------------ */
function CustomChart({ analysis, onRemove }) {
  const metricLabel = METRICS.find(m => m.key === analysis.metric)?.label || analysis.metric;
  const PIE_COLORS = [C.emerald, C.blue, C.amber, C.purple, C.orange, C.cyan, C.pink, C.red, C.slate, C.emeraldDim, C.blueDim, C.amberDim];

  return (
    <ChartCard title={analysis.title} subtitle={`${metricLabel} · ${analysis.period}`}>
      <ResponsiveContainer width="100%" height={260}>
        {analysis.chartType === 'bar' ? (
          <BarChart data={analysis.data}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="name" tick={{ ...TICK, fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={TICK_DIM} />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="value" name={metricLabel} radius={[4, 4, 0, 0]}>
              {analysis.data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        ) : analysis.chartType === 'line' ? (
          <LineChart data={analysis.data}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="name" tick={TICK} />
            <YAxis tick={TICK_DIM} />
            <Tooltip content={<DarkTooltip />} />
            <Line type="monotone" dataKey="value" name={metricLabel} stroke={C.emerald}
              strokeWidth={2.5} dot={{ r: 3, fill: C.emerald }} activeDot={{ r: 5 }} />
          </LineChart>
        ) : analysis.chartType === 'area' ? (
          <AreaChart data={analysis.data}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="name" tick={TICK} />
            <YAxis tick={TICK_DIM} />
            <Tooltip content={<DarkTooltip />} />
            <Area type="monotone" dataKey="value" name={metricLabel} stroke={C.blue}
              fill={C.blue} fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        ) : (
          <PieChart>
            <Pie data={analysis.data} dataKey="value" nameKey="name" cx="50%" cy="50%"
              outerRadius={85} innerRadius={48} paddingAngle={3} strokeWidth={0}>
              {analysis.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<DarkTooltip />} />
            <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
          </PieChart>
        )}
      </ResponsiveContainer>
      <button
        onClick={() => onRemove(analysis.id)}
        className="mt-2 text-[11px] text-red-400 bg-transparent border-none cursor-pointer opacity-50 hover:opacity-100"
      >
        Eliminar analisis
      </button>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  CUSTOM TAB                                                         */
/* ------------------------------------------------------------------ */
export default function CustomTab({ analyses, onRemove, onAdd }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {analyses.length === 0 ? (
        <Card hover={false} className="p-8 text-center">
          <div className="text-3xl mb-2"><BarChart3 size={32} className="text-slate-400 mx-auto" /></div>
          <div className="text-sm text-slate-400 font-medium">No hay analisis personalizados</div>
          <div className="text-xs text-slate-500 mt-1 mb-4">Crea tu primer analisis con el boton de arriba</div>
          <button
            onClick={onAdd}
            className="bg-gradient-to-br from-[#1F2A44] to-[#C8A03A] text-white border-none rounded-lg px-5 py-2.5 text-xs font-semibold cursor-pointer"
          >
            + Nuevo Analisis
          </button>
        </Card>
      ) : (
        <>
          {analyses.map(a => (
            <CustomChart key={a.id} analysis={a} onRemove={onRemove} />
          ))}
          <button
            onClick={onAdd}
            className="w-full py-3.5 rounded-xl border border-dashed border-[#C8A03A]/25 bg-[#1F2A44]/[0.04] text-[#C8A03A] text-[13px] font-semibold cursor-pointer"
          >
            + Nuevo Analisis
          </button>
        </>
      )}
    </div>
  );
}
