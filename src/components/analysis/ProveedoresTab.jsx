/**
 * ProveedoresTab — Tab 3: Proveedores & Riesgo
 * Radar chart, horizontal bar top 10, risk concentration table
 */
import { useMemo } from 'react';
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import Badge from '../shared/Badge';
import { C, GRID, TICK, TICK_DIM } from './analysisData';
import { DarkTooltip, ChartCard, legendFmt } from './ChartComponents';

export default function ProveedoresTab() {
  const radarData = useMemo(() => [
    { axis: 'Calidad', Agrofertil: 88, Dekalpar: 82, Ciabay: 78 },
    { axis: 'Entrega', Agrofertil: 75, Dekalpar: 90, Ciabay: 85 },
    { axis: 'Precio', Agrofertil: 70, Dekalpar: 85, Ciabay: 92 },
    { axis: 'Compliance', Agrofertil: 92, Dekalpar: 80, Ciabay: 74 },
    { axis: 'Servicio', Agrofertil: 82, Dekalpar: 78, Ciabay: 80 },
  ], []);

  const topSuppliers = useMemo(() => [
    { name: 'Agrofertil', volumen: 5140 },
    { name: 'Cargill', volumen: 2820 },
    { name: 'ADM', volumen: 2450 },
    { name: 'Dekalpar', volumen: 1980 },
    { name: 'Petrobras', volumen: 1750 },
    { name: 'Ciabay', volumen: 1420 },
    { name: 'Copetrol', volumen: 1180 },
    { name: 'Rosenbusch', volumen: 980 },
    { name: 'MSD Animal', volumen: 820 },
    { name: 'Rieder', volumen: 650 },
  ], []);

  const riskTable = useMemo(() => [
    { producto: 'Maiz humedo', proveedor: 'Agrofertil', pct: 78, alternativas: 2, riesgo: 'CRITICO' },
    { producto: 'Burlanda (DDGS)', proveedor: 'Agrofertil', pct: 65, alternativas: 3, riesgo: 'ALTO' },
    { producto: 'Vacuna Aftosa', proveedor: 'Rosenbusch', pct: 85, alternativas: 1, riesgo: 'CRITICO' },
    { producto: 'Calcareo', proveedor: 'Sin definir', pct: 90, alternativas: 0, riesgo: 'CRITICO' },
    { producto: 'Diesel', proveedor: 'Petrobras', pct: 60, alternativas: 2, riesgo: 'MEDIO' },
    { producto: 'Sal marina', proveedor: 'Malteria', pct: 70, alternativas: 2, riesgo: 'ALTO' },
  ], []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 6 — Radar */}
        <ChartCard title="Evaluacion Top 3 Proveedores" subtitle="Agrofertil, Dekalpar, Ciabay — 5 ejes">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="axis" tick={TICK} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={TICK_DIM} />
              <Radar name="Agrofertil" dataKey="Agrofertil" stroke={C.emerald}
                fill={C.emerald} fillOpacity={0.12} strokeWidth={2} />
              <Radar name="Dekalpar" dataKey="Dekalpar" stroke={C.blue}
                fill={C.blue} fillOpacity={0.12} strokeWidth={2} />
              <Radar name="Ciabay" dataKey="Ciabay" stroke={C.amber}
                fill={C.amber} fillOpacity={0.12} strokeWidth={2} />
              <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
              <Tooltip content={<DarkTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        {/* Chart 7 — Horizontal Bar Top 10 */}
        <ChartCard title="Top 10 Proveedores por Volumen" subtitle="Gs millones">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSuppliers} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis type="number" tick={TICK_DIM} />
              <YAxis type="category" dataKey="name" tick={TICK} width={75} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="volumen" name="Volumen (Gs M)" radius={[0, 4, 4, 0]}>
                {topSuppliers.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? C.emerald : i < 3 ? C.blue : C.slate} fillOpacity={i === 0 ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      {/* Risk Table */}
      <ChartCard title="Productos con Proveedor Unico" subtitle="Dependencia Agrofertil 40% del total">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Producto', 'Proveedor', '% Compras', 'Alternativas', 'Riesgo'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riskTable.map((r, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3 text-white font-medium text-xs">{r.producto}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs">{r.proveedor}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/[0.08]">
                        <div className="h-full rounded-full" style={{
                          width: `${r.pct}%`,
                          background: r.pct > 75 ? C.red : r.pct > 50 ? C.amber : C.emerald,
                        }} />
                      </div>
                      <span className="text-slate-300 text-xs">{r.pct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs text-center">{r.alternativas}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={r.riesgo === 'CRITICO' ? 'danger' : r.riesgo === 'ALTO' ? 'warning' : 'success'}
                      size="xs" dot>{r.riesgo}</Badge>
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
