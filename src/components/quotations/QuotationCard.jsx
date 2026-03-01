export default function QuotationCard({
  quotation, cheapest, bestItemPrices, onSelect, onRemove,
}) {
  const q = quotation;
  return (
    <div
      onClick={() => onSelect && onSelect(q.id)}
      className={`rounded-xl px-4 py-3.5 mb-2 relative ${
        onSelect ? 'cursor-pointer' : ''
      } ${
        q.selected ? 'bg-green-500/[0.05] border-2 border-green-500' : 'bg-white/[0.03] border border-white/[0.06]'
      }`}
    >
      {q.selected && (
        <div className="absolute top-2.5 right-2.5 bg-green-500 text-white w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs font-bold">
          &#10003;
        </div>
      )}
      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(q.id); }}
        className="absolute top-2.5 right-10 bg-transparent border-none text-red-400 text-xs cursor-pointer p-1 opacity-50 hover:opacity-100"
        title="Eliminar cotizacion"
      >
        &#128465;
      </button>

      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-semibold text-white">{q.supplier}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {q.date}
            {q.deliveryDays > 0 && ` · ${q.deliveryDays} dias entrega`}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-base font-bold ${q.id === cheapest?.id ? 'text-green-400' : 'text-white'}`}>
            {q.currency} {q.price?.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Per-item breakdown */}
      {q.items?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/[0.06]">
          {q.items.map((qi, idx) => {
            const isBest = qi.unitPrice > 0 && bestItemPrices[idx] === qi.unitPrice;
            return qi.unitPrice > 0 ? (
              <div key={idx} className="flex justify-between items-center py-0.5">
                <span className="text-[11px] text-slate-400 truncate flex-1 mr-2">
                  {qi.name}
                </span>
                <span className={`text-[11px] font-semibold flex-shrink-0 ${isBest ? 'text-green-400' : 'text-white'}`}>
                  {qi.unitPrice.toLocaleString()} × {qi.quantity} = {qi.subtotal.toLocaleString()}
                </span>
              </div>
            ) : null;
          })}
        </div>
      )}

      {q.paymentTerms && (
        <div className="text-[11px] text-slate-400 mt-1.5 bg-white/[0.02] px-2 py-1 rounded inline-block">
          {q.paymentTerms}
        </div>
      )}
      {q.notes && (
        <div className="text-[11px] text-slate-400 mt-1 italic">{q.notes}</div>
      )}
      {q.attachment && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const data = q.attachment.data || q.attachment.url;
            if (!data) return;
            // For base64 data URIs, convert to blob for reliable viewing
            if (data.startsWith("data:")) {
              try {
                const [header, b64] = data.split(",");
                const mime = header.match(/:(.*?);/)?.[1] || "application/octet-stream";
                const bytes = atob(b64);
                const arr = new Uint8Array(bytes.length);
                for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
                const blob = new Blob([arr], { type: mime });
                window.open(URL.createObjectURL(blob), "_blank");
              } catch { window.open(data, "_blank"); }
            } else {
              window.open(data, "_blank");
            }
          }}
          disabled={!q.attachment.data && !q.attachment.url}
          className={`mt-2 flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border-none transition-colors w-full text-left ${
            q.attachment.data || q.attachment.url
              ? 'text-blue-400 bg-blue-500/[0.06] cursor-pointer hover:bg-blue-500/[0.12]'
              : 'text-slate-500 bg-white/[0.02] cursor-default'
          }`}
        >
          {q.attachment.type?.startsWith("image/") ? "🖼" : "📄"} {q.attachment.name}
          <span className="text-[10px] text-slate-500 ml-auto">
            {q.attachment.data || q.attachment.url ? "Abrir ↗" : "Sin archivo"}
          </span>
        </button>
      )}
    </div>
  );
}
