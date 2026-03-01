import SummaryRow from "../common/SummaryRow";

function fmtGs(n) {
  if (!n) return "₲ 0";
  return "₲ " + Math.round(n).toLocaleString("es-PY");
}

export default function RequestStepReview({
  form, items, totalAmount, approvalSteps, budgetInfo, usdRate,
}) {
  return (
    <div className="flex flex-col gap-3.5">
      {/* Items table */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Items de la Solicitud</span>
        </div>
        {items.map((it, i) => (
          <div key={i} className="px-4 py-2.5 flex justify-between items-center border-b border-white/[0.04] last:border-b-0">
            <div>
              <div className="text-sm text-white font-medium">{it.product}</div>
              <div className="text-[10px] text-slate-500">{it.code} &middot; {it.qty} {it.unit}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-emerald-400">{fmtGs(it.estimatedAmount)}</div>
              <div className="text-[10px] text-slate-500">$ {Math.round(it.estimatedAmount / usdRate).toLocaleString("en-US")}</div>
            </div>
          </div>
        ))}
        <div className="px-4 py-3 bg-emerald-500/[0.04] flex justify-between items-center">
          <span className="text-xs font-bold text-white">TOTAL</span>
          <div className="text-right">
            <div className="text-base font-bold text-emerald-400">{fmtGs(totalAmount)}</div>
            <div className="text-[10px] text-slate-400">$ {Math.round(totalAmount / usdRate).toLocaleString("en-US")} USD</div>
          </div>
        </div>
      </div>

      {/* Summary details */}
      <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.06]">
        <div className="text-xs font-semibold text-slate-400 mb-2.5 uppercase tracking-wide">Detalles</div>
        <SummaryRow label="Solicitante" value={form.requester} />
        <SummaryRow label="Establecimiento" value={form.establishment} />
        <SummaryRow label="Sector" value={form.sector} />
        <SummaryRow label="Prioridad" value={form.urgency} />
        <SummaryRow label="Motivo" value={form.reason} />
        {form.notes && <SummaryRow label="Notas" value={form.notes} />}
      </div>

      {/* Approval flow visual (C8 / Task 7) */}
      <div className="bg-emerald-500/[0.04] rounded-xl px-3.5 py-3 border border-emerald-500/[0.08]">
        <div className="text-xs font-semibold text-emerald-400 mb-2.5">{"🔄"} Flujo de Aprobaci{"ó"}n</div>
        <div className="flex items-center gap-0">
          {approvalSteps.map((s, i) => (
            <div key={i} className="flex items-center">
              {i > 0 && <div className="w-6 h-[2px] bg-slate-600 mx-0.5" />}
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-slate-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="text-[9px] text-slate-400 text-center leading-tight max-w-[80px]">{s.label}</div>
                <div className="text-[9px] text-white font-medium text-center max-w-[80px] truncate">{s.person}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget warning */}
      {budgetInfo?.exceeds && (
        <div className="bg-amber-500/[0.06] rounded-lg px-3 py-2.5 border border-amber-500/[0.19]">
          <div className="text-[11px] font-semibold text-amber-400">{"⚠"} Esta solicitud excede el presupuesto asignado</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Se requerirá aprobación adicional del Director</div>
        </div>
      )}

      {/* Legal notice */}
      <div className="bg-amber-500/[0.04] rounded-lg px-3 py-2.5 border border-amber-500/[0.12]">
        <div className="text-[11px] text-amber-400 font-medium text-center">
          Toda compra debe contar con factura legal vigente
        </div>
      </div>
    </div>
  );
}
