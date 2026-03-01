/**
 * NotificationBell — bell icon with dropdown notification panel
 */
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { relativeTime } from "../../utils/dateFormatters";

export default function NotificationBell({ onNavigate }) {
  const { currentUser } = useAuth();
  const { getVisibleNotifications, markAsRead, markAllAsRead, TYPE_ICONS, TYPE_COLORS } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const visible = getVisibleNotifications(currentUser?.name, currentUser?.role);
  const unreadCount = visible.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (notif) => {
    markAsRead(notif.id);
    if (notif.requestId && onNavigate) {
      onNavigate("request", notif.requestId);
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-9 h-9 rounded-lg bg-white/[0.06] border-none cursor-pointer flex items-center justify-center text-base hover:bg-white/[0.12] transition-colors relative"
        title="Notificaciones"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] bg-[#14151c] border border-white/[0.08] rounded-xl shadow-2xl z-[200] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.06] flex justify-between items-center">
            <span className="text-sm font-semibold text-white">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-[11px] text-emerald-400 font-medium bg-transparent border-none cursor-pointer hover:text-emerald-300"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {visible.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Sin notificaciones
              </div>
            ) : (
              visible.slice(0, 20).map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.04] cursor-pointer transition-colors flex gap-3 items-start ${
                    notif.read ? 'bg-transparent hover:bg-white/[0.03]' : 'bg-white/[0.02] hover:bg-white/[0.05]'
                  } border-none`}
                >
                  {/* Unread dot */}
                  <div className="flex-shrink-0 pt-1.5">
                    {!notif.read ? (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    ) : (
                      <div className="w-2 h-2" />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ background: (TYPE_COLORS[notif.type] || "#64748b") + "15", color: TYPE_COLORS[notif.type] || "#64748b" }}
                  >
                    {TYPE_ICONS[notif.type] || "🔔"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs leading-relaxed line-clamp-2 ${notif.read ? 'text-slate-400' : 'text-white font-medium'}`}>
                      {notif.message}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {relativeTime(notif.timestamp)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* line-clamp CSS */}
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
