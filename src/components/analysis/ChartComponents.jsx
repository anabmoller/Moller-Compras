/**
 * ChartComponents.jsx — Shared chart UI primitives for AnalysisScreen
 * DarkTooltip, ChartCard, TreemapContent, legendFmt
 */
import Card from '../shared/Card';

/* ------------------------------------------------------------------ */
/*  DARK TOOLTIP                                                       */
/* ------------------------------------------------------------------ */
export function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1b23] border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CHART CARD                                                         */
/* ------------------------------------------------------------------ */
export function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <Card hover={false} className={`p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  TREEMAP CUSTOM CONTENT                                             */
/* ------------------------------------------------------------------ */
export function TreemapContent({ x, y, width, height, name, ahorro, fill }) {
  if (width < 50 || height < 30) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={fill} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
      <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={600}>
        {name?.length > 18 ? name.slice(0, 16) + '...' : name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={9}>
        Gs {ahorro}M
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  LEGEND FORMATTER                                                   */
/* ------------------------------------------------------------------ */
export const legendFmt = (v) => <span className="text-xs text-slate-400">{v}</span>;
