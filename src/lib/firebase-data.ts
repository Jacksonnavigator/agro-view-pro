import { Device, SensorReading, SensorThresholds } from '@/types/device';

export interface FirebaseReading {
  ec: number;
  moisture: number;
  ph: number;
  temperature: number;

}

export interface FirebasePlotData {
  [timestamp: string]: FirebaseReading;
}

export interface FirebaseDevicesData {
  [plotId: string]: FirebasePlotData;
}

// Fallback thresholds if not in localStorage
export const fallbackThresholds: SensorThresholds = {
  moisture: { min: 30, max: 70 },
  temperature: { min: 15, max: 35 },
  ph: { min: 5.5, max: 7.5 },
  ec: { min: 0.5, max: 2.5 },
};

// Plot configurations mapping Firebase plot IDs to friendly names
export const plotConfigs: Record<string, { name: string; description: string }> = {
  Plot_1A: { name: 'Plot 1A - North Field', description: 'Primary monitoring zone' },
  Plot_1B: { name: 'Plot 1B - South Field', description: 'Secondary monitoring zone' },
  Plot_2A: { name: 'Plot 2A - Greenhouse', description: 'Controlled environment' },
  Plot_2B: { name: 'Plot 2B - Orchard', description: 'Fruit tree area' },
};

// Determine device status based on last update time (3 minute timeout)
export const getDeviceStatus = (
  lastUpdated: Date
): Device['status'] => {
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

  // If data is older than 3 minutes, device is offline
  if (diffInMinutes > 3) {
    return 'offline';
  }

  return 'online';
};

// Parse timestamp from Firebase key (format: 2026-01-15-02-53-41)
// Parse timestamp from Firebase key (format: 2026-01-15-02-53-41 OR 2026-01-15_02-53-41)
export const parseFirebaseTimestamp = (key: string): Date => {
  // Replace underscores with hyphens to handle both formats
  const normalizedKey = key.replace(/_/g, '-');
  const parts = normalizedKey.split('-');

  if (parts.length >= 6) {
    const [year, month, day, hour, minute, second] = parts.map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  }
  return new Date();
};



interface TransformOptions {
  customThresholds: Map<string, SensorThresholds>;
  defaultThresholds: SensorThresholds;
}

// Extract all historical readings from Firebase data for a specific plot
export const extractHistoricalReadings = (
  plotData: FirebasePlotData
): { timestamp: Date; readings: SensorReading }[] => {
  const readings: { timestamp: Date; readings: SensorReading }[] = [];

  Object.entries(plotData).forEach(([timestampKey, reading]) => {
    const timestamp = parseFirebaseTimestamp(timestampKey);
    readings.push({
      timestamp,
      readings: {
        moisture: reading.moisture ?? 0,
        temperature: reading.temperature ?? 0,
        ph: reading.ph ?? 7,
        ec: reading.ec ?? 0,
      },
    });
  });

  // Sort by timestamp ascending
  return readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

// Extract all historical data for all devices from Firebase
export const extractAllDeviceHistories = (
  data: FirebaseDevicesData
): Map<string, { timestamp: Date; readings: SensorReading }[]> => {
  const historyMap = new Map<string, { timestamp: Date; readings: SensorReading }[]>();

  console.log('[extractAllDeviceHistories] Processing Firebase data for', Object.keys(data).length, 'plots');

  Object.entries(data).forEach(([plotId, plotData]) => {
    const deviceId = `device-${plotId}`;
    const history = extractHistoricalReadings(plotData);
    historyMap.set(deviceId, history);

    const timeRange = history.length > 0
      ? `${history[0].timestamp.toLocaleString()} to ${history[history.length - 1].timestamp.toLocaleString()}`
      : 'no data';

    console.log(`[extractAllDeviceHistories] ${deviceId}: ${history.length} readings, ${timeRange}`);
  });

  return historyMap;
};

export const transformFirebaseData = (
  data: FirebaseDevicesData,
  { customThresholds, defaultThresholds }: TransformOptions
): Device[] => {
  const devicesList: Device[] = [];
  let deviceIndex = 0;

  Object.entries(data).forEach(([plotId, plotData]) => {
    // Get the latest reading for this plot
    const timestamps = Object.keys(plotData).sort();
    const latestTimestamp = timestamps[timestamps.length - 1];

    if (latestTimestamp && plotData[latestTimestamp]) {
      const reading = plotData[latestTimestamp];
      const deviceId = `device-${plotId}`;
      const thresholds = customThresholds.get(deviceId) || defaultThresholds;

      const sensorReading: SensorReading = {
        moisture: reading.moisture ?? 0,
        temperature: reading.temperature ?? 0,
        ph: reading.ph ?? 7,
        ec: reading.ec ?? 0,
      };

      const lastUpdated = parseFirebaseTimestamp(latestTimestamp);
      const status = getDeviceStatus(lastUpdated);
      const plotConfig = plotConfigs[plotId] || {
        name: plotId.replace(/_/g, ' '),
        description: 'Monitoring zone',
      };

      devicesList.push({
        id: deviceId,
        name: `Sensor ${plotId.replace(/_/g, '-')}`,
        plotName: plotConfig.name,
        plotId: `plot-${plotId}`,
        status,

        lastUpdated,
        readings: sensorReading,
        thresholds,
        location: {
          lat: 40.7128 + deviceIndex * 0.01,
          lng: -74.006 + deviceIndex * 0.01,
        },
      });

      deviceIndex++;
    }
  });

  return devicesList;
};
