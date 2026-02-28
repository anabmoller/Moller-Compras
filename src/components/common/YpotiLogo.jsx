// YPOTI Logo — SVG component matching the brand assets
export default function YpotiLogo({ size = 32, variant = "icon", color = "currentColor" }) {
  if (variant === "icon") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#7B2233" />
        <path d="M50 12 C72 12, 86 30, 86 48 C86 58, 80 66, 72 72 L54 88 C52 90, 48 90, 46 88 L28 72 C20 66, 14 58, 14 48 C14 30, 28 12, 50 12Z" fill="#7B2233" />
        <path d="M34 52 C34 52, 42 72, 46 80 C48 84, 50 86, 50 86 C50 86, 52 84, 54 80 C58 72, 66 52, 66 52" stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M26 38 C26 22, 50 10, 50 10 C50 10, 74 22, 74 38 C74 50, 66 56, 66 56 L50 86 L34 56 C34 56, 26 50, 26 38Z" fill="#7B2233" stroke="white" strokeWidth="4" />
        <path d="M38 56 C38 56, 44 72, 48 82 C49 84, 50 86, 50 86 C50 86, 51 84, 52 82 C56 72, 62 56, 62 56" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  // Text version
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#7B2233" />
        <path d="M26 38 C26 22, 50 10, 50 10 C50 10, 74 22, 74 38 C74 50, 66 56, 66 56 L50 86 L34 56 C34 56, 26 50, 26 38Z" fill="#7B2233" stroke="white" strokeWidth="4" />
        <path d="M38 56 C38 56, 44 72, 48 82 C49 84, 50 86, 50 86 C50 86, 51 84, 52 82 C56 72, 62 56, 62 56" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
      <span style={{ fontWeight: 700, fontSize: size * 0.6, color, letterSpacing: 1 }}>YPOTI</span>
    </div>
  );
}
