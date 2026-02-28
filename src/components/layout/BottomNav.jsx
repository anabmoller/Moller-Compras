import { colors, font, radius } from "../../styles/theme";

export default function BottomNav({ screen, onNavigate, onNewRequest }) {
  const items = [
    { key: "dashboard", icon: "📋", label: "Solicitudes" },
    { key: "inventory", icon: "📦", label: "Inventario" },
    { key: "analytics", icon: "📊", label: "Análisis" },
    { key: "settings", icon: "⚙️", label: "Config" },
  ];

  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      maxWidth: 480,
      width: "100%",
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(12px)",
      borderTop: `1px solid ${colors.border}`,
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      padding: "6px 0 env(safe-area-inset-bottom, 16px)",
      zIndex: 100,
    }}>
      {items.slice(0, 2).map(item => (
        <NavBtn key={item.key} item={item} active={screen === item.key} onClick={() => onNavigate(item.key)} />
      ))}

      {/* Center FAB */}
      <button
        onClick={onNewRequest}
        style={{
          width: 48, height: 48, borderRadius: radius.lg,
          background: colors.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "none", cursor: "pointer",
          boxShadow: `0 4px 14px ${colors.primary}40`,
          marginTop: -16,
          transition: "transform 0.15s",
        }}
        onMouseDown={e => e.currentTarget.style.transform = "scale(0.93)"}
        onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="#fff">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
        </svg>
      </button>

      {items.slice(2).map(item => (
        <NavBtn key={item.key} item={item} active={screen === item.key} onClick={() => onNavigate(item.key)} />
      ))}
    </nav>
  );
}

function NavBtn({ item, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", border: "none",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
      cursor: "pointer", padding: "4px 12px",
    }}>
      <span style={{ fontSize: 18, opacity: active ? 1 : 0.4 }}>{item.icon}</span>
      <span style={{
        fontSize: 10, fontFamily: font, fontWeight: active ? 600 : 450,
        color: active ? colors.primary : colors.textMuted,
      }}>
        {item.label}
      </span>
    </button>
  );
}
