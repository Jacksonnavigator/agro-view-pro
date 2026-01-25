// Interactive map component showing device locations - uses lazy loading for Leaflet
import { Suspense, lazy } from 'react';
import { Device } from '@/types/device';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Lazy load the Leaflet map component
const LeafletMap = lazy(() => import('./LeafletMap'));

interface DeviceMapProps {
  devices: Device[];
  className?: string;
  height?: string;
  plots?: Array<{
    id: string;
    name: string;
    location?: { lat: number; lng: number };
  }>;
}

function MapLoader({ height }: { height: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border bg-muted"
      style={{ height }}
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function DeviceMap({ devices, className, height = '400px', plots }: DeviceMapProps) {
  const devicesWithLocation = devices.filter((d) => d.location);
  const plotsWithLocation = plots?.filter((p) => p.location) || [];

  if (devicesWithLocation.length === 0 && plotsWithLocation.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center rounded-lg border bg-muted', className)}
        style={{ height }}
      >
        <p className="text-muted-foreground">No devices or plots with location data</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl overflow-hidden border border-white/10 glass shadow-2xl', className)} style={{ height }}>
      <Suspense fallback={<MapLoader height={height} />}>
        <LeafletMap devices={devices} height={height} plots={plots} />
      </Suspense>
    </div>
  );
}