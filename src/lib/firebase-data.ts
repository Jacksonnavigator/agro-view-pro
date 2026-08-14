import { AppSettings, Device, SensorReading, SensorThresholds } from '@/types/device';

export interface FirebaseReading {
  ec: number;
  moisture: number;
  ph: number;
  temperature: number;
  timestamp?: string;
  [key: string]: any; // Allow extra fields like baud_rate, irrigation_sensor, etc.
}

// Updated to handle nested structure with 'latest' and 'readings'
export interface FirebasePlotDataNested {
  latest?: FirebaseReading;
  readings?: {
    [timestamp: string]: FirebaseReading;
  };
  [timestamp: string]?: FirebaseReading; // Fallback for flat structure
}

export interface FirebasePlotData {
  [timestamp: string]: FirebaseReading;
}

export interface FirebaseDevicesData {
  [plotId: string]: FirebasePlotDataNested | FirebasePlotData;
}

// Fallback thresholds if not in localStorage
export const fallbackThresholds: SensorThresholds = {
  moisture: { min: 30, max: 70 },
  temperature: { min: 15, max: 35 },
  ph: { min: 5.5, max: 7.5 },
  ec: { min: 0.5, max: 2.5 },
};

export const fallbackSettings: AppSettings = {
  thresholds: fallbackThresholds,
  system: {
    refreshInterval: 30,
    retention: 30,
    offlineDetection: true,
    offlineAfterMinutes: 5,
  },
  account: {
    reportEmail: '',
  },
  plotLocations: {},
};

// Plot configurations mapping Firebase plot IDs to friendly names
export const plotConfigs: Record<string, { name: string; description: string }> = {
  Plot_1A: { name: 'Plot 1A - North Field', description: 'Primary monitoring zone' },
  Plot_1B: { name: 'Plot 1B - South Field', description: 'Secondary monitoring zone' },
  Plot_2A: { name: 'Plot 2A - Greenhouse', description: 'Controlled environment' },
  Plot_2B: { name: 'Plot 2B - Orchard', description: 'Fruit tree area' },
};

// Determine device status based on latest sensor timestamp.
export const getDeviceStatus = (
  lastUpdated: Date,
  offlineAfterMinutes = fallbackSettings.system.offlineAfterMinutes,
  offlineDetection = true
): Device['status'] => {
  if (!offlineDetection) {
    return 'online';
  }

  const now = new Date();
  const diffInMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

  if (diffInMinutes > offlineAfterMinutes) {
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
  plotLocations?: Record<string, { lat: number; lng: number }>;
  offlineAfterMinutes?: number;
  offlineDetection?: boolean;
}

// Extract all historical readings from Firebase data for a specific plot
// Handles both nested structure (latest/readings) and flat structure (legacy)
export const extractHistoricalReadings = (
  plotData: any
): { timestamp: Date; readings: SensorReading }[] => {
  const readings: { timestamp: Date; readings: SensorReading }[] = [];

  // Handle nested structure with 'readings' object
  if (plotData.readings && typeof plotData.readings === 'object') {
    Object.entries(plotData.readings).forEach(([timestampKey, reading]: [string, any]) => {
      if (typeof reading === 'object' && reading !== null) {
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
      }
    });
  } else {
    // Handle flat structure (legacy)
    Object.entries(plotData).forEach(([timestampKey, reading]: [string, any]) => {
      // Skip special keys
      if (timestampKey === 'latest' || timestampKey === 'readings') {
        return;
      }

      if (typeof reading === 'object' && reading !== null) {
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
      }
    });
  }

  // Sort by timestamp ascending
  return readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

// Extract all historical data for all devices from Firebase
export const extractAllDeviceHistories = (
  data: FirebaseDevicesData
): Map<string, { timestamp: Date; readings: SensorReading }[]> => {
  const historyMap = new Map<string, { timestamp: Date; readings: SensorReading }[]>();

  Object.entries(data).forEach(([plotId, plotData]) => {
    const deviceId = `device-${plotId}`;
    const history = extractHistoricalReadings(plotData);
    historyMap.set(deviceId, history);
  });

  return historyMap;
};

export const transformFirebaseData = (
  data: FirebaseDevicesData,
  {
    customThresholds,
    defaultThresholds,
    plotLocations = {},
    offlineAfterMinutes,
    offlineDetection,
  }: TransformOptions
): Device[] => {
  const devicesList: Device[] = [];

  Object.entries(data).forEach(([plotId, plotData]: [string, any]) => {
    let reading: FirebaseReading | null = null;
    let latestTimestamp: string = '';

    // Handle nested structure with 'latest' object
    if (plotData.latest && typeof plotData.latest === 'object') {
      reading = plotData.latest;
      // Use timestamp from the latest object if available, otherwise use current time
      if (reading.timestamp) {
        latestTimestamp = reading.timestamp;
      } else {
        latestTimestamp = new Date().toISOString();
      }
    } else {
      // Fallback: Find latest timestamp from flat structure or readings
      const timestamps = Object.keys(plotData)
        .filter(key => key !== 'latest' && key !== 'readings')
        .sort();

      if (timestamps.length > 0) {
        latestTimestamp = timestamps[timestamps.length - 1];
        reading = plotData[latestTimestamp];
      } else if (plotData.readings) {
        // Try to get from readings object
        const readingTimestamps = Object.keys(plotData.readings).sort();
        if (readingTimestamps.length > 0) {
          latestTimestamp = readingTimestamps[readingTimestamps.length - 1];
          reading = plotData.readings[latestTimestamp];
        }
      }
    }

    if (reading && typeof reading === 'object') {
      const deviceId = `device-${plotId}`;
      const thresholds = customThresholds.get(deviceId) || defaultThresholds;

      const sensorReading: SensorReading = {
        moisture: reading.moisture ?? 0,
        temperature: reading.temperature ?? 0,
        ph: reading.ph ?? 7,
        ec: reading.ec ?? 0,
      };

      const lastUpdated = latestTimestamp 
        ? parseFirebaseTimestamp(latestTimestamp)
        : new Date();
      const status = getDeviceStatus(lastUpdated, offlineAfterMinutes, offlineDetection);
      const plotConfig = plotConfigs[plotId] || {
        name: plotId.replace(/_/g, ' '),
        description: 'Monitoring zone',
      };
      const devicePlotId = `plot-${plotId}`;

      devicesList.push({
        id: deviceId,
        name: `Sensor ${plotId.replace(/_/g, '-')}`,
        plotName: plotConfig.name,
        plotId: devicePlotId,
        status,
        lastUpdated,
        readings: sensorReading,
        thresholds,
        location: plotLocations[devicePlotId] || plotLocations[plotId],
      });
    }
  });

  return devicesList;
};
