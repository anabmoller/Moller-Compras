import { colors, font, radius } from "../../styles/theme";

export default function Header({ currentUser }) {
  return (
    <header style={{
      background: colors.card,
      borderBottom: `1px solid ${colors.border}`,
      padding: "12px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: radius.md,
          background: colors.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: font,
        }}>Y</div>
        <div>
          <div style={{
            fontSize: 16, fontWeight: 700, color: colors.text,
            fontFamily: font, letterSpacing: "-0.02em", lineHeight: 1.1,
          }}>YPOTI</div>
          <div style={{ fontSize: 10, color: colors.textMuted, fontWeight: 500 }}>
            Compras
          </div>
        </div>
      </div>
      <div style={{
        width: 34, height: 34, borderRadius: radius.full,
        background: colors.primaryLight,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 600, color: colors.primary,
      }}>
        {currentUser?.charAt(0) || "U"}
      </div>
    </header>
  );
}
