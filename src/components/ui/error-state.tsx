// Reusable error state component for displaying errors with retry functionality
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
    title?: string;
    message?: string;
    error?: Error | string | null;
    onRetry?: () => void;
    retryLabel?: string;
    variant?: 'default' | 'connection' | 'minimal';
    className?: string;
    showDetails?: boolean;
}

/**
 * ErrorState component displays user-friendly error messages with retry functionality.
 * Use this for displaying errors in data fetching, form submissions, etc.
 */
export function ErrorState({
    title = 'Something went wrong',
    message = 'An unexpected error occurred. Please try again.',
    error,
    onRetry,
    retryLabel = 'Try Again',
    variant = 'default',
    className,
    showDetails = false,
}: ErrorStateProps) {
    const errorMessage = typeof error === 'string' ? error : error?.message;
    const isConnectionError = variant === 'connection' || errorMessage?.toLowerCase().includes('network');

    const Icon = isConnectionError ? WifiOff : AlertTriangle;
    const iconColor = isConnectionError ? 'text-warning' : 'text-destructive';
    const bgColor = isConnectionError ? 'bg-warning/10' : 'bg-destructive/10';

    if (variant === 'minimal') {
        return (
            <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
                <Icon className={cn('h-4 w-4', iconColor)} />
                <span>{errorMessage || message}</span>
                {onRetry && (
                    <Button
                        onClick={onRetry}
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1"
                    >
                        <RefreshCw className="h-3 w-3" />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
            <div className={cn('p-3 rounded-full mb-4', bgColor)}>
                <Icon className={cn('h-8 w-8', iconColor)} />
            </div>

            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
                {errorMessage || message}
            </p>

            {showDetails && error && typeof error !== 'string' && error.stack && (
                <details className="mb-4 text-left w-full max-w-md">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        Show technical details
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                        {error.stack}
                    </pre>
                </details>
            )}

            {onRetry && (
                <Button onClick={onRetry} variant="default">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {retryLabel}
                </Button>
            )}

            {isConnectionError && (
                <div className="mt-4 text-xs text-muted-foreground">
                    <p>Check your internet connection and try again</p>
                </div>
            )}
        </div>
    );
}

/**
 * Inline error message for forms and small UI elements
 */
export function InlineError({
    message,
    className,
}: {
    message: string;
    className?: string;
}) {
    return (
        <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
            <AlertTriangle className="h-4 w-4" />
            <span>{message}</span>
        </div>
    );
}
