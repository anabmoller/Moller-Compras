import { ROLES } from "../../constants/users";

export default function UserCard({ user, onEdit, onToggleActive, disabled }) {
  const role = ROLES[user.role];
  const isActive = user.active !== false;

  return (
    <div
      className={`bg-white/[0.03] rounded-xl px-3.5 py-3 border border-white/[0.06] flex items-center gap-3 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-50'}`}
    >
      {/* Avatar */}
      <div
        className="w-[38px] h-[38px] rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-[13px]"
        style={{ background: `linear-gradient(135deg, ${role?.color || '#10b981'} 0%, ${role?.color || '#10b981'}cc 100%)` }}
      >
        {user.avatar || user.name.charAt(0)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="text-sm font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">
          {user.name}
        </div>
        <div className="text-[11px] text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
          @{user.email || user.username} · {user.position || "—"} · {user.establishment}
        </div>
      </div>

      {/* Role badge */}
      <div
        className="text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0"
        style={{
          background: (role?.color || '#10b981') + "15",
          color: role?.color || '#10b981',
        }}
      >
        {role?.label || user.role}
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          disabled={disabled}
          className="w-8 h-8 rounded-lg border-none bg-white/[0.02] cursor-pointer flex items-center justify-center text-sm"
          title="Editar"
        >
          ✏
        </button>
        <button
          onClick={onToggleActive}
          disabled={disabled}
          className={`w-8 h-8 rounded-lg border-none cursor-pointer flex items-center justify-center text-sm ${isActive ? 'bg-red-500/[0.06]' : 'bg-green-500/[0.06]'}`}
          title={isActive ? "Desactivar" : "Activar"}
        >
          {isActive ? "🚫" : "✅"}
        </button>
      </div>
    </div>
  );
}
