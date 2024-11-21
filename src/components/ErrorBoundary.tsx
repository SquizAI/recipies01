import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private getErrorMessage(error: Error | null): string {
    if (!error) return 'An unexpected error occurred';
    
    if (error.name === 'APIError') {
      switch ((error as any).code) {
        case 'EXTRACTION_ERROR':
          return 'Could not extract recipe from the Instagram post. Please check the URL and try again.';
        case 'DB_ERROR':
          return 'Database error occurred. Please try again later.';
        case 'PDF_ERROR':
          return 'Could not generate PDF. Please try again.';
        default:
          return error.message || 'An error occurred while processing your request';
      }
    }

    return error.message || 'An unexpected error occurred';
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
          <div className="max-w-md p-8 glass-panel">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-4 text-center">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-300 mb-6 text-center">
              {this.getErrorMessage(this.state.error)}
            </p>
            <div className="flex justify-center">
              <button
                onClick={this.handleRetry}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}