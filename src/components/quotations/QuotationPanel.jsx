import { useState, useMemo } from "react";
import { generateQuotationId } from "../../utils/ids";
import { SUPER_APPROVERS, getCurrentStep, canUserApproveStep } from "../../constants/approvalConfig";
import QuotationComparisonTable from "./QuotationComparisonTable";
import QuotationCard from "./QuotationCard";
import QuotationAddForm from "./QuotationAddForm";

export default function QuotationPanel({ request, currentUser, onClose, onSave }) {
  const [quotations, setQuotations] = useState(request.quotations || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const items = request.items || [];

  // Only approvers/super-approvers can select winner — not comprador
  const canSelectWinner = useMemo(() => {
    if (!currentUser) return false;
    // Super-approver can always select
    if (SUPER_APPROVERS[currentUser.email] !== undefined) return true;
    // Current step approver can select
    if (request.approvalSteps) {
      const step = getCurrentStep(request.approvalSteps);
      if (step && canUserApproveStep(currentUser, step, request.totalAmount)) return true;
    }
    // Diretoria role can select
    if (["diretoria", "director", "super_approver", "gerente"].includes(currentUser.role)) return true;
    return false;
  }, [currentUser, request]);

  const selectQuotation = (qId) => {
    if (!canSelectWinner) return;
    const updated = quotations.map(q => ({ ...q, selected: q.id === qId }));
    setQuotations(updated);
  };

  const removeQuotation = (qId) => {
    setQuotations(prev => prev.filter(q => q.id !== qId));
  };

  const handleAddQuotation = (formData) => {
    const newQ = {
      id: generateQuotationId(),
      ...formData,
      date: new Date().toISOString().slice(0, 10),
      selected: false,
    };
    setQuotations(prev => [...prev, newQ]);
    setShowAddForm(false);
  };

  const handleSave = () => {
    onSave(request.id, { quotations });
    onClose();
  };

  // ---- Best price analysis ----
  const cheapest = quotations.length > 0
    ? quotations.reduce((min, q) => q.price < min.price ? q : min, quotations[0])
    : null;

  const fastest = quotations.length > 0
    ? quotations.filter(q => q.deliveryDays > 0)
        .reduce((min, q) => (!min || q.deliveryDays < min.deliveryDays) ? q : min, null)
    : null;

  // Per-item best prices (across all quotations)
  const bestItemPrices = useMemo(() => {
    if (quotations.length === 0) return {};
    const best = {};
    items.forEach((_, idx) => {
      let minPrice = Infinity;
      quotations.forEach(q => {
        if (q.items?.[idx]?.unitPrice > 0 && q.items[idx].unitPrice < minPrice) {
          minPrice = q.items[idx].unitPrice;
        }
      });
      if (minPrice < Infinity) best[idx] = minPrice;
    });
    return best;
  }, [quotations, items]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-[#0a0b0f] rounded-t-[20px] md:rounded-2xl w-full max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-hidden flex flex-col border border-white/[0.08]">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold text-white m-0">
              Cotizaciones
            </h3>
            <button onClick={onClose} className="bg-white/[0.06] border-none w-8 h-8 rounded-lg cursor-pointer text-base text-white flex items-center justify-center">
              ✕
            </button>
          </div>
          <div className="text-xs text-slate-400">
            {request.name} · {request.id} · {items.length} item{items.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="overflow-auto px-5 pb-5 flex-1">
          {/* Summary badges */}
          {quotations.length > 0 && (
            <div className="flex gap-2 mb-3.5">
              <div className="flex-1 bg-green-500/[0.06] rounded-xl px-3 py-2.5 border border-green-500/[0.12]">
                <div className="text-[10px] text-green-400 font-semibold uppercase">Mas barato</div>
                <div className="text-sm font-bold text-green-400 mt-0.5">
                  {cheapest?.currency} {cheapest?.price?.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-px">{cheapest?.supplier}</div>
              </div>
              {fastest && fastest.deliveryDays > 0 && (
                <div className="flex-1 bg-emerald-500/[0.06] rounded-xl px-3 py-2.5 border border-emerald-500/[0.12]">
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase">Mas rapido</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{fastest.deliveryDays} dias</div>
                  <div className="text-[10px] text-slate-400 mt-px">{fastest.supplier}</div>
                </div>
              )}
            </div>
          )}

          {/* Winner selection info */}
          {quotations.length > 0 && !canSelectWinner && (
            <div className="bg-amber-500/[0.06] border border-amber-500/[0.15] rounded-lg px-3 py-2 mb-3">
              <div className="text-[11px] text-amber-400 font-medium">
                Solo un aprobador o director puede seleccionar la cotización ganadora.
              </div>
            </div>
          )}

          {/* Toggle: Cards vs Comparison Table */}
          {quotations.length >= 2 && (
            <div className="flex mb-3 bg-white/[0.03] rounded-lg border border-white/[0.06] overflow-hidden">
              <button
                onClick={() => setShowComparison(false)}
                className={`flex-1 py-2 text-xs font-semibold border-none cursor-pointer ${
                  !showComparison ? 'bg-emerald-500/[0.12] text-emerald-400' : 'bg-transparent text-slate-400'
                }`}
              >
                Tarjetas
              </button>
              <button
                onClick={() => setShowComparison(true)}
                className={`flex-1 py-2 text-xs font-semibold border-none cursor-pointer ${
                  showComparison ? 'bg-emerald-500/[0.12] text-emerald-400' : 'bg-transparent text-slate-400'
                }`}
              >
                Comparacion
              </button>
            </div>
          )}

          {/* ---- COMPARISON TABLE VIEW ---- */}
          {showComparison && quotations.length >= 2 ? (
            <QuotationComparisonTable
              quotations={quotations}
              items={items}
              bestItemPrices={bestItemPrices}
              cheapest={cheapest}
              fastest={fastest}
            />
          ) : (
            /* ---- CARD VIEW ---- */
            <>
              {quotations.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-[13px]">
                  No hay cotizaciones registradas
                </div>
              ) : (
                quotations.map(q => (
                  <QuotationCard
                    key={q.id}
                    quotation={q}
                    cheapest={cheapest}
                    bestItemPrices={bestItemPrices}
                    onSelect={canSelectWinner ? selectQuotation : null}
                    onRemove={removeQuotation}
                  />
                ))
              )}
            </>
          )}

          {/* ---- ADD FORM ---- */}
          {showAddForm ? (
            <QuotationAddForm
              items={items}
              currency="PYG"
              onAdd={handleAddQuotation}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3.5 rounded-xl border border-dashed border-emerald-500/25 bg-emerald-500/[0.04] text-emerald-400 text-[13px] font-semibold cursor-pointer mt-2"
            >
              + Agregar Cotizacion
            </button>
          )}

          {/* Save button */}
          {quotations.length > 0 && (
            <button
              onClick={handleSave}
              className="w-full py-3.5 rounded-xl border-none bg-gradient-to-br from-blue-400 to-blue-500 text-white text-sm font-semibold cursor-pointer mt-3 shadow-lg shadow-blue-500/20"
            >
              Guardar Cotizaciones ({quotations.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
