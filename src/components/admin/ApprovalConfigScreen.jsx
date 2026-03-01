import { useState } from "react";
import BackButton from "../common/BackButton";
import PageHeader from "../common/PageHeader";
import {
  MANAGER_MAP, COMPANY_MAP, PRESIDENT_MAP, ESTABLISHMENT_COMPANY,
  COMPANIES, THRESHOLDS, SLA, OVERBUDGET_APPROVER, VET_APPROVER, VET_APPROVER_2, VET_SECTORS,
  USER_DISPLAY_NAMES,
} from "../../constants/approvalConfig";
import { formatGuaranies } from "../../constants/budgets";

const STEPS_DISPLAY = [
  {
    num: 1, label: "Gerente de Area", type: "manager", icon: "👤",
    description: "Aprueba solicitudes de su establecimiento asignado",
    color: "#f59e0b",
  },
  {
    num: 2, label: "Director", type: "director", icon: "🏢",
    description: "Aprueba compras mayores a ₲5M según la empresa",
    color: "#10b981",
  },
  {
    num: 3, label: "Presidente", type: "president", icon: "👑",
    description: "Aprueba compras mayores a ₲50M según la empresa",
    color: "#ef4444",
  },
];

export default function ApprovalConfigScreen({ onBack }) {
  const [activeStep, setActiveStep] = useState(null);

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <BackButton onClick={onBack} />
      <div className="mb-5">
        <PageHeader
          title="Flujo de Autorización y Aprobación"
          subtitle="Configuración del workflow de autorización y aprobación de compras"
        />
      </div>

      <div className="px-5 pb-[120px]">
        {/* Visual Pipeline */}
        <div className="flex items-center justify-center gap-0 mb-6 py-4">
          {STEPS_DISPLAY.map((step, i) => (
            <div key={step.num} className="flex items-center">
              <div
                onClick={() => setActiveStep(activeStep === step.num ? null : step.num)}
                className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
                style={{
                  background: activeStep === step.num
                    ? `linear-gradient(135deg, ${step.color} 0%, ${step.color}cc 100%)`
                    : 'rgba(255,255,255,0.03)',
                  border: `2px solid ${activeStep === step.num ? step.color : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: activeStep === step.num ? `0 4px 12px ${step.color}30` : 'none',
                }}
              >
                <span className="text-[10px] font-bold" style={{ color: activeStep === step.num ? '#fff' : step.color }}>
                  {step.num}
                </span>
                <span className="text-base" style={{ filter: activeStep === step.num ? 'brightness(0) invert(1)' : 'none' }}>
                  {step.icon}
                </span>
              </div>
              {i < STEPS_DISPLAY.length - 1 && (
                <div className="w-8 h-0.5 bg-white/[0.06] -mx-px" />
              )}
            </div>
          ))}
          {/* Special step: Vet */}
          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-white/[0.06] -mx-px" />
            <div
              onClick={() => setActiveStep(activeStep === 4 ? null : 4)}
              className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
              style={{
                background: activeStep === 4
                  ? 'linear-gradient(135deg, #7c6bb5 0%, #6b5aaa 100%)'
                  : 'rgba(255,255,255,0.03)',
                border: `2px dashed ${activeStep === 4 ? '#7c6bb5' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <span className="text-[10px] font-bold" style={{ color: activeStep === 4 ? '#fff' : '#7c6bb5' }}>VET</span>
              <span className="text-base">💉</span>
            </div>
          </div>
        </div>

        {/* Step labels */}
        <div className="flex justify-around mb-5 text-[10px] text-slate-400 font-medium text-center">
          <span className="w-[70px]">Gerente</span>
          <span className="w-[70px]">Director</span>
          <span className="w-[70px]">Presidente</span>
          <span className="w-[70px]">Vet (cond.)</span>
        </div>

        {/* Thresholds Card */}
        <Card title="Umbrales de Aprobación" icon="📐">
          <ThresholdRow label="Director requerido" value={formatGuaranies(THRESHOLDS.DIRECTOR_REQUIRED)} desc="Compras >= este monto requieren aprobación del Director" />
          <ThresholdRow label="Overbudget" value={formatGuaranies(THRESHOLDS.PRESIDENT_REQUIRED)} desc="Compras >= este monto requieren aprobación extra" />
        </Card>

        {/* SLA Card */}
        <Card title="SLA (Tiempos de Respuesta)" icon="⏱">
          <ThresholdRow label="Gerente Normal" value={`${SLA.MANAGER_NORMAL}h`} desc="1 dia hábil" />
          <ThresholdRow label="Gerente Emergencia" value={`${SLA.MANAGER_EMERGENCY}h`} desc="4 horas" />
          <ThresholdRow label="Director Normal" value={`${SLA.DIRECTOR_NORMAL}h`} desc="2 días hábiles" />
          <ThresholdRow label="Director Emergencia" value={`${SLA.DIRECTOR_EMERGENCY}h`} desc="8 horas" />
          <ThresholdRow label="Overbudget" value={`${SLA.OVERBUDGET}h`} desc="2 días hábiles" />
        </Card>

        {/* Manager Assignments */}
        <Card title="Gerentes por Establecimiento" icon="👤">
          {Object.entries(MANAGER_MAP).map(([est, mgr]) => (
            <div key={est} className="flex justify-between items-center py-2 border-b border-white/[0.06]">
              <span className="text-[13px] text-white">📍 {est}</span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/[0.06] px-2.5 py-0.5 rounded-lg">
                {USER_DISPLAY_NAMES[mgr] || mgr}
              </span>
            </div>
          ))}
        </Card>

        {/* Director Assignments */}
        <Card title="Directores por Empresa" icon="🏢">
          {Object.entries(COMPANY_MAP).map(([company, dirUsername]) => (
            <div key={company} className="flex justify-between items-center py-2 border-b border-white/[0.06]">
              <div>
                <div className="text-[13px] text-white">{company}</div>
              </div>
              <span className="text-xs font-semibold text-blue-400 bg-blue-500/[0.06] px-2.5 py-0.5 rounded-lg">
                {USER_DISPLAY_NAMES[dirUsername] || dirUsername}
              </span>
            </div>
          ))}
        </Card>

        {/* President Assignments */}
        <Card title="Presidentes por Empresa" icon="👑">
          {Object.entries(PRESIDENT_MAP).map(([company, presUsername]) => (
            <div key={company} className="flex justify-between items-center py-2 border-b border-white/[0.06]">
              <div>
                <div className="text-[13px] text-white">{company}</div>
              </div>
              <span className="text-xs font-semibold text-purple-400 bg-purple-500/[0.06] px-2.5 py-0.5 rounded-lg">
                {USER_DISPLAY_NAMES[presUsername] || presUsername}
              </span>
            </div>
          ))}
        </Card>

        {/* Establishment → Company Mapping */}
        <Card title="Establecimiento → Empresa" icon="🔗">
          {Object.entries(ESTABLISHMENT_COMPANY).filter(([k]) => k !== "General").map(([est, company]) => (
            <div key={est} className="flex justify-between items-center py-1.5 border-b border-white/[0.06]">
              <span className="text-xs text-white">{est}</span>
              <span className="text-xs text-slate-400">{company}</span>
            </div>
          ))}
        </Card>

        {/* Special Rules */}
        <Card title="Reglas Especiales" icon="⚡">
          <div className="bg-white/[0.02] rounded-xl p-3.5 mb-2">
            <div className="text-xs font-semibold text-[#7c6bb5] mb-1">
              💉 Regla Veterinaria (R5)
            </div>
            <div className="text-xs text-white mb-1">
              Solicitudes de sectores veterinarios requieren autorización previa del especialista.
            </div>
            <div className="text-[11px] text-slate-400">
              Aprobador 1: <strong>{VET_APPROVER}</strong> (Especialista)
            </div>
            <div className="text-[11px] text-slate-400">
              Aprobador 2: <strong>{VET_APPROVER_2}</strong> (Confirmación Gerente)
            </div>
            <div className="text-[11px] text-slate-400">
              Sectores: {VET_SECTORS.join(", ")}
            </div>
          </div>

          <div className="bg-white/[0.02] rounded-xl p-3.5">
            <div className="text-xs font-semibold text-red-400 mb-1">
              ⚠ Regla Overbudget (R6)
            </div>
            <div className="text-xs text-white mb-1">
              Cuando una solicitud excede el presupuesto del sector, se activa un paso adicional de aprobación.
            </div>
            <div className="text-[11px] text-slate-400">
              Aprobador: <strong>{OVERBUDGET_APPROVER}</strong>
            </div>
          </div>
        </Card>

        {/* Rules Summary */}
        <Card title="Resumen de Reglas" icon="📜">
          {[
            { id: "R1", desc: "Toda SC requiere autorización del Gerente de Área asignado al establecimiento", color: "#f59e0b" },
            { id: "R2", desc: `SC >= ${formatGuaranies(THRESHOLDS.DIRECTOR_REQUIRED)} requiere aprobación del Director de la empresa`, color: "#10b981" },
            { id: "R3", desc: `SC >= ${formatGuaranies(THRESHOLDS.PRESIDENT_REQUIRED)} requiere aprobación del Presidente de la empresa`, color: "#ef4444" },
            { id: "R4", desc: "Emergencias: SLA reducido (Gerente 4h, Director 8h)", color: "#6366f1" },
            { id: "R5", desc: "Sectores Vet/Farmacia requieren autorización de especialista", color: "#7c6bb5" },
            { id: "R6", desc: "Exceso de presupuesto activa paso de aprobación overbudget", color: "#ef4444" },
            { id: "R7", desc: "Alerta si precio unitario ingresado supera >5% el precio promedio del catálogo", color: "#f59e0b" },
          ].map(rule => (
            <div key={rule.id} className="flex gap-2.5 py-2.5 border-b border-white/[0.06]">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded flex-shrink-0 h-fit"
                style={{ color: rule.color, background: rule.color + "15" }}
              >
                {rule.id}
              </span>
              <span className="text-xs text-white leading-relaxed">{rule.desc}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] mb-3 shadow-sm">
      <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide flex items-center gap-1.5">
        {icon && <span className="text-sm">{icon}</span>}
        {title}
      </div>
      {children}
    </div>
  );
}

function ThresholdRow({ label, value, desc }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
      <div>
        <div className="text-[13px] text-white font-medium">{label}</div>
        <div className="text-[10px] text-slate-400">{desc}</div>
      </div>
      <span className="text-sm font-bold text-emerald-400">
        {value}
      </span>
    </div>
  );
}
