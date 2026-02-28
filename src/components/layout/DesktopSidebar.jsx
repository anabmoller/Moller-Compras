import { colors, font, radius, shadows } from "../../styles/theme";

export default function DesktopSidebar({ screen, onNavigate, onNewRequest, currentUser, canViewAnalytics, canManageUsers }) {
  const mainItems = [
    { key: "dashboard", icon: "📋", label: "Solicitudes" },
    { key: "inventory", icon: "📦", label: "Inventario" },
    ...(canViewAnalytics ? [{ key: "analytics", icon: "📊", label: "Análisis" }] : []),
  ];

  const adminItems = [
    ...(canManageUsers ? [{ key: "users", icon: "👥", label: "Usuarios" }] : []),
    ...(canViewAnalytics ? [{ key: "budgets", icon: "💰", label: "Presupuestos" }] : []),
    ...(canManageUsers ? [{ key: "parameters", icon: "⚙️", label: "Parámetros" }] : []),
    ...(canManageUsers ? [{ key: "approvalConfig", icon: "🔄", label: "Aprobaciones" }] : []),
  ];

  return (
    <aside className="desktop-sidebar" style={{ background: colors.card }}>
      {/* Brand */}
      <div style={{
        padding: "20px 20px 16px",
        borderBottom: `1px solid ${colors.border}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: radius.md,
          background: colors.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: font,
        }}>Y</div>
        <div>
          <h1 style={{
            fontFamily: font, fontSize: 18, margin: 0,
            fontWeight: 700, color: colors.text,
            letterSpacing: "-0.02em", lineHeight: 1.1,
          }}>YPOTI</h1>
          <div style={{
            fontSize: 10, fontWeight: 500, color: colors.textMuted,
            letterSpacing: "0.02em",
          }}>
            Gestión de Compras
          </div>
        </div>
      </div>

      {/* User card */}
      <div style={{
        margin: "12px 12px 4px", padding: "10px 12px",
        background: colors.surface, borderRadius: radius.md,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: radius.full,
          background: colors.primaryLight,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: colors.primary, fontWeight: 600, fontSize: 13,
        }}>
          {currentUser.charAt(0)}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 500, color: colors.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {currentUser}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "8px 12px", flex: 1, overflowY: "auto" }}>
        <SectionLabel>Principal</SectionLabel>
        {mainItems.map(item => (
          <NavItem key={item.key} item={item} active={screen === item.key} onClick={() => onNavigate(item.key)} />
        ))}

        {adminItems.length > 0 && (
          <>
            <SectionLabel>Administración</SectionLabel>
            {adminItems.map(item => (
              <NavItem key={item.key} item={item} active={screen === item.key} onClick={() => onNavigate(item.key)} />
            ))}
          </>
        )}

        <SectionLabel>Sistema</SectionLabel>
        <NavItem item={{ key: "settings", icon: "🔧", label: "Configuración" }} active={screen === "settings"} onClick={() => onNavigate("settings")} />
      </nav>

      {/* New request button */}
      <div style={{ padding: "12px 16px 20px" }}>
        <button
          onClick={onNewRequest}
          style={{
            width: "100%", padding: "11px", borderRadius: radius.md,
            border: "none",
            background: colors.primary,
            color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: font,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = colors.primaryDark}
          onMouseLeave={e => e.currentTarget.style.background = colors.primary}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          Nueva Solicitud
        </button>
      </div>
    </aside>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: colors.textMuted,
      textTransform: "uppercase", letterSpacing: "0.08em",
      padding: "14px 12px 6px",
    }}>
      {children}
    </div>
  );
}

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: radius.sm, border: "none",
        background: active ? colors.primaryLight : "transparent",
        color: active ? colors.primary : colors.textSecondary,
        fontWeight: active ? 600 : 450,
        fontSize: 13, fontFamily: font, cursor: "pointer",
        marginBottom: 1, transition: "all 0.12s",
      }}
    >
      <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
      {item.label}
    </button>
  );
}
