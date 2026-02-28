import { Component } from "react";
import { colors, fontDisplay, font, radius } from "../../styles/theme";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console for debugging (will be replaced by backend logging later)
    console.error("[YPOTI ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "60vh", padding: 32, textAlign: "center",
        }}>
          <div style={{
            fontSize: 48, marginBottom: 16,
          }}>
            ⚠️
          </div>
          <h2 style={{
            fontFamily: fontDisplay, fontSize: 20, fontWeight: 700,
            color: colors.text, margin: "0 0 8px",
          }}>
            Algo salio mal
          </h2>
          <p style={{
            fontFamily: font, fontSize: 14, color: colors.textLight,
            margin: "0 0 24px", maxWidth: 400,
          }}>
            Ocurrio un error inesperado. Intenta nuevamente o recarga la pagina.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: "10px 24px", borderRadius: radius.lg, border: "none",
                background: colors.primary, color: "#fff",
                fontSize: 14, fontWeight: 600, fontFamily: font,
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 24px", borderRadius: radius.lg,
                border: `1px solid ${colors.border}`, background: colors.card,
                color: colors.text, fontSize: 14, fontWeight: 600,
                fontFamily: font, cursor: "pointer",
              }}
            >
              Recargar pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
