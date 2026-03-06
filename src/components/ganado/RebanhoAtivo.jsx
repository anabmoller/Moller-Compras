import { useState, useMemo } from "react";

// ─── Brand tokens — AM Soluciones · Notion Brand Manual ──────────
// Primárias
const navy     = "#0A1628";
const burgundy = "#7B1E2E";
const mustard  = "#F5B301";

// Light theme surfaces
const bg       = "#F4F1EC";
const surface  = "#FFFFFF";
const surface2 = "#F8F7F4";
const border   = "#E2DDD6";
const borderHv = "#C8C2BA";

// Texto
const textPrimary = navy;
const textMuted   = "#6B6560";
const textFaint   = "#9E9892";

// Status — valores exatos do manual
const colorSuccess = "#2d7a4f";
const colorWarning = "#c8922a";
const colorError   = "#c43333";
const bgSuccess    = "rgba(45,122,79,0.10)";
const bgWarning    = "rgba(200,146,42,0.10)";
const bgError      = "rgba(196,51,51,0.10)";

// Typography
const serif = "'DM Serif Display', serif";
const sans  = "'Outfit', sans-serif";
const mono  = "'JetBrains Mono', monospace";

// ─── Mock data ────────────────────────────────────────────────────
const ANIMAIS = [
  { idx:"PY-00412", brinco:"NL-0412", sexo:"M", categoria:"Boi",     peso:487, ultimaPesagem:"2026-02-28", localizacao:"Est. Santa Rosa", lote:"LOTE-23A",  status:"ativo",    ultimaMovimentacao:"2026-02-15" },
  { idx:"PY-00389", brinco:"NL-0389", sexo:"F", categoria:"Vaca",    peso:412, ultimaPesagem:"2026-02-20", localizacao:"Est. Santa Rosa", lote:"LOTE-22B",  status:"ativo",    ultimaMovimentacao:"2026-01-30" },
  { idx:"PY-00451", brinco:"NL-0451", sexo:"M", categoria:"Novilho", peso:318, ultimaPesagem:"2026-01-15", localizacao:"Lucipar",         lote:"LOTE-25A",  status:"transito", ultimaMovimentacao:"2026-02-28" },
  { idx:"PY-00303", brinco:"NL-0303", sexo:"F", categoria:"Novilha", peso:294, ultimaPesagem:"2026-02-25", localizacao:"Hipoti",          lote:"LOTE-20C",  status:"ativo",    ultimaMovimentacao:"2026-02-10" },
  { idx:"PY-00510", brinco:"NL-0510", sexo:"M", categoria:"Boi",     peso:521, ultimaPesagem:"2026-03-01", localizacao:"Est. Santa Rosa", lote:"LOTE-23A",  status:"ativo",    ultimaMovimentacao:"2026-03-01" },
  { idx:"PY-00278", brinco:"NL-0278", sexo:"M", categoria:"Touro",   peso:698, ultimaPesagem:"2026-02-10", localizacao:"Est. Santa Rosa", lote:"REPROD-01", status:"ativo",    ultimaMovimentacao:"2026-01-20" },
  { idx:"PY-00398", brinco:"NL-0398", sexo:"F", categoria:"Vaca",    peso:0,   ultimaPesagem:"2025-11-30", localizacao:"Lucipar",         lote:"LOTE-22B",  status:"alerta",   ultimaMovimentacao:"2026-01-05" },
  { idx:"PY-00427", brinco:"NL-0427", sexo:"M", categoria:"Novilho", peso:355, ultimaPesagem:"2026-02-18", localizacao:"Hipoti",          lote:"LOTE-25A",  status:"ativo",    ultimaMovimentacao:"2026-02-18" },
  { idx:"PY-00488", brinco:"NL-0488", sexo:"F", categoria:"Novilha", peso:277, ultimaPesagem:"2026-02-22", localizacao:"Est. Santa Rosa", lote:"LOTE-24C",  status:"ativo",    ultimaMovimentacao:"2026-02-22" },
  { idx:"PY-00333", brinco:"NL-0333", sexo:"M", categoria:"Boi",     peso:463, ultimaPesagem:"2026-02-05", localizacao:"Frigorifico CDE", lote:"ABATE-06",  status:"saida",    ultimaMovimentacao:"2026-03-04" },
];

