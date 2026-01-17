// Device comparison page with error handling
import { useMemo } from 'react';
import { useDevices } from '@/context/DeviceContext';
import { Header } from '@/components/layout/Header';
import { DeviceComparisonChart } from '@/components/dashboard/DeviceComparisonChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Compare() {
  const { devices, isLoading, error, refreshData } = useDevices();

  // Calculate averages safely with memoization (guard against empty arrays)
  const averages = useMemo(() => {
    if (devices.length === 0) {
      return { moisture: 0, temp: 0, ph: 0, ec: 0 };
    }
    return {
      moisture: devices.reduce((sum, d) => sum + d.readings.moisture, 0) / devices.length,
      temp: devices.reduce((sum, d) => sum + d.readings.temperature, 0) / devices.length,
      ph: devices.reduce((sum, d) => sum + d.readings.ph, 0) / devices.length,
      ec: devices.reduce((sum, d) => sum + d.readings.ec, 0) / devices.length,
    };
  }, [devices]);

  // Loading state
  if (isLoading && devices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Error state
  if (error && devices.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <ErrorState
          title="Failed to Load Devices"
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
        title="Compare Devices"
        subtitle="Analyze sensor data across multiple devices"
      />

      {/* Comparison Chart */}
      <DeviceComparisonChart devices={devices} />

      {/* Data comparison table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Readings Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Moisture</TableHead>
                  <TableHead className="text-right">Temperature</TableHead>
                  <TableHead className="text-right">pH</TableHead>
                  <TableHead className="text-right">EC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground">{device.plotName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusIndicator status={device.status} showLabel size="sm" />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={device.readings.moisture > averages.moisture ? 'text-success' : 'text-muted-foreground'}>
                        {device.readings.moisture}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={device.readings.temperature > averages.temp ? 'text-warning' : 'text-muted-foreground'}>
                        {device.readings.temperature}°C
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {device.readings.ph}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {device.readings.ec} mS/cm
                    </TableCell>
                  </TableRow>
                ))}
                {/* Average row */}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={2}>Average</TableCell>
                  <TableCell className="text-right font-mono">
                    {averages.moisture.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {averages.temp.toFixed(1)}°C
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {averages.ph.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {averages.ec.toFixed(2)} mS/cm
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
