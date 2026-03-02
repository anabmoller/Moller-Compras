import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/users";
import BackButton from "../common/BackButton";

const DEV_USERS = [
  { name: "Ramón Sosa", username: "ramon.sosa", role: "solicitante", label: "Solicitante" },
  { name: "Paulo Becker", username: "paulo", role: "gerente", label: "Autoriza / Aprueba hasta ₲5M" },
  { name: "Laura Rivas", username: "laura.rivas", role: "compras", label: "Presupuesta (Compras)" },
  { name: "Ronei Barrios", username: "ronei", role: "director", label: "Autoriza todo / Aprueba hasta ₲50M" },
  { name: "Mauricio Moller", username: "mauricio", role: "super_approver", label: "Autoriza y aprueba cualquier monto" },
];

export default function SettingsScreen({ onBack, onNavigate, devMode, onSetDevMode }) {
  const { currentUser, logout, can } = useAuth();
  const role = ROLES[currentUser.role];

  return (
    <div className="animate-fadeIn">
      <BackButton onClick={onBack} />

      <div className="px-5 pb-[120px] md:pb-8">
        <h2 className="text-[22px] font-semibold text-white mb-5 mt-0">
          Configuración
        </h2>

        {/* User Profile Card */}
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] mb-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1F2A44] flex items-center justify-center text-white font-bold text-[22px] mx-auto mb-3">
            {currentUser.avatar}
          </div>
          <div className="text-lg font-semibold text-white">
            {currentUser.name}
          </div>
          <div className="text-[13px] text-slate-400 mt-0.5">
            {currentUser.email}
          </div>
          <div className="inline-block mt-2 text-[11px] font-semibold text-[#C8A03A] bg-[#C8A03A]/[0.07] px-3 py-1 rounded-lg">
            {role.label}
          </div>
        </div>

        {/* Role Info */}
        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] mb-4">
          <div className="text-xs font-semibold text-slate-400 mb-2.5 uppercase tracking-wide">
            Tu Rol y Permisos
          </div>
          <div className="text-[13px] text-white mb-3">
            {role.description}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {role.permissions.map(p => (
              <span key={p} className="text-[10px] font-medium text-[#C8A03A] bg-[#C8A03A]/[0.06] px-2 py-0.5 rounded">
                {p.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] mb-4">
          <div className="text-xs font-semibold text-slate-400 mb-2.5 uppercase tracking-wide">
            Información del Sistema
          </div>
          <SettingsRow label="Versión" value="4.0.0 (Supabase)" />
          <SettingsRow label="Establecimiento" value={currentUser.establishment} />
          <SettingsRow label="Datos" value="Supabase Cloud" />
        </div>

        {/* Data Management */}
        {can("manage_settings") && (
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] mb-4">
            <div className="text-xs font-semibold text-slate-400 mb-2.5 uppercase tracking-wide">
              Administración
            </div>
            {can("manage_users") && (
              <AdminButton icon="👥" label="Gestión de Usuarios" onClick={() => onNavigate("users")} />
            )}
            {can("view_analytics") && (
              <AdminButton icon="💰" label="Gestión de Presupuestos" onClick={() => onNavigate("budgets")} />
            )}
            {can("manage_settings") && (
              <AdminButton icon="⚙" label="Parámetros del Sistema" onClick={() => onNavigate("parameters")} />
            )}
            {can("manage_settings") && (
              <AdminButton icon="🔄" label="Autorización y Aprobación" onClick={() => onNavigate("approvalConfig")} />
            )}
            <button
              onClick={() => {
                if (window.confirm("¿Recargar la aplicación y refrescar datos desde el servidor?")) {
                  window.location.reload();
                }
              }}
              className="w-full p-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.05] text-amber-400 text-[13px] font-semibold cursor-pointer mb-2"
            >
              Recargar datos del servidor
            </button>
          </div>
        )}

        {/* Modo Desarrollador — only in development builds */}
        {import.meta.env.DEV && can("manage_users") && (
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-amber-500/20 mb-4">
            <div className="text-xs font-semibold text-amber-400 mb-2.5 uppercase tracking-wide">
              🛠 Modo Desarrollador
            </div>
            <div className="text-[11px] text-slate-400 mb-3">
              Simular la vista de otro usuario (solo visual)
            </div>
            <div className="flex flex-col gap-1.5">
              {DEV_USERS.map(u => (
                <button
                  key={u.name}
                  onClick={() => onSetDevMode && onSetDevMode({ name: u.name, role: u.role, label: u.label, username: u.username })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-left text-[13px] font-medium cursor-pointer transition-colors flex items-center justify-between ${
                    devMode?.name === u.name
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{u.name} <span className="text-slate-500">({u.label})</span></span>
                  <span className="text-[11px] font-semibold text-[#C8A03A]">Entrar →</span>
                </button>
              ))}
            </div>
            {devMode && (
              <button
                onClick={() => onSetDevMode && onSetDevMode(null)}
                className="w-full mt-2 py-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.06] text-red-400 text-xs font-semibold cursor-pointer"
              >
                Salir del modo desarrollador
              </button>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-3.5 rounded-xl border-none bg-gradient-to-br from-blue-400 to-blue-500 text-white text-sm font-semibold cursor-pointer mb-[120px] shadow-lg shadow-blue-500/20"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

function AdminButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#C8A03A] text-[13px] font-semibold cursor-pointer mb-2 flex items-center justify-center gap-2"
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  );
}

function SettingsRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-white/[0.06]">
      <span className="text-[13px] text-slate-400">{label}</span>
      <span className="text-[13px] font-medium text-white">{value}</span>
    </div>
  );
}
