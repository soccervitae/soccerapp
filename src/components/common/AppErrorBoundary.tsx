import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to help debugging in PWA where blank screens are common
    console.error("[AppErrorBoundary] Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReload = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-lg font-bold">Algo deu errado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A tela ficou em branco por causa de um erro inesperado. Você pode recarregar o app.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold"
            >
              Recarregar
            </button>
            <button
              type="button"
              onClick={this.handleClearCacheAndReload}
              className="w-full h-11 rounded-xl border border-border bg-card text-foreground font-semibold"
            >
              Limpar cache e recarregar
            </button>
          </div>

          {this.state.error?.message ? (
            <pre className="mt-4 text-left text-xs p-3 rounded-lg bg-card border border-border overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          ) : null}
        </div>
      </div>
    );
  }
}
