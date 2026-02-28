// ============================================================
// YPOTI COMPRAS — TEMA / ESTILOS (PDR v3)
// Inspired by Precoro (precoro.com) — Clean SaaS Procurement
// ============================================================

// PDR v3 Brand Colors
export const colors = {
  // Core brand
  primary: "#006633",        // Emerald-700 — Verde YPOTI
  primaryDark: "#004D26",    // Darker shade
  primaryLight: "#E8F5EE",   // Very light green tint
  primaryMid: "#00804A",     // Mid green

  secondary: "#7B3014",      // Brown/Maroon — Marrón YPOTI
  secondaryLight: "#F5EDE8", // Very light brown tint

  // Accent
  accent: "#7B3014",         // Same as secondary for consistency
  accentLight: "#9B4A2E",

  // Neutrals (Precoro-inspired clean grays)
  bg: "#F8F9FB",             // Clean light gray background
  surface: "#F3F4F6",        // Slightly darker surface
  card: "#FFFFFF",
  text: "#1A1D23",           // Near-black for readability
  textSecondary: "#4B5563",  // Medium gray text
  textLight: "#6B7280",      // Light gray text
  textMuted: "#9CA3AF",      // Very muted text
  border: "#E5E7EB",         // Clean gray border
  borderLight: "#F3F4F6",    // Very light border

  // Semantic
  success: "#059669",        // Emerald-600
  successLight: "#ECFDF5",
  warning: "#D97706",        // Amber-600
  warningLight: "#FFFBEB",
  danger: "#DC2626",         // Red-600
  dangerLight: "#FEF2F2",
  info: "#2563EB",           // Blue-600
  infoLight: "#EFF6FF",

  // Priority colors (from PDR 3.3)
  priorityLow: "#6B7280",      // Gray
  priorityMedium: "#F59E0B",   // Amber
  priorityHigh: "#F97316",     // Orange
  priorityEmergency: "#EF4444", // Red
};

// Typography — DM Sans (PDR v3 spec)
export const font = "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
export const fontDisplay = "'DM Sans', sans-serif";
export const fontMono = "'JetBrains Mono', 'SF Mono', 'Consolas', monospace";

// Shared styles
export const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: colors.textLight,
  marginBottom: 6,
  letterSpacing: "0.02em",
  fontFamily: font,
};

export const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: colors.card,
  fontFamily: font,
  fontSize: 14,
  color: colors.text,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

// Shadows (Precoro-inspired — minimal, clean)
export const shadows = {
  xs: "0 1px 2px rgba(0,0,0,0.04)",
  sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  md: "0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)",
  lg: "0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.03)",
  xl: "0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04)",
  card: "0 1px 3px rgba(0,0,0,0.04)",
  dropdown: "0 4px 16px rgba(0,0,0,0.1)",
  modal: "0 20px 60px rgba(0,0,0,0.15)",
};

// Border radius
export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Global CSS
export const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');

  @keyframes slideDown {
    from { transform: translate(-50%, -100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 4px rgba(0,102,51,0.10); }
    50% { box-shadow: 0 0 0 8px rgba(0,102,51,0.05); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

  body {
    margin: 0;
    background: ${colors.bg};
    font-family: ${font};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${colors.textMuted}; }

  select { -webkit-appearance: none; appearance: none; }

  input:focus, select:focus, textarea:focus {
    border-color: ${colors.primary} !important;
    box-shadow: 0 0 0 3px ${colors.primary}15 !important;
    outline: none;
  }

  /* Responsive Layout */
  .desktop-sidebar { display: none; }
  .mobile-header { display: block; }
  .mobile-bottom-nav { display: flex; }
  .desktop-view-toggle { display: none; }

  @media (min-width: 768px) {
    .desktop-sidebar {
      display: flex !important;
      flex-direction: column;
      width: 260px;
      min-width: 260px;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      background: #fff;
      border-right: 1px solid ${colors.border};
      z-index: 50;
    }
    .mobile-header { display: none !important; }
    .mobile-bottom-nav { display: none !important; }
    .desktop-view-toggle { display: flex !important; }
    .app-main-content {
      margin-left: 260px !important;
      max-width: none !important;
      padding: 0 32px !important;
      min-height: 100vh;
    }
  }
  @media (min-width: 1200px) {
    .app-main-content {
      max-width: 1100px !important;
    }
  }
`;
