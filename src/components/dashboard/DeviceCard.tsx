// Device overview card component
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
  ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DeviceCardProps {
  device: Device;
  className?: string;
}

export function DeviceCard({ device, className }: DeviceCardProps) {
  const { readings, thresholds } = device;

  // Check if value is out of threshold
  const isOutOfRange = (value: number, min: number, max: number) => 
    value < min || value > max;

  const moistureStatus = isOutOfRange(readings.moisture, thresholds.moisture.min, thresholds.moisture.max);
  const tempStatus = isOutOfRange(readings.temperature, thresholds.temperature.min, thresholds.temperature.max);
  const phStatus = isOutOfRange(readings.ph, thresholds.ph.min, thresholds.ph.max);
  const ecStatus = isOutOfRange(readings.ec, thresholds.ec.min, thresholds.ec.max);

  return (
    <Card className={cn('card-hover group', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusIndicator status={device.status} size="sm" />
              <h3 className="font-semibold text-foreground">{device.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{device.plotName}</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-1" title="Signal Strength">
              <Wifi className="h-3.5 w-3.5" />
              <span className="text-xs font-mono">{device.signalStrength}%</span>
            </div>
            <div className="flex items-center gap-1" title="Battery Level">
              <Battery className="h-3.5 w-3.5" />
              <span className="text-xs font-mono">{device.batteryLevel}%</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sensor readings grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Moisture */}
          <div className={cn(
            'rounded-lg border p-3 transition-colors',
            moistureStatus ? 'border-warning/50 bg-warning/5' : 'border-border'
          )}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="h-4 w-4 text-chart-moisture" />
              <span className="text-xs">Moisture</span>
            </div>
            <p className="mt-1 font-mono text-lg font-semibold">
              {readings.moisture}%
            </p>
          </div>

          {/* Temperature */}
          <div className={cn(
            'rounded-lg border p-3 transition-colors',
            tempStatus ? 'border-warning/50 bg-warning/5' : 'border-border'
          )}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Thermometer className="h-4 w-4 text-chart-temperature" />
              <span className="text-xs">Temperature</span>
            </div>
            <p className="mt-1 font-mono text-lg font-semibold">
              {readings.temperature}°C
            </p>
          </div>

          {/* pH */}
          <div className={cn(
            'rounded-lg border p-3 transition-colors',
            phStatus ? 'border-warning/50 bg-warning/5' : 'border-border'
          )}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FlaskConical className="h-4 w-4 text-chart-ph" />
              <span className="text-xs">pH Level</span>
            </div>
            <p className="mt-1 font-mono text-lg font-semibold">
              {readings.ph}
            </p>
          </div>

          {/* EC */}
          <div className={cn(
            'rounded-lg border p-3 transition-colors',
            ecStatus ? 'border-warning/50 bg-warning/5' : 'border-border'
          )}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 text-chart-ec" />
              <span className="text-xs">EC</span>
            </div>
            <p className="mt-1 font-mono text-lg font-semibold">
              {readings.ec} mS/cm
            </p>
          </div>
        </div>

        {/* Footer with timestamp and action */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDistanceToNow(device.lastUpdated, { addSuffix: true })}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Link to={`/device/${device.id}`}>
              Details
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
