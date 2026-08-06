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
    bucket.moisture += reading.readings.moisture;
    bucket.temperature += reading.readings.temperature;
    bucket.ph += reading.readings.ph;
    bucket.ec += reading.readings.ec;
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
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <Header
          title="Dashboard Overview"
          subtitle="Real-time monitoring of all soil sensor devices"
        />
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
          <h2 className="text-lg font-semibold">Device Status</h2>
          <span className="text-sm text-muted-foreground">
            {devices.length} devices
          </span>
        </div>

        {/* Tabs for plot-based filtering */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 p-1 bg-white/5 border-white/10 rounded-2xl glass">
            <TabsTrigger value="all" className="rounded-xl px-6">All Devices</TabsTrigger>
            {plots.map((plot) => (
              <TabsTrigger key={plot.id} value={plot.id} className="rounded-xl px-6">
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
