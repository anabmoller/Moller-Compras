/**
 * Mobile bottom navigation — dark mode
 * Icons: lucide-react
 */
import { LayoutDashboard, Package, BarChart3, Settings, Plus } from "lucide-react";

const ICON_SIZE = 20;

export default function BottomNav({ screen, onNavigate, onNewRequest }) {
  const items = [
    { key: 'panel', icon: <LayoutDashboard size={ICON_SIZE} />, label: 'Panel' },
    { key: 'inventory', icon: <Package size={ICON_SIZE} />, label: 'Inventario' },
    { key: 'analytics', icon: <BarChart3 size={ICON_SIZE} />, label: 'Análisis' },
    { key: 'settings', icon: <Settings size={ICON_SIZE} />, label: 'Config' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-[var(--color-sidebar-bg)] backdrop-blur-xl border-t border-[var(--color-border)] flex justify-around items-center px-0 pb-[env(safe-area-inset-bottom,16px)] pt-1.5 z-[100]">
      {items.slice(0, 2).map(item => (
        <NavBtn key={item.key} item={item} active={screen === item.key} onClick={() => onNavigate(item.key)} />
      ))}

      {/* Center FAB */}
      <button
        onClick={onNewRequest}
        className="w-12 h-12 rounded-xl bg-[#1F2A44] flex items-center justify-center border-none cursor-pointer -mt-4 shadow-lg shadow-black/20 active:scale-95 transition-transform text-white"
        aria-label="Nueva Solicitud"
      >
        <Plus size={22} />
      </button>

      {items.slice(2).map(item => (
        <NavBtn key={item.key} item={item} active={screen === item.key} onClick={() => onNavigate(item.key)} />
      ))}
    </nav>
  );
}

function NavBtn({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-transparent border-none flex flex-col items-center gap-0.5 cursor-pointer px-3 py-1"
    >
      <span className={`${active ? 'text-[#C8A03A]' : 'text-slate-500'}`}>{item.icon}</span>
      <span className={`text-[10px] ${active ? 'font-semibold text-[#C8A03A]' : 'font-normal text-slate-500'}`}>
        {item.label}
      </span>
    </button>
  );
}
