import { colors, font, shadows, radius } from "../../styles/theme";

export default function KPICard({ label, value, color, icon }) {
  return (
    <div style={{
      background: colors.card,
      borderRadius: radius.lg,
      padding: "14px 16px",
      border: `1px solid ${colors.borderLight}`,
      boxShadow: shadows.card,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <div style={{
          fontSize: 26,
          fontWeight: 700,
          color,
          fontFamily: font,
          lineHeight: 1,
        }}>
          {value}
        </div>
      </div>
      <div style={{
        fontSize: 11,
        color: colors.textLight,
        marginTop: 6,
        fontWeight: 500,
        letterSpacing: "0.01em",
      }}>
        {label}
      </div>
    </div>
  );
}
