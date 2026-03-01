import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

export default function ProfileScreen({ onBack, currentUser }) {
  const { logout } = useAuth();
  const { showNotif } = useApp();

  const name = currentUser?.name || "Ana Beatriz Moller";
  const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const role = currentUser?.role || "admin";
  const roleLabel = role === "admin" ? "Administrador" : role === "gerente" ? "Gerente" : "Usuario";

  return (
    <div className="pb-10 animate-fade-in">
      <div className="px-5 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="bg-transparent border-none cursor-pointer text-sm text-blue-400 font-medium"
        >
          ← Volver
        </button>
        <span className="text-xs text-slate-400 font-medium">Perfil</span>
      </div>

      <div className="px-5 flex flex-col items-center pt-4">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center text-2xl font-bold text-emerald-400 mb-3 border-2 border-emerald-500/20">
          {initials}
        </div>
        <h2 className="text-xl font-bold text-white m-0">{name}</h2>
        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full mt-1.5">
          {roleLabel}
        </span>
      </div>

      <div className="px-5 mt-6 flex flex-col gap-2">
        <InfoRow label="Cargo" value={currentUser?.cargo || roleLabel} />
        <InfoRow label="Establecimiento" value={currentUser?.establishment || "General"} />
        <InfoRow label="Email" value={currentUser?.email || "—"} />
        <InfoRow label="Teléfono" value={currentUser?.phone || "No registrado"} />
        <InfoRow label="Último acceso" value={new Date().toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
      </div>

      <div className="px-5 mt-6 flex flex-col gap-2.5">
        <button
          onClick={() => showNotif("Redirigiendo a cambio de contraseña...", "info")}
          className="w-full py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white text-sm font-semibold cursor-pointer hover:bg-white/[0.06] transition-colors"
        >
          🔒 Cambiar contraseña
        </button>
        <button
          onClick={() => {
            if (typeof logout === "function") logout();
            else showNotif("Sesión cerrada", "info");
          }}
          className="w-full py-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] text-red-400 text-sm font-semibold cursor-pointer hover:bg-red-500/[0.1] transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="bg-white/[0.03] rounded-lg px-4 py-3 border border-white/[0.06] flex justify-between items-center">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}
