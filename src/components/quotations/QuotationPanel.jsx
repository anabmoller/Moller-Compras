import { useState } from "react";
import { generateQuotationId } from "../../utils/ids";

export default function QuotationPanel({ request, onClose, onSave }) {
  const [quotations, setQuotations] = useState(request.quotations || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    supplier: "",
    price: "",
    currency: "PYG",
    deliveryDays: "",
    notes: "",
    paymentTerms: "",
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const addQuotation = () => {
    if (!form.supplier.trim() || !form.price) return;
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) return;
    const deliveryDays = Math.max(0, Math.min(9999, parseInt(form.deliveryDays) || 0));
    const newQ = {
      id: generateQuotationId(),
      supplier: form.supplier.trim().slice(0, 200),
      currency: form.currency,
      price,
      deliveryDays,
      paymentTerms: (form.paymentTerms || "").trim().slice(0, 500),
      notes: (form.notes || "").trim().slice(0, 1000),
      date: new Date().toISOString().slice(0, 10),
      selected: false,
    };
    const updated = [...quotations, newQ];
    setQuotations(updated);
    setForm({ supplier: "", price: "", currency: "PYG", deliveryDays: "", notes: "", paymentTerms: "" });
    setShowAddForm(false);
  };

  const selectQuotation = (qId) => {
    const updated = quotations.map(q => ({ ...q, selected: q.id === qId }));
    setQuotations(updated);
  };

  const handleSave = () => {
    onSave(request.id, { quotations });
    onClose();
  };

  const cheapest = quotations.length > 0
    ? quotations.reduce((min, q) => q.price < min.price ? q : min, quotations[0])
    : null;

  const fastest = quotations.length > 0
    ? quotations.filter(q => q.deliveryDays > 0)
        .reduce((min, q) => q.deliveryDays < min.deliveryDays ? q : min, quotations.filter(q => q.deliveryDays > 0)[0] || quotations[0])
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-end justify-center">
      <div className="bg-[#0a0b0f] rounded-t-[20px] max-w-[480px] w-full max-h-[90vh] overflow-hidden flex flex-col">
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
            {request.name} · {request.id}
          </div>
        </div>

        <div className="overflow-auto px-5 pb-5 flex-1">
          {/* Summary badges */}
          {quotations.length > 0 && (
            <div className="flex gap-2 mb-3.5">
              <div className="flex-1 bg-green-500/[0.06] rounded-xl px-3 py-2.5 border border-green-500/[0.12]">
                <div className="text-[10px] text-green-400 font-semibold uppercase">
                  Mas barato
                </div>
                <div className="text-sm font-bold text-green-400 mt-0.5">
                  {cheapest?.currency} {cheapest?.price?.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-px">
                  {cheapest?.supplier}
                </div>
              </div>
              {fastest && fastest.deliveryDays > 0 && (
                <div className="flex-1 bg-emerald-500/[0.06] rounded-xl px-3 py-2.5 border border-emerald-500/[0.12]">
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase">
                    Mas rapido
                  </div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {fastest.deliveryDays} dias
                  </div>
                  <div className="text-[10px] text-slate-400 mt-px">
                    {fastest.supplier}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quotation list */}
          {quotations.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-[13px]">
              No hay cotizaciones registradas
            </div>
          ) : (
            quotations.map((q, idx) => (
              <div
                key={q.id}
                onClick={() => selectQuotation(q.id)}
                className={`rounded-xl px-4 py-3.5 mb-2 cursor-pointer relative ${
                  q.selected ? 'bg-green-500/[0.05] border-2 border-green-500' : 'bg-white/[0.03] border border-white/[0.06]'
                }`}
              >
                {q.selected && (
                  <div className="absolute top-2.5 right-2.5 bg-green-500 text-white w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {q.supplier}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {q.date}
                      {q.deliveryDays > 0 && ` · ${q.deliveryDays} dias entrega`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-base font-bold ${q.id === cheapest?.id ? 'text-green-400' : 'text-white'}`}>
                      {q.currency} {q.price.toLocaleString()}
                    </div>
                  </div>
                </div>
                {q.paymentTerms && (
                  <div className="text-[11px] text-slate-400 mt-1.5 bg-white/[0.02] px-2 py-1 rounded inline-block">
                    {q.paymentTerms}
                  </div>
                )}
                {q.notes && (
                  <div className="text-[11px] text-slate-400 mt-1 italic">
                    {q.notes}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Add form */}
          {showAddForm ? (
            <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] mt-2">
              <div className="text-[13px] font-semibold text-white mb-3">
                Nueva Cotizacion
              </div>

              <div className="flex flex-col gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Proveedor</label>
                  <input
                    value={form.supplier}
                    onChange={e => update("supplier", e.target.value)}
                    placeholder="Nombre del proveedor"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Precio</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => update("price", e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="w-[100px]">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Moneda</label>
                    <select
                      value={form.currency}
                      onChange={e => update("currency", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                    >
                      <option value="PYG">PYG</option>
                      <option value="USD">USD</option>
                      <option value="BRL">BRL</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Plazo de entrega (dias)</label>
                  <input
                    type="number"
                    value={form.deliveryDays}
                    onChange={e => update("deliveryDays", e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Condiciones de pago</label>
                  <input
                    value={form.paymentTerms}
                    onChange={e => update("paymentTerms", e.target.value)}
                    placeholder="Ej: 30 dias, contado, cheque"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Observaciones</label>
                  <textarea
                    value={form.notes}
                    onChange={e => update("notes", e.target.value)}
                    placeholder="Notas adicionales..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 resize-y"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white text-[13px] font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addQuotation}
                    disabled={!form.supplier || !form.price}
                    className={`flex-1 py-3 rounded-xl border-none text-[13px] font-semibold ${
                      form.supplier && form.price
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white cursor-pointer'
                        : 'bg-white/[0.06] text-slate-500 cursor-default'
                    }`}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
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