const ESTABELECIMENTOS = [
  { nome:"Est. Santa Rosa", total:5, cor:navy         },
  { nome:"Lucipar",         total:2, cor:burgundy     },
  { nome:"Hipoti",          total:2, cor:colorWarning },
  { nome:"Frigorifico CDE", total:1, cor:textFaint    },
];

const CATEGORIAS = [
  { nome:"Boi",     total:3 },
  { nome:"Vaca",    total:2 },
  { nome:"Novilho", total:2 },
  { nome:"Novilha", total:2 },
  { nome:"Touro",   total:1 },
];

const STATUS_CFG = {
  ativo:    { label:"Ativo",       fg:colorSuccess, bg:bgSuccess },
  transito: { label:"Em trânsito", fg:colorWarning, bg:bgWarning },
  alerta:   { label:"Alerta",      fg:colorError,   bg:bgError   },
  saida:    { label:"Saída",       fg:textMuted,    bg:"rgba(0,0,0,0.06)" },
};

// ─── Helpers ──────────────────────────────────────────────────────
const daysSince = d => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : null;
const fmtDate   = d => { if (!d) return "—"; const [y,m,dd] = d.split("-"); return `${dd}/${m}/${y}`; };

// ─── Atoms ────────────────────────────────────────────────────────
function Badge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.ativo;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:c.bg, color:c.fg,
      fontFamily:sans, fontSize:11, fontWeight:600,
      padding:"3px 9px", borderRadius:20, letterSpacing:"0.04em", whiteSpace:"nowrap",
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.fg, display:"inline-block" }} />
      {c.label}
    </span>
  );
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background:surface, borderRadius:10,
      border:`1px solid ${border}`, borderTop:`3px solid ${accent}`,
      padding:"18px 20px", minWidth:0,
    }}>
      <div style={{ fontFamily:sans, fontSize:11, color:textFaint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:serif, fontSize:30, color:textPrimary, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontFamily:sans, fontSize:12, color:textMuted, marginTop:5 }}>{sub}</div>}
    </div>
  );
}

function EstabPanel() {
  const total = ESTABELECIMENTOS.reduce((s,e) => s+e.total, 0);
  return (
    <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:10, padding:"18px 20px" }}>
      <div style={{ fontFamily:sans, fontSize:11, color:textFaint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:14 }}>
        Por Estabelecimento
      </div>
      <div style={{ display:"flex", borderRadius:4, overflow:"hidden", height:7, marginBottom:16 }}>
        {ESTABELECIMENTOS.map(e => (
          <div key={e.nome} style={{ flex:e.total/total, background:e.cor }} />
        ))}
      </div>
      {ESTABELECIMENTOS.map(e => (
        <div key={e.nome} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <div style={{ width:9, height:9, borderRadius:2, background:e.cor, flexShrink:0 }} />
          <span style={{ fontFamily:sans, fontSize:13, color:textPrimary, flex:1 }}>{e.nome}</span>
          <span style={{ fontFamily:mono, fontSize:12, color:textMuted }}>{e.total}</span>
        </div>
      ))}
    </div>
  );
}

