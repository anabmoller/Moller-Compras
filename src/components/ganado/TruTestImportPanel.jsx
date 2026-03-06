import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Loader2 } from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import PageHeader from "../common/PageHeader";
import { ESTABLECIMIENTOS_PROPIOS } from "../../constants/establecimientos";
import { parseTruTestCSV, importTruTestCSV, getBatches } from "../../lib/hacendaService";
import { useAuth } from "../../context/AuthContext";

/* ── Main component ─────────────────────────────────────────── */

export default function TruTestImportPanel({ onBack, onNavigate }) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  // Form state
  const [establecimiento, setEstablecimiento] = useState("");
  const [batchId, setBatchId] = useState("");
  const [file, setFile] = useState(null);
  const [batches, setBatches] = useState([]);

  // Parse state
  const [parsedRecords, setParsedRecords] = useState(null);
  const [parseError, setParseError] = useState(null);

  // Import state
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  // Load batches when establishment changes
  const handleEstChange = async (key) => {
    setEstablecimiento(key);
    setBatchId("");
    if (key) {
      try {
        const data = await getBatches({ establishmentId: key, isActive: true, limit: 50 });
        setBatches(data);
      } catch {
        setBatches([]);
      }
    } else {
      setBatches([]);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParsedRecords(null);
    setParseError(null);
    setResult(null);

    // Auto-parse
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const records = parseTruTestCSV(ev.target.result);
        setParsedRecords(records);
        setParseError(null);
      } catch (err) {
        setParseError(err.message);
        setParsedRecords(null);
      }
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!parsedRecords || !establecimiento) return;
    setImporting(true);
    try {
      const res = await importTruTestCSV(
        null, // fileStoreId — will be set after upload
        parsedRecords,
        establecimiento,
        batchId || null,
        currentUser?.id
      );
      setResult(res);
    } catch (err) {
      setResult({ error: err.message });
    }
    setImporting(false);
  };

  const canImport = parsedRecords && parsedRecords.length > 0 && establecimiento && !importing && !result;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      <PageHeader
        title="Importar TruTest CSV"
        subtitle="Cargá un archivo TruTest para registrar animales y pesajes"
        onBack={onBack}
      />

      <div className="space-y-4 mt-6 px-5 sm:px-0">
        {/* Step 1: Establishment */}
        <Card hover={false} className="p-5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            1. Seleccionar Establecimiento
          </div>
          <select
            value={establecimiento}
            onChange={(e) => handleEstChange(e.target.value)}
            className="w-full bg-[#0a0b0f] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-300 focus:outline-none focus:border-[#C8A03A]/40"
          >
            <option value="">— Seleccionar —</option>
            {ESTABLECIMIENTOS_PROPIOS.map((e) => (
              <option key={e.key} value={e.key}>{e.nombre}</option>
            ))}
          </select>

          {batches.length > 0 && (
            <div className="mt-3">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">
                Lote (opcional)
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full bg-[#0a0b0f] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-300 focus:outline-none focus:border-[#C8A03A]/40"
              >
                <option value="">— Sin lote —</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.batch_code} ({b.batch_type})</option>
                ))}
              </select>
            </div>
          )}
        </Card>

        {/* Step 2: File Upload */}
        <Card hover={false} className="p-5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            2. Cargar Archivo CSV
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          {!file ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-white/[0.08] rounded-xl p-8 text-center hover:border-[#C8A03A]/30 transition-colors cursor-pointer group"
            >
              <Upload size={32} className="mx-auto text-slate-600 group-hover:text-[#C8A03A] transition-colors mb-2" />
              <div className="text-[13px] text-slate-400 font-medium">
                Click para seleccionar un archivo CSV
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Formato TruTest: EID, VID, Weight, Date
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-[#0a0b0f] rounded-lg">
              <FileText size={20} className="text-[#C8A03A] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-white font-semibold truncate">{file.name}</div>
                <div className="text-[11px] text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                onClick={() => { setFile(null); setParsedRecords(null); setParseError(null); setResult(null); }}
                className="text-slate-500 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {parseError && (
            <div className="mt-3 p-3 bg-red-500/[0.06] border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-[12px] text-red-400">{parseError}</div>
            </div>
          )}

          {parsedRecords && (
            <div className="mt-3 p-3 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-[12px] font-bold text-emerald-400">
                  {parsedRecords.length} registro{parsedRecords.length !== 1 ? "s" : ""} detectado{parsedRecords.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Preview first 5 rows */}
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-slate-500 border-b border-white/[0.04]">
                      <th className="text-left py-1 px-2">TruTest ID</th>
                      <th className="text-left py-1 px-2">Visual</th>
                      <th className="text-right py-1 px-2">Peso</th>
                      <th className="text-left py-1 px-2">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRecords.slice(0, 5).map((r, i) => (
                      <tr key={i} className="text-slate-300 border-b border-white/[0.02]">
                        <td className="py-1 px-2 font-mono">{r.trutest_id || "—"}</td>
                        <td className="py-1 px-2">{r.visual_tag || "—"}</td>
                        <td className="py-1 px-2 text-right">{r.weight ? `${r.weight} kg` : "—"}</td>
                        <td className="py-1 px-2">{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRecords.length > 5 && (
                <div className="text-[10px] text-slate-600 mt-1 text-center">
                  ...y {parsedRecords.length - 5} más
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Step 3: Import */}
        {!result && (
          <button
            onClick={handleImport}
            disabled={!canImport}
            className={`w-full py-3 rounded-xl font-bold text-[13px] transition-colors ${
              canImport
                ? "bg-[#C8A03A] text-black hover:bg-[#d4ad48] cursor-pointer"
                : "bg-white/[0.04] text-slate-600 cursor-not-allowed"
            }`}
          >
            {importing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Importando...
              </span>
            ) : (
              `Importar ${parsedRecords?.length || 0} registros`
            )}
          </button>
        )}

        {/* Result */}
        {result && (
          <Card hover={false} className="p-5">
            {result.error ? (
              <div className="flex items-start gap-3">
                <AlertTriangle size={24} className="text-red-400 shrink-0" />
                <div>
                  <div className="text-[14px] font-bold text-red-400 mb-1">Error en importación</div>
                  <div className="text-[12px] text-slate-400">{result.error}</div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
                <div className="text-[16px] font-bold text-white mb-2">Importación completada</div>
                <div className="flex justify-center gap-6 text-[13px]">
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">{result.new}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Nuevos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{result.updated}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Actualizados</div>
                  </div>
                  {result.errors > 0 && (
                    <div>
                      <div className="text-2xl font-bold text-red-400">{result.errors}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Errores</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onNavigate?.("animals")}
                  className="mt-4 px-6 py-2 rounded-lg bg-[#C8A03A]/10 text-[#C8A03A] text-[12px] font-bold hover:bg-[#C8A03A]/20 transition-colors"
                >
                  Ver animales
                </button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
