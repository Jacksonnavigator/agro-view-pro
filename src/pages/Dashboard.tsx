// Main dashboard overview page
import { useMemo, useState, useCallback, forwardRef } from 'react';
import { useDevices } from '@/context/DeviceContext';
import { Header } from '@/components/layout/Header';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { DeviceCard } from '@/components/dashboard/DeviceCard';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { SensorChart } from '@/components/dashboard/SensorChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import { TimeRange } from '@/types/device';

const Dashboard = forwardRef<HTMLDivElement, object>(function Dashboard(_props, ref) {
  const { devices, plots, isLoading, error, connectionStatus, refreshData, lastRefresh, getDeviceHistory } = useDevices();
  const [selectedHours, setSelectedHours] = useState(24);

  // Handle time range change from chart
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setSelectedHours(range.hours);
  }, []);

  // Generate aggregated chart data from first device's history (real data from Firebase hook)
  const aggregatedChartData = useMemo(() => {
    if (devices.length === 0) return [];
    const history = getDeviceHistory(devices[0].id, selectedHours);
    console.log('[Dashboard] Chart data points:', history.length);
    return history;
  }, [devices, getDeviceHistory, selectedHours]);

  // Calculate real system health stats from devices
  const systemStats = useMemo(() => {
    if (devices.length === 0) {
      return {
        avgUptime: 0,
        avgSignal: 0,
        avgBattery: 0,
        totalReadings: 0
      };
    }

    // Calculate real averages from device data
    const totalSignal = devices.reduce((sum, d) => sum + d.signalStrength, 0);
    const totalBattery = devices.reduce((sum, d) => sum + d.batteryLevel, 0);
    const onlineCount = devices.filter(d => d.status === 'online').length;

    // Estimate readings per hour based on device count
    // Assuming each device sends 1 reading per minute
    const readingsPerHour = devices.length * 60;

    return {
      avgUptime: ((onlineCount / devices.length) * 100).toFixed(1),
      avgSignal: Math.round(totalSignal / devices.length),
      avgBattery: Math.round(totalBattery / devices.length),
      totalReadings: readingsPerHour
    };
  }, [devices]);

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
        >
          <ConnectionStatus
            isConnected={connectionStatus === 'connected'}
            isError={connectionStatus === 'disconnected'}
            lastUpdate={lastRefresh}
            variant="badge"
          />
        </Header>
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

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Device cards section - spans 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Device Status</h2>
            <span className="text-sm text-muted-foreground">
              {devices.length} devices
            </span>
          </div>

          {/* Tabs for plot-based filtering */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Devices</TabsTrigger>
              {plots.map((plot) => (
                <TabsTrigger key={plot.id} value={plot.id}>
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

        {/* Alerts panel - spans 1 column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <AlertsPanel maxItems={8} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SensorChart
          data={aggregatedChartData}
          title="Sensor Readings Overview"
          onTimeRangeChange={handleTimeRangeChange}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
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
                  readings/hour estimated
                </p>
              </div>

              {/* Signal quality - REAL DATA */}
              <div className="rounded-lg border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Avg Signal</p>
                <p className="mt-1 font-mono text-3xl font-bold text-primary">
                  {systemStats.avgSignal}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  network strength
                </p>
              </div>

              {/* Battery status - REAL DATA */}
              <div className="rounded-lg border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Avg Battery</p>
                <p className="mt-1 font-mono text-3xl font-bold text-warning">
                  {systemStats.avgBattery}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  device average
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;