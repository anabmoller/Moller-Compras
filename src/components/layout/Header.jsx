/**
 * Mobile header — hamburger (left), logo→home (center), avatar→profile (right)
 */
export default function Header({ currentUser, onToggleDrawer, onNavigate }) {
  const initial = currentUser?.charAt(0)?.toUpperCase() || 'U';
  return (
    <header className="bg-[#0d0e14] border-b border-white/[0.06] px-4 py-3 flex justify-between items-center sticky top-0 z-40">
      {/* Hamburger */}
      <button
        onClick={onToggleDrawer}
        className="w-9 h-9 rounded-lg bg-transparent border-none cursor-pointer flex items-center justify-center text-white hover:bg-white/[0.06] transition-colors"
        aria-label="Abrir menú"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
        </svg>
      </button>

      {/* Logo → home */}
      <div
        onClick={() => onNavigate && onNavigate('dashboard')}
        className="flex items-center gap-2 cursor-pointer"
      >
        <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
          Y
        </div>
        <div className="text-sm font-bold text-white tracking-tight">YPOTI</div>
      </div>

      {/* Avatar → profile */}
      <button
        onClick={() => onNavigate && onNavigate('profile')}
        className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-semibold text-emerald-400 border-none cursor-pointer"
        aria-label="Perfil"
      >
        {initial}
      </button>
    </header>
  );
}
