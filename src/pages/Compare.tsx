// Device comparison page
import { useDevices } from '@/context/DeviceContext';
import { Header } from '@/components/layout/Header';
import { DeviceComparisonChart } from '@/components/dashboard/DeviceComparisonChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusIndicator } from '@/components/ui/status-indicator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Compare() {
  const { devices } = useDevices();

  // Calculate averages and stats for comparison table
  const avgMoisture = devices.reduce((sum, d) => sum + d.readings.moisture, 0) / devices.length;
  const avgTemp = devices.reduce((sum, d) => sum + d.readings.temperature, 0) / devices.length;
  const avgPh = devices.reduce((sum, d) => sum + d.readings.ph, 0) / devices.length;
  const avgEc = devices.reduce((sum, d) => sum + d.readings.ec, 0) / devices.length;

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
                      <span className={device.readings.moisture > avgMoisture ? 'text-success' : 'text-muted-foreground'}>
                        {device.readings.moisture}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={device.readings.temperature > avgTemp ? 'text-warning' : 'text-muted-foreground'}>
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
                    {avgMoisture.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {avgTemp.toFixed(1)}°C
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {avgPh.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {avgEc.toFixed(2)} mS/cm
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
