// Multi-device comparison chart component
import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Device, HistoricalReading, TimeRange } from '@/types/device';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useDevices } from '@/context/DeviceContext';

interface DeviceComparisonChartProps {
  devices: Device[];
  className?: string;
}

const timeRanges: TimeRange[] = [
  { label: '1H', value: '1h', hours: 1 },
  { label: '24H', value: '24h', hours: 24 },
  { label: '7D', value: '7d', hours: 168 },
  { label: '30D', value: '30d', hours: 720 },
];

const parameters = [
  { key: 'moisture', label: 'Moisture (%)', unit: '%' },
  { key: 'temperature', label: 'Temperature (°C)', unit: '°C' },
  { key: 'ph', label: 'pH Level', unit: '' },
  { key: 'ec', label: 'Electrical Conductivity', unit: 'mS/cm' },
];

// Color palette for device lines
const deviceColors = [
  'hsl(142, 70%, 45%)',  // Green
  'hsl(199, 89%, 48%)',  // Blue
  'hsl(0, 72%, 51%)',    // Red
  'hsl(280, 65%, 60%)',  // Purple
  'hsl(40, 95%, 50%)',   // Orange
  'hsl(180, 70%, 45%)',  // Cyan
  'hsl(320, 70%, 50%)',  // Pink
  'hsl(60, 70%, 45%)',   // Yellow-green
  'hsl(220, 70%, 55%)',  // Indigo
];

export function DeviceComparisonChart({ devices, className }: DeviceComparisonChartProps) {
  const { getDeviceHistory } = useDevices();
  const [selectedDevices, setSelectedDevices] = useState<string[]>(
    devices.slice(0, 3).map((d) => d.id)
  );
  const [selectedParameter, setSelectedParameter] = useState('moisture');
  const [selectedRange, setSelectedRange] = useState<TimeRange['value']>('24h');

  const currentRange = timeRanges.find((r) => r.value === selectedRange) || timeRanges[1];

  // Generate comparison data using real Firebase hook
  const chartData = useMemo(() => {
    if (selectedDevices.length === 0) return [];

    // Get historical data for each selected device from Firebase
    const deviceHistories: Record<string, HistoricalReading[]> = {};
    selectedDevices.forEach((deviceId) => {
      deviceHistories[deviceId] = getDeviceHistory(deviceId, currentRange.hours);
    });

    // Merge data by timestamp
    const firstDevice = selectedDevices[0];
    if (!deviceHistories[firstDevice]) return [];

    return deviceHistories[firstDevice]
      .map((reading, index) => {
        const dataPoint: Record<string, number | string> = {
          time: reading.timestamp.getTime(),
        };

        selectedDevices.forEach((deviceId) => {
          const deviceReading = deviceHistories[deviceId]?.[index];
          if (deviceReading) {
            dataPoint[deviceId] = deviceReading.readings[selectedParameter as keyof typeof deviceReading.readings] as number;
          }
        });

        return dataPoint;
      })
      .sort((a, b) => (a.time as number) - (b.time as number));
  }, [selectedDevices, selectedParameter, currentRange.hours, getDeviceHistory]);

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const selectedParam = parameters.find((p) => p.key === selectedParameter);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Device Comparison</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedParameter} onValueChange={setSelectedParameter}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {parameters.map((param) => (
                  <SelectItem key={param.key} value={param.key}>
                    {param.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded-lg border bg-secondary p-1">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={selectedRange === range.value ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-6 px-2 text-xs',
                    selectedRange === range.value && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => setSelectedRange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device selection */}
        <div className="flex flex-wrap gap-2">
          {devices.map((device, index) => (
            <button
              key={device.id}
              onClick={() => toggleDevice(device.id)}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all border',
                selectedDevices.includes(device.id)
                  ? 'bg-secondary text-foreground border-primary/50'
                  : 'bg-muted text-muted-foreground opacity-60 border-transparent'
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: deviceColors[index % deviceColors.length] }}
              />
              {device.name}
            </button>
          ))}
        </div>

        {/* Chart */}
        {selectedDevices.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Select at least one device to compare
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="time"
                  type="number"
                  scale="time"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  label={{
                    value: selectedParam?.unit || '',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  labelFormatter={(value, payload) => {
                    if (payload?.[0]?.payload?.time) {
                      return format(new Date(payload[0].payload.time), 'MMM d, HH:mm');
                    }
                    return value;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 16 }}
                  iconType="circle"
                  iconSize={8}
                />
                {selectedDevices.map((deviceId, index) => {
                  const device = devices.find((d) => d.id === deviceId);
                  return (
                    <Line
                      key={deviceId}
                      type="monotone"
                      dataKey={deviceId}
                      name={device?.name || deviceId}
                      stroke={deviceColors[devices.findIndex((d) => d.id === deviceId) % deviceColors.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
