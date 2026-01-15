// Device overview card component with enhanced visuals
import { Link } from 'react-router-dom';
import { Device } from '@/types/device';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Droplets,
  Thermometer,
  FlaskConical,
  Zap,
  Wifi,
  Battery,
  Clock,
  ChevronRight,
  Signal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DeviceCardProps {
  device: Device;
  className?: string;
}

export function DeviceCard({ device, className }: DeviceCardProps) {
  const { readings, thresholds } = device;

  // Safety check for readings
  const safeReadings = {
    moisture: readings?.moisture ?? 0,
    temperature: readings?.temperature ?? 0,
    ph: readings?.ph ?? 7,
    ec: readings?.ec ?? 0,
  };

  // Check if value is out of threshold
  const isOutOfRange = (value: number, min: number, max: number) =>
    value < min || value > max;

  const moistureStatus = isOutOfRange(safeReadings.moisture, thresholds.moisture.min, thresholds.moisture.max);
  const tempStatus = isOutOfRange(safeReadings.temperature, thresholds.temperature.min, thresholds.temperature.max);
  const phStatus = isOutOfRange(safeReadings.ph, thresholds.ph.min, thresholds.ph.max);
  const ecStatus = isOutOfRange(safeReadings.ec, thresholds.ec.min, thresholds.ec.max);

  const statusGlow = {
    online: 'hover:shadow-[0_0_30px_hsl(145_70%_45%/0.15)]',
    warning: 'hover:shadow-[0_0_30px_hsl(38_92%_50%/0.15)]',
    offline: 'hover:shadow-[0_0_30px_hsl(0_72%_51%/0.15)]',
  };

  return (
    <Card className={cn(
      'group relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1',
      statusGlow[device.status],
      className
    )}>
      {/* Status accent line */}
      <div className={cn(
        'absolute left-0 top-0 h-full w-1 transition-all duration-300',
        device.status === 'online' && 'bg-success',
        device.status === 'warning' && 'bg-warning',
        device.status === 'offline' && 'bg-destructive'
      )} />

      <CardHeader className="pb-3 pl-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusIndicator status={device.status} size="sm" />
              <h3 className="font-semibold text-foreground">{device.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{device.plotName}</p>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-1.5" title="Signal Strength">
              <Signal className={cn(
                'h-3.5 w-3.5',
                device.signalStrength > 70 ? 'text-success' :
                  device.signalStrength > 40 ? 'text-warning' : 'text-destructive'
              )} />
              <span className="text-xs font-mono">{device.signalStrength}%</span>
            </div>
            <div className="flex items-center gap-1.5" title="Battery Level">
              <Battery className={cn(
                'h-3.5 w-3.5',
                device.batteryLevel > 50 ? 'text-success' :
                  device.batteryLevel > 20 ? 'text-warning' : 'text-destructive'
              )} />
              <span className="text-xs font-mono">{device.batteryLevel}%</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pl-5">
        {/* Sensor readings grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Moisture */}
          <div className={cn(
            'rounded-xl border p-3 transition-all duration-200',
            moistureStatus
              ? 'border-warning/40 bg-warning/5'
              : 'border-border/30 bg-secondary/20 hover:bg-secondary/30'
          )}>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-info/10 p-1.5">
                <Droplets className="h-3.5 w-3.5 text-info" />
              </div>
              <span className="text-xs text-muted-foreground">Moisture</span>
            </div>
            <p className="mt-2 font-mono text-xl font-bold tracking-tight">
              {safeReadings.moisture}<span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
          </div>

          {/* Temperature */}
          <div className={cn(
            'rounded-xl border p-3 transition-all duration-200',
            tempStatus
              ? 'border-warning/40 bg-warning/5'
              : 'border-border/30 bg-secondary/20 hover:bg-secondary/30'
          )}>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-destructive/10 p-1.5">
                <Thermometer className="h-3.5 w-3.5 text-destructive" />
              </div>
              <span className="text-xs text-muted-foreground">Temp</span>
            </div>
            <p className="mt-2 font-mono text-xl font-bold tracking-tight">
              {safeReadings.temperature}<span className="text-sm font-normal text-muted-foreground">°C</span>
            </p>
          </div>

          {/* pH */}
          <div className={cn(
            'rounded-xl border p-3 transition-all duration-200',
            phStatus
              ? 'border-warning/40 bg-warning/5'
              : 'border-border/30 bg-secondary/20 hover:bg-secondary/30'
          )}>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-success/10 p-1.5">
                <FlaskConical className="h-3.5 w-3.5 text-success" />
              </div>
              <span className="text-xs text-muted-foreground">pH</span>
            </div>
            <p className="mt-2 font-mono text-xl font-bold tracking-tight">
              {safeReadings.ph}
            </p>
          </div>

          {/* EC */}
          <div className={cn(
            'rounded-xl border p-3 transition-all duration-200',
            ecStatus
              ? 'border-warning/40 bg-warning/5'
              : 'border-border/30 bg-secondary/20 hover:bg-secondary/30'
          )}>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-500/10 p-1.5">
                <Zap className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <span className="text-xs text-muted-foreground">EC</span>
            </div>
            <p className="mt-2 font-mono text-xl font-bold tracking-tight">
              {safeReadings.ec}<span className="text-sm font-normal text-muted-foreground">mS</span>
            </p>
          </div>
        </div>

        {/* Footer with timestamp and action */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDistanceToNow(device.lastUpdated, { addSuffix: true })}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10"
          >
            <Link to={`/device/${device.id}`}>
              View Details
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
