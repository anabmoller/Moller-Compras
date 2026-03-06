export default function ConfirmModal({ title, message, confirmLabel = "Confirmar", onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[var(--color-modal)] rounded-2xl p-6 w-full max-w-[360px] shadow-2xl border border-[var(--color-border)]"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-[17px] font-semibold text-[var(--color-text)] mb-2 mt-0">
          {title}
        </h3>
        <p className="text-[13px] text-slate-400 mb-5 mt-0 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-[var(--color-border)] bg-transparent text-[var(--color-text)] text-sm font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl border-none bg-[#1F2A44] text-white text-sm font-semibold cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
