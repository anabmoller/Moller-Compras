import { colors, font, fontDisplay, shadows, radius } from "../../styles/theme";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/users";
import BackButton from "../common/BackButton";

export default function SettingsScreen({ onBack, onNavigate }) {
  const { currentUser, logout, can } = useAuth();
  const role = ROLES[currentUser.role];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <BackButton onClick={onBack} />

      <div style={{ padding: "0 20px 16px" }}>
        <h2 style={{
          fontFamily: fontDisplay, fontSize: 22, fontWeight: 600,
          color: colors.text, margin: "0 0 20px",
        }}>
          Configuración
        </h2>

        {/* User Profile Card */}
        <div style={{
          background: colors.card, borderRadius: radius.xl, padding: 20,
          border: `1px solid ${colors.borderLight}`, marginBottom: 16,
          textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: radius.xl,
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 22,
            margin: "0 auto 12px",
          }}>
            {currentUser.avatar}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
            {currentUser.name}
          </div>
          <div style={{
            fontSize: 13, color: colors.textLight, marginTop: 2,
          }}>
            {currentUser.email}
          </div>
          <div style={{
            display: "inline-block", marginTop: 8,
            fontSize: 11, fontWeight: 600,
            color: colors.primary,
            background: colors.primary + "12",
            padding: "4px 12px", borderRadius: radius.md,
          }}>
            {role.label}
          </div>
        </div>

        {/* Role Info */}
        <div style={{
          background: colors.card, borderRadius: radius.xl, padding: 16,
          border: `1px solid ${colors.borderLight}`, marginBottom: 16,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: colors.textLight,
            marginBottom: 10, textTransform: "uppercase", letterSpacing: 1,
          }}>
            Tu Rol y Permisos
          </div>
          <div style={{ fontSize: 13, color: colors.text, marginBottom: 12 }}>
            {role.description}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {role.permissions.map(p => (
              <span key={p} style={{
                fontSize: 10, fontWeight: 500,
                color: colors.success,
                background: colors.success + "10",
                padding: "3px 8px", borderRadius: radius.sm,
              }}>
                {p.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>

        {/* App Info */}
        <div style={{
          background: colors.card, borderRadius: radius.xl, padding: 16,
          border: `1px solid ${colors.borderLight}`, marginBottom: 16,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: colors.textLight,
            marginBottom: 10, textTransform: "uppercase", letterSpacing: 1,
          }}>
            Información del Sistema
          </div>
          <SettingsRow label="Versión" value="4.0.0 (Supabase)" />
          <SettingsRow label="Establecimiento" value={currentUser.establishment} />
          <SettingsRow label="Datos" value="Supabase Cloud" />
        </div>

        {/* Data Management */}
        {can("manage_settings") && (
          <div style={{
            background: colors.card, borderRadius: radius.xl, padding: 16,
            border: `1px solid ${colors.borderLight}`, marginBottom: 16,
          }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: colors.textLight,
              marginBottom: 10, textTransform: "uppercase", letterSpacing: 1,
            }}>
              Administración
            </div>
            {can("manage_users") && (
              <AdminButton icon="👥" label="Gestión de Usuarios" onClick={() => onNavigate("users")} color={colors.primary} />
            )}
            {can("view_analytics") && (
              <AdminButton icon="💰" label="Gestión de Presupuestos" onClick={() => onNavigate("budgets")} color={colors.primary} />
            )}
            {can("manage_settings") && (
              <AdminButton icon="⚙" label="Parámetros del Sistema" onClick={() => onNavigate("parameters")} color={colors.primary} />
            )}
            {can("manage_settings") && (
              <AdminButton icon="🔄" label="Autorización y Aprobación" onClick={() => onNavigate("approvalConfig")} color={colors.primary} />
            )}
            <button
              onClick={() => {
                if (window.confirm("\u00BFRecargar la aplicaci\u00F3n y refrescar datos desde el servidor?")) {
                  window.location.reload();
                }
              }}
              style={{
                width: "100%", padding: "12px", borderRadius: radius.lg,
                border: `1px solid ${colors.warning}40`,
                background: colors.warning + "08",
                color: colors.warning,
                fontSize: 13, fontWeight: 600, fontFamily: font,
                cursor: "pointer", marginBottom: 8,
              }}
            >
              Recargar datos del servidor
            </button>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            width: "100%", padding: "14px", borderRadius: radius.lg,
            border: "none",
            background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`,
            color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: font,
            cursor: "pointer", marginBottom: 120,
            boxShadow: `0 4px 16px ${colors.accent}30`,
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

function AdminButton({ icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "12px", borderRadius: radius.lg,
        border: `1px solid ${color}40`,
        background: color + "08",
        color: color,
        fontSize: 13, fontWeight: 600, fontFamily: font,
        cursor: "pointer", marginBottom: 8,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  );
}

function SettingsRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "8px 0", borderBottom: `1px solid ${colors.borderLight}`,
    }}>
      <span style={{ fontSize: 13, color: colors.textLight }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{value}</span>
    </div>
  );
}
