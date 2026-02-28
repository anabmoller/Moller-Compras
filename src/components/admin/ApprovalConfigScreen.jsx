import { useState } from "react";
import { colors, font, fontDisplay, shadows, radius } from "../../styles/theme";
import BackButton from "../common/BackButton";
import PageHeader from "../common/PageHeader";
import {
  MANAGER_BY_ESTABLISHMENT, DIRECTOR_BY_COMPANY, ESTABLISHMENT_COMPANY,
  COMPANIES, THRESHOLDS, SLA, OVERBUDGET_APPROVER, VET_APPROVER, VET_SECTORS,
} from "../../constants/approvalConfig";
import { formatGuaranies } from "../../constants/budgets";

const STEPS_DISPLAY = [
  {
    num: 1, label: "Gerente de Area", type: "manager", icon: "👤",
    description: "Aprueba solicitudes de su establecimiento asignado",
    color: colors.warning,
  },
  {
    num: 2, label: "Director / CFO", type: "director", icon: "🏢",
    description: "Aprueba compras mayores a ₲5M segun la empresa",
    color: colors.primary,
  },
  {
    num: 3, label: "Overbudget", type: "overbudget", icon: "⚠",
    description: "Aprueba si el monto supera ₲50M o excede presupuesto",
    color: colors.danger,
  },
];

