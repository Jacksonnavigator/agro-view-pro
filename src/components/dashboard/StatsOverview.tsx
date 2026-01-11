// Dashboard statistics overview component
import { useDevices } from '@/context/DeviceContext';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  WifiOff,
  TrendingUp,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatsOverview() {
  const { devices, alerts, unacknowledgedAlertCount } = useDevices();

  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.status === 'online').length,
    warning: devices.filter((d) => d.status === 'warning').length,
    offline: devices.filter((d) => d.status === 'offline').length,
    activeAlerts: unacknowledgedAlertCount,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length,
  };

  const statCards = [
    {
      label: 'Total Devices',
      value: stats.total,
      icon: Cpu,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Online',
      value: stats.online,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Warning',
      value: stats.warning,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Offline',
      value: stats.offline,
      icon: WifiOff,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Active Alerts',
      value: stats.activeAlerts,
      icon: Activity,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Critical',
      value: stats.criticalAlerts,
      icon: TrendingUp,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {statCards.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2', stat.bgColor)}>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
