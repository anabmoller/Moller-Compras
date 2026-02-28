import { colors, radius, shadows } from "../../styles/theme";

export default function Notification({ notification }) {
  if (!notification) return null;

  return (
    <div style={{
      position: "fixed",
      top: 16,
      left: "50%",
      transform: "translateX(-50%)",
      background: notification.type === "success" ? colors.success : colors.danger,
      color: "#fff",
      padding: "12px 24px",
      borderRadius: radius.lg,
      zIndex: 9999,
      fontWeight: 500,
      fontSize: 14,
      boxShadow: shadows.lg,
      animation: "slideDown 0.3s ease",
    }}>
      {notification.msg}
    </div>
  );
}
