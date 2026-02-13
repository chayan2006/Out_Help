import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '50px auto' }}>
          <h1 style={{ color: '#ef4444' }}>Something went wrong.</h1>
          <p>The application encountered an unexpected error.</p>
          <pre style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', overflowX: 'auto', fontSize: '12px' }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);