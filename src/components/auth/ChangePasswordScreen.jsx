import { useState } from "react";
import { colors, font, inputStyle, shadows, radius } from "../../styles/theme";
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

    // Validations
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
      // On success, AuthContext updates profile.force_password_change = false
      // and App.jsx will re-render showing the main app
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
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
            Sistema de Gesti&oacute;n de Compras
          </p>
        </div>

        {/* Change password card */}
        <div style={{
          background: colors.card, borderRadius: radius.xl,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.lg, padding: "36px 32px",
        }}>
          {/* Security icon */}
          <div style={{
            width: 44, height: 44, borderRadius: radius.md,
            background: colors.warningLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 4px" }}>
            Cambiar contrase&ntilde;a
          </h2>
          <p style={{ fontSize: 13, color: colors.textLight, margin: "0 0 6px" }}>
            {currentUser?.name ? `Hola, ${currentUser.name.split(" ")[0]}. ` : ""}
            Por seguridad, debes cambiar tu contrase&ntilde;a antes de continuar.
          </p>
          <p style={{
            fontSize: 12, color: colors.textMuted, margin: "0 0 24px",
            padding: "8px 12px", background: colors.surface, borderRadius: radius.sm,
          }}>
            La contrase&ntilde;a debe tener al menos 8 caracteres y no puede ser la contrase&ntilde;a por defecto.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textSecondary, marginBottom: 6 }}>
                Nueva contrase&ntilde;a
              </label>
              <input
                type="password" value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                autoFocus
                style={{ ...inputStyle, height: 44, border: `1px solid ${error && !newPassword ? colors.danger : colors.border}` }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textSecondary, marginBottom: 6 }}>
                Confirmar contrase&ntilde;a
              </label>
              <input
                type="password" value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="Repite la nueva contraseña"
                autoComplete="new-password"
                style={{ ...inputStyle, height: 44, border: `1px solid ${error && newPassword && !confirmPassword ? colors.danger : colors.border}` }}
              />
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
                  Guardando...
                </>
              ) : "Cambiar contraseña y continuar"}
            </button>

            <button
              type="button"
              onClick={logout}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: colors.textMuted, fontSize: 13, fontFamily: font,
                padding: "8px 0", textDecoration: "underline",
                textAlign: "center",
              }}
            >
              Cerrar sesi&oacute;n
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>
          Grupo Rural Bioenergia &middot; YPOTI Compras v3.0
        </div>
      </div>
    </div>
  );
}
