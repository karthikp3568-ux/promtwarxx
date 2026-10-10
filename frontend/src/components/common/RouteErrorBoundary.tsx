import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors and failed lazy-loaded page chunks so a single page
 * failure never blanks the whole app. Layout keys this by pathname, so
 * navigating elsewhere clears the error. React.lazy caches a rejected import,
 * so recovering the same page requires a full reload.
 */
export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Page failed to render:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="w-full max-w-4xl mx-auto py-12 animate-fadeIn">
        <div
          role="alert"
          className="glass-card rounded-3xl border border-[#F43F5E]/30 p-8 text-center max-w-md mx-auto shadow-2xl"
        >
          <div className="icon-tile w-14 h-14 rounded-2xl bg-[#F43F5E]/20 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[#F43F5E]" />
          </div>
          <h1 className="text-lg font-extrabold text-white mb-2 tracking-tight">This page failed to load</h1>
          <p className="text-sm text-gray-300 mb-6 leading-relaxed">
            Check your connection and reload. If the app was just updated, reloading fetches the latest version.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary text-sm px-5 py-2.5 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload page</span>
          </button>
        </div>
      </div>
    );
  }
}
