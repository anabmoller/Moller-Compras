import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

// ============================================================
// YPOTI — Cambio de Contrase&ntilde;a Obligatorio
// Se muestra cuando force_password_change = true
// ============================================================

export default function ChangePasswordScreen() {
  const { changePassword, currentUser, logout } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("Ingresa tu nueva contraseña");
      return;
    }
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (newPassword === "ypoti2026") {
      setError("No puedes usar la contraseña por defecto");
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(newPassword);
      if (!result.success) {
        setError(result.error || "Error al cambiar contraseña");
        setLoading(false);
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0b0f] min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-[440px]">
        {/* Brand header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-xl bg-emerald-500 inline-flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <span className="text-white text-2xl font-bold tracking-tight">Y</span>
          </div>
          <h1 className="text-[28px] font-bold text-white mb-1 tracking-tight">
            YPOTI Compras
          </h1>
          <p className="text-sm text-slate-400 m-0">
            Sistema de Gesti&oacute;n de Compras
          </p>
        </div>

        {/* Change password card */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] shadow-xl px-8 py-9">
          {/* Security icon */}
          <div className="w-11 h-11 rounded-lg bg-amber-500/[0.08] flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-white mb-1">
            Cambiar contrase&ntilde;a
          </h2>
          <p className="text-[13px] text-slate-400 mb-1.5 mt-0">
            {currentUser?.name ? `Hola, ${currentUser.name.split(" ")[0]}. ` : ""}
            Por seguridad, debes cambiar tu contrase&ntilde;a antes de continuar.
          </p>
          <p className="text-xs text-slate-500 mb-6 mt-0 px-3 py-2 bg-white/[0.02] rounded">
            La contrase&ntilde;a debe tener al menos 8 caracteres y no puede ser la contrase&ntilde;a por defecto.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-[13px] font-medium text-slate-300 mb-1.5">
                Nueva contrase&ntilde;a
              </label>
              <input
                type="password" value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                autoFocus
                className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 h-11 ${error && !newPassword ? 'border-red-500' : 'border-white/[0.1]'}`}
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-300 mb-1.5">
                Confirmar contrase&ntilde;a
              </label>
              <input
                type="password" value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="Repite la nueva contraseña"
                autoComplete="new-password"
                className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 h-11 ${error && newPassword && !confirmPassword ? 'border-red-500' : 'border-white/[0.1]'}`}
              />
            </div>

            {error && (
              <div className="bg-red-500/[0.06] border border-red-300/20 rounded-lg px-3.5 py-2.5 text-[13px] text-red-400 font-medium flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="#ef4444">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className={`w-full h-11 rounded-lg border-none text-white text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 mt-1 ${loading ? 'bg-slate-500 cursor-default' : 'bg-emerald-500 cursor-pointer'}`}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
                  Guardando...
                </>
              ) : "Cambiar contraseña y continuar"}
            </button>

            <button
              type="button"
              onClick={logout}
              className="bg-transparent border-none cursor-pointer text-slate-500 text-[13px] py-2 underline text-center"
            >
              Cerrar sesi&oacute;n
            </button>
          </form>
        </div>

        <div className="text-center mt-8 text-xs text-slate-500 leading-relaxed">
          Grupo Rural Bioenergia &middot; YPOTI Compras v3.0
        </div>
      </div>
    </div>
  );
}
