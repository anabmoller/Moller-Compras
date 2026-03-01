/**
 * NotificationsScreen — full-page notification list
 */
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { relativeTime } from "../../utils/dateFormatters";

export default function NotificationsScreen({ onBack, onNavigate }) {
  const { currentUser } = useAuth();
  const { getVisibleNotifications, markAsRead, markAllAsRead, TYPE_ICONS, TYPE_COLORS } = useNotifications();

  const visible = getVisibleNotifications(currentUser?.name, currentUser?.role);
  const unreadCount = visible.filter(n => !n.read).length;

  const handleClick = (notif) => {
    markAsRead(notif.id);
    if (notif.requestId && onNavigate) {
      onNavigate("request", notif.requestId);
    }
  };

  return (
    <div className="animate-fadeIn pb-10">
      <div className="px-5 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="bg-transparent border-none cursor-pointer text-sm text-emerald-400 font-medium"
        >
          ← Volver
        </button>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-transparent border-none cursor-pointer text-xs text-emerald-400 font-medium"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="px-5 mb-4">
        <h2 className="text-[22px] font-semibold text-white m-0">Notificaciones</h2>
        <div className="text-[13px] text-slate-400 mt-1">
          {unreadCount > 0 ? `${unreadCount} sin leer` : "Todas leídas"}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-1.5">
        {visible.length === 0 ? (
          <div className="text-center p-10 text-slate-400 text-sm">
            Sin notificaciones
          </div>
        ) : (
          visible.map(notif => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border cursor-pointer transition-colors flex gap-3 items-start ${
                notif.read
                  ? 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]'
                  : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07]'
              }`}
            >
              {/* Unread dot */}
              <div className="flex-shrink-0 pt-2">
                {!notif.read ? (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                ) : (
                  <div className="w-2 h-2" />
                )}
              </div>

              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                style={{ background: (TYPE_COLORS[notif.type] || "#64748b") + "15", color: TYPE_COLORS[notif.type] || "#64748b" }}
              >
                {TYPE_ICONS[notif.type] || "🔔"}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] leading-relaxed ${notif.read ? 'text-slate-400' : 'text-white font-medium'}`}>
                  {notif.message}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {relativeTime(notif.timestamp)}
                  {notif.requestId && <span className="ml-2 text-slate-600">· {notif.requestId}</span>}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
