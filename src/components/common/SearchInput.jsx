import { colors, font, radius } from "../../styles/theme";

/**
 * Shared search input with magnifying glass icon and optional clear button.
 * Replaces duplicate search inputs in Dashboard, InventoryScreen, InventoryModal.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  autoFocus = false,
  style: wrapStyle,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: "10px 14px",
        ...wrapStyle,
      }}
    >
      <span style={{ fontSize: 16, opacity: 0.4 }}>🔍</span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        style={{
          border: "none",
          background: "transparent",
          outline: "none",
          fontFamily: font,
          fontSize: 14,
          color: colors.text,
          width: "100%",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            color: colors.textLight,
            padding: "2px 6px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
