import { useState } from "react";
import { colors, font, inputStyle, shadows, radius } from "../../styles/theme";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Ingresa tu usuario"); return; }
    if (!password) { setError("Ingresa tu contraseña"); return; }
    setLoading(true);
    setTimeout(() => {
      const result = login(email.trim(), password);
      if (!result.success) { setError(result.error); setLoading(false); }
    }, 400);
  };

  return (
    <div style={{
      fontFamily: font,
      background: colors.bg,
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: radius.lg,
            background: colors.primary,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
            boxShadow: `0 4px 16px ${colors.primary}30`,
          }}>
            <span style={{ color: "#fff", fontSize: 24, fontWeight: 700, fontFamily: font, letterSpacing: -1 }}>Y</span>
          </div>
          <h1 style={{
            fontFamily: font, fontSize: 28, fontWeight: 700,
            color: colors.text, margin: "0 0 4px", letterSpacing: "-0.02em",
          }}>
            YPOTI Compras
          </h1>
          <p style={{ fontSize: 14, color: colors.textLight, margin: 0 }}>
            Sistema de Gestión de Compras
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: colors.card, borderRadius: radius.xl,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.lg, padding: "36px 32px",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 4px" }}>
            Iniciar sesión
          </h2>
          <p style={{ fontSize: 13, color: colors.textLight, margin: "0 0 28px" }}>
            Ingresa tus credenciales para acceder
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textSecondary, marginBottom: 6 }}>
                Usuario
              </label>
              <input
                type="text" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="ej: ana.karina"
                autoComplete="username" autoCapitalize="none"
                style={{ ...inputStyle, height: 44, border: `1px solid ${error && !email.trim() ? colors.danger : colors.border}` }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textSecondary, marginBottom: 6 }}>
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  style={{ ...inputStyle, height: 44, paddingRight: 44, border: `1px solid ${error && !password ? colors.danger : colors.border}` }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", padding: "8px 10px", fontSize: 14, color: colors.textMuted }}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: colors.dangerLight, border: "1px solid #FECACA",
                borderRadius: radius.md, padding: "10px 14px",
                fontSize: 13, color: colors.danger, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill={colors.danger}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", height: 44, borderRadius: radius.md,
              border: "none",
              background: loading ? colors.textMuted : colors.primary,
              color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: font,
              cursor: loading ? "default" : "pointer",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginTop: 4,
            }}>
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Verificando...
                </>
              ) : "Ingresar"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>
          Grupo Rural Bioenergia · YPOTI Compras v3.0
        </div>
      </div>
    </div>
  );
}
