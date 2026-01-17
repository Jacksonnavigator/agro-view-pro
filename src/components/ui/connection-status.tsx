// Connection status indicator component
import { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
    isConnected: boolean;
    isError?: boolean;
    lastUpdate?: Date;
    className?: string;
    variant?: 'badge' | 'inline' | 'toast';
}

/**
 * ConnectionStatus component displays the current connection state
 * and last update time for Firebase or other real-time connections.
 */
export function ConnectionStatus({
    isConnected,
    isError = false,
    lastUpdate,
    className,
    variant = 'inline',
}: ConnectionStatusProps) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const status = !isOnline || isError ? 'offline' : isConnected ? 'connected' : 'connecting';

    const statusConfig = {
        connected: {
            icon: Wifi,
            label: 'Connected',
            color: 'text-success',
            bgColor: 'bg-success/10',
            dotColor: 'bg-success',
        },
        connecting: {
            icon: Wifi,
            label: 'Connecting...',
            color: 'text-warning',
            bgColor: 'bg-warning/10',
            dotColor: 'bg-warning',
        },
        offline: {
            icon: isError ? AlertCircle : WifiOff,
            label: isError ? 'Connection Error' : 'Offline',
            color: 'text-destructive',
            bgColor: 'bg-destructive/10',
            dotColor: 'bg-destructive',
        },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    if (variant === 'badge') {
        return (
            <div
                className={cn(
                    'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium',
                    config.bgColor,
                    config.color,
                    className
                )}
            >
                <div className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
                {config.label}
            </div>
        );
    }

    if (variant === 'toast') {
        return (
            <div
                className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border',
                    config.bgColor,
                    className
                )}
            >
                <Icon className={cn('h-4 w-4', config.color)} />
                <div className="flex-1">
                    <p className={cn('text-sm font-medium', config.color)}>{config.label}</p>
                    {lastUpdate && status === 'connected' && (
                        <p className="text-xs text-muted-foreground">
                            Last update: {lastUpdate.toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // inline variant (default)
    return (
        <div className={cn('flex items-center gap-2 text-sm', className)}>
            <Icon className={cn('h-4 w-4', config.color)} />
            <span className={config.color}>{config.label}</span>
            {lastUpdate && status === 'connected' && (
                <span className="text-muted-foreground">
                    • {lastUpdate.toLocaleTimeString()}
                </span>
            )}
        </div>
    );
}

/**
 * Simple connection dot indicator
 */
export function ConnectionDot({ isConnected }: { isConnected: boolean }) {
    return (
        <div className="relative">
            <div
                className={cn(
                    'h-2 w-2 rounded-full',
                    isConnected ? 'bg-success' : 'bg-destructive'
                )}
            />
            {isConnected && (
                <div className="absolute inset-0 h-2 w-2 rounded-full bg-success animate-ping opacity-75" />
            )}
        </div>
    );
}
