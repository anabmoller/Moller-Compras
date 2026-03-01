import { Component } from "react";

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
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="text-5xl mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white m-0 mb-2">
            Algo salio mal
          </h2>
          <p className="text-sm text-slate-400 m-0 mb-6 max-w-[400px]">
            Ocurrio un error inesperado. Intenta nuevamente o recarga la pagina.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-6 py-2.5 rounded-xl border-none bg-emerald-500 text-white text-sm font-semibold cursor-pointer"
            >
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm font-semibold cursor-pointer"
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
