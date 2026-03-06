import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingCart, Package, BarChart3, Shield, Settings, FileText,
} from "lucide-react";

/**
 * Global search modal (Cmd+K / Ctrl+K)
 */
export default function GlobalSearch({ onNavigate, requests = [], onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const sections = [
    {
      title: 'Navegación',
      items: [
        { icon: <ShoppingCart size={16} />, label: 'Solicitudes', action: () => { onNavigate('dashboard'); onClose(); } },
        { icon: <Package size={16} />, label: 'Inventario', action: () => { onNavigate('inventory'); onClose(); } },
        { icon: <BarChart3 size={16} />, label: 'Análisis', action: () => { onNavigate('analytics'); onClose(); } },
        { icon: <Shield size={16} />, label: 'Seguridad', action: () => { onNavigate('security'); onClose(); } },
        { icon: <Settings size={16} />, label: 'Configuración', action: () => { onNavigate('settings'); onClose(); } },
      ],
    },
  ];

  const q = query.toLowerCase();
  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item => !q || item.label.toLowerCase().includes(q)),
  })).filter(s => s.items.length > 0);

  const matchingRequests = q.length >= 2
    ? requests.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q) ||
        r.establishment?.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[var(--color-modal)] border border-[var(--color-border)] rounded-2xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar solicitudes, pantallas..."
            className="flex-1 bg-transparent border-none outline-none text-[var(--color-text)] text-sm placeholder:text-slate-500"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-[var(--color-surface)] rounded border border-[var(--color-border)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filteredSections.map(section => (
            <div key={section.title}>
              <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {section.title}
              </div>
              {section.items.map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8F9FB]/[0.06] transition-colors"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm text-slate-300">{item.label}</span>
                </button>
              ))}
            </div>
          ))}

          {matchingRequests.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Solicitudes
              </div>
              {matchingRequests.map(r => (
                <button
                  key={r.id}
                  onClick={() => { onNavigate('request', r.id); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8F9FB]/[0.06] transition-colors"
                >
                  <span className="text-base text-slate-400"><FileText size={16} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-300 truncate">{r.name}</div>
                    <div className="text-[10px] text-slate-500">{r.id} · {r.establishment}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {filteredSections.length === 0 && matchingRequests.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              No se encontraron resultados
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
