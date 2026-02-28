import { colors } from "../../styles/theme";

export default function DetailRow({ label, value, color, last }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 16px",
      borderBottom: last ? "none" : `1px solid ${colors.borderLight}`,
    }}>
      <span style={{ fontSize: 13, color: colors.textLight }}>{label}</span>
      <span style={{
        fontSize: 13,
        fontWeight: 500,
        color: color || colors.text,
        textAlign: "right",
        maxWidth: "60%",
      }}>
        {value}
      </span>
    </div>
  );
}
