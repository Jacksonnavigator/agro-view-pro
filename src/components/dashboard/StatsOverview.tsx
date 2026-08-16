// Dashboard statistics overview component with enhanced visuals
import { useDevices } from '@/context/DeviceContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  Cpu,
  CheckCircle,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatsOverview() {
  const { devices } = useDevices();

  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.status === 'online').length,
    offline: devices.filter((d) => d.status === 'offline').length,
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
      trend: null,
    },
    {
      label: 'Offline',
      value: stats.offline,
      icon: WifiOff,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      glowColor: 'group-hover:shadow-[0_0_30px_hsl(0_72%_51%/0.2)]',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 stagger-fade">
      {statCards.map((stat) => (
        <Card
          key={stat.label}
          className={cn(
            'group border-border/80 bg-gradient-to-br from-card to-secondary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-25px_rgba(15,23,42,0.18)]',
            stat.glowColor
          )}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className={cn('rounded-2xl p-3 shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105', stat.bgColor)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
            </div>
            <div className="mt-4">
              <p className={cn('font-mono text-3xl font-bold tracking-tight', stat.color)}>
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
