import { colors, font } from "../../styles/theme";

/**
 * Shared back-navigation button.
 * Replaces 7+ duplicate inline back buttons across screens.
 */
export default function BackButton({ onClick, label = "Volver" }) {
  return (
    <div style={{ padding: "12px 20px" }}>
      <button
        onClick={onClick}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: font,
          fontSize: 14,
          color: colors.primary,
          fontWeight: 500,
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        ← {label}
      </button>
    </div>
  );
}
