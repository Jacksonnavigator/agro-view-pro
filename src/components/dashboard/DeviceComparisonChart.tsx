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
  Area,
} from 'recharts';
import { Device, HistoricalReading, TimeRange } from '@/types/device';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CHART_CONFIG } from '@/config/app-config';

interface DeviceComparisonChartProps {
  devices: Device[];
  className?: string;
}

interface BuildComparisonChartDataInput {
  deviceHistories: Record<string, HistoricalReading[]>;
  selectedDevices: string[];
  selectedParameter: string;
  rangeHours: number;
}

export function buildComparisonChartData({
  deviceHistories,
  selectedDevices,
  selectedParameter,
  rangeHours,
}: BuildComparisonChartDataInput) {
  const activeDeviceIds = selectedDevices.filter((deviceId) => deviceHistories[deviceId]?.length);

  if (activeDeviceIds.length === 0) {
    return [];
  }

  const bucketMs = rangeHours <= 1
    ? 5 * 60 * 1000
    : rangeHours <= 24
      ? 30 * 60 * 1000
      : rangeHours <= 168
        ? 2 * 60 * 60 * 1000
        : 12 * 60 * 60 * 1000;

  const allTimestamps = activeDeviceIds
    .flatMap((deviceId) => deviceHistories[deviceId].map((reading) => reading.timestamp.getTime()))
    .filter((value) => Number.isFinite(value));

  if (allTimestamps.length === 0) {
    return [];
  }

  const minTime = Math.min(...allTimestamps);
  const maxTime = Math.max(...allTimestamps);
  const chartBuckets = new Map<number, Record<string, number | string | null>>();

  for (let bucketStart = minTime; bucketStart <= maxTime; bucketStart += bucketMs) {
    chartBuckets.set(bucketStart, { time: bucketStart });
  }

  activeDeviceIds.forEach((deviceId) => {
    const history = [...deviceHistories[deviceId]].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    let readingIndex = 0;
    for (const [bucketStart] of chartBuckets) {
      const bucketEnd = bucketStart + bucketMs;
      let lastValue: number | null = null;

      while (readingIndex < history.length && history[readingIndex].timestamp.getTime() < bucketStart) {
        readingIndex += 1;
      }

      while (readingIndex < history.length && history[readingIndex].timestamp.getTime() < bucketEnd) {
        const reading = history[readingIndex];
        const value = reading.readings[selectedParameter as keyof typeof reading.readings] as number | undefined;
        if (typeof value === 'number' && Number.isFinite(value)) {
          lastValue = value;
        }
        readingIndex += 1;
      }

      if (lastValue !== null) {
        const point = chartBuckets.get(bucketStart);
        if (point) {
          point[deviceId] = lastValue;
        }
      }
    }
  });

  return Array.from(chartBuckets.values());
}

const timeRanges: TimeRange[] = CHART_CONFIG.timeRanges as unknown as TimeRange[];

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
  'hsl(35, 92%, 50%)',   // Amber
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

  const chartData = useMemo(() => {
    if (selectedDevices.length === 0) return [];

    const deviceHistories: Record<string, HistoricalReading[]> = {};
    selectedDevices.forEach((deviceId) => {
      deviceHistories[deviceId] = getDeviceHistory(deviceId, currentRange.hours);
    });

    return buildComparisonChartData({
      deviceHistories,
      selectedDevices,
      selectedParameter,
      rangeHours: currentRange.hours,
    });
  }, [selectedDevices, selectedParameter, currentRange.hours, getDeviceHistory]);

  const summaryStats = useMemo(() => {
    const allValues = selectedDevices
      .flatMap((deviceId) => chartData.map((point) => Number(point[deviceId] ?? NaN)))
      .filter((value) => Number.isFinite(value));

    if (allValues.length === 0) {
      return { average: 0, min: 0, max: 0 };
    }

    const average = allValues.reduce((sum, value) => sum + value, 0) / allValues.length;
    return {
      average,
      min: Math.min(...allValues),
      max: Math.max(...allValues),
    };
  }, [chartData, selectedDevices]);

  const liveDevices = devices.filter((device) => selectedDevices.includes(device.id) && device.status === 'online').length;
  const trendDirection = selectedDevices.length > 1 && chartData.length > 1
    ? Number(chartData[chartData.length - 1]?.[selectedDevices[0]] ?? 0) - Number(chartData[0]?.[selectedDevices[0]] ?? 0)
    : 0;

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
          <div className="space-y-1">
            <CardTitle className="text-base">Device Comparison</CardTitle>
            <p className="text-xs text-muted-foreground">
              Avg {summaryStats.average.toFixed(1)}{selectedParam?.unit || ''} · Range {summaryStats.min.toFixed(1)}{selectedParam?.unit || ''} to {summaryStats.max.toFixed(1)}{selectedParam?.unit || ''}
            </p>
          </div>
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
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Average {selectedParam?.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {summaryStats.average.toFixed(1)}
              <span className="ml-1 text-sm text-muted-foreground">{selectedParam?.unit || ''}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Online sensors</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{liveDevices}<span className="ml-1 text-sm text-muted-foreground">/{selectedDevices.length}</span></p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Trend</p>
            <p className={cn('mt-2 text-2xl font-semibold tracking-tight', trendDirection >= 0 ? 'text-emerald-500' : 'text-amber-500')}>
              {trendDirection >= 0 ? '+' : ''}{trendDirection.toFixed(1)}
              <span className="ml-1 text-sm text-muted-foreground">{selectedParam?.unit || ''}</span>
            </p>
          </div>
        </div>
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
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No readings in the selected time range
          </div>
        ) : (
          <div className="h-[360px] w-full rounded-2xl border border-border/60 bg-gradient-to-b from-background to-muted/20 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 18, left: 10, bottom: 30 }}
              >
                <defs>
                  {selectedDevices.map((deviceId, index) => {
                    const deviceColor = deviceColors[devices.findIndex((d) => d.id === deviceId) % deviceColors.length];
                    return (
                      <linearGradient key={`${deviceId}-gradient`} id={`area-${deviceId}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={deviceColor} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={deviceColor} stopOpacity={0.04} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

                <XAxis
                  dataKey="time"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => format(new Date(value), currentRange.value === '1h' ? 'HH:mm' : 'MMM d HH:mm')}
                  minTickGap={40}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={42}
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
                  formatter={(value: number | string | Array<number | string>, name) => {
                    const numericValue = Array.isArray(value) ? Number(value[0]) : Number(value);
                    return [`${numericValue.toFixed(1)}${selectedParam?.unit || ''}`, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 16 }}
                  iconType="circle"
                  iconSize={8}
                />
                {selectedDevices.map((deviceId) => {
                  const device = devices.find((d) => d.id === deviceId);
                  const stroke = deviceColors[devices.findIndex((d) => d.id === deviceId) % deviceColors.length];
                  return (
                    <>
                      <Area
                        type="monotone"
                        dataKey={deviceId}
                        stroke="none"
                        fill={`url(#area-${deviceId})`}
                        isAnimationActive={false}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey={deviceId}
                        name={device?.name || deviceId}
                        stroke={stroke}
                        strokeWidth={2.5}
                        connectNulls={true}
                        dot={chartData.length <= CHART_CONFIG.dataPointThreshold ? { r: CHART_CONFIG.dotSize.normal, strokeWidth: 1 } : false}
                        activeDot={{ r: CHART_CONFIG.dotSize.active, strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                    </>
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
