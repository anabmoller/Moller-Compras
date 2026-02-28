import { colors, font, radius } from "../../styles/theme";

export default function PillButton({ active, onClick, label, color, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: "7px 14px",
        borderRadius: radius.full,
        border: "none",
        background: active ? color : colors.card,
        color: active ? "#fff" : colors.textLight,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: font,
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: active ? `0 2px 12px ${color}30` : `0 1px 3px rgba(0,0,0,0.06)`,
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}
