/**
 * Shared modal backdrop with click-outside-to-close.
 * Variants: "bottom" (bottom sheet style) | "center" (centered dialog).
 * Replaces 8+ duplicate modal backdrop patterns.
 */
export default function ModalBackdrop({
  children,
  onClose,
  variant = "bottom",
  zIndex = 1000,
}) {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex,
        display: "flex",
        alignItems: variant === "center" ? "center" : "flex-end",
        justifyContent: "center",
        padding: variant === "center" ? 16 : 0,
      }}
    >
      {children}
    </div>
  );
}
