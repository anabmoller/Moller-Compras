/**
 * YPOTI — PDF Generator (browser-native, no external libraries)
 * Uses hidden iframe with print-optimized HTML
 */
import {
  MANAGER_MAP, ESTABLISHMENT_COMPANY, COMPANY_MAP,
  PRESIDENT_MAP, USER_DISPLAY_NAMES, THRESHOLDS,
} from "../constants/approvalConfig";

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; font-size: 12px; line-height: 1.5; padding: 24px; }
  .header { border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header-left h1 { font-size: 18px; font-weight: 700; color: #059669; margin-bottom: 2px; }
  .header-left p { font-size: 10px; color: #666; }
  .company-data { font-size: 9px; color: #888; margin-top: 2px; }
  .legal-notice { background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; padding: 6px 10px; font-size: 10px; color: #92400e; margin-top: 12px; text-align: center; font-weight: 600; }
  .header-right { text-align: right; font-size: 11px; color: #666; }
  .header-right .sc-number { font-size: 16px; font-weight: 700; color: #1a1a1a; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #059669; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
  .info-item label { font-size: 10px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
  .info-item span { font-size: 12px; color: #1a1a1a; display: block; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th { background: #f0fdf4; color: #059669; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 8px 10px; text-align: left; border: 1px solid #d1fae5; }
  td { padding: 7px 10px; border: 1px solid #e5e7eb; font-size: 11px; }
  tr:nth-child(even) { background: #fafafa; }
  .total-row td { font-weight: 700; background: #f0fdf4; border-color: #d1fae5; }
  .amount { text-align: right; font-variant-numeric: tabular-nums; }
  .approval-steps { display: flex; gap: 8px; margin: 8px 0; }
  .step { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; text-align: center; font-size: 10px; }
  .step.approved { border-color: #22c55e; background: #f0fdf4; }
  .step.pending { border-color: #eab308; background: #fefce8; }
  .step.future { border-color: #e5e7eb; background: #fafafa; color: #999; }
  .step-icon { font-size: 16px; margin-bottom: 2px; }
  .step-person { font-weight: 700; font-size: 11px; color: #1a1a1a; }
  .step-label { font-size: 9px; color: #888; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #999; text-align: center; }
  .signature-area { display: flex; gap: 24px; margin-top: 32px; }
  .signature-line { flex: 1; text-align: center; padding-top: 40px; border-top: 1px solid #333; font-size: 10px; color: #555; }
  .highlight { background: #dcfce7; font-weight: 700; }
  .justification { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 10px; font-size: 11px; color: #555; white-space: pre-wrap; }
  @media print { body { padding: 0; } }
`;

function fmtGs(amount) {
  if (!amount) return "Gs 0";
  return "Gs " + Math.round(amount).toLocaleString("es-PY");
}

function fmtUsd(amount, rate) {
  if (!amount || !rate) return "USD 0";
  return "USD " + Math.round(amount / rate).toLocaleString("en-US");
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

function fmtNow() {
  return new Date().toLocaleDateString("es-PY", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ================================================================
// A) SOLICITUD DE COMPRA PDF
// ================================================================
function generateSolicitudHTML(request, usdRate) {
  const r = request;
  const items = r.items || [];
  const total = r.totalAmount || items.reduce((s, it) => {
    const price = it.unitPrice || it.precioUnitario || it.estimatedAmount || 0;
    const qty = it.quantity || it.cantidad || it.qty || 1;
    const sub = it.estimatedAmount || (price * qty);
    return s + sub;
  }, 0);

  const itemsRows = items.map((it, i) => {
    const name = it.product || it.name || it.nombre || "Item";
    const code = it.code || it.codigo || "";
    const qty = it.quantity || it.cantidad || it.qty || 0;
    const unit = it.unit || it.unidad || "un";
    const sub = it.estimatedAmount || ((it.unitPrice || it.precioUnitario || 0) * qty);
    return `<tr>
      <td>${i + 1}</td>
      <td>${name}</td>
      <td>${code}</td>
      <td class="amount">${qty}</td>
      <td>${unit}</td>
      <td class="amount">${fmtGs(sub)}</td>
      <td class="amount">${fmtUsd(sub, usdRate)}</td>
    </tr>`;
  }).join("");

  // Approval chain
  const chain = getApprovalChainForPdf(total, r.establishment);
  const approvedCount = r.approvalHistory?.filter(h => h.action === "approved").length || 0;
  const stepsHTML = chain.map((step, i) => {
    const cls = i < approvedCount ? "approved" : (i === approvedCount && (r.status === "pend_autorizacion" || r.status === "pend_aprobacion")) ? "pending" : "future";
    return `<div class="step ${cls}">
      <div class="step-icon">${cls === "approved" ? "✅" : cls === "pending" ? "⏳" : "○"}</div>
      <div class="step-person">${step.person}</div>
      <div class="step-label">${step.label}</div>
    </div>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Solicitud ${r.id}</title><style>${STYLES}</style></head><body>
    <div class="header">
      <div class="header-left">
        <h1>GESTION DE COMPRAS</h1>
        <p>GRUPO RURAL BIOENERGIA — YPOTI AGROPECUARIA</p>
        <div class="company-data">RUC: 80050418-6 · Ruta 5 Km 350, Horqueta, Concepción · Tel: (0332) 272-200</div>
      </div>
      <div class="header-right">
        <div class="sc-number">${r.id}</div>
        <div>Fecha: ${fmtDate(r.date)}</div>
        <div>Impreso: ${fmtNow()}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Datos de la Solicitud</div>
      <div class="info-grid">
        <div class="info-item"><label>Establecimiento</label><span>${r.establishment || "—"}</span></div>
        <div class="info-item"><label>Sector</label><span>${r.sector || r.type || "—"}</span></div>
        <div class="info-item"><label>Solicitante</label><span>${r.requester || "—"}</span></div>
        <div class="info-item"><label>Asignado a</label><span>${r.assignee || "Laura Rivas"}</span></div>
        <div class="info-item"><label>Estado</label><span>${r.status || "—"}</span></div>
        <div class="info-item"><label>Prioridad</label><span>${r.priority || r.urgency || "—"}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Items Solicitados</div>
      <table>
        <thead><tr>
          <th>#</th><th>Item</th><th>Código</th><th>Cant.</th><th>Unidad</th><th>Estimado (Gs)</th><th>Estimado (USD)</th>
        </tr></thead>
        <tbody>
          ${itemsRows}
          <tr class="total-row">
            <td colspan="5" style="text-align:right;">TOTAL</td>
            <td class="amount">${fmtGs(total)}</td>
            <td class="amount">${fmtUsd(total, usdRate)}</td>
          </tr>
        </tbody>
      </table>
      <div style="font-size:9px;color:#999;margin-top:2px;">TC: 1 USD = Gs ${Math.round(usdRate).toLocaleString("es-PY")}</div>
    </div>

    <div class="section">
      <div class="section-title">Flujo de Aprobación</div>
      <div class="approval-steps">${stepsHTML}</div>
    </div>

    ${r.reason || r.notes ? `<div class="section">
      <div class="section-title">Justificación</div>
      <div class="justification">${r.reason || r.notes || ""}</div>
    </div>` : ""}

    <div class="legal-notice">Toda compra debe contar con factura legal vigente</div>
    <div class="footer">Documento generado por YPOTI Compras — ${fmtNow()} · RUC: 80050418-6</div>
  </body></html>`;
}

// ================================================================
// B) ORDEN DE COMPRA PDF
// ================================================================
function generateOrdenCompraHTML(request, usdRate) {
  const r = request;
  const items = r.items || [];
  const selectedQ = r.quotations?.find(q => q.selected);
  // Prefer total derived from selected quotation; fall back to request total
  const total = (selectedQ?.price && items.length > 0)
    ? selectedQ.price * items.reduce((sum, it) => sum + (it.quantity || it.cantidad || it.qty || 0), 0)
    : r.totalAmount || 0;

  const itemsRows = items.map((it, i) => {
    const name = it.product || it.name || it.nombre || "Item";
    const code = it.code || it.codigo || "";
    const qty = it.quantity || it.cantidad || it.qty || 0;
    const unit = it.unit || it.unidad || "un";
    const sub = it.estimatedAmount || ((it.unitPrice || it.precioUnitario || 0) * qty);
    return `<tr>
      <td>${i + 1}</td><td>${name}</td><td>${code}</td>
      <td class="amount">${qty}</td><td>${unit}</td>
      <td class="amount">${fmtGs(sub)}</td><td class="amount">${fmtUsd(sub, usdRate)}</td>
    </tr>`;
  }).join("");

  const ocNumber = r.id.replace("SC-", "OC-");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Orden ${ocNumber}</title><style>${STYLES}</style></head><body>
    <div class="header">
      <div class="header-left">
        <h1>ORDEN DE COMPRA</h1>
        <p>GRUPO RURAL BIOENERGIA — YPOTI AGROPECUARIA</p>
        <div class="company-data">RUC: 80050418-6 · Ruta 5 Km 350, Horqueta, Concepción · Tel: (0332) 272-200</div>
      </div>
      <div class="header-right">
        <div class="sc-number">${ocNumber}</div>
        <div>Solicitud: ${r.id}</div>
        <div>Fecha: ${fmtNow()}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Proveedor</div>
      <div class="info-grid">
        <div class="info-item"><label>Nombre / Razón Social</label><span>${selectedQ?.supplier || r.supplier || "—"}</span></div>
        <div class="info-item"><label>RUC</label><span>${selectedQ?.ruc || "—"}</span></div>
        <div class="info-item"><label>Contacto</label><span>${selectedQ?.contact || "—"}</span></div>
        <div class="info-item"><label>Establecimiento destino</label><span>${r.establishment || "—"}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Items</div>
      <table>
        <thead><tr><th>#</th><th>Item</th><th>Código</th><th>Cant.</th><th>Unidad</th><th>Precio (Gs)</th><th>Precio (USD)</th></tr></thead>
        <tbody>
          ${itemsRows}
          <tr class="total-row">
            <td colspan="5" style="text-align:right;">TOTAL</td>
            <td class="amount">${fmtGs(total)}</td>
            <td class="amount">${fmtUsd(total, usdRate)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Condiciones</div>
      <div class="info-grid">
        <div class="info-item"><label>Forma de Pago</label><span>Crédito 30 días</span></div>
        <div class="info-item"><label>Plazo de Entrega</label><span>15 días hábiles</span></div>
        <div class="info-item"><label>Lugar de Entrega</label><span>${r.establishment || "A confirmar"}</span></div>
        <div class="info-item"><label>Validez</label><span>30 días</span></div>
      </div>
    </div>

    <div class="signature-area">
      <div class="signature-line">Elaborado por</div>
      <div class="signature-line">Autorizado por</div>
      <div class="signature-line">Aprobado por</div>
    </div>

    <div class="legal-notice">Toda compra debe contar con factura legal vigente</div>
    <div class="footer">Documento generado por YPOTI Compras — ${fmtNow()} · RUC: 80050418-6</div>
  </body></html>`;
}

// ================================================================
// C) COMPARATIVO DE COTIZACIONES PDF
// ================================================================
function generateComparativoHTML(request, usdRate) {
  const r = request;
  const items = r.items || [];
  const quotations = r.quotations || [];
  const suppliers = quotations.slice(0, 4);

  if (suppliers.length === 0) {
    return generateSolicitudHTML(request, usdRate); // fallback
  }

  const headerCols = suppliers.map(q =>
    `<th colspan="2">${q.supplier || "Proveedor"}</th>`
  ).join("");

  const itemRows = items.map((it, i) => {
    const name = it.product || it.name || it.nombre || "Item";
    const qty = it.quantity || it.cantidad || it.qty || 1;
    const supplierCols = suppliers.map(q => {
      const price = q.unitPrices?.[i] || q.price || 0;
      const sub = price * qty;
      const isMin = suppliers.every(sq => (sq.unitPrices?.[i] || sq.price || Infinity) >= price);
      return `<td class="amount ${isMin ? 'highlight' : ''}">${fmtGs(price)}</td><td class="amount ${isMin ? 'highlight' : ''}">${fmtGs(sub)}</td>`;
    }).join("");
    return `<tr><td>${i + 1}</td><td>${name}</td><td class="amount">${qty}</td>${supplierCols}</tr>`;
  }).join("");

  const totalRow = suppliers.map(q => {
    const tot = q.price || 0;
    return `<td colspan="2" class="amount" style="font-weight:700;">${fmtGs(tot)}</td>`;
  }).join("");

  const subHeaderCols = suppliers.map(() =>
    `<th>Unitario</th><th>Total</th>`
  ).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comparativo ${r.id}</title><style>${STYLES} .highlight { background: #dcfce7; }</style></head><body>
    <div class="header">
      <div class="header-left">
        <h1>COMPARATIVO DE COTIZACIONES</h1>
        <p>GRUPO RURAL BIOENERGIA — YPOTI AGROPECUARIA</p>
      </div>
      <div class="header-right">
        <div class="sc-number">${r.id}</div>
        <div>Fecha: ${fmtNow()}</div>
      </div>
    </div>

    <div class="section">
      <table>
        <thead>
          <tr><th>#</th><th>Item</th><th>Cant.</th>${headerCols}</tr>
          <tr><th></th><th></th><th></th>${subHeaderCols}</tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr class="total-row"><td colspan="3" style="text-align:right;">TOTAL</td>${totalRow}</tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Recomendación</div>
      <div class="justification">${suppliers[0]?.selected ? `Proveedor seleccionado: ${suppliers.find(s => s.selected)?.supplier || suppliers[0]?.supplier}` : "Pendiente de selección"}</div>
    </div>

    <div class="footer">Documento generado por YPOTI Compras — ${fmtNow()}</div>
  </body></html>`;
}

// Helper: approval chain for PDF (uses imported maps from approvalConfig.js)
function getApprovalChainForPdf(amount, establishment) {
  const dn = (u) => USER_DISPLAY_NAMES[u] || u;
  const managerUsername = MANAGER_MAP[establishment] || "ronei";
  const steps = [{ label: "Autorización Gerente", person: dn(managerUsername) }];
  if (amount >= THRESHOLDS.DIRECTOR_REQUIRED) {
    const company = ESTABLISHMENT_COMPANY[establishment] || "Rural Bioenergia S.A.";
    steps.push({ label: "Aprobación Director", person: dn(COMPANY_MAP[company] || "ronei") });
  }
  if (amount >= THRESHOLDS.PRESIDENT_REQUIRED) {
    const company = ESTABLISHMENT_COMPANY[establishment] || "Rural Bioenergia S.A.";
    const pres = PRESIDENT_MAP[company];
    if (pres) steps.push({ label: "Aprobación Presidente", person: dn(pres) });
  }
  return steps;
}

// ================================================================
// Print / Download engine
// ================================================================
function printHTML(html, filename) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-10000px;left:-10000px;width:0;height:0;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Wait for content to render
  iframe.contentWindow.onafterprint = () => {
    document.body.removeChild(iframe);
  };

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error("[PDF] Print failed:", e);
    }
    // Cleanup after timeout if onafterprint doesn't fire
    setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    }, 5000);
  }, 300);
}

// ================================================================
// PUBLIC API
// ================================================================

/**
 * Generate and print/download a Solicitud de Compra PDF
 */
export function downloadSolicitudPDF(request, usdRate = 7800) {
  const html = generateSolicitudHTML(request, usdRate);
  printHTML(html, `Solicitud_${request.id}`);
}

/**
 * Generate and print/download an Orden de Compra PDF
 */
export function downloadOrdenCompraPDF(request, usdRate = 7800) {
  const html = generateOrdenCompraHTML(request, usdRate);
  printHTML(html, `OrdenCompra_${request.id}`);
}

/**
 * Generate and print/download a Comparativo de Cotizaciones PDF
 */
export function downloadComparativoPDF(request, usdRate = 7800) {
  const html = generateComparativoHTML(request, usdRate);
  printHTML(html, `Comparativo_${request.id}`);
}

/**
 * Smart download: pick the right PDF based on request status
 */
export function downloadRequestPDF(request, usdRate = 7800) {
  const status = request.status;
  if (status === "orden_compra" || status === "recibido" || status === "sap") {
    downloadOrdenCompraPDF(request, usdRate);
  } else if (request.quotations?.length > 1) {
    downloadComparativoPDF(request, usdRate);
  } else {
    downloadSolicitudPDF(request, usdRate);
  }
}

/**
 * Share via WhatsApp: tries Web Share API first, falls back to download + WhatsApp link
 */
export async function shareViaWhatsApp(request, usdRate = 7800) {
  const items = request.items || [];
  const productNames = items.slice(0, 3).map(i => i.product || i.name || i.nombre).filter(Boolean).join(", ");
  const extra = items.length > 3 ? ` (+${items.length - 3} mas)` : "";
  const total = request.totalAmount || 0;
  const totalStr = "Gs " + Math.round(total).toLocaleString("es-PY");
  const title = `Solicitud ${request.id}`;
  const text = `${title} - ${productNames}${extra} - ${totalStr}`;

  // Generate HTML content for the file
  const status = request.status;
  let html;
  if (status === "orden_compra" || status === "recibido" || status === "sap") {
    html = generateOrdenCompraHTML(request, usdRate);
  } else {
    html = generateSolicitudHTML(request, usdRate);
  }

  // Try Web Share API with file (works on mobile)
  try {
    const blob = new Blob([html], { type: "text/html" });
    const file = new File([blob], `${request.id}.html`, { type: "text/html" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title, text });
      return;
    }
  } catch (e) {
    // Fallback below
  }

  // Fallback: download PDF first, then open WhatsApp with clean message
  downloadRequestPDF(request, usdRate);
  setTimeout(() => {
    const statusLabel = request.status || "borrador";
    const msg = [
      `*${request.id}*`,
      `Establecimiento: ${request.establishment || "—"}`,
      `Items: ${productNames}${extra}`,
      `Total: ${totalStr}`,
      `Estado: ${statusLabel}`,
    ].join("\n");
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }, 500);
}
