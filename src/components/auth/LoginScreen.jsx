import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import BrandMark from "../../brand/BrandMark";
import { SYSTEM_NAME, FOOTER_TEXT } from "../../brand/brand";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) { setError("Ingresa tu usuario"); return; }
    if (!password) { setError("Ingresa tu contraseña"); return; }
    setLoading(true);
    try {
      const result = await login(username.trim(), password);
      if (!result.success) {
        setError(result.error);
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
          <BrandMark size="xl" className="inline-flex mb-4 shadow-lg shadow-[#1F2A44]/30" />
          <h1 className="text-[28px] font-bold text-white mb-1 tracking-tight">
            {SYSTEM_NAME}
          </h1>
          <p className="text-sm text-slate-400 m-0">
            Sistema de Gesti&oacute;n de Compras
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] shadow-xl px-8 py-9">
          <h2 className="text-lg font-semibold text-white mb-1">
            Iniciar sesi&oacute;n
          </h2>
          <p className="text-[13px] text-slate-400 mb-7 mt-0">
            Ingresa tus credenciales para acceder
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-[13px] font-medium text-slate-300 mb-1.5">
                Usuario
              </label>
              <input
                type="text" value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="ej: ana.moller"
                autoComplete="username" autoCapitalize="none"
                className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-[#C8A03A]/50 h-11 ${error && !username.trim() ? 'border-red-500' : 'border-white/[0.1]'}`}
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-300 mb-1.5">
                Contrase&ntilde;a
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-[#C8A03A]/50 h-11 pr-11 ${error && !password ? 'border-red-500' : 'border-white/[0.1]'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer px-2.5 py-2 text-sm text-slate-500"
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/[0.06] border border-red-300/20 rounded-lg px-3.5 py-2.5 text-[13px] text-red-400 font-medium flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="#ef4444">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className={`w-full h-11 rounded-lg border-none text-white text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 mt-1 ${loading ? 'bg-slate-500 cursor-default' : 'bg-[#C8A03A] cursor-pointer'}`}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
                  Verificando...
                </>
              ) : "Ingresar"}
            </button>
          </form>
        </div>

        <div className="text-center mt-8 text-xs text-slate-500 leading-relaxed">
          {FOOTER_TEXT}
        </div>
      </div>
    </div>
  );
}
