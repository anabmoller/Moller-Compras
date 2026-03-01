import { useState, useEffect, useMemo } from "react";
import { FULL_PRODUCT_CATALOG } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { MANAGER_MAP, COMPANY_MAP, PRESIDENT_MAP, ESTABLISHMENT_COMPANY, USER_DISPLAY_NAMES } from "../../constants/approvalConfig";
import { findBudgetForPR, wouldExceedBudget } from "../../constants/budgets";
import { supabase } from "../../lib/supabase";
import RequestStepItems from "./RequestStepItems";
import RequestStepDetails from "./RequestStepDetails";
import RequestStepReview from "./RequestStepReview";

const DEFAULT_FARM_ASSIGNEE = "Laura Rivas";
const OFICINA_ESTABLISHMENTS = ["Oficina"];

// 5-minute product cache (module-level, shared across mounts)
let _productCache = { data: null, ts: 0 };
const PRODUCT_CACHE_TTL = 5 * 60 * 1000;

// ---- Approval preview based on amount + establishment ----
function getApprovalPreview(amount, establishment) {
  const dn = (u) => USER_DISPLAY_NAMES[u] || u;
  const managerUsername = MANAGER_MAP[establishment] || "ronei";
  const steps = [{ label: "Autorización — Gerente de Área", person: dn(managerUsername), icon: "①" }];
  if (amount >= 5_000_000) {
    const company = ESTABLISHMENT_COMPANY[establishment] || "Rural Bioenergia S.A.";
    const directorUsername = COMPANY_MAP[company] || "ronei";
    steps.push({ label: "Aprobación Director", person: dn(directorUsername), icon: "②" });
  }
  if (amount >= 50_000_000) {
    const company = ESTABLISHMENT_COMPANY[establishment] || "Rural Bioenergia S.A.";
    const presidentUsername = PRESIDENT_MAP[company];
    if (presidentUsername) {
      steps.push({ label: "Aprobación Presidente", person: dn(presidentUsername), icon: "③" });
    }
  }
  return steps;
}

