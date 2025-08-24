import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-auto p-6 text-center">
            <div className="mb-6">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Oops! Something went wrong
              </h2>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left bg-muted p-4 rounded-lg">
                <summary className="font-medium cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-sm overflow-auto">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="space-y-3">
              <Button 
                onClick={this.handleRetry} 
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={this.handleReload} 
                className="w-full"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Spinner Component
export const LoadingSpinner: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClasses[size]} ${className}`} />
  );
};

// Loading Page Component
export const LoadingPage: React.FC<{ 
  message?: string;
}> = ({ message = "Loading..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
);

// Error Message Component
export const ErrorMessage: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({ 
  title = "Something went wrong",
  message, 
  onRetry, 
  className = "" 
}) => (
  <div className={`text-center p-6 ${className}`}>
    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground mb-4">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    )}
  </div>
);

// Empty State Component
export const EmptyState: React.FC<{
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}> = ({ 
  icon, 
  title, 
  description, 
  action, 
  className = "" 
}) => (
  <div className={`text-center p-8 ${className}`}>
    {icon && <div className="mb-4">{icon}</div>}
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    {description && (
      <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
        {description}
      </p>
    )}
    {action && <div>{action}</div>}
  </div>
);
