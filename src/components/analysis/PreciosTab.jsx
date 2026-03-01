/**
 * PreciosTab — Tab 2: Precios & Tendencias
 * Cattle price line, raw materials area, fuel comparison bar
 */
import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { C, GRID, TICK, TICK_DIM } from './analysisData';
import { DarkTooltip, ChartCard, legendFmt } from './ChartComponents';

export default function PreciosTab() {
  const cattlePrices = useMemo(() => [
    { period: 'Q1 22', usd: 1.82 }, { period: 'Q2 22', usd: 1.88 },
    { period: 'Q3 22', usd: 1.95 }, { period: 'Q4 22', usd: 1.90 },
    { period: 'Q1 23', usd: 1.96 }, { period: 'Q2 23', usd: 2.04 },
    { period: 'Q3 23', usd: 1.98 }, { period: 'Q4 23', usd: 2.08 },
    { period: 'Q1 24', usd: 2.12 }, { period: 'Q2 24', usd: 2.18 },
    { period: 'Q3 24', usd: 2.10 }, { period: 'Q4 24', usd: 2.15 },
    { period: 'Q1 25', usd: 2.20 }, { period: 'Q2 25', usd: 2.28 },
    { period: 'Q3 25', usd: 2.22 }, { period: 'Q4 25', usd: 2.30 },
    { period: 'Q1 26', usd: 2.35 },
  ], []);

  const rawMaterials = useMemo(() => [
    { period: 'Q1 23', maiz: 205, soja: 510, sorgo: 185 },
    { period: 'Q2 23', maiz: 195, soja: 490, sorgo: 175 },
    { period: 'Q3 23', maiz: 188, soja: 475, sorgo: 168 },
    { period: 'Q4 23', maiz: 198, soja: 495, sorgo: 178 },
    { period: 'Q1 24', maiz: 210, soja: 520, sorgo: 190 },
    { period: 'Q2 24', maiz: 200, soja: 505, sorgo: 182 },
    { period: 'Q3 24', maiz: 192, soja: 488, sorgo: 172 },
    { period: 'Q4 24', maiz: 205, soja: 510, sorgo: 185 },
    { period: 'Q1 25', maiz: 215, soja: 530, sorgo: 195 },
    { period: 'Q2 25', maiz: 208, soja: 515, sorgo: 188 },
    { period: 'Q3 25', maiz: 198, soja: 498, sorgo: 178 },
    { period: 'Q4 25', maiz: 212, soja: 525, sorgo: 192 },
    { period: 'Q1 26', maiz: 220, soja: 540, sorgo: 200 },
  ], []);

  const fuelComparison = useMemo(() => [
    { proveedor: 'Copetrol', diesel: 8320, nafta: 8950 },
    { proveedor: 'Petropar', diesel: 8180, nafta: 8780 },
    { proveedor: 'Puma', diesel: 8500, nafta: 9100 },
  ], []);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Chart 3 — Cattle Price Line */}
      <ChartCard title="Evolucion Precio Novillo Gordo" subtitle="USD/kg — 2022-2026, tendencia alcista con estacionalidad">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cattlePrices}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="period" tick={TICK} interval={2} />
            <YAxis tick={TICK_DIM} domain={[1.75, 2.40]} tickFormatter={(v) => v.toFixed(2)} />
            <Tooltip content={<DarkTooltip />} />
            <Line type="monotone" dataKey="usd" name="USD/kg" stroke={C.emerald}
              strokeWidth={2.5} dot={{ r: 3, fill: C.emerald }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      {/* Chart 4 — Raw Materials Area */}
      <ChartCard title="Precios Materias Primas" subtitle="USD/ton — Maiz, Soja, Sorgo (2023-2026)">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={rawMaterials}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="period" tick={TICK} interval={2} />
            <YAxis tick={TICK_DIM} />
            <Tooltip content={<DarkTooltip />} />
            <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
            <Area type="monotone" dataKey="soja" name="Soja" stroke={C.amber}
              fill={C.amber} fillOpacity={0.08} strokeWidth={2} />
            <Area type="monotone" dataKey="maiz" name="Maiz" stroke={C.emerald}
              fill={C.emerald} fillOpacity={0.08} strokeWidth={2} />
            <Area type="monotone" dataKey="sorgo" name="Sorgo" stroke={C.purple}
              fill={C.purple} fillOpacity={0.08} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      {/* Chart 5 — Fuel Comparison Bar */}
      <ChartCard title="Diesel vs Nafta por Proveedor" subtitle="Gs/litro — Comparativa actual">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={fuelComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="proveedor" tick={TICK} />
            <YAxis tick={TICK_DIM} domain={[7500, 9500]} />
            <Tooltip content={<DarkTooltip />} />
            <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
            <Bar dataKey="diesel" name="Diesel" fill={C.blue} radius={[4, 4, 0, 0]} barSize={32} />
            <Bar dataKey="nafta" name="Nafta" fill={C.orange} radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
