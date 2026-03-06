/**
 * Desktop sidebar navigation — dark mode, with theme toggle
 * Icons: lucide-react + BullIcon + CornIcon (custom SVGs)
 */
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../shared/NotificationBell";
import {
  LayoutDashboard, Bell, ShoppingCart, Fuel, Package,
  BarChart3, Shield, Users, Wallet, SlidersHorizontal, RotateCcw,
  Settings, MessageCircle, Sun, Moon, Plus, KeyRound,
  Truck, Database,
} from "lucide-react";
import { BullIcon, CornIcon } from "../icons";

const ICON_SIZE = 18;

export default function DesktopSidebar({ screen, onNavigate, onNewRequest, currentUser, canViewAnalytics, canManageUsers, canViewGanado, usdRate, usdLive, onRefreshRate }) {
  const { theme, toggleTheme } = useTheme();
  const { getVisibleNotifications } = useNotifications();
  const auth = useAuth();
  const unreadCount = getVisibleNotifications(auth.currentUser?.name, auth.currentUser?.role).filter(n => !n.read).length;

  const mainItems = [
    { key: 'panel', icon: <LayoutDashboard size={ICON_SIZE} />, label: 'Panel General' },
    { key: 'notifications', icon: <Bell size={ICON_SIZE} />, label: 'Notificaciones', badge: unreadCount || null },
    { key: 'dashboard', icon: <ShoppingCart size={ICON_SIZE} />, label: 'Compras' },
    ...(canViewGanado ? [{ key: 'ganado', icon: <BullIcon size={ICON_SIZE} />, label: 'Hacienda' }] : []),
    { key: 'materia_prima', icon: <CornIcon size={ICON_SIZE} />, label: 'Materia Prima' },
    { key: 'combustible', icon: <Fuel size={ICON_SIZE} />, label: 'Combustible' },
    { key: 'freight', icon: <Truck size={ICON_SIZE} />, label: 'Flete' },
    { key: 'inventory', icon: <Package size={ICON_SIZE} />, label: 'Inventario' },
    ...(canViewAnalytics ? [{ key: 'analytics', icon: <BarChart3 size={ICON_SIZE} />, label: 'Análisis' }] : []),
    ...(canViewAnalytics ? [{ key: 'reconciliation', icon: <Database size={ICON_SIZE} />, label: 'Conciliación' }] : []),
    ...(canManageUsers ? [{ key: 'security', icon: <Shield size={ICON_SIZE} />, label: 'Seguridad' }] : []),
  ];

  const adminItems = [
    ...(canManageUsers ? [{ key: 'users', icon: <Users size={ICON_SIZE} />, label: 'Usuarios' }] : []),
    ...(canManageUsers ? [{ key: 'permissions', icon: <KeyRound size={ICON_SIZE} />, label: 'Permisos' }] : []),
    ...(canViewAnalytics ? [{ key: 'budgets', icon: <Wallet size={ICON_SIZE} />, label: 'Presupuestos' }] : []),
    ...(canManageUsers ? [{ key: 'parameters', icon: <SlidersHorizontal size={ICON_SIZE} />, label: 'Parámetros' }] : []),
    ...(canManageUsers ? [{ key: 'approvalConfig', icon: <RotateCcw size={ICON_SIZE} />, label: 'Aprobaciones' }] : []),
  ];

  return (
    <aside className="desktop-sidebar bg-[var(--color-sidebar-bg)]">
      {/* Brand — clickable to go to Panel General */}
      <div
        onClick={() => onNavigate('panel')}
        className="px-5 pt-5 pb-4 border-b border-[var(--color-border)] flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="w-9 h-9 rounded-lg bg-[#1F2A44] flex items-center justify-center text-white font-bold text-base">
          AM
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text)] tracking-tight leading-tight m-0">SIGAM</h1>
          <div className="text-[10px] font-medium text-slate-500 tracking-wide">{"Sistema Integrado de Gestión"}</div>
        </div>
      </div>

      {/* User card — clickable to profile */}
      <div
        onClick={() => onNavigate('profile')}
        className="mx-3 mt-3 mb-1 px-3 py-2.5 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] flex items-center gap-2.5 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#1F2A44]/10 flex items-center justify-center text-[#C8A03A] font-semibold text-xs">
          {"AM"}
        </div>
        <div className="text-sm font-medium text-[var(--color-text)] truncate flex-1">
          {currentUser}
        </div>
        {/* Notification bell */}
        <div onClick={(e) => e.stopPropagation()}>
          <NotificationBell onNavigate={onNavigate} />
        </div>
        {/* Theme toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
          className="w-7 h-7 rounded-md bg-[var(--color-surface)] border-none cursor-pointer flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors text-slate-400"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
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
          item={{ key: 'settings', icon: <Settings size={ICON_SIZE} />, label: 'Configuración' }}
          active={screen === 'settings'}
          onClick={() => onNavigate('settings')}
        />
        <NavItem
          item={{ key: 'help', icon: <MessageCircle size={ICON_SIZE} />, label: 'Ayuda' }}
          active={false}
          onClick={() => window.open('https://wa.me/595986354781?text=Hola%2C%20necesito%20ayuda%20con%20YPOTI%20Compras', '_blank')}
        />
      </nav>

      {/* New request button */}
      <div className="px-4 pb-3 pt-3">
        <button
          onClick={onNewRequest}
          className="w-full py-2.5 rounded-lg bg-[var(--color-accent,#5B0B14)] hover:opacity-90 text-on-dark text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border-none cursor-pointer"
          aria-label="Nueva Solicitud"
        >
          <Plus size={14} />
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
          : 'bg-transparent text-slate-400 font-normal hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
      }`}
    >
      <span className="w-5 flex items-center justify-center flex-shrink-0">{item.icon}</span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-px rounded-full min-w-[18px] text-center">
          {item.badge}
        </span>
      )}
    </button>
  );
}
