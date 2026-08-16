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

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const isSensorValueObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return ['moisture', 'temperature', 'ph', 'ec'].some((key) => key in record);
};

const normalizeSensorReading = (rawReading: Record<string, unknown> | null | undefined): SensorReading => ({
  moisture: toNumber(rawReading?.moisture, 0),
  temperature: toNumber(rawReading?.temperature, 0),
  ph: toNumber(rawReading?.ph, 7),
  ec: toNumber(rawReading?.ec, 0),
});

const selectLatestReading = (plotData: any): { reading: FirebaseReading | null; latestTimestamp: string } => {
  if (!plotData || typeof plotData !== 'object') {
    return { reading: null, latestTimestamp: '' };
  }

  if (plotData.latest && typeof plotData.latest === 'object' && isSensorValueObject(plotData.latest)) {
    const timestampValue = typeof plotData.latest.timestamp === 'string' ? plotData.latest.timestamp : '';
    return {
      reading: plotData.latest as FirebaseReading,
      latestTimestamp: timestampValue || new Date().toISOString(),
    };
  }

  if (plotData.readings && typeof plotData.readings === 'object') {
    const timestampKeys = Object.keys(plotData.readings)
      .filter((key) => isSensorValueObject(plotData.readings[key]))
      .sort((a, b) => parseFirebaseTimestamp(a).getTime() - parseFirebaseTimestamp(b).getTime());

    const latestKey = timestampKeys[timestampKeys.length - 1];
    if (latestKey && plotData.readings[latestKey] && isSensorValueObject(plotData.readings[latestKey])) {
      return {
        reading: plotData.readings[latestKey] as FirebaseReading,
        latestTimestamp: latestKey,
      };
    }
  }

  const candidateEntries = Object.entries(plotData)
    .filter(([key]) => key !== 'latest' && key !== 'readings')
    .filter(([, value]) => isSensorValueObject(value))
    .sort(([a], [b]) => parseFirebaseTimestamp(a).getTime() - parseFirebaseTimestamp(b).getTime());

  const latestEntry = candidateEntries[candidateEntries.length - 1];
  if (latestEntry) {
    return {
      reading: latestEntry[1] as FirebaseReading,
      latestTimestamp: latestEntry[0],
    };
  }

  return { reading: null, latestTimestamp: '' };
};

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
  const normalizedKey = key.trim();

  if (!normalizedKey) return new Date();

  const match = normalizedKey.match(/(\d{4})[-_/\s](\d{1,2})[-_/\s](\d{1,2})(?:[-_/\s](\d{1,2})[-_:](\d{1,2})[-_:](\d{1,2}))?/);
  if (match) {
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const numericDate = new Date(normalizedKey);
  if (!Number.isNaN(numericDate.getTime())) {
    return numericDate;
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
  const entries = plotData && typeof plotData === 'object' ? Object.entries(plotData) : [];

  entries.forEach(([timestampKey, reading]: [string, any]) => {
    if (timestampKey === 'latest' || timestampKey === 'readings') {
      return;
    }

    if (reading && typeof reading === 'object' && isSensorValueObject(reading)) {
      const timestamp = parseFirebaseTimestamp(timestampKey);
      readings.push({
        timestamp,
        readings: normalizeSensorReading(reading),
      });
    }
  });

  if (plotData?.readings && typeof plotData.readings === 'object') {
    Object.entries(plotData.readings).forEach(([timestampKey, reading]: [string, any]) => {
      if (reading && typeof reading === 'object' && isSensorValueObject(reading)) {
        const timestamp = parseFirebaseTimestamp(timestampKey);
        readings.push({
          timestamp,
          readings: normalizeSensorReading(reading),
        });
      }
    });
  }

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
    const { reading, latestTimestamp } = selectLatestReading(plotData);

    if (reading && typeof reading === 'object') {
      const deviceId = `device-${plotId}`;
      const thresholds = customThresholds.get(deviceId) || defaultThresholds;
      const sensorReading = normalizeSensorReading(reading);

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
