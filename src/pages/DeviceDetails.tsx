// Individual device details page
import { useMemo, useState, forwardRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDevices } from '@/context/DeviceContext';
import { Header } from '@/components/layout/Header';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { MetricCard } from '@/components/ui/metric-card';
import { SensorChart } from '@/components/dashboard/SensorChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Droplets,
  Thermometer,
  FlaskConical,
  Zap,
  MapPin,
  ArrowLeft,
  Settings,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { TimeRange, SensorThresholds } from '@/types/device';
import { useAuth } from '@/context/AuthContext';
import { exportDevicesCSV } from '@/utils/exportUtils';

const DeviceDetails = forwardRef<HTMLDivElement, object>(function DeviceDetails(_props, ref) {
  const { id } = useParams<{ id: string }>();
  const { getDevice, getDeviceHistory, updateDeviceThresholds } = useDevices();
  const { hasRole } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>({
    label: '24H',
    value: '24h',
    hours: 24
  });

  const device = getDevice(id || '');

  // Local threshold state for editing
  const [editedThresholds, setEditedThresholds] = useState<SensorThresholds | null>(null);

  // Initialize edited thresholds when device loads
  const thresholds = editedThresholds || device?.thresholds;

  const historicalData = useMemo(() => {
    if (!id) return [];
    return getDeviceHistory(id, timeRange.hours);
  }, [id, timeRange.hours, getDeviceHistory]);

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-lg text-muted-foreground mb-4">Device not found</p>
        <Button asChild variant="outline">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const { readings } = device;

  // Determine status for each metric
  const getMetricStatus = (value: number, min: number, max: number) => {
    if (value < min || value > max) return 'critical';
    const buffer = (max - min) * 0.1;
    if (value < min + buffer || value > max - buffer) return 'warning';
    return 'normal';
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Back navigation and header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <Header
        title={device.name}
        subtitle={`${device.plotName} • Last updated ${format(device.lastUpdated, 'PPp')}`}
      >
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => device && exportDevicesCSV([device])}
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </Header>

      {/* Device info bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <StatusIndicator status={device.status} size="lg" />
              <span className="font-medium capitalize">{device.status}</span>
            </div>

            {device.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="font-mono text-sm">
                  {device.location.lat.toFixed(4)}, {device.location.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current readings */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Soil Moisture"
          value={readings.moisture}
          unit="%"
          icon={Droplets}
          status={getMetricStatus(readings.moisture, thresholds.moisture.min, thresholds.moisture.max)}
          trend="stable"
        />
        <MetricCard
          label="Temperature"
          value={readings.temperature}
          unit="°C"
          icon={Thermometer}
          status={getMetricStatus(readings.temperature, thresholds.temperature.min, thresholds.temperature.max)}
          trend="up"
        />
        <MetricCard
          label="pH Level"
          value={readings.ph}
          unit=""
          icon={FlaskConical}
          status={getMetricStatus(readings.ph, thresholds.ph.min, thresholds.ph.max)}
          trend="stable"
        />
        <MetricCard
          label="Electrical Conductivity"
          value={readings.ec}
          unit="mS/cm"
          icon={Zap}
          status={getMetricStatus(readings.ec, thresholds.ec.min, thresholds.ec.max)}
          trend="down"
        />
      </div>

      {/* NPK readings if available */}
      {readings.nitrogen !== undefined && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">NPK Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Nitrogen (N)</p>
                <p className="mt-1 font-mono text-2xl font-bold text-chart-moisture">
                  {readings.nitrogen}
                </p>
                <p className="text-xs text-muted-foreground">mg/kg</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Phosphorus (P)</p>
                <p className="mt-1 font-mono text-2xl font-bold text-chart-npk">
                  {readings.phosphorus}
                </p>
                <p className="text-xs text-muted-foreground">mg/kg</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Potassium (K)</p>
                <p className="mt-1 font-mono text-2xl font-bold text-chart-ec">
                  {readings.potassium}
                </p>
                <p className="text-xs text-muted-foreground">mg/kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical chart */}
      <SensorChart
        data={historicalData}
        title="Historical Readings"
        onTimeRangeChange={setTimeRange}
      />

      {/* Threshold configuration (admin only) */}
      {hasRole('admin') && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Threshold Configuration
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {thresholds && Object.entries(thresholds).map(([key, value]) => (
                <div key={key} className="space-y-3">
                  <Label className="capitalize">{key}</Label>
                  <div className="flex gap-2">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Min</span>
                      <Input
                        type="number"
                        value={value.min}
                        onChange={(e) => {
                          const newThresholds = { ...(editedThresholds || device!.thresholds) };
                          newThresholds[key as keyof SensorThresholds] = {
                            ...newThresholds[key as keyof SensorThresholds],
                            min: Number(e.target.value),
                          };
                          setEditedThresholds(newThresholds);
                        }}
                        className="h-8 w-full font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Max</span>
                      <Input
                        type="number"
                        value={value.max}
                        onChange={(e) => {
                          const newThresholds = { ...(editedThresholds || device!.thresholds) };
                          newThresholds[key as keyof SensorThresholds] = {
                            ...newThresholds[key as keyof SensorThresholds],
                            max: Number(e.target.value),
                          };
                          setEditedThresholds(newThresholds);
                        }}
                        className="h-8 w-full font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  if (device && editedThresholds) {
                    updateDeviceThresholds(device.id, editedThresholds);
                  }
                }}
                disabled={!editedThresholds}
              >
                Save Thresholds
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

DeviceDetails.displayName = 'DeviceDetails';

export default DeviceDetails;
