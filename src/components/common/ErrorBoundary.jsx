import { Component } from "react";
import { supabaseConfigured } from "../../lib/supabase";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[YPOTI ErrorBoundary]", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const isEnvMissing = !supabaseConfigured;
      const isChunkError = error?.message?.includes("Failed to fetch dynamically imported module")
        || error?.message?.includes("Loading chunk")
        || error?.name === "ChunkLoadError";

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="text-5xl mb-4">
            {isEnvMissing ? "🔧" : "⚠️"}
          </div>
          <h2 className="text-xl font-bold text-white m-0 mb-2">
            {isEnvMissing
              ? "Configuración incompleta"
              : isChunkError
                ? "Actualización disponible"
                : "Algo salió mal"}
          </h2>
          <p className="text-sm text-slate-400 m-0 mb-4 max-w-[440px]">
            {isEnvMissing
              ? "Faltan las variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. " +
                "Configurarlas en Vercel → Settings → Environment Variables."
              : isChunkError
                ? "Se desplegó una nueva versión. Recarga la página para actualizar."
                : "Ocurrió un error inesperado. Intenta nuevamente o recarga la página."}
          </p>

          {/* Stack trace (dev & production debugging) */}
          {error && !isEnvMissing && (
            <details className="text-left w-full max-w-[600px] mb-4">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 mb-2">
                Detalles del error
              </summary>
              <pre className="text-[10px] text-red-400/80 bg-black/40 rounded-lg p-3 overflow-auto max-h-[200px] whitespace-pre-wrap break-words">
                {error.toString()}
                {errorInfo?.componentStack && (
                  "\n\nComponent Stack:" + errorInfo.componentStack
                )}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            {!isEnvMissing && (
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 rounded-xl border-none bg-[#1F2A44] text-white text-sm font-semibold cursor-pointer"
              >
                Reintentar
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl border border-white/[0.08] bg-[#F8F9FB]/[0.03] text-white text-sm font-semibold cursor-pointer"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
