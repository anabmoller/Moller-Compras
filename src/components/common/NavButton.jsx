import { colors, font } from "../../styles/theme";

export default function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        cursor: "pointer",
        padding: "4px 12px",
      }}
    >
      <span style={{ fontSize: 20, opacity: active ? 1 : 0.4 }}>{icon}</span>
      <span style={{
        fontSize: 10,
        fontFamily: font,
        fontWeight: 500,
        color: active ? colors.primary : colors.textLight,
      }}>
        {label}
      </span>
    </button>
  );
}