function CatPanel() {
  return (
    <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:10, padding:"18px 20px" }}>
      <div style={{ fontFamily:sans, fontSize:11, color:textFaint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:14 }}>
        Por Categoria
      </div>
      {CATEGORIAS.map(c => (
        <div key={c.nome} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
          <span style={{ fontFamily:sans, fontSize:13, color:textPrimary, flex:1 }}>{c.nome}</span>
          <div style={{ flex:2, height:4, background:border, borderRadius:2, overflow:"hidden" }}>
            <div style={{ width:`${(c.total/3)*100}%`, height:"100%", background:mustard, borderRadius:2 }} />
          </div>
          <span style={{ fontFamily:mono, fontSize:12, color:textMuted, minWidth:16, textAlign:"right" }}>{c.total}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Drawer ────────────────────────────────────────────────────────
function AnimalDrawer({ animal, onClose }) {
  if (!animal) return null;
  const dias    = daysSince(animal.ultimaPesagem);
  const semPeso = dias > 60;

  const timeline = [
    { local:"Est. Santa Rosa",   evento:"Entrada no sistema", data:"2025-06-10"                   },
    { local:"Lucipar",           evento:"Transferência",       data:"2025-10-22"                   },
    { local:animal.localizacao,  evento:"Transferência",       data:animal.ultimaMovimentacao      },
  ];

  return (
    <div style={{
      position:"fixed", right:0, top:0, bottom:0, width:360,
      background:surface, borderLeft:`3px solid ${burgundy}`,
      boxShadow:"-6px 0 32px rgba(10,22,40,0.13)",
      display:"flex", flexDirection:"column", zIndex:200, overflowY:"auto",
    }}>
      {/* Cabeçalho navy */}
      <div style={{ background:navy, padding:"22px 24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontFamily:mono, fontSize:10, color:mustard, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:4 }}>IDX</div>
            <div style={{ fontFamily:serif, fontSize:26, color:"rgba(255,255,255,0.95)", lineHeight:1 }}>{animal.idx}</div>
            <div style={{ fontFamily:sans, fontSize:13, color:"rgba(255,255,255,0.55)", marginTop:4 }}>
              {animal.brinco} · {animal.sexo==="M"?"♂":"♀"} {animal.categoria}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.08)", border:"none", color:"rgba(255,255,255,0.7)",
            width:32, height:32, borderRadius:7, cursor:"pointer", fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>✕</button>
        </div>
        <div style={{ marginTop:14 }}><Badge status={animal.status} /></div>
      </div>

      <div style={{ padding:22, display:"flex", flexDirection:"column", gap:20 }}>
        {/* Grid dados */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            ["Peso atual",        animal.peso>0?`${animal.peso} kg`:"Sem dado", semPeso?colorError:textPrimary],
            ["Última pesagem",    fmtDate(animal.ultimaPesagem),                semPeso?colorError:textPrimary],
            ["Localização",       animal.localizacao,                           textPrimary],
            ["Lote",              animal.lote,                                  textPrimary],
            ["Últ. movimentação", fmtDate(animal.ultimaMovimentacao),           textMuted],
          ].map(([l,v,fg]) => (
            <div key={l} style={{ background:surface2, borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontFamily:sans, fontSize:10, color:textFaint, fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4 }}>{l}</div>
              <div style={{ fontFamily:mono, fontSize:13, color:fg, fontWeight:500 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div>
          <div style={{ fontFamily:sans, fontSize:11, color:textFaint, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:14 }}>
            Rastreabilidade
          </div>
          {timeline.map((ev,i) => (
            <div key={i} style={{ display:"flex", gap:12 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:18 }}>
                <div style={{
                  width:10, height:10, borderRadius:"50%", flexShrink:0, marginTop:3,
                  background: i===timeline.length-1 ? burgundy : border,
                  border: `2px solid ${i===timeline.length-1 ? burgundy : borderHv}`,
                }} />
                {i < timeline.length-1 && <div style={{ width:2, flex:1, background:border, margin:"3px 0" }} />}
              </div>
              <div style={{ paddingBottom:14 }}>
                <div style={{ fontFamily:sans, fontSize:13, color:textPrimary, fontWeight:500 }}>{ev.local}</div>
                <div style={{ fontFamily:sans, fontSize:12, color:textMuted }}>{ev.evento} · {fmtDate(ev.data)}</div>
              </div>
            </div>
          ))}
        </div>

        <button style={{
          background:navy, color:mustard, border:"none", borderRadius:8,
          padding:"11px 0", fontFamily:sans, fontSize:13, fontWeight:600,
          cursor:"pointer", letterSpacing:"0.03em", width:"100%",
        }}>
          Abrir ficha completa →
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function RebanhoAtivo() {
  const [search,        setSearch]       = useState("");
  const [filterStatus,  setFilterStatus] = useState("todos");
  const [filterLocal,   setFilterLocal]  = useState("todos");
  const [sortBy,        setSortBy]       = useState("idx");
  const [sortDir,       setSortDir]      = useState("asc");
  const [selected,      setSelected]     = useState(null);

  const ativos     = ANIMAIS.filter(a => a.status !== "saida").length;
  const emTransito = ANIMAIS.filter(a => a.status === "transito").length;
  const alertas    = ANIMAIS.filter(a => a.status === "alerta").length;
  const pesoMedio  = Math.round(
    ANIMAIS.filter(a => a.peso > 0).reduce((s,a) => s+a.peso, 0) /
    ANIMAIS.filter(a => a.peso > 0).length
  );

  const locais     = ["todos", ...new Set(ANIMAIS.map(a => a.localizacao))];
  const statusOpts = ["todos","ativo","transito","alerta","saida"];

  const filtered = useMemo(() => {
    return ANIMAIS
      .filter(a => {
        const q = search.toLowerCase();
        const matchSearch = !q || [a.idx,a.brinco,a.lote,a.localizacao].some(s => s.toLowerCase().includes(q));
        return matchSearch
          && (filterStatus === "todos" || a.status === filterStatus)
          && (filterLocal  === "todos" || a.localizacao === filterLocal);
      })
      .sort((a,b) => {
        let va = a[sortBy], vb = b[sortBy];
        if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
        return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
  }, [search, filterStatus, filterLocal, sortBy, sortDir]);

  const toggleSort = col => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const inputStyle = {
    padding:"8px 12px", border:`1px solid ${border}`, borderRadius:7,
    fontFamily:sans, fontSize:13, color:textPrimary, background:surface2, outline:"none",
  };

  const COLS = [
    ["idx","IDX"], ["brinco","Brinco"], ["categoria","Categoria"],
    ["peso","Peso kg"], ["ultimaPesagem","Última pesagem"],
    ["localizacao","Localização"], ["lote","Lote"],
  ];

  return (
    <div style={{ fontFamily:sans, background:bg, minHeight:"100vh", padding:24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .tr-row:hover td{background:#F0EDE8!important;cursor:pointer;}
        .tr-sel td{background:#EAE4DC!important;}
        input:focus,select:focus{outline:2px solid ${mustard};outline-offset:-1px;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-thumb{background:${border};border-radius:3px;}
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <div style={{ fontFamily:mono, fontSize:11, color:burgundy, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>
            Central de Hacienda
          </div>
          <div style={{ fontFamily:serif, fontSize:28, color:navy }}>Rebanho Ativo</div>
          <div style={{ fontFamily:sans, fontSize:13, color:textMuted, marginTop:2 }}>
            {new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}
          </div>
        </div>
        <button style={{
          background:burgundy, color:"#fff", border:"none", borderRadius:8,
          padding:"10px 20px", fontFamily:sans, fontSize:13, fontWeight:600,
          cursor:"pointer", letterSpacing:"0.03em",
        }}>
          + Registrar animal
        </button>
      </div>

      {/* Alerta */}
      {alertas > 0 && (
        <div style={{
          background:bgError, border:`1px solid rgba(196,51,51,0.25)`, borderRadius:8,
          padding:"10px 16px", display:"flex", alignItems:"center", gap:10, marginBottom:16,
        }}>
          <span style={{ fontSize:15 }}>⚠️</span>
          <span style={{ fontFamily:sans, fontSize:13, color:colorError }}>
            <strong>{alertas} animal{alertas>1?"is":""}</strong> sem pesagem há mais de 90 dias
          </span>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:16 }}>
        <KpiCard label="Animais ativos"   value={ativos}           sub="no rebanho"           accent={navy}         />
        <KpiCard label="Em trânsito"      value={emTransito}       sub="guia aberta"           accent={colorWarning} />
        <KpiCard label="Alertas"          value={alertas}          sub="sem leitura recente"   accent={colorError}   />
        <KpiCard label="Peso médio"       value={`${pesoMedio} kg`} sub="rebanho com pesagem" accent={mustard}      />
        <KpiCard label="Total geral"      value={ANIMAIS.length}   sub="incl. saídas"          accent={border}       />
      </div>

      {/* Layout sidebar + tabela */}
      <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", gap:14, alignItems:"start" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <EstabPanel />
          <CatPanel />
        </div>

        <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:10, overflow:"hidden" }}>
          {/* Filtros */}
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${border}`, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            <input
              placeholder="Buscar IDX, brinco, lote…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, flex:1, minWidth:180 }}
            />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
              {statusOpts.map(s => (
                <option key={s} value={s}>{s==="todos"?"Todos os status":STATUS_CFG[s]?.label||s}</option>
              ))}
            </select>
            <select value={filterLocal} onChange={e => setFilterLocal(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
              {locais.map(l => <option key={l} value={l}>{l==="todos"?"Todos os locais":l}</option>)}
            </select>
            <span style={{ fontFamily:mono, fontSize:11, color:textFaint }}>
              {filtered.length} resultado{filtered.length!==1?"s":""}
            </span>
          </div>

          {/* Tabela */}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:surface2 }}>
                  {COLS.map(([col,label]) => (
                    <th key={col} onClick={() => toggleSort(col)} style={{
                      padding:"10px 14px", textAlign:"left",
                      fontFamily:sans, fontSize:11, fontWeight:600,
                      color:textFaint, letterSpacing:"0.08em", textTransform:"uppercase",
                      borderBottom:`2px solid ${border}`, cursor:"pointer",
                      userSelect:"none", whiteSpace:"nowrap",
                    }}>
                      {label}
                      <span style={{ marginLeft:4, color:sortBy===col?mustard:textFaint }}>
                        {sortBy===col?(sortDir==="asc"?"↑":"↓"):"↕"}
                      </span>
                    </th>
                  ))}
                  <th style={{ padding:"10px 14px", borderBottom:`2px solid ${border}`, fontFamily:sans, fontSize:11, fontWeight:600, color:textFaint, letterSpacing:"0.08em", textTransform:"uppercase" }}>
                    Status
                  </th>
                  <th style={{ padding:"10px 14px", borderBottom:`2px solid ${border}` }} />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ padding:36, textAlign:"center", fontFamily:sans, fontSize:13, color:textFaint }}>
                    Nenhum animal com esses filtros
                  </td></tr>
                )}
                {filtered.map(a => {
                  const dias    = daysSince(a.ultimaPesagem);
                  const antigo  = dias > 60;
                  const isSel   = selected?.idx === a.idx;
                  return (
                    <tr key={a.idx}
                      className={isSel ? "tr-sel" : "tr-row"}
                      onClick={() => setSelected(isSel ? null : a)}
                      style={{ borderBottom:`1px solid ${border}` }}
                    >
                      <td style={{ padding:"11px 14px" }}>
                        <span style={{ fontFamily:mono, fontSize:13, color:burgundy, fontWeight:500 }}>{a.idx}</span>
                      </td>
                      <td style={{ padding:"11px 14px", fontFamily:mono, fontSize:13, color:textPrimary }}>{a.brinco}</td>
                      <td style={{ padding:"11px 14px", fontFamily:sans, fontSize:13, color:textMuted }}>
                        {a.sexo==="M"?"♂":"♀"} {a.categoria}
                      </td>
                      <td style={{ padding:"11px 14px" }}>
                        <span style={{ fontFamily:mono, fontSize:13, fontWeight:500, color:a.peso>0?textPrimary:colorError }}>
                          {a.peso>0?a.peso:"—"}
                        </span>
                      </td>
                      <td style={{ padding:"11px 14px", fontFamily:sans, fontSize:13, color:antigo?colorError:textMuted }}>
                        {fmtDate(a.ultimaPesagem)}
                        {antigo && <span style={{ marginLeft:6, fontSize:11 }}>({dias}d)</span>}
                      </td>
                      <td style={{ padding:"11px 14px", fontFamily:sans, fontSize:13, color:textPrimary }}>{a.localizacao}</td>
                      <td style={{ padding:"11px 14px" }}>
                        <span style={{
                          fontFamily:mono, fontSize:11, color:textMuted,
                          background:surface2, border:`1px solid ${border}`,
                          borderRadius:4, padding:"2px 7px",
                        }}>{a.lote}</span>
                      </td>
                      <td style={{ padding:"11px 14px" }}><Badge status={a.status} /></td>
                      <td style={{ padding:"11px 14px" }}>
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(isSel?null:a); }}
                          style={{
                            background:"none", border:`1px solid ${border}`,
                            borderRadius:6, padding:"4px 10px", fontSize:12,
                            color:navy, cursor:"pointer", fontFamily:sans, whiteSpace:"nowrap",
                          }}
                        >
                          Ver ficha →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimalDrawer animal={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
