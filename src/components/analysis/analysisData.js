/**
 * analysisData.js — Hardcoded data constants for AnalysisScreen
 * Palette, tab definitions, chart config, custom-analysis metadata
 */

/* ------------------------------------------------------------------ */
/*  PALETTE                                                            */
/* ------------------------------------------------------------------ */
export const C = {
  emerald: '#C8A03A', emeraldDim: '#A8862F',
  blue: '#3b82f6', blueDim: '#2563eb',
  amber: '#f59e0b', amberDim: '#d97706',
  red: '#ef4444', redDim: '#dc2626',
  purple: '#8b5cf6', purpleDim: '#7c3aed',
  cyan: '#06b6d4',
  orange: '#f97316',
  pink: '#ec4899',
  slate: '#64748b',
};

/* ------------------------------------------------------------------ */
/*  TABS                                                               */
/* ------------------------------------------------------------------ */
export const TABS = [
  { key: 'resumen', label: 'Resumen Ejecutivo' },
  { key: 'precios', label: 'Precios & Tendencias' },
  { key: 'proveedores', label: 'Proveedores & Riesgo' },
  { key: 'oportunidades', label: 'Oportunidades' },
  { key: 'workflow', label: 'Workflow & Plan' },
  { key: 'custom', label: 'Mis Analisis' },
];

/* ------------------------------------------------------------------ */
/*  CHART AXIS STYLES                                                  */
/* ------------------------------------------------------------------ */
export const GRID = 'rgba(255,255,255,0.05)';
export const TICK = { fill: '#94a3b8', fontSize: 10 };
export const TICK_DIM = { fill: '#64748b', fontSize: 10 };

/* ------------------------------------------------------------------ */
/*  CUSTOM ANALYSIS CONFIG                                             */
/* ------------------------------------------------------------------ */
export const CHART_TYPES = [
  { key: 'bar', label: 'Barras', icon: '📊' },
  { key: 'line', label: 'Linea', icon: '📈' },
  { key: 'area', label: 'Area', icon: '📉' },
  { key: 'pie', label: 'Circular', icon: '🥧' },
];

export const DIMENSIONS = [
  { key: 'establecimiento', label: 'Establecimiento', values: ['Ypoti', 'Cerro Memby', 'Cielo Azul', 'Santa Clara', 'Lusipar', 'Oro Verde'] },
  { key: 'categoria', label: 'Categoria', values: ['Veterinaria', 'Nutricion', 'Combustible', 'Mantenimiento', 'Agricola', 'Operacional'] },
  { key: 'proveedor', label: 'Proveedor', values: ['Agrofertil', 'Cargill', 'ADM', 'Dekalpar', 'Petrobras', 'Ciabay', 'Copetrol', 'Rosenbusch'] },
  { key: 'mes', label: 'Mes', values: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] },
];

export const METRICS = [
  { key: 'monto', label: 'Monto (Gs M)', range: [100, 5000] },
  { key: 'cantidad', label: 'Cantidad solicitudes', range: [1, 30] },
  { key: 'ahorro', label: 'Ahorro (Gs M)', range: [10, 900] },
  { key: 'lead_time', label: 'Lead Time (dias)', range: [5, 30] },
];

export const PERIODS = ['Enero 2026', 'Febrero 2026', 'Q1 2026', 'Ultimo trimestre', 'Ultimo semestre', 'Anual 2025', 'Anual 2026'];

/* ------------------------------------------------------------------ */
/*  SAMPLE DATA GENERATOR                                              */
/* ------------------------------------------------------------------ */
export function generateSampleData(dimension, metric) {
  const dim = DIMENSIONS.find(d => d.key === dimension);
  const met = METRICS.find(m => m.key === metric);
  if (!dim || !met) return [];
  return dim.values.map(v => ({
    name: v,
    value: Math.round(met.range[0] + Math.random() * (met.range[1] - met.range[0])),
  }));
}
