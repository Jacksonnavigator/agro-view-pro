// Plots/Location view page with interactive map and error handling
import { useState, useMemo, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useDevices } from '@/context/DeviceContext';
import { Header } from '@/components/layout/Header';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeviceMap } from '@/components/dashboard/DeviceMap';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { 
  MapPin, 
  Cpu, 
  Droplets, 
  Thermometer, 
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  LayoutGrid,
  Map
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Plots = forwardRef<HTMLDivElement, object>(function Plots(_props, ref) {
  const { plots, devices, getPlotDevices, isLoading, error, refreshData } = useDevices();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Calculate stats for each plot with memoization
  const plotStats = useMemo(() => plots.map((plot) => {
    const plotDevices = getPlotDevices(plot.id);
    const online = plotDevices.filter((d) => d.status === 'online').length;
    const warning = plotDevices.filter((d) => d.status === 'warning').length;
    const offline = plotDevices.filter((d) => d.status === 'offline').length;
    
    // Calculate averages safely
    const avgMoisture = plotDevices.length > 0 
      ? plotDevices.reduce((sum, d) => sum + d.readings.moisture, 0) / plotDevices.length 
      : 0;
    const avgTemp = plotDevices.length > 0 
      ? plotDevices.reduce((sum, d) => sum + d.readings.temperature, 0) / plotDevices.length 
      : 0;

    return {
      ...plot,
      devices: plotDevices,
      stats: { online, warning, offline, total: plotDevices.length },
      averages: { moisture: avgMoisture, temperature: avgTemp },
    };
  }), [plots, getPlotDevices]);

  // Loading state
  if (isLoading && plots.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && plots.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <ErrorState
          title="Failed to Load Plots"
          message={error}
          onRetry={refreshData}
          variant="connection"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <Header 
        title="Plots & Locations" 
        subtitle="Manage sensor deployment areas"
      >
        <div className="flex rounded-lg border bg-secondary p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className={cn('gap-2', viewMode === 'grid' && 'bg-primary text-primary-foreground')}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            className={cn('gap-2', viewMode === 'map' && 'bg-primary text-primary-foreground')}
            onClick={() => setViewMode('map')}
          >
            <Map className="h-4 w-4" />
            Map
          </Button>
        </div>
      </Header>

      {/* Overall stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold">{plots.length}</p>
                <p className="text-sm text-muted-foreground">Total Plots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Cpu className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold">{devices.length}</p>
                <p className="text-sm text-muted-foreground">Total Sensors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2">
                <Droplets className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold">
                  {devices.length > 0 
                    ? (devices.reduce((sum, d) => sum + d.readings.moisture, 0) / devices.length).toFixed(1) 
                    : '0.0'}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Moisture</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Map className="h-4 w-4" />
              Plot & Device Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeviceMap devices={devices} height="500px" plots={plotStats} />
          </CardContent>
        </Card>
      )}

      {/* Grid View - Plot cards */}
      {viewMode === 'grid' && (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {plotStats.map((plot) => (
            <Card key={plot.id} className="card-hover group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{plot.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{plot.description}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Device status breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Device Status</span>
                    <span className="font-mono">{plot.stats.total} devices</span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div 
                      className="bg-success rounded-l transition-all"
                      style={{ width: `${(plot.stats.online / plot.stats.total) * 100}%` }}
                    />
                    <div 
                      className="bg-warning transition-all"
                      style={{ width: `${(plot.stats.warning / plot.stats.total) * 100}%` }}
                    />
                    <div 
                      className="bg-destructive rounded-r transition-all"
                      style={{ width: `${(plot.stats.offline / plot.stats.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-success" />
                      {plot.stats.online} online
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-warning" />
                      {plot.stats.warning} warning
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-destructive" />
                      {plot.stats.offline} offline
                    </span>
                  </div>
                </div>

                {/* Average readings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Droplets className="h-4 w-4 text-chart-moisture" />
                      <span className="text-xs">Avg Moisture</span>
                    </div>
                    <p className="mt-1 font-mono text-lg font-semibold">
                      {plot.averages.moisture.toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Thermometer className="h-4 w-4 text-chart-temperature" />
                      <span className="text-xs">Avg Temp</span>
                    </div>
                    <p className="mt-1 font-mono text-lg font-semibold">
                      {plot.averages.temperature.toFixed(1)}°C
                    </p>
                  </div>
                </div>

                {/* Device list */}
                <div className="space-y-2">
                  {plot.devices.slice(0, 3).map((device) => (
                    <Link
                      key={device.id}
                      to={`/device/${device.id}`}
                      className="flex items-center justify-between rounded-lg border p-2 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <StatusIndicator status={device.status} size="sm" />
                        <span className="text-sm font-medium">{device.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>

                {plot.devices.length > 3 && (
                  <Button asChild variant="ghost" className="w-full" size="sm">
                    <Link to="/devices">
                      View all {plot.devices.length} devices
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

Plots.displayName = 'Plots';

export default Plots;
