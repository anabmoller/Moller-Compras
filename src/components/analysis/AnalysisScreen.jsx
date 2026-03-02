/**
 * AnalysisScreen — Bloomberg Terminal-style dark analytics dashboard
 * Slim orchestrator: imports 6 tab components, handles routing + modal state.
 */
import { useState, useMemo } from 'react';
import { TABS } from './analysisData';
import ResumenTab from './ResumenTab';
import PreciosTab from './PreciosTab';
import ProveedoresTab from './ProveedoresTab';
import OportunidadesTab from './OportunidadesTab';
import WorkflowTab from './WorkflowTab';
import CustomTab, { CreateAnalysisModal } from './CustomTab';

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function AnalysisScreen({ onBack, embedded = false }) {
  const [activeTab, setActiveTab] = useState('resumen');
  const [customAnalyses, setCustomAnalyses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const addCustomAnalysis = (analysis) => {
    setCustomAnalyses(prev => [...prev, analysis]);
    setActiveTab('custom');
  };

  const removeCustomAnalysis = (id) => {
    setCustomAnalyses(prev => prev.filter(a => a.id !== id));
  };

  const tabContent = useMemo(() => ({
    resumen: <ResumenTab />,
    precios: <PreciosTab />,
    proveedores: <ProveedoresTab />,
    oportunidades: <OportunidadesTab />,
    workflow: <WorkflowTab />,
    custom: <CustomTab analyses={customAnalyses} onRemove={removeCustomAnalysis} onAdd={() => setShowCreateModal(true)} />,
  }), [customAnalyses]);

  return (
    <div className={embedded ? "pb-24" : "min-h-screen bg-[#0a0b0f] pb-24"}>
      {/* Header — hidden when embedded in unified AnalyticsScreen */}
      {!embedded && (
        <div className="px-5 pt-4 pb-2">
          <button onClick={onBack}
            className="text-[#C8A03A] text-sm font-medium hover:text-[#C8A03A] transition-colors mb-3 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight">Analisis Estrategico</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-br from-[#1F2A44] to-[#C8A03A] text-white border-none rounded-lg px-3.5 py-2 text-[11px] font-semibold cursor-pointer flex items-center gap-1 shadow-sm"
            >
              + Nuevo
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">Dashboard ejecutivo — Bloomberg-style analytics</p>
        </div>
      )}

      {embedded && (
        <div className="px-5 pt-2 pb-1 flex items-center justify-between">
          <p className="text-xs text-slate-500">Dashboard ejecutivo — Bloomberg-style analytics</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-br from-[#1F2A44] to-[#C8A03A] text-white border-none rounded-lg px-3 py-1.5 text-[11px] font-semibold cursor-pointer"
          >
            + Nuevo
          </button>
        </div>
      )}

      {/* Tab Pills */}
      <div className="flex gap-1.5 px-5 py-3 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === t.key
                ? 'bg-[#1F2A44]/10 text-[#C8A03A] border border-[#C8A03A]/30'
                : 'bg-[#F8F9FB]/[0.03] text-slate-500 border border-white/[0.06] hover:bg-[#F8F9FB]/[0.06] hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-5" key={activeTab}>
        {tabContent[activeTab]}
      </div>

      {/* Create Analysis Modal */}
      {showCreateModal && (
        <CreateAnalysisModal
          onClose={() => setShowCreateModal(false)}
          onCreate={addCustomAnalysis}
        />
      )}
    </div>
  );
}
