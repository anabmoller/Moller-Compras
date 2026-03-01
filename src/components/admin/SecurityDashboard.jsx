import { useState } from 'react';
import Card from '../shared/Card';
import Badge from '../shared/Badge';

// ============================================================
// YPOTI — Security & Compliance Dashboard
// ISO 27001 / 9001 / 27701 / 27018 compliance monitoring
// ============================================================

const TABS = [
  { key: 'resumen', label: 'Resumen', icon: '📊' },
  { key: 'auditoria', label: 'Auditoría', icon: '🔍' },
  { key: 'evaluacion', label: 'Evaluación Proveedores', icon: '⭐' },
  { key: 'documentacion', label: 'Documentación', icon: '📋' },
];

const SECURITY_POLICIES = [
  { title: 'Política de Control de Acceso', iso: 'ISO 27001 - A.9', status: 'active', review: '2026-09-01' },
  { title: 'Política de Clasificación de Información', iso: 'ISO 27001 - A.8.2', status: 'active', review: '2026-09-01' },
  { title: 'Política de Gestión de Proveedores', iso: 'ISO 9001 - 8.4', status: 'active', review: '2026-06-01' },
  { title: 'Política de Auditoría y Trazabilidad', iso: 'ISO 27001 - A.12.4', status: 'active', review: '2026-09-01' },
  { title: 'Política de Respaldo y Recuperación', iso: 'ISO 27001 - A.12.3', status: 'draft', review: '2026-06-01' },
  { title: 'Política de Protección de Datos Personales', iso: 'ISO 27701 - 6.3', status: 'active', review: '2026-09-01' },
  { title: 'Política de Gestión de No Conformidades', iso: 'ISO 9001 - 10.2', status: 'active', review: '2026-06-01' },
  { title: 'Política de Seguridad en la Nube', iso: 'ISO 27018 - 5.1', status: 'draft', review: '2026-12-01' },
];

const MOCK_AUDIT_ENTRIES = [
  { id: 1, table: 'purchase_requests', action: 'INSERT', user: 'admin@ypoti.com', date: '2026-03-01 08:15' },
  { id: 2, table: 'suppliers', action: 'UPDATE', user: 'compras@ypoti.com', date: '2026-03-01 09:30' },
  { id: 3, table: 'products', action: 'INSERT', user: 'admin@ypoti.com', date: '2026-03-01 10:45' },
  { id: 4, table: 'price_history', action: 'INSERT', user: 'compras@ypoti.com', date: '2026-03-01 11:00' },
  { id: 5, table: 'suppliers', action: 'UPDATE', user: 'admin@ypoti.com', date: '2026-03-01 14:20' },
];

const ISO_REFERENCES = [
  { code: 'ISO 27001', name: 'Seguridad de la Información', sections: ['A.5 Políticas', 'A.8 Gestión de activos', 'A.9 Control de acceso', 'A.12 Seguridad operativa'] },
  { code: 'ISO 9001', name: 'Gestión de Calidad', sections: ['8.4 Control de proveedores', '9.1 Monitoreo y medición', '10.2 No conformidades'] },
  { code: 'ISO 27701', name: 'Privacidad de la Información', sections: ['6.3 Gestión de datos personales', '7.2 Condiciones de recopilación'] },
  { code: 'ISO 27018', name: 'Protección de Datos en la Nube', sections: ['5.1 Políticas cloud', 'A.1 Consentimiento', 'A.10 Cumplimiento'] },
];

const PDCA_STEPS = [
  { phase: 'Plan', color: 'text-blue-400', bg: 'bg-blue-500/10', items: ['Definir alcance del SGSI', 'Análisis de riesgos', 'Plan de tratamiento de riesgos'] },
  { phase: 'Do', color: 'text-emerald-400', bg: 'bg-emerald-500/10', items: ['Implementar controles', 'Capacitación del personal', 'Documentar procedimientos'] },
  { phase: 'Check', color: 'text-amber-400', bg: 'bg-amber-500/10', items: ['Auditorías internas', 'Revisión de indicadores', 'Evaluación de proveedores'] },
  { phase: 'Act', color: 'text-purple-400', bg: 'bg-purple-500/10', items: ['Acciones correctivas', 'Mejora continua', 'Actualizar políticas'] },
];

const TOP_SUPPLIERS = [
  { name: 'MSD Salud Animal', category: 'Sanidad Animal', rating: 4.8, quality: 9.5, delivery: 9.0, price: 7.5, compliance: 9.8 },
  { name: 'Zoetis Paraguay', category: 'Sanidad Animal', rating: 4.7, quality: 9.2, delivery: 9.1, price: 7.8, compliance: 9.5 },
  { name: 'Rieder & Cía', category: 'Maquinaria', rating: 4.7, quality: 9.3, delivery: 8.8, price: 7.2, compliance: 9.6 },
  { name: 'Cargill Agropecuaria', category: 'Granos', rating: 4.6, quality: 9.0, delivery: 9.2, price: 8.0, compliance: 9.0 },
  { name: 'Biogénesis Bagó', category: 'Sanidad Animal', rating: 4.6, quality: 9.1, delivery: 8.5, price: 7.8, compliance: 9.4 },
  { name: 'Chortitzer Komitee', category: 'Distribución', rating: 4.6, quality: 8.8, delivery: 9.0, price: 8.5, compliance: 9.0 },
];

function KpiCard({ label, value, sub, color = 'text-white' }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </Card>
  );
}

function StatusBadge({ status }) {
  if (status === 'active') return <Badge variant="success" dot>Activa</Badge>;
  if (status === 'draft') return <Badge variant="warning" dot>Borrador</Badge>;
  return <Badge variant="default">{status}</Badge>;
}

