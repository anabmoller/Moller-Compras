/**
 * WorkflowTab — Tab 5: Workflow & Plan
 * Processing time area, request volume stacked bar, composed efficiency chart, roadmap
 */
import { useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart,
} from 'recharts';
import Card from '../shared/Card';
import { C, GRID, TICK, TICK_DIM } from './analysisData';
import { DarkTooltip, ChartCard, legendFmt } from './ChartComponents';

export default function WorkflowTab() {
  const processingTime = useMemo(() => [
    { mes: 'Jul', dias: 22 },  { mes: 'Ago', dias: 20 },
    { mes: 'Sep', dias: 18 },  { mes: 'Oct', dias: 19 },
    { mes: 'Nov', dias: 16 },  { mes: 'Dic', dias: 15 },
    { mes: 'Ene', dias: 14 },  { mes: 'Feb', dias: 13 },
  ], []);

  const requestVolume = useMemo(() => [
    { mes: 'Jul', aprobada: 12, pendiente: 5, rechazada: 2 },
    { mes: 'Ago', aprobada: 15, pendiente: 4, rechazada: 1 },
    { mes: 'Sep', aprobada: 18, pendiente: 6, rechazada: 3 },
    { mes: 'Oct', aprobada: 14, pendiente: 8, rechazada: 2 },
    { mes: 'Nov', aprobada: 20, pendiente: 3, rechazada: 1 },
    { mes: 'Dic', aprobada: 16, pendiente: 7, rechazada: 4 },
    { mes: 'Ene', aprobada: 19, pendiente: 5, rechazada: 2 },
    { mes: 'Feb', aprobada: 23, pendiente: 4, rechazada: 1 },
  ], []);

  const roadmap = useMemo(() => [
    { q: 'Q1 2026', items: [
      'Negociar forward maiz con Agrofertil',
      'Contratar segundo proveedor DDGS',
      'Licitacion diesel anual',
      'Evaluar 5 nuevos proveedores',
    ]},
    { q: 'Q2 2026', items: [
      'Implementar scoring automatico',
      'Auditoria ISO 9001 proveedores top 5',
      'Pool de compra urea',
      'Early booking semillas invierno',
    ]},
    { q: 'Q3 2026', items: [
      'Revision semestral contratos',
      'Importacion directa sal marina',
      'Licitacion uniformes y EPP',
      'Optimizacion logistica interna',
    ]},
    { q: 'Q4 2026', items: [
      'Presupuesto 2027 basado en data',
      'Renegociacion anual contratos',
      'Certificacion ISO 9001 compras',
      'Dashboard predictivo ML',
    ]},
  ], []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 10 — Processing Time Area */}
        <ChartCard title="Tiempo de Procesamiento de Solicitudes" subtitle="Dias promedio para completar — tendencia descendente">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={processingTime}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="mes" tick={TICK} />
              <YAxis tick={TICK_DIM} domain={[0, 28]} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="dias" name="Dias" stroke={C.emerald}
                fill={C.emerald} fillOpacity={0.1} strokeWidth={2.5} dot={{ r: 3, fill: C.emerald }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        {/* Chart 11 — Stacked Bar Request Volume */}
        <ChartCard title="Volumen de Solicitudes por Estado" subtitle="Unidades por mes">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={requestVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="mes" tick={TICK} />
              <YAxis tick={TICK_DIM} />
              <Tooltip content={<DarkTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
              <Bar dataKey="aprobada" name="Aprobada" stackId="a" fill={C.emerald} />
              <Bar dataKey="pendiente" name="Pendiente" stackId="a" fill={C.amber} />
              <Bar dataKey="rechazada" name="Rechazada" stackId="a" fill={C.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      {/* Chart 12 — Composed chart: volume + processing overlay */}
      <ChartCard title="Eficiencia Operativa" subtitle="Solicitudes totales vs tiempo de procesamiento">
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={requestVolume.map((r, i) => ({
            ...r,
            total: r.aprobada + r.pendiente + r.rechazada,
            dias: processingTime[i]?.dias ?? 0,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="mes" tick={TICK} />
            <YAxis yAxisId="left" tick={TICK_DIM} />
            <YAxis yAxisId="right" orientation="right" tick={TICK_DIM} domain={[0, 30]} />
            <Tooltip content={<DarkTooltip />} />
            <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
            <Bar yAxisId="left" dataKey="total" name="Solicitudes" fill={C.blue} fillOpacity={0.6} radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="dias" name="Dias promedio"
              stroke={C.emerald} strokeWidth={2.5} dot={{ r: 3, fill: C.emerald }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
      {/* Roadmap Table */}
      <ChartCard title="Roadmap 2026" subtitle="Plan de accion Q1-Q4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmap.map((q) => (
            <Card key={q.q} hover={false} className="p-4">
              <h4 className="text-sm font-bold text-emerald-400 mb-3">{q.q}</h4>
              <ul className="space-y-2">
                {q.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-emerald-500 mt-0.5 shrink-0">●</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
