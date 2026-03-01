/**
 * Shared back-navigation button.
 * Replaces 7+ duplicate inline back buttons across screens.
 */
export default function BackButton({ onClick, label = "Volver" }) {
  return (
    <div className="py-3 px-5">
      <button
        onClick={onClick}
        className="bg-transparent border-none cursor-pointer text-sm text-emerald-500 font-medium p-0 flex items-center gap-1"
      >
        ← {label}
      </button>
    </div>
  );
}
