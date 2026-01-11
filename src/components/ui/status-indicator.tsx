// Status indicator component with animated pulse effect
import { cn } from '@/lib/utils';
import { DeviceStatus } from '@/types/device';

interface StatusIndicatorProps {
  status: DeviceStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  online: {
    color: 'bg-success',
    label: 'Online',
    glow: 'shadow-[0_0_8px_hsl(var(--success))]',
  },
  warning: {
    color: 'bg-warning',
    label: 'Warning',
    glow: 'shadow-[0_0_8px_hsl(var(--warning))]',
  },
  offline: {
    color: 'bg-destructive',
    label: 'Offline',
    glow: 'shadow-[0_0_8px_hsl(var(--destructive))]',
  },
};

const sizeConfig = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = false, 
  className 
}: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        {/* Pulse animation for online/warning status */}
        {status !== 'offline' && (
          <div
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-75',
              config.color
            )}
          />
        )}
        <div
          className={cn(
            'relative rounded-full',
            config.color,
            config.glow,
            sizeConfig[size]
          )}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground">
          {config.label}
        </span>
      )}
    </div>
  );
}
