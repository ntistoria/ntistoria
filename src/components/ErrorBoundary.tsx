import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional label shown in the error message (e.g. "ტესტების გვერდი") */
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * I13 — Error Boundary
 * Catches uncaught JS errors in the child tree and renders a friendly fallback
 * instead of crashing the entire app. Wrap around TestsView and QuizzesView in App.tsx.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary] Uncaught error in "${this.props.section ?? 'component'}":`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">
            {this.props.section ? `${this.props.section} — ` : ''}შეცდომა მოხდა
          </h2>
          <p className="text-sm text-[#666] max-w-md mb-1">
            გვერდის ჩატვირთვისას მოულოდნელი შეცდომა წარმოიშვა.
          </p>
          {this.state.error?.message && (
            <p className="text-xs text-[#999] font-mono bg-[#f5f5f5] rounded px-3 py-1 mb-6 max-w-lg break-all">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C79B3A] text-white rounded-xl text-sm font-semibold hover:bg-[#b8883a] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            სცადეთ ხელახლა
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
