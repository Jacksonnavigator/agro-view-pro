// Main dashboard overview page
import { useMemo, useState, useCallback, forwardRef } from 'react';
import { useDevices } from '@/context/DeviceContext';
import { Header } from '@/components/layout/Header';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { DeviceCard } from '@/components/dashboard/DeviceCard';

import { SensorChart } from '@/components/dashboard/SensorChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff, Activity } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HistoricalReading, TimeRange } from '@/types/device';

const aggregateByMinute = (histories: HistoricalReading[][]): HistoricalReading[] => {
  const buckets = new Map<number, { count: number; moisture: number; temperature: number; ph: number; ec: number }>();

  histories.flat().forEach((reading) => {
    const minute = Math.floor(reading.timestamp.getTime() / 60000) * 60000;
    const bucket = buckets.get(minute) || { count: 0, moisture: 0, temperature: 0, ph: 0, ec: 0 };
    bucket.count += 1;
    bucket.moisture += reading.readings?.moisture ?? 0;
    bucket.temperature += reading.readings?.temperature ?? 0;
    bucket.ph += reading.readings?.ph ?? 7;
    bucket.ec += reading.readings?.ec ?? 0;
    buckets.set(minute, bucket);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([time, bucket]) => ({
      timestamp: new Date(time),
      readings: {
        moisture: Number((bucket.moisture / bucket.count).toFixed(2)),
        temperature: Number((bucket.temperature / bucket.count).toFixed(2)),
        ph: Number((bucket.ph / bucket.count).toFixed(2)),
        ec: Number((bucket.ec / bucket.count).toFixed(2)),
      },
    }));
};

const Dashboard = forwardRef<HTMLDivElement, object>(function Dashboard(_props, ref) {
  const { devices, plots, isLoading, error, connectionStatus, refreshData, getDeviceHistory, deviceFreshness } = useDevices();
  const [selectedHours, setSelectedHours] = useState(24);
  const [selectedDeviceId, setSelectedDeviceId] = useState('all');

  // Handle time range change from chart
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setSelectedHours(range.hours);
  }, []);

  // Generate chart data from real histories for all devices or the selected device.
  const aggregatedChartData = useMemo(() => {
    if (devices.length === 0) return [];
    if (selectedDeviceId !== 'all') {
      return getDeviceHistory(selectedDeviceId, selectedHours);
    }
    return aggregateByMinute(devices.map((device) => getDeviceHistory(device.id, selectedHours)));
  }, [devices, getDeviceHistory, selectedDeviceId, selectedHours]);

  // Calculate real system health stats from devices
  const systemStats = useMemo(() => {
    if (devices.length === 0) {
      return {
        avgUptime: 0,
        totalReadings: 0
      };
    }

    const onlineCount = deviceFreshness.onlineCount;
    const readingsLastHour = devices.reduce(
      (count, device) => count + getDeviceHistory(device.id, 1).length,
      0
    );

    return {
      avgUptime: ((onlineCount / devices.length) * 100).toFixed(1),
      totalReadings: readingsLastHour
    };
  }, [devices, deviceFreshness.onlineCount, getDeviceHistory]);

  if (isLoading && devices.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error && devices.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-6">
        <ErrorState
          title="Connection Failed"
          message={error}
          onRetry={refreshData}
          variant="connection"
          showDetails
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in -mt-1">
      <div className="relative overflow-hidden rounded-[28px] border border-emerald-200/80 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-600 p-6 text-white shadow-[0_30px_60px_-35px_rgba(6,95,70,0.9)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.35),_transparent_35%)]" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-50/90">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
              AgroView Pro
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Farm intelligence overview</h1>
            <p className="mt-2 max-w-xl text-sm text-emerald-50/80 sm:text-base">
              Real-time soil health, climate conditions, and operational performance across every active zone.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-100/85">Online</p>
              <p className="mt-2 font-mono text-2xl font-bold text-white">{deviceFreshness.onlineCount}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-100/85">Zones</p>
              <p className="mt-2 font-mono text-2xl font-bold text-white">{plots.length}</p>
            </div>
          </div>
        </div>
      </div>

      {connectionStatus === 'disconnected' && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Connection Lost</AlertTitle>
          <AlertDescription>
            Live updates are currently unavailable. Showing last known data.
            <Button variant="link" className="h-auto p-0 ml-1 text-destructive font-semibold" onClick={refreshData}>
              Try reconnecting
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics overview */}
      <StatsOverview />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Device Status</h2>
            <p className="text-sm text-muted-foreground">Monitoring the current operational state of every field node</p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            {devices.length} devices
          </span>
        </div>

        {/* Tabs for plot-based filtering */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-1 shadow-sm">
            <TabsTrigger value="all" className="rounded-xl px-5 text-sm font-medium">All Devices</TabsTrigger>
            {plots.map((plot) => (
              <TabsTrigger key={plot.id} value={plot.id} className="rounded-xl px-5 text-sm font-medium">
                {plot.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {devices.map((device) => (
                <DeviceCard key={device.id} device={device} />
              ))}
            </div>
          </TabsContent>

          {plots.map((plot) => (
            <TabsContent key={plot.id} value={plot.id} className="mt-0">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {devices
                  .filter((d) => d.plotId === plot.id)
                  .map((device) => (
                    <DeviceCard key={device.id} device={device} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Charts section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sensor History</h2>
          <p className="text-sm text-muted-foreground">
            {selectedDeviceId === 'all' ? 'Average readings across all devices' : 'Readings for the selected device'}
          </p>
        </div>
        <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
          <SelectTrigger className="w-full sm:w-[260px]">
            <SelectValue placeholder="Select device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All devices average</SelectItem>
            {devices.map((device) => (
              <SelectItem key={device.id} value={device.id}>
                {device.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SensorChart
          data={aggregatedChartData}
          title="Sensor Readings"
          onTimeRangeChange={handleTimeRangeChange}
        />

        <Card className="premium-card border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="h-32 w-32 rotate-12" />
          </div>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className={deviceFreshness.hasLiveDevices ? 'h-2 w-2 rounded-full bg-success' : 'h-2 w-2 rounded-full bg-destructive'} />
              System Health Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Device uptime stats - REAL DATA */}
              <div className="rounded-lg border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Average Uptime</p>
                <p className="mt-1 font-mono text-3xl font-bold text-success">
                  {systemStats.avgUptime}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {devices.filter(d => d.status === 'online').length} of {devices.length} online
                </p>
              </div>

              {/* Data transmission rate - REAL DATA */}
              <div className="rounded-lg border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Data Rate</p>
                <p className="mt-1 font-mono text-3xl font-bold text-info">
                  {systemStats.totalReadings}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  readings in the last hour
                </p>
              </div>


            </div>
          </CardContent>
        </Card>
      </div>
    </div >
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
