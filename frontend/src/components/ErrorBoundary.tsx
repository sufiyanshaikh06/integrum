import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackViewName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Integrum View Error Boundary]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="card"
          style={{
            margin: '24px auto',
            maxWidth: '680px',
            padding: '32px',
            textAlign: 'center',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--card-bg, #ffffff)',
          }}
        >
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0' }}>
            {this.props.fallbackViewName
              ? `Unable to load ${this.props.fallbackViewName}`
              : 'Something went wrong in this module'}
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
            A temporary rendering fault occurred. Your underlying local workspace data is intact and safe.
          </p>
          {this.state.error && (
            <div
              style={{
                background: 'var(--bg-3)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: 'var(--error)',
                marginBottom: '20px',
                textAlign: 'left',
                overflowX: 'auto',
              }}
            >
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={this.handleReset}>
              Reload Module View
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                window.location.hash = '#';
                window.location.reload();
              }}
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
