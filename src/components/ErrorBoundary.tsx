// Global error boundary to catch React errors and prevent white screen crashes
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorCount: number;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI instead of the
 * component tree that crashed.
 * 
 * This prevents the "white screen of death" and provides users with recovery options.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Update state with error details
        this.setState((prevState) => ({
            errorInfo,
            errorCount: prevState.errorCount + 1,
        }));

        // Call optional error callback
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // In production, you might want to send this to an error reporting service
        // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI provided by parent
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            const { error, errorInfo, errorCount } = this.state;
            const isDevelopment = import.meta.env.DEV;

            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <Card className="max-w-2xl w-full">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-destructive/10">
                                    <AlertTriangle className="h-6 w-6 text-destructive" />
                                </div>
                                <div>
                                    <CardTitle>Something went wrong</CardTitle>
                                    <CardDescription>
                                        We encountered an unexpected error. Don't worry, your data is safe.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Error message */}
                            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                                <p className="text-sm font-medium text-destructive mb-1">
                                    Error: {error?.message || 'Unknown error'}
                                </p>
                                {errorCount > 1 && (
                                    <p className="text-xs text-muted-foreground">
                                        This error has occurred {errorCount} times
                                    </p>
                                )}
                            </div>

                            {/* Development-only error details */}
                            {isDevelopment && errorInfo && (
                                <details className="rounded-lg border bg-muted/50 p-4">
                                    <summary className="cursor-pointer text-sm font-medium mb-2">
                                        Technical Details (Development Only)
                                    </summary>
                                    <div className="space-y-2 mt-2">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                                Error Stack:
                                            </p>
                                            <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-40">
                                                {error?.stack}
                                            </pre>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                                Component Stack:
                                            </p>
                                            <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-40">
                                                {errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    </div>
                                </details>
                            )}

                            {/* Recovery actions */}
                            <div className="space-y-2">
                                <p className="text-sm font-medium">What you can do:</p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                        onClick={this.handleReset}
                                        variant="default"
                                        className="flex-1"
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Try Again
                                    </Button>
                                    <Button
                                        onClick={this.handleGoHome}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <Home className="mr-2 h-4 w-4" />
                                        Go to Home
                                    </Button>
                                    <Button
                                        onClick={this.handleReload}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Reload Page
                                    </Button>
                                </div>
                            </div>

                            {/* Helpful tips */}
                            <div className="rounded-lg bg-muted/50 p-4">
                                <p className="text-sm font-medium mb-2">Troubleshooting tips:</p>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>Try refreshing the page</li>
                                    <li>Clear your browser cache and cookies</li>
                                    <li>Check your internet connection</li>
                                    <li>If the problem persists, contact support</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook-based error boundary for functional components
 * Note: This is a wrapper around the class-based ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<Props, 'children'>
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}
