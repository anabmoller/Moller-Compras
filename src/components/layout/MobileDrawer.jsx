/**
 * MobileDrawer — slide-out from left with all nav items (role-gated)
 */
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";

export default function MobileDrawer({ open, onClose, screen, onNavigate, onNewRequest, currentUser, canViewAnalytics, canManageUsers }) {
  const { getVisibleNotifications } = useNotifications();
  const auth = useAuth();
  const unreadCount = getVisibleNotifications(auth.currentUser?.name, auth.currentUser?.role).filter(n => !n.read).length;

  const mainItems = [
    { key: 'dashboard', icon: '📋', label: 'Solicitudes' },
    { key: 'notifications', icon: '🔔', label: 'Notificaciones', badge: unreadCount || null },
    { key: 'inventory', icon: '📦', label: 'Inventario' },
    ...(canViewAnalytics ? [{ key: 'analytics', icon: '📊', label: 'Análisis' }] : []),
    ...(canManageUsers ? [{ key: 'security', icon: '🛡️', label: 'Seguridad' }] : []),
  ];

  const adminItems = [
    ...(canManageUsers ? [{ key: 'users', icon: '👥', label: 'Usuarios' }] : []),
    ...(canViewAnalytics ? [{ key: 'budgets', icon: '💰', label: 'Presupuestos' }] : []),
    ...(canManageUsers ? [{ key: 'parameters', icon: '⚙️', label: 'Parámetros' }] : []),
    ...(canManageUsers ? [{ key: 'approvalConfig', icon: '🔄', label: 'Aprobaciones' }] : []),
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
        className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0d0e14] z-[101] shadow-2xl transition-transform duration-300 flex flex-col"
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base">
              Y
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-tight leading-tight">YPOTI</div>
              <div className="text-[10px] font-medium text-slate-500 tracking-wide">Gestión de Compras</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer flex items-center justify-center text-slate-400 hover:bg-white/[0.06] transition-colors"
            aria-label="Cerrar menú"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        {/* User card */}
        <div
          onClick={() => handleNav('profile')}
          className="mx-3 mt-3 mb-1 px-3 py-2.5 bg-[rgba(255,255,255,0.04)] rounded-lg border border-white/[0.06] flex items-center gap-2.5 cursor-pointer hover:bg-[rgba(255,255,255,0.07)] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-semibold text-xs">
            {currentUser?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="text-sm font-medium text-white truncate flex-1">
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
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'bg-transparent text-slate-400 font-normal hover:bg-[rgba(255,255,255,0.06)]'
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
                      ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                      : 'bg-transparent text-slate-400 font-normal hover:bg-[rgba(255,255,255,0.06)]'
                  }`}
                >
                  <span className="text-[15px] w-5 text-center">{item.icon}</span>
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
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                : 'bg-transparent text-slate-400 font-normal hover:bg-[rgba(255,255,255,0.06)]'
            }`}
          >
            <span className="text-[15px] w-5 text-center">🔧</span>
            <span className="flex-1 text-left">Configuración</span>
          </button>
        </nav>

        {/* New request button */}
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={() => { onNewRequest(); onClose(); }}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border-none cursor-pointer"
          >
            + Nueva Solicitud
          </button>
        </div>
      </div>
    </>
  );
}
