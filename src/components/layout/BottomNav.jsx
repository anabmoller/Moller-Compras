/**
 * Mobile bottom navigation — dark mode
 */
export default function BottomNav({ screen, onNavigate, onNewRequest }) {
  const items = [
    { key: 'dashboard', icon: '📋', label: 'Solicitudes' },
    { key: 'inventory', icon: '📦', label: 'Inventario' },
    { key: 'analytics', icon: '📊', label: 'Análisis' },
    { key: 'settings', icon: '⚙️', label: 'Config' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-[rgba(10,11,15,0.97)] backdrop-blur-xl border-t border-white/[0.06] flex justify-around items-center px-0 pb-[env(safe-area-inset-bottom,16px)] pt-1.5 z-[100]">
      {items.slice(0, 2).map(item => (
        <NavBtn key={item.key} item={item} active={screen === item.key} onClick={() => onNavigate(item.key)} />
      ))}

      {/* Center FAB */}
      <button
        onClick={onNewRequest}
        className="w-12 h-12 rounded-xl bg-[#1F2A44] flex items-center justify-center border-none cursor-pointer -mt-4 shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform"
        aria-label="Nueva Solicitud"
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="#fff">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
        </svg>
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
      <span className={`text-lg ${active ? 'opacity-100' : 'opacity-40'}`}>{item.icon}</span>
      <span className={`text-[10px] ${active ? 'font-semibold text-[#C8A03A]' : 'font-normal text-slate-500'}`}>
        {item.label}
      </span>
    </button>
  );
}
