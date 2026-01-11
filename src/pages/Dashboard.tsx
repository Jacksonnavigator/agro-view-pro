// Main dashboard overview page
import { useMemo } from 'react';
import { useDevices } from '@/context/DeviceContext';
import { Header } from '@/components/layout/Header';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { DeviceCard } from '@/components/dashboard/DeviceCard';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { SensorChart } from '@/components/dashboard/SensorChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateHistoricalData } from '@/data/mockData';

export default function Dashboard() {
  const { devices, plots } = useDevices();

  // Generate aggregated chart data from all devices
  const aggregatedChartData = useMemo(() => {
    return generateHistoricalData('aggregate', 24);
  }, []);

  return (
    <div className="space-y-6 fade-in">
      <Header 
        title="Dashboard Overview" 
        subtitle="Real-time monitoring of all soil sensor devices"
      />

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
        />
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Device uptime stats */}
              <div className="rounded-lg border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Average Uptime</p>
                <p className="mt-1 font-mono text-3xl font-bold text-success">
                  99.2%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </div>

              {/* Data transmission rate */}
              <div className="rounded-lg border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Data Rate</p>
                <p className="mt-1 font-mono text-3xl font-bold text-info">
                  847
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  readings/hour
                </p>
              </div>

              {/* Signal quality */}
              <div className="rounded-lg border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Avg Signal</p>
                <p className="mt-1 font-mono text-3xl font-bold text-primary">
                  78%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  network strength
                </p>
              </div>

              {/* Battery status */}
              <div className="rounded-lg border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Avg Battery</p>
                <p className="mt-1 font-mono text-3xl font-bold text-warning">
                  72%
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
}
