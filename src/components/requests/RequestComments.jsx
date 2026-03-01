// ============================================================
// RequestComments — Comment list + input with internal toggle
// Extracted from RequestDetail.jsx
// ============================================================
import { fmtDateTime } from "../../utils/dateFormatters";

function SectionTitle({ children, count }) {
  return (
    <div className="flex items-center justify-between mb-3 cursor-default">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
        {children}
        {count != null && (
          <span className="bg-emerald-500/[0.08] text-emerald-400 text-[10px] font-bold px-1.5 py-px rounded-md min-w-[18px] text-center">
            {count}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RequestComments({
  comments,
  commentText,
  commentInternal,
  onCommentTextChange,
  onCommentInternalChange,
  onAddComment,
}) {
  return (
    <div className="px-5 py-2">
      <SectionTitle count={comments.length}>Comentarios</SectionTitle>
      <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
        {/* Comment list */}
        {comments.length > 0 ? (
          <div>
            {comments.map((c, i) => (
              <div
                key={c.id || i}
                className={`px-4 py-3 ${i < comments.length - 1 ? 'border-b border-white/[0.06]' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-[26px] h-[26px] rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {(c.avatar || (c.author || c.autor || "?")?.[0] || "?").toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-white">{c.author || c.autor}</span>
                  {c.interno && (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-400/[0.08] px-1.5 py-px rounded uppercase tracking-wide">
                      Interno
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 ml-auto">
                    {fmtDateTime(c.createdAt || c.fecha)}
                  </span>
                </div>
                <div className="text-[13px] text-white leading-relaxed pl-[34px]">
                  {c.texto}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-400">
            Sin comentarios aún
          </div>
        )}

        {/* Comment input */}
        <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02]">
          <div className="flex gap-2">
            <textarea
              value={commentText}
              onChange={e => onCommentTextChange(e.target.value)}
              placeholder="Agregar comentario..."
              rows={1}
              className="flex-1 border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-white bg-white/[0.03] resize-none outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAddComment(); }
              }}
            />
            <button
              onClick={onAddComment}
              disabled={!commentText.trim()}
              className={`border-none rounded-lg px-3.5 text-xs font-semibold ${
                commentText.trim()
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white cursor-pointer'
                  : 'bg-white/[0.06] text-slate-500 cursor-default'
              }`}
            >
              →
            </button>
          </div>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={commentInternal}
              onChange={(e) => onCommentInternalChange(e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-400"
            />
            Solo empresa (interno)
          </label>
        </div>
      </div>
    </div>
  );
}
