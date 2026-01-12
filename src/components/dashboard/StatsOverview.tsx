// Dashboard statistics overview component with enhanced visuals
import { useDevices } from '@/context/DeviceContext';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  WifiOff,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight
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
      glowColor: 'group-hover:shadow-[0_0_30px_hsl(145_65%_42%/0.2)]',
      trend: null,
    },
    {
      label: 'Online',
      value: stats.online,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      glowColor: 'group-hover:shadow-[0_0_30px_hsl(145_70%_45%/0.2)]',
      trend: { value: 2, positive: true },
    },
    {
      label: 'Warning',
      value: stats.warning,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      glowColor: 'group-hover:shadow-[0_0_30px_hsl(38_92%_50%/0.2)]',
      trend: stats.warning > 0 ? { value: 1, positive: false } : null,
    },
    {
      label: 'Offline',
      value: stats.offline,
      icon: WifiOff,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      glowColor: 'group-hover:shadow-[0_0_30px_hsl(0_72%_51%/0.2)]',
      trend: stats.offline > 0 ? { value: stats.offline, positive: false } : null,
    },
    {
      label: 'Active Alerts',
      value: stats.activeAlerts,
      icon: Activity,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      glowColor: 'group-hover:shadow-[0_0_30px_hsl(38_92%_50%/0.2)]',
      trend: null,
    },
    {
      label: 'Critical',
      value: stats.criticalAlerts,
      icon: TrendingUp,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      glowColor: 'group-hover:shadow-[0_0_30px_hsl(0_72%_51%/0.2)]',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 stagger-fade">
      {statCards.map((stat) => (
        <Card 
          key={stat.label} 
          className={cn(
            'group border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5',
            stat.glowColor
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className={cn('rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110', stat.bgColor)}>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </div>
              {stat.trend && (
                <div className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  stat.trend.positive ? 'text-success' : 'text-destructive'
                )}>
                  {stat.trend.positive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {stat.trend.value}
                </div>
              )}
            </div>
            <div className="mt-3">
              <p className={cn('font-mono text-3xl font-bold tracking-tight', stat.color)}>
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
