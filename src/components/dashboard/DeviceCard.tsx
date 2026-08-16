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
  Clock,
  ChevronRight,
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
    offline: 'hover:shadow-[0_0_30px_hsl(0_72%_51%/0.15)]',
  };

  return (
    <Card className={cn(
      'group relative overflow-hidden border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/90 to-emerald-50/40 shadow-[0_22px_40px_-28px_rgba(15,23,42,0.24)] transition-all duration-500 hover:-translate-y-1.5 hover:border-emerald-200 hover:shadow-[0_28px_55px_-32px_rgba(15,118,110,0.25)]',
      statusGlow[device.status],
      className
    )}>
      <CardHeader className="pb-3 pl-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <StatusIndicator status={device.status} size="sm" />
              <h3 className="text-lg font-semibold text-slate-900">{device.name}</h3>
            </div>
            <p className="text-sm text-slate-600">{device.plotName}</p>
          </div>
          <div className={cn(
            'rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em]',
            device.status === 'online'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          )}>
            {device.status}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pl-5 pb-5">
        {/* Sensor readings grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Moisture */}
          <div className={cn(
            'rounded-2xl border p-3.5 transition-all duration-300',
            moistureStatus
              ? 'border-amber-200 bg-amber-50/80 ring-1 ring-amber-100'
              : 'border-emerald-100 bg-emerald-50/70 hover:bg-emerald-50'
          )}>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-sky-100 p-1.5">
                <Droplets className="h-3.5 w-3.5 text-sky-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">Moisture</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900">
              {safeReadings.moisture}<span className="text-sm font-normal text-slate-500">%</span>
            </p>
          </div>

          {/* Temperature */}
          <div className={cn(
            'rounded-2xl border p-3.5 transition-all duration-300',
            tempStatus
              ? 'border-amber-200 bg-amber-50/80 ring-1 ring-amber-100'
              : 'border-orange-100 bg-orange-50/60 hover:bg-orange-50'
          )}>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-100 p-1.5">
                <Thermometer className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">Temp</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900">
              {safeReadings.temperature}<span className="text-sm font-normal text-slate-500">°C</span>
            </p>
          </div>

          {/* pH */}
          <div className={cn(
            'rounded-2xl border p-3.5 transition-all duration-200',
            phStatus
              ? 'border-amber-200 bg-amber-50/80'
              : 'border-emerald-100 bg-emerald-50/70 hover:bg-emerald-50'
          )}>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-100 p-1.5">
                <FlaskConical className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">pH</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900">
              {safeReadings.ph}
            </p>
          </div>

          {/* EC */}
          <div className={cn(
            'rounded-2xl border p-3.5 transition-all duration-200',
            ecStatus
              ? 'border-violet-200 bg-violet-50/80'
              : 'border-violet-100 bg-violet-50/60 hover:bg-violet-50'
          )}>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-violet-100 p-1.5">
                <Zap className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">EC</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900">
              {safeReadings.ec}<span className="text-sm font-normal text-slate-500">mS</span>
            </p>
          </div>
        </div>

        {/* Footer with timestamp and action */}
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDistanceToNow(device.lastUpdated, { addSuffix: true })}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1 rounded-full border border-emerald-200 bg-white/80 text-xs font-medium text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-50"
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
