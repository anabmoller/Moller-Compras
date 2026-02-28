import { colors } from "../../styles/theme";

export default function SummaryRow({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0",
      borderBottom: `1px solid ${colors.borderLight}`,
    }}>
      <span style={{ fontSize: 12, color: colors.textLight }}>{label}</span>
      <span style={{
        fontSize: 12,
        fontWeight: 500,
        color: colors.text,
        textAlign: "right",
        maxWidth: "60%",
      }}>
        {value || "\u2014"}
      </span>
    </div>
  );
}
