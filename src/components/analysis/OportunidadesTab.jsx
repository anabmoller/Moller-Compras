/**
 * OportunidadesTab — Tab 4: Oportunidades
 * Savings treemap, budget vs actual bar, priority actions table
 */
import { useMemo } from 'react';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Treemap,
} from 'recharts';
import Badge from '../shared/Badge';
import { C, GRID, TICK, TICK_DIM } from './analysisData';
import { DarkTooltip, ChartCard, TreemapContent, legendFmt } from './ChartComponents';

export default function OportunidadesTab() {
  const savingsTree = useMemo(() => [
    { name: 'Maiz forward', ahorro: 850, fill: C.emerald },
    { name: 'Diesel contrato', ahorro: 620, fill: C.emeraldDim },
    { name: 'Burlanda alt.', ahorro: 480, fill: C.blue },
    { name: 'Vacunas consol.', ahorro: 350, fill: C.blueDim },
    { name: 'Sal importacion', ahorro: 280, fill: C.amber },
    { name: 'Calcareo coop.', ahorro: 220, fill: C.amberDim },
    { name: 'Nafta fleet', ahorro: 180, fill: C.purple },
    { name: 'Aceites semest.', ahorro: 150, fill: C.purpleDim },
    { name: 'Repuestos prev.', ahorro: 120, fill: C.cyan },
    { name: 'Semillas early', ahorro: 95, fill: C.orange },
    { name: 'Urea pool', ahorro: 85, fill: C.pink },
    { name: 'Herram. licit.', ahorro: 75, fill: C.red },
    { name: 'Cascarilla transp.', ahorro: 65, fill: C.redDim },
    { name: 'Abono timing', ahorro: 55, fill: C.slate },
    { name: 'Uniformes local', ahorro: 40, fill: '#475569' },
  ], []);

  const budgetVsActual = useMemo(() => [
    { estab: 'Ypoti Central', presupuesto: 4800, real: 5120 },
    { estab: 'Estancia Norte', presupuesto: 3200, real: 2980 },
    { estab: 'Feedlot Sur', presupuesto: 2600, real: 2850 },
    { estab: 'Campo Agricola', presupuesto: 1900, real: 1720 },
    { estab: 'Deposito Asuncion', presupuesto: 800, real: 910 },
  ], []);

  const q1Actions = useMemo(() => [
    { accion: 'Negociar forward maiz Agrofertil', ahorro: 'Gs 850M', prioridad: 'ALTA', estado: 'En curso' },
    { accion: 'Licitacion diesel anual (3 proveedores)', ahorro: 'Gs 620M', prioridad: 'ALTA', estado: 'Pendiente' },
    { accion: 'Evaluar proveedor alternativo burlanda', ahorro: 'Gs 480M', prioridad: 'ALTA', estado: 'Pendiente' },
    { accion: 'Compra consolidada vacunas Q1', ahorro: 'Gs 350M', prioridad: 'MEDIA', estado: 'Planificado' },
    { accion: 'Cotizar importacion directa sal marina', ahorro: 'Gs 280M', prioridad: 'MEDIA', estado: 'Pendiente' },
    { accion: 'Contactar Cooperativa Chortitzer calcareo', ahorro: 'Gs 220M', prioridad: 'MEDIA', estado: 'Pendiente' },
  ], []);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Chart 8 — Treemap */}
      <ChartCard title="Top 15 Oportunidades de Ahorro" subtitle="Por categoria de producto — tamano proporcional al ahorro">
        <ResponsiveContainer width="100%" height={320}>
          <Treemap data={savingsTree} dataKey="ahorro" nameKey="name"
            content={<TreemapContent />} animationDuration={400} />
        </ResponsiveContainer>
      </ChartCard>
      {/* Chart 9 — Budget vs Actual Bar */}
      <ChartCard title="Presupuesto vs Real por Establecimiento" subtitle="Gs millones — Q1 2026">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={budgetVsActual}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="estab" tick={{ ...TICK, fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={55} />
            <YAxis tick={TICK_DIM} />
            <Tooltip content={<DarkTooltip />} />
            <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
            <Bar dataKey="presupuesto" name="Presupuesto" fill={C.blue} radius={[4, 4, 0, 0]} barSize={28} fillOpacity={0.7} />
            <Bar dataKey="real" name="Real" fill={C.emerald} radius={[4, 4, 0, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      {/* Priority Actions Table */}
      <ChartCard title="Acciones Prioritarias Q1 2026" subtitle="Iniciativas de alto impacto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Accion', 'Ahorro Est.', 'Prioridad', 'Estado'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q1Actions.map((a, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3 text-white text-xs font-medium">{a.accion}</td>
                  <td className="py-2.5 px-3 text-emerald-400 text-xs font-semibold">{a.ahorro}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={a.prioridad === 'ALTA' ? 'danger' : 'warning'} size="xs">{a.prioridad}</Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={a.estado === 'En curso' ? 'success' : a.estado === 'Planificado' ? 'info' : 'default'}
                      size="xs" dot>{a.estado}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
