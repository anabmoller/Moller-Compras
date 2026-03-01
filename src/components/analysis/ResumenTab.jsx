/**
 * ResumenTab — Tab 1: Resumen Ejecutivo
 * KPI cards, monthly purchases bar chart, category pie chart
 */
import { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Card from '../shared/Card';
import Badge from '../shared/Badge';
import { C, GRID, TICK, TICK_DIM } from './analysisData';
import { DarkTooltip, ChartCard, legendFmt } from './ChartComponents';

export default function ResumenTab() {
  const monthlyPurchases = useMemo(() => [
    { mes: 'Ene', compras: 980 },  { mes: 'Feb', compras: 1120 },
    { mes: 'Mar', compras: 1340 },  { mes: 'Abr', compras: 1050 },
    { mes: 'May', compras: 890 },   { mes: 'Jun', compras: 760 },
    { mes: 'Jul', compras: 820 },   { mes: 'Ago', compras: 1010 },
    { mes: 'Sep', compras: 1180 },  { mes: 'Oct', compras: 1250 },
    { mes: 'Nov', compras: 1340 },  { mes: 'Dic', compras: 1107 },
  ], []);

  const categoryDist = useMemo(() => [
    { name: 'Veterinaria', value: 35, color: C.emerald },
    { name: 'Nutricion', value: 25, color: C.blue },
    { name: 'Mantenimiento', value: 15, color: C.amber },
    { name: 'Combustible', value: 12, color: C.orange },
    { name: 'Agricola', value: 8, color: C.purple },
    { name: 'Operacional', value: 5, color: C.cyan },
  ], []);

  const kpis = useMemo(() => [
    { label: 'Total Compras YTD', value: 'Gs 12.847M', color: C.emerald, accent: 'border-l-emerald-500' },
    { label: 'Ahorro Negociado', value: 'Gs 2.340M', sub: '18.2%', color: C.blue, accent: 'border-l-blue-500' },
    { label: 'Proveedores Activos', value: '29', color: C.purple, accent: 'border-l-purple-500' },
    { label: 'Lead Time Promedio', value: '14 dias', color: C.amber, accent: 'border-l-amber-500' },
    { label: 'Compliance ISO', value: '67%', color: C.red, accent: 'border-l-red-500' },
    { label: 'Solicitudes Mes', value: '23', color: C.cyan, accent: 'border-l-cyan-500' },
  ], []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} hover={false} className={`p-4 border-l-2 ${k.accent}`}>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{k.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
            {k.sub && <Badge variant="success" size="xs" className="mt-1">{k.sub}</Badge>}
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 1 — Monthly Purchases Bar */}
        <ChartCard title="Compras Mensuales 2026" subtitle="Gs millones por mes">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyPurchases}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="mes" tick={TICK} />
              <YAxis tick={TICK_DIM} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="compras" name="Compras (Gs M)" radius={[4, 4, 0, 0]}>
                {monthlyPurchases.map((_, i) => (
                  <Cell key={i} fill={i < 3 ? C.emerald : C.emeraldDim} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        {/* Chart 2 — Category Pie */}
        <ChartCard title="Distribucion por Categoria" subtitle="% del total de compras">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryDist} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={85} innerRadius={48} paddingAngle={3} strokeWidth={0}>
                {categoryDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