function ActionBadge({ action }) {
  const map = { INSERT: 'success', UPDATE: 'info', DELETE: 'danger' };
  return <Badge variant={map[action] || 'default'}>{action}</Badge>;
}

function ScoreBar({ value, max = 10 }) {
  const pct = (value / max) * 100;
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{value}</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// TAB PANELS
// ────────────────────────────────────────────────────────────

function TabResumen() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Políticas ISO" value="8" sub="6 activas, 2 borrador" color="text-blue-400" />
        <KpiCard label="Proveedores Evaluados" value="0 / 29" sub="Pendiente primera evaluación" color="text-amber-400" />
        <KpiCard label="No Conformidades" value="0" sub="Sin registros aún" color="text-emerald-400" />
        <KpiCard label="Score Compliance" value="67%" sub="Objetivo: 85%" color="text-purple-400" />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Políticas de Seguridad</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase border-b border-white/[0.06]">
                <th className="px-5 py-3">Política</th>
                <th className="px-5 py-3">Referencia ISO</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Próxima Revisión</th>
              </tr>
            </thead>
            <tbody>
              {SECURITY_POLICIES.map((p, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-slate-200">{p.title}</td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-xs">{p.iso}</td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-3 text-slate-400">{p.review}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TabAuditoria() {
  return (
    <div className="space-y-6">
      <Card className="p-5 border-amber-500/20 bg-amber-500/[0.03]">
        <h3 className="text-sm font-semibold text-amber-400 mb-2">Integración audit_trail</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          La tabla <code className="text-amber-300 bg-white/[0.05] px-1 rounded">audit_trail</code> registra
          automáticamente cada INSERT, UPDATE y DELETE en las tablas: purchase_requests, suppliers, products
          y price_history mediante triggers PostgreSQL. Los registros incluyen old_data / new_data en formato
          JSONB para trazabilidad completa.
        </p>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Registros Recientes (demo)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase border-b border-white/[0.06]">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Tabla</th>
                <th className="px-5 py-3">Acción</th>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_AUDIT_ENTRIES.map((e) => (
                <tr key={e.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-slate-500 font-mono">#{e.id}</td>
                  <td className="px-5 py-3 text-slate-200 font-mono text-xs">{e.table}</td>
                  <td className="px-5 py-3"><ActionBadge action={e.action} /></td>
                  <td className="px-5 py-3 text-slate-400">{e.user}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TabEvaluacion() {
  return (
    <div className="space-y-6">
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Top Proveedores por Score</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase border-b border-white/[0.06]">
                <th className="px-5 py-3">Proveedor</th>
                <th className="px-5 py-3">Categoría</th>
                <th className="px-5 py-3 w-32">Calidad</th>
                <th className="px-5 py-3 w-32">Entrega</th>
                <th className="px-5 py-3 w-32">Precio</th>
                <th className="px-5 py-3 w-32">Cumplimiento</th>
                <th className="px-5 py-3 text-right">Rating</th>
              </tr>
            </thead>
            <tbody>
              {TOP_SUPPLIERS.map((s, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-slate-200 font-medium">{s.name}</td>
                  <td className="px-5 py-3"><Badge variant="info">{s.category}</Badge></td>
                  <td className="px-5 py-3"><ScoreBar value={s.quality} /></td>
                  <td className="px-5 py-3"><ScoreBar value={s.delivery} /></td>
                  <td className="px-5 py-3"><ScoreBar value={s.price} /></td>
                  <td className="px-5 py-3"><ScoreBar value={s.compliance} /></td>
                  <td className="px-5 py-3 text-right text-amber-400 font-bold">{s.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 border-blue-500/20 bg-blue-500/[0.03]">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">Formulario de Evaluación</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          El formulario de evaluación de proveedores permite registrar scores trimestrales en 4 ejes:
          Calidad, Entrega, Precio y Cumplimiento. Los datos se almacenan en la tabla
          <code className="text-blue-300 bg-white/[0.05] px-1 rounded mx-1">supplier_evaluations</code>
          con cálculo automático de total_score. Próximamente disponible en esta sección.
        </p>
      </Card>
    </div>
  );
}

function TabDocumentacion() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ISO_REFERENCES.map((ref, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg font-bold text-blue-400">{ref.code}</span>
              <Badge variant="info">{ref.name}</Badge>
            </div>
            <ul className="space-y-1">
              {ref.sections.map((s, j) => (
                <li key={j} className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Ciclo PDCA - Mejora Continua</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {PDCA_STEPS.map((step, i) => (
            <div key={i} className={`${step.bg} rounded-lg p-4 border border-white/[0.06]`}>
              <h4 className={`text-sm font-bold ${step.color} mb-2`}>{step.phase}</h4>
              <ul className="space-y-1">
                {step.items.map((item, j) => (
                  <li key={j} className="text-xs text-slate-400">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────

export default function SecurityDashboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('resumen');

  const renderTab = () => {
    switch (activeTab) {
      case 'resumen': return <TabResumen />;
      case 'auditoria': return <TabAuditoria />;
      case 'evaluacion': return <TabEvaluacion />;
      case 'documentacion': return <TabDocumentacion />;
      default: return <TabResumen />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">Seguridad y Compliance</h1>
            <p className="text-xs text-slate-400 mt-0.5">Panel de cumplimiento ISO 27001 / 9001</p>
          </div>
        </div>
        <Badge variant="purple" size="md">v1.0</Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1 border border-white/[0.06]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      {renderTab()}
    </div>
  );
}