export default function NewRequestForm({ onSubmit, onCancel, usdRate = 7800, usdLive = false }) {
  const { currentUser } = useAuth();
  const { showNotif, effectiveUser } = useApp();
  const activeUser = effectiveUser || currentUser;
  const [step, setStep] = useState(1);

  // ---- Merge DB products with static catalog pricing (5-min cache) ----
  const [dbProducts, setDbProducts] = useState(_productCache.data);
  useEffect(() => {
    if (_productCache.data && Date.now() - _productCache.ts < PRODUCT_CACHE_TTL) {
      setDbProducts(_productCache.data);
      return;
    }
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, unit_of_measure, categories(name)")
        .order("name");
      if (error || !data) return;
      const pricingByCode = {};
      FULL_PRODUCT_CATALOG.forEach(p => { pricingByCode[p.c] = p; });
      const merged = data.map(p => {
        const ref = pricingByCode[p.code] || {};
        return {
          n: p.name || "Sin nombre",
          c: p.code || "—",
          g: ref.g || p.categories?.name || "",
          u: ref.u || p.unit_of_measure || "unidad",
          up: ref.up || 0,
          lp: ref.lp || 0,
          ap: ref.ap || 0,
          ld: ref.ld || "",
          ls: ref.ls || "",
        };
      });
      _productCache = { data: merged, ts: Date.now() };
      setDbProducts(merged);
    }
    fetchProducts();
  }, []);

  const productCatalog = dbProducts || FULL_PRODUCT_CATALOG;

  // Form state
  const [form, setForm] = useState({
    requester: activeUser?.name || "",
    establishment: activeUser?.establishment !== "General" ? activeUser?.establishment || "" : "",
    sector: "",
    urgency: "media",
    reason: "",
    purpose: "",
    notes: "",
    assignee: (() => {
      const est = activeUser?.establishment !== "General" ? activeUser?.establishment || "" : "";
      return (est && !OFICINA_ESTABLISHMENTS.includes(est)) ? DEFAULT_FARM_ASSIGNEE : "";
    })(),
  });

  const [items, setItems] = useState([]);
  const [photos, setPhotos] = useState([]); // File[] for Step 2 photo upload
  const [errors, setErrors] = useState({});

  const totalAmount = items.reduce((sum, it) => sum + (it.estimatedAmount || 0), 0);

  const update = (key, val) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      if (key === "establishment" && val) {
        next.assignee = OFICINA_ESTABLISHMENTS.includes(val) ? "" : DEFAULT_FARM_ASSIGNEE;
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  // Budget check
  const budgetInfo = useMemo(() => {
    if (!form.establishment || !form.sector) return null;
    const budget = findBudgetForPR(form.establishment, form.sector);
    if (!budget) return null;
    const exceeds = totalAmount > 0 ? wouldExceedBudget(budget, totalAmount) : false;
    return { budget, exceeds };
  }, [form.establishment, form.sector, totalAmount]);

  // Approval preview
  const approvalSteps = useMemo(() => {
    if (!form.establishment) return [];
    return getApprovalPreview(totalAmount, form.establishment);
  }, [form.establishment, totalAmount]);

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (items.length === 0) e.items = "Agrega al menos un item";
      if (!form.establishment) e.establishment = "Requerido";
      if (!form.sector) e.sector = "Requerido";
    }
    if (step === 2) {
      if (!form.reason.trim()) e.reason = "Requerido";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (step < 3) { setStep(s => s + 1); return; }
    // Submit
    const formToSubmit = {
      ...form,
      status: "borrador",
      name: items.map(it => it.product).join(", "),
      totalAmount,
      items: items.map(it => ({
        name: it.product,
        code: it.code,
        quantity: it.qty,
        unit: it.unit,
        unitPrice: it.qty > 0 ? Math.round(it.estimatedAmount / it.qty) : 0,
        totalPrice: it.estimatedAmount,
        notes: "",
      })),
      _photos: photos, // File[] to upload after request creation
    };
    onSubmit(formToSubmit);
  };

  const stepTitles = [
    { title: "Items", sub: "Selecciona productos del catálogo y agrega cantidades" },
    { title: "Detalles", sub: "Urgencia, justificación y notas" },
    { title: "Revisión y Envío", sub: "Verifica los datos antes de enviar" },
  ];

  const FieldError = ({ field }) => errors[field]
    ? <div className="text-[11px] text-red-400 mt-0.5 font-medium">{errors[field]}</div>
    : null;

  return (
    <div className="pb-10 animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-3 flex justify-between items-center">
        <button onClick={onCancel} className="bg-transparent border-none cursor-pointer text-sm text-blue-400 font-medium">
          &larr; Cancelar
        </button>
        <span className="text-xs text-slate-400 font-medium">Paso {step} de 3</span>
      </div>

      <div className="px-5">
        <h2 className="text-[22px] font-semibold text-white mb-1 mt-0">{stepTitles[step - 1].title}</h2>
        <div className="text-[13px] text-slate-400 mb-5">{stepTitles[step - 1].sub}</div>

        {/* Step indicators */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="flex-1 h-1 rounded-sm transition-colors duration-300"
              style={{ background: s <= step ? (s < step ? '#22c55e' : '#10b981') : 'rgba(255,255,255,0.06)' }}
            />
          ))}
        </div>

        {/* ============ Step 1: Items ============ */}
        {step === 1 && (
          <RequestStepItems
            form={form}
            items={items}
            totalAmount={totalAmount}
            errors={errors}
            productCatalog={productCatalog}
            usdRate={usdRate}
            usdLive={usdLive}
            onUpdateForm={update}
            onSetItems={setItems}
            onSetErrors={setErrors}
            FieldError={FieldError}
          />
        )}

        {/* ============ Step 2: Detalles ============ */}
        {step === 2 && (
          <RequestStepDetails
            form={form}
            errors={errors}
            onUpdateForm={update}
            FieldError={FieldError}
            photos={photos}
            onSetPhotos={setPhotos}
          />
        )}

        {/* ============ Step 3: Revision ============ */}
        {step === 3 && (
          <RequestStepReview
            form={form}
            items={items}
            totalAmount={totalAmount}
            approvalSteps={approvalSteps}
            budgetInfo={budgetInfo}
            usdRate={usdRate}
          />
        )}

        {/* Navigation */}
        <div className="flex gap-2.5 mt-6 pb-5">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white text-sm font-semibold cursor-pointer"
            >
              &larr; Anterior
            </button>
          )}
          <button
            onClick={handleNext}
            className="py-3.5 rounded-xl border-none text-white text-sm font-semibold cursor-pointer shadow-md"
            style={{
              flex: step > 1 ? 1 : undefined,
              width: step === 1 ? "100%" : undefined,
              background: step === 3 ? '#6366f1' : '#10b981',
            }}
          >
            {step === 3 ? "Crear Solicitud ✓" : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );
}
