/**
 * MobileDrawer — slide-out from left with all nav items (role-gated)
 * Icons: lucide-react + CornIcon + BullIcon (custom SVGs)
 */
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Bell, ShoppingCart, Fuel, Package,
  BarChart3, Shield, Users, Wallet, SlidersHorizontal, RotateCcw,
  Settings, Plus, X, KeyRound, Truck, Database,
} from "lucide-react";
import { BullIcon, CornIcon } from "../icons";

const ICON_SIZE = 18;

export default function MobileDrawer({ open, onClose, screen, onNavigate, onNewRequest, currentUser, canViewAnalytics, canManageUsers, canViewGanado }) {
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

  const handleNav = (key) => {
    onNavigate(key);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 bottom-0 w-[280px] bg-[var(--color-sidebar-bg)] z-[101] shadow-2xl transition-transform duration-300 flex flex-col"
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#1F2A44] flex items-center justify-center text-white font-bold text-base">
              AM
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--color-text)] tracking-tight leading-tight">SIGAM</div>
              <div className="text-[10px] font-medium text-slate-500 tracking-wide">Sistema Integrado de Gestión</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer flex items-center justify-center text-slate-400 hover:bg-[#F8F9FB]/[0.06] transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* User card */}
        <div
          onClick={() => handleNav('profile')}
          className="mx-3 mt-3 mb-1 px-3 py-2.5 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] flex items-center gap-2.5 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#1F2A44]/10 flex items-center justify-center text-[#C8A03A] font-semibold text-xs">
            {currentUser?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="text-sm font-medium text-[var(--color-text)] truncate flex-1">
            {currentUser}
          </div>
        </div>

        {/* Nav items */}
        <nav className="px-3 py-2 flex-1 overflow-y-auto">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pt-3 pb-1.5">Principal</div>
          {mainItems.map(item => (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md border-none text-sm cursor-pointer mb-0.5 transition-all ${
                screen === item.key
                  ? 'bg-[#1F2A44]/10 text-[#C8A03A] font-semibold'
                  : 'bg-transparent text-slate-400 font-normal hover:bg-[var(--color-surface-hover)]'
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
          ))}

          {adminItems.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pt-3.5 pb-1.5">Administración</div>
              {adminItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md border-none text-sm cursor-pointer mb-0.5 transition-all ${
                    screen === item.key
                      ? 'bg-[#1F2A44]/10 text-[#C8A03A] font-semibold'
                      : 'bg-transparent text-slate-400 font-normal hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  <span className="w-5 flex items-center justify-center flex-shrink-0">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              ))}
            </>
          )}

          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pt-3.5 pb-1.5">Sistema</div>
          <button
            onClick={() => handleNav('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md border-none text-sm cursor-pointer mb-0.5 transition-all ${
              screen === 'settings'
                ? 'bg-[#1F2A44]/10 text-[#C8A03A] font-semibold'
                : 'bg-transparent text-slate-400 font-normal hover:bg-[var(--color-surface-hover)]'
            }`}
          >
            <span className="w-5 flex items-center justify-center flex-shrink-0"><Settings size={ICON_SIZE} /></span>
            <span className="flex-1 text-left">Configuración</span>
          </button>
        </nav>

        {/* New request button */}
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={() => { onNewRequest(); onClose(); }}
            className="w-full py-2.5 rounded-lg bg-[var(--color-accent,#5B0B14)] hover:opacity-90 text-on-dark text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border-none cursor-pointer"
          >
            <Plus size={14} />
            Nueva Solicitud
          </button>
        </div>
      </div>
    </>
  );
}
