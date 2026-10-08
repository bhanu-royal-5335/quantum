import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error trapped by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public handleResetToHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[350px] p-6 flex items-center justify-center">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-rose-200 shadow-xl p-6 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                {this.props.fallbackTitle || 'Component Rendering Recovered'}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                An unexpected state or missing telemetry occurred in this view. The application prevented a crash and safely isolated the component.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-900 rounded-xl text-left overflow-x-auto max-h-36">
                <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Error Diagnostics</span>
                <code className="text-xs font-mono text-slate-200 whitespace-pre-wrap block">
                  {this.state.error.message || 'Unknown render error'}
                </code>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2 shadow-sm transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry View</span>
              </button>

              <button
                onClick={this.handleResetToHome}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2 transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reset to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
