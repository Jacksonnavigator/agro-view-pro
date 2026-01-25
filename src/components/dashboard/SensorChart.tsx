// Real-time sensor data chart component using Recharts
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
import { HistoricalReading, TimeRange } from '@/types/device';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SensorChartProps {
  data: HistoricalReading[];
  title?: string;
  className?: string;
  showControls?: boolean;
  onTimeRangeChange?: (range: TimeRange) => void;
}

const timeRanges: TimeRange[] = [
  { label: '1H', value: '1h', hours: 1 },
  { label: '24H', value: '24h', hours: 24 },
  { label: '7D', value: '7d', hours: 168 },
  { label: '30D', value: '30d', hours: 720 },
];

const parameterConfig = {
  moisture: {
    color: 'hsl(199, 89%, 48%)',
    label: 'Moisture',
    unit: '%',
    dataKey: 'moisture'
  },
  temperature: {
    color: 'hsl(45, 93%, 47%)',
    label: 'Temperature',
    unit: '°C',
    dataKey: 'temperature'
  },
  ph: {
    color: 'hsl(142, 70%, 45%)',
    label: 'pH',
    unit: '',
    dataKey: 'ph'
  },
  ec: {
    color: 'hsl(280, 65%, 60%)',
    label: 'EC',
    unit: 'mS/cm',
    dataKey: 'ec'
  },
};

export function SensorChart({
  data,
  title,
  className,
  showControls = true,
  onTimeRangeChange
}: SensorChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange['value']>('24h');
  const [visibleParams, setVisibleParams] = useState<Set<string>>(
    new Set(['moisture', 'temperature', 'ph', 'ec'])
  );

  // Transform data for Recharts
  const chartData = useMemo(() => {
    const mapped = data
      .map((reading) => ({
        time: reading.timestamp.getTime(),
        ...reading.readings,
      }))
      .sort((a, b) => a.time - b.time);

    const timeRange = mapped.length > 0
      ? `${new Date(mapped[0].time).toLocaleString()} to ${new Date(mapped[mapped.length - 1].time).toLocaleString()}`
      : 'no data';

    console.log('[SensorChart] chartData length:', mapped.length, 'selectedRange:', selectedRange, 'timeRange:', timeRange);
    return mapped;
  }, [data, selectedRange]);

  const toggleParameter = (param: string) => {
    setVisibleParams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(param)) {
        newSet.delete(param);
      } else {
        newSet.add(param);
      }
      return newSet;
    });
  };

  const handleRangeChange = (range: TimeRange) => {
    console.log('[SensorChart] handleRangeChange', range);
    setSelectedRange(range.value);
    onTimeRangeChange?.(range);
  };

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      {/* Header with title and controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        {title && (
          <h3 className="font-semibold text-foreground">{title}</h3>
        )}

        {showControls && (
          <div className="flex items-center gap-2">
            {/* Time range selector */}
            <div className="flex rounded-lg border bg-secondary p-1">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={selectedRange === range.value ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-7 px-3 text-xs',
                    selectedRange === range.value && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => handleRangeChange(range)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Parameter toggles */}
      {showControls && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(parameterConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => toggleParameter(key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all',
                visibleParams.has(key)
                  ? 'bg-secondary text-foreground'
                  : 'bg-muted text-muted-foreground opacity-50'
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              {config.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 85 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              type="number"
              domain={(() => {
                if (chartData.length > 0) return ['dataMin', 'dataMax'];
                const now = Date.now();
                const range = timeRanges.find(r => r.value === selectedRange);
                const hoursInMs = (range?.hours || 24) * 60 * 60 * 1000;
                return [now - hoursInMs, now];
              })()}
              ticks={chartData.length < 50 ? chartData.map(d => d.time) : undefined}
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={true}
              axisLine={false}
              height={85}
              angle={-45}
              textAnchor="end"
              dy={10}
              tickFormatter={(value) => {
                return format(new Date(value), 'MMM d, HH:mm:ss');
              }}
              minTickGap={0}
              interval={0}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
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
                return String(value);
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 16 }}
              iconType="circle"
              iconSize={8}
            />

            {Object.entries(parameterConfig).map(([key, config]) =>
              visibleParams.has(key) ? (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={config.dataKey}
                  name={`${config.label}${config.unit ? ` (${config.unit})` : ''}`}
                  stroke={config.color}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
