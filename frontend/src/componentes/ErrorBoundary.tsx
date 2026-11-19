import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary atrapó un error no controlado:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] h-full p-6 text-center">
          <div className="bg-[#1C2541] border border-[#D97706]/40 p-6 rounded-2xl max-w-md w-full shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#D97706]/20 text-[#D97706] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-[#F4D6B0] text-lg font-bold mb-2">
              {this.props.fallbackTitle || "Ocurrió un error en esta sección"}
            </h2>
            <p className="text-[#5BC0DE] text-xs mb-4">
              {this.state.error?.message || "Error inesperado al renderizar el módulo."}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-[#5BC0DE] hover:bg-[#5BC0DE]/80 text-[#0B132B] font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw size={14} /> Reintentar
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
