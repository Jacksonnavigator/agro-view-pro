// Metric display card for sensor readings
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  status?: 'normal' | 'warning' | 'critical';
  className?: string;
}

const statusStyles = {
  normal: 'border-border bg-card',
  warning: 'border-warning/50 bg-warning/5',
  critical: 'border-destructive/50 bg-destructive/5',
};

const iconStatusStyles = {
  normal: 'text-primary',
  warning: 'text-warning',
  critical: 'text-destructive',
};

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  status = 'normal',
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border p-4 transition-all duration-200 hover:border-primary/30',
        statusStyles[status],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-semibold tracking-tight">
              {value}
            </span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        </div>
        <div
          className={cn(
            'rounded-lg bg-secondary p-2',
            iconStatusStyles[status]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      
      {/* Trend indicator */}
      {trend && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {trend === 'up' && (
            <span className="text-success">↑ Rising</span>
          )}
          {trend === 'down' && (
            <span className="text-info">↓ Falling</span>
          )}
          {trend === 'stable' && (
            <span className="text-muted-foreground">→ Stable</span>
          )}
        </div>
      )}

      {/* Decorative gradient */}
      <div
        className={cn(
          'absolute -bottom-4 -right-4 h-16 w-16 rounded-full opacity-10 blur-2xl',
          status === 'normal' && 'bg-primary',
          status === 'warning' && 'bg-warning',
          status === 'critical' && 'bg-destructive'
        )}
      />
    </div>
  );
}
