// Alerts panel component for displaying and managing alerts
import { Alert as AlertType } from '@/types/device';
import { useDevices } from '@/context/DeviceContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  MessageSquare, 
  Check,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AlertsPanelProps {
  maxItems?: number;
  className?: string;
}

const severityConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
    iconColor: 'text-info',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    iconColor: 'text-warning',
  },
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    iconColor: 'text-destructive',
  },
};

export function AlertsPanel({ maxItems = 10, className }: AlertsPanelProps) {
  const { alerts, acknowledgeAlert } = useDevices();
  
  // Sort alerts: unacknowledged first, then by timestamp
  const sortedAlerts = [...alerts]
    .sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) {
        return a.acknowledged ? 1 : -1;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    })
    .slice(0, maxItems);

  if (sortedAlerts.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div className="rounded-full bg-success/10 p-3 mb-3">
          <Bell className="h-6 w-6 text-success" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">All systems normal</p>
        <p className="text-xs text-muted-foreground mt-1">No active alerts</p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn('h-[400px]', className)}>
      <div className="space-y-2 pr-4">
        {sortedAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={cn(
                'relative rounded-lg border p-3 transition-all',
                config.bgColor,
                config.borderColor,
                alert.acknowledged && 'opacity-50'
              )}
            >
              <div className="flex gap-3">
                <div className={cn('mt-0.5', config.iconColor)}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {alert.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {alert.deviceName} • {alert.plotName}
                      </p>
                    </div>
                    
                    {!alert.acknowledged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => acknowledgeAlert(alert.id)}
                        title="Acknowledge alert"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(alert.timestamp, { addSuffix: true })}</span>
                    
                    {alert.smsSent && (
                      <span className="flex items-center gap-1 text-success">
                        <MessageSquare className="h-3 w-3" />
                        SMS sent
                      </span>
                    )}
                    
                    {alert.acknowledged && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Check className="h-3 w-3" />
                        Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
