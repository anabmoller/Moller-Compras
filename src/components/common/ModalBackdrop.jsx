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
      className={`fixed inset-0 bg-black/50 flex justify-center ${
        variant === "center" ? "items-center p-4" : "items-end p-0"
      }`}
      style={{ zIndex }}
    >
      {children}
    </div>
  );
}
