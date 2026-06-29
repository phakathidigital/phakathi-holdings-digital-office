import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Application render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
          <div className="max-w-2xl rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-3">Phakathi Flow</p>
            <h1 className="text-2xl font-bold mb-3">The app hit a startup error.</h1>
            <p className="text-white/70 mb-4">
              This screen is shown instead of a blank white page so we can diagnose the issue quickly.
            </p>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-black/40 p-4 text-sm text-amber-100">
              {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-white px-4 py-2 font-semibold text-gray-950 hover:bg-gray-100"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
