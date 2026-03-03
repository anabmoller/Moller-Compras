/**
 * Desktop sidebar navigation — dark mode, with theme toggle
 */
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../shared/NotificationBell";

export default function DesktopSidebar({ screen, onNavigate, onNewRequest, currentUser, canViewAnalytics, canManageUsers, canViewGanado, usdRate, usdLive, onRefreshRate }) {
  const { theme, toggleTheme } = useTheme();
  const { getVisibleNotifications } = useNotifications();
  const auth = useAuth();
  const unreadCount = getVisibleNotifications(auth.currentUser?.name, auth.currentUser?.role).filter(n => !n.read).length;

  const mainItems = [
    { key: 'dashboard', icon: '📋', label: 'Solicitudes' },
    { key: 'notifications', icon: '🔔', label: 'Notificaciones', badge: unreadCount || null },
    { key: 'inventory', icon: '📦', label: 'Inventario' },
    ...(canViewGanado ? [{ key: 'ganado', icon: '🐄', label: 'Ganado' }] : []),
    ...(canViewAnalytics ? [{ key: 'analytics', icon: '📊', label: 'Análisis' }] : []),
    ...(canManageUsers ? [{ key: 'security', icon: '🛡️', label: 'Seguridad' }] : []),
  ];

  const adminItems = [
    ...(canManageUsers ? [{ key: 'users', icon: '👥', label: 'Usuarios' }] : []),
    ...(canViewAnalytics ? [{ key: 'budgets', icon: '💰', label: 'Presupuestos' }] : []),
    ...(canManageUsers ? [{ key: 'parameters', icon: '⚙️', label: 'Parámetros' }] : []),
    ...(canManageUsers ? [{ key: 'approvalConfig', icon: '🔄', label: 'Aprobaciones' }] : []),
  ];

  const initial = currentUser?.charAt(0)?.toUpperCase() || 'U';

  return (
    <aside className="desktop-sidebar bg-[#0d0e14]">
      {/* Brand — clickable to go to Solicitudes */}
      <div
        onClick={() => onNavigate('dashboard')}
        className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="w-9 h-9 rounded-lg bg-[#1F2A44] flex items-center justify-center text-white font-bold text-base">
          AMs
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight leading-tight m-0">AM Soluciones</h1>
          <div className="text-[10px] font-medium text-slate-500 tracking-wide">{"Gestión de Compras"}</div>
        </div>
      </div>

      {/* User card — clickable to profile */}
      <div
        onClick={() => onNavigate('profile')}
        className="mx-3 mt-3 mb-1 px-3 py-2.5 bg-[rgba(255,255,255,0.04)] rounded-lg border border-white/[0.06] flex items-center gap-2.5 cursor-pointer hover:bg-[rgba(255,255,255,0.07)] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#1F2A44]/10 flex items-center justify-center text-[#C8A03A] font-semibold text-xs">
          {"AMs"}
        </div>
        <div className="text-sm font-medium text-white truncate flex-1">
          {currentUser}
        </div>
        {/* Notification bell */}
        <div onClick={(e) => e.stopPropagation()}>
          <NotificationBell onNavigate={onNavigate} />
        </div>
        {/* Theme toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
          className="w-7 h-7 rounded-md bg-[#F8F9FB]/[0.06] border-none cursor-pointer flex items-center justify-center text-sm hover:bg-[#F8F9FB]/[0.12] transition-colors"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-2 flex-1 overflow-y-auto">
        <SectionLabel>Principal</SectionLabel>
        {mainItems.map(item => (
          <NavItem key={item.key} item={item} active={screen === item.key} onClick={() => onNavigate(item.key)} />
        ))}

        {adminItems.length > 0 && (
          <>
            <SectionLabel>{"Administración"}</SectionLabel>
            {adminItems.map(item => (
              <NavItem key={item.key} item={item} active={screen === item.key} onClick={() => onNavigate(item.key)} />
            ))}
          </>
        )}

        <SectionLabel>Sistema</SectionLabel>
        <NavItem
          item={{ key: 'settings', icon: '🔧', label: 'Configuración' }}
          active={screen === 'settings'}
          onClick={() => onNavigate('settings')}
        />
        <NavItem
          item={{ key: 'help', icon: '💬', label: 'Ayuda' }}
          active={false}
          onClick={() => window.open('https://wa.me/595986354781?text=Hola%2C%20necesito%20ayuda%20con%20YPOTI%20Compras', '_blank')}
        />
      </nav>

      {/* New request button */}
      <div className="px-4 pb-3 pt-3">
        <button
          onClick={onNewRequest}
          className="w-full py-2.5 rounded-lg bg-[#1F2A44] hover:bg-[#1F2A44] text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border-none cursor-pointer"
          aria-label="Nueva Solicitud"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          Nueva Solicitud
        </button>
      </div>

      {/* USD Rate */}
      {usdRate && (
        <div className="px-5 pb-2 pt-1 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${usdLive ? 'bg-green-500' : 'bg-slate-500'}`} />
          <span className="text-[10px] text-slate-500 flex-1">
            TC: 1 USD = Gs {Number(usdRate).toLocaleString("es-PY")} {usdLive ? "(live)" : "(offline)"}
          </span>
          {onRefreshRate && (
            <button
              onClick={onRefreshRate}
              className="bg-transparent border-none cursor-pointer text-slate-500 hover:text-slate-300 transition-colors p-0"
              title="Actualizar tipo de cambio"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Footer links */}
      <div className="px-5 pb-4 pt-1 flex items-center gap-3">
        <a
          href="https://www.ypoti.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors no-underline flex items-center gap-1"
        >
          ypoti.com
          <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className="opacity-50">
            <path d="M3.5 3a.5.5 0 000 1h3.793L2.146 9.146a.5.5 0 00.708.708L8 4.707V8.5a.5.5 0 001 0v-5a.5.5 0 00-.5-.5h-5z"/>
          </svg>
        </a>
        <a
          href="https://www.instagram.com/mauriciomoller.ypoti/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 hover:text-slate-400 transition-colors"
          title="Instagram"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </a>
      </div>
    </aside>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pt-3.5 pb-1.5">
      {children}
    </div>
  );
}

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md border-none text-sm cursor-pointer mb-0.5 transition-all ${
        active
          ? 'bg-[#1F2A44]/10 text-[#C8A03A] font-semibold'
          : 'bg-transparent text-slate-400 font-normal hover:bg-[rgba(255,255,255,0.06)] hover:text-slate-200'
      }`}
    >
      <span className="text-[15px] w-5 text-center">{item.icon}</span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-px rounded-full min-w-[18px] text-center">
          {item.badge}
        </span>
      )}
    </button>
  );
}