export default function ApprovalConfigScreen({ onBack }) {
  const [activeStep, setActiveStep] = useState(null);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <BackButton onClick={onBack} />
      <div style={{ marginBottom: 20 }}>
        <PageHeader
          title="Flujo de Autorización y Aprobación"
          subtitle="Configuración del workflow de autorización y aprobación de compras"
        />
      </div>

      <div style={{ padding: "0 20px 120px" }}>
        {/* Visual Pipeline */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 0, marginBottom: 24, padding: "16px 0",
        }}>
          {STEPS_DISPLAY.map((step, i) => (
            <div key={step.num} style={{ display: "flex", alignItems: "center" }}>
              <div
                onClick={() => setActiveStep(activeStep === step.num ? null : step.num)}
                style={{
                  width: 56, height: 56, borderRadius: radius.xl,
                  background: activeStep === step.num
                    ? `linear-gradient(135deg, ${step.color} 0%, ${step.color}cc 100%)`
                    : colors.card,
                  border: `2px solid ${activeStep === step.num ? step.color : colors.border}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s",
                  boxShadow: activeStep === step.num ? `0 4px 12px ${step.color}30` : "none",
                }}
              >
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: activeStep === step.num ? "#fff" : step.color,
                }}>
                  {step.num}
                </span>
                <span style={{
                  fontSize: 16,
                  filter: activeStep === step.num ? "brightness(0) invert(1)" : "none",
                }}>
                  {step.icon}
                </span>
              </div>
              {i < STEPS_DISPLAY.length - 1 && (
                <div style={{
                  width: 32, height: 2, background: colors.border, margin: "0 -1px",
                }} />
              )}
            </div>
          ))}
          {/* Special step: Vet */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 32, height: 2, background: colors.border, margin: "0 -1px" }} />
            <div
              onClick={() => setActiveStep(activeStep === 4 ? null : 4)}
              style={{
                width: 56, height: 56, borderRadius: radius.xl,
                background: activeStep === 4
                  ? `linear-gradient(135deg, #7c6bb5 0%, #6b5aaa 100%)`
                  : colors.card,
                border: `2px dashed ${activeStep === 4 ? "#7c6bb5" : colors.border}`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: activeStep === 4 ? "#fff" : "#7c6bb5" }}>VET</span>
              <span style={{ fontSize: 16 }}>💉</span>
            </div>
          </div>
        </div>

        {/* Step labels */}
        <div style={{
          display: "flex", justifyContent: "space-around", marginBottom: 20,
          fontSize: 10, color: colors.textLight, fontWeight: 500, textAlign: "center",
        }}>
          <span style={{ width: 70 }}>Gerente</span>
          <span style={{ width: 70 }}>Director</span>
          <span style={{ width: 70 }}>Overbudget</span>
          <span style={{ width: 70 }}>Vet (cond.)</span>
        </div>

        {/* Thresholds Card */}
        <Card title="Umbrales de Aprobación" icon="📐">
          <ThresholdRow label="Director requerido" value={formatGuaranies(THRESHOLDS.DIRECTOR_REQUIRED)} desc="Compras >= este monto requieren aprobación del Director" />
          <ThresholdRow label="Overbudget" value={formatGuaranies(THRESHOLDS.OVERBUDGET_DIRECTOR)} desc="Compras >= este monto requieren aprobación extra" />
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
          {Object.entries(MANAGER_BY_ESTABLISHMENT).map(([est, mgr]) => (
            <div key={est} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: `1px solid ${colors.borderLight}`,
            }}>
              <span style={{ fontSize: 13, color: colors.text }}>📍 {est}</span>
              <span style={{
                fontSize: 12, fontWeight: 600, color: colors.primary,
                background: colors.primary + "10", padding: "3px 10px", borderRadius: radius.md,
              }}>
                {mgr}
              </span>
            </div>
          ))}
        </Card>

        {/* Director Assignments */}
        <Card title="Directores por Empresa" icon="🏢">
          {COMPANIES.map(c => {
            const dirUsername = DIRECTOR_BY_COMPANY[c.id] || "—";
            return (
              <div key={c.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: `1px solid ${colors.borderLight}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, color: colors.text }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: colors.textLight }}>
                    {c.type === "empresa" ? "Empresa" : "Persona Física"}
                  </div>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: colors.accent,
                  background: colors.accent + "10", padding: "3px 10px", borderRadius: radius.md,
                }}>
                  {dirUsername}
                </span>
              </div>
            );
          })}
        </Card>

        {/* Establishment → Company Mapping */}
        <Card title="Establecimiento → Empresa" icon="🔗">
          {Object.entries(ESTABLISHMENT_COMPANY).filter(([k]) => k !== "General").map(([est, compId]) => {
            const comp = COMPANIES.find(c => c.id === compId);
            return (
              <div key={est} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 0", borderBottom: `1px solid ${colors.borderLight}`,
              }}>
                <span style={{ fontSize: 12, color: colors.text }}>{est}</span>
                <span style={{ fontSize: 12, color: colors.textLight }}>{comp?.name || compId}</span>
              </div>
            );
          })}
        </Card>

        {/* Special Rules */}
        <Card title="Reglas Especiales" icon="⚡">
          <div style={{
            background: colors.surface, borderRadius: radius.lg, padding: 14,
            marginBottom: 8,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#7c6bb5", marginBottom: 4 }}>
              💉 Regla Veterinaria (R5)
            </div>
            <div style={{ fontSize: 12, color: colors.text, marginBottom: 4 }}>
              Solicitudes de sectores veterinarios requieren autorización previa del especialista.
            </div>
            <div style={{ fontSize: 11, color: colors.textLight }}>
              Aprobador: <strong>{VET_APPROVER}</strong>
            </div>
            <div style={{ fontSize: 11, color: colors.textLight }}>
              Sectores: {VET_SECTORS.join(", ")}
            </div>
          </div>

          <div style={{
            background: colors.surface, borderRadius: radius.lg, padding: 14,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.danger, marginBottom: 4 }}>
              ⚠ Regla Overbudget (R6)
            </div>
            <div style={{ fontSize: 12, color: colors.text, marginBottom: 4 }}>
              Cuando una solicitud excede el presupuesto del sector, se activa un paso adicional de aprobación.
            </div>
            <div style={{ fontSize: 11, color: colors.textLight }}>
              Aprobador: <strong>{OVERBUDGET_APPROVER}</strong>
            </div>
          </div>
        </Card>

        {/* Rules Summary */}
        <Card title="Resumen de Reglas" icon="📜">
          {[
            { id: "R1", desc: "Toda SC requiere autorización del Gerente de Área asignado al establecimiento", color: colors.warning },
            { id: "R2", desc: `SC >= ${formatGuaranies(THRESHOLDS.DIRECTOR_REQUIRED)} requiere aprobación del Director de la empresa`, color: colors.primary },
            { id: "R3", desc: `SC >= ${formatGuaranies(THRESHOLDS.OVERBUDGET_DIRECTOR)} requiere aprobación de ${OVERBUDGET_APPROVER}`, color: colors.danger },
            { id: "R4", desc: "Emergencias: SLA reducido (Gerente 4h, Director 8h)", color: colors.accent },
            { id: "R5", desc: "Sectores Vet/Farmacia requieren autorización de especialista", color: "#7c6bb5" },
            { id: "R6", desc: "Exceso de presupuesto activa paso de aprobación overbudget", color: colors.danger },
          ].map(rule => (
            <div key={rule.id} style={{
              display: "flex", gap: 10, padding: "10px 0",
              borderBottom: `1px solid ${colors.borderLight}`,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: rule.color,
                background: rule.color + "15", padding: "2px 8px",
                borderRadius: radius.sm, flexShrink: 0, height: "fit-content",
              }}>
                {rule.id}
              </span>
              <span style={{ fontSize: 12, color: colors.text, lineHeight: 1.4 }}>{rule.desc}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div style={{
      background: colors.card, borderRadius: radius.xl, padding: 16,
      border: `1px solid ${colors.borderLight}`, marginBottom: 12,
      boxShadow: shadows.card,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: colors.textLight,
        marginBottom: 12, textTransform: "uppercase", letterSpacing: 1,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        {title}
      </div>
      {children}
    </div>
  );
}

function ThresholdRow({ label, value, desc }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0", borderBottom: `1px solid ${colors.borderLight}`,
    }}>
      <div>
        <div style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 10, color: colors.textLight }}>{desc}</div>
      </div>
      <span style={{
        fontSize: 14, fontWeight: 700, color: colors.primary,
        fontFamily: font,
      }}>
        {value}
      </span>
    </div>
  );
}
