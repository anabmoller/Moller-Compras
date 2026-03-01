/**
 * Shared search input with magnifying glass icon and optional clear button.
 * Replaces duplicate search inputs in Dashboard, InventoryScreen, InventoryModal.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  autoFocus = false,
  className: wrapClassName,
}) {
  return (
    <div
      className={`flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 ${
        wrapClassName || ""
      }`}
    >
      <span className="text-base opacity-40">🔍</span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className="border-none bg-transparent outline-none text-sm text-white w-full placeholder:text-slate-500"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="bg-none border-none cursor-pointer text-xs text-slate-400 px-1.5 py-0.5 leading-none"
        >
          ✕
        </button>
      )}
    </div>
  );
}
