/**
 * Mobile header — hamburger (left), logo→home (center), avatar→profile (right)
 */
import BrandMark from "../../brand/BrandMark";
import { SYSTEM_NAME } from "../../brand/brand";
import getUserInitials from "../../lib/getUserInitials";

export default function Header({ currentUser, onToggleDrawer, onNavigate }) {
  return (
    <header className="bg-[#111827] border-b border-white/[0.08] px-4 py-3 flex justify-between items-center sticky top-0 z-40">
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
        <BrandMark size="xs" />
        <div className="text-sm font-bold text-white tracking-tight">{SYSTEM_NAME}</div>
      </div>

      {/* Avatar → profile */}
      <button
        onClick={() => onNavigate && onNavigate('profile')}
        className="w-8 h-8 rounded-full bg-[#C8A03A]/10 flex items-center justify-center text-xs font-semibold text-[#C8A03A] border-none cursor-pointer"
        aria-label="Perfil"
      >
        {getUserInitials(currentUser)}
      </button>
    </header>
  );
}
