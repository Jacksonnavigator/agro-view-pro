import { getFirebasePlotIdsFromSnapshot } from '@/hooks/useFirebaseData';
import { Alert, Device, SensorReading, SensorThresholds } from '@/types/device';

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

// Determine device status based on readings
export const getDeviceStatus = (
  readings: SensorReading,
  thresholds: SensorThresholds
): Device['status'] => {
  const issues: string[] = [];

  if (readings.moisture < thresholds.moisture.min || readings.moisture > thresholds.moisture.max) {
    issues.push('moisture');
  }
  if (readings.temperature < thresholds.temperature.min || readings.temperature > thresholds.temperature.max) {
    issues.push('temperature');
  }
  if (readings.ph < thresholds.ph.min || readings.ph > thresholds.ph.max) {
    issues.push('ph');
  }
  if (readings.ec < thresholds.ec.min || readings.ec > thresholds.ec.max) {
    issues.push('ec');
  }

  if (issues.length >= 2) return 'offline';
  if (issues.length === 1) return 'warning';
  return 'online';
};

// Parse timestamp from Firebase key (format: 2026-01-15-02-53-41)
export const parseFirebaseTimestamp = (key: string): Date => {
  const parts = key.split('-');
  if (parts.length >= 6) {
    const [year, month, day, hour, minute, second] = parts.map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  }
  return new Date();
};

// Generate alerts from device readings
export const generateAlertsFromReadings = (devices: Device[]): Alert[] => {
  const alerts: Alert[] = [];
  const parameters: (keyof SensorReading)[] = ['moisture', 'temperature', 'ph', 'ec'];

  devices.forEach((device) => {
    parameters.forEach((param) => {
      const value = device.readings[param] as number;
      const threshold = device.thresholds[param as keyof SensorThresholds];

      if (threshold && value !== undefined) {
        let severity: Alert['severity'] = 'info';
        let isAlert = false;
        let isHigh = false;

        if (value > threshold.max) {
          isAlert = true;
          isHigh = true;
          severity = value > threshold.max * 1.2 ? 'critical' : 'warning';
        } else if (value < threshold.min) {
          isAlert = true;
          severity = value < threshold.min * 0.8 ? 'critical' : 'warning';
        }

        if (isAlert) {
          alerts.push({
            id: `alert-${device.id}-${param}-${Date.now()}`,
            deviceId: device.id,
            deviceName: device.name,
            plotName: device.plotName,
            parameter: param,
            value,
            threshold: isHigh ? threshold.max : threshold.min,
            severity,
            message: `${param.charAt(0).toUpperCase() + param.slice(1)} is ${isHigh ? 'above' : 'below'} threshold`,
            timestamp: device.lastUpdated,
            acknowledged: false,
            smsSent: severity === 'critical',
          });
        }
      }
    });
  });

  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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

  Object.entries(data).forEach(([plotId, plotData]) => {
    const deviceId = `device-${plotId}`;
    const history = extractHistoricalReadings(plotData);
    historyMap.set(deviceId, history);
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

      const status = getDeviceStatus(sensorReading, thresholds);
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

        lastUpdated: parseFirebaseTimestamp(latestTimestamp),
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

describe('Firebase structure detection', () => {
  it('detects root-level plot ids when data is nested under latest/readings', () => {
    const result = getFirebasePlotIdsFromSnapshot({
      users: {},
      settings: {},
      Plot_1: {
        latest: { moisture: 20.3, temperature: 25, ph: 6.5, ec: 1.2, timestamp: '2026-08-14 22:21:57' },
        readings: {
          '2026-08-11_08-03-34': { moisture: 18, temperature: 24, ph: 6.2, ec: 1.0 },
        },
      },
      Plot_2: {
        latest: { moisture: 22, temperature: 26, ph: 6.8, ec: 1.3, timestamp: '2026-08-14 21:45:00' },
        readings: {
          '2026-08-11_08-05-34': { moisture: 21, temperature: 25, ph: 6.7, ec: 1.2 },
        },
      },
    });

    expect(result).toEqual({
      plotIds: ['Plot_1', 'Plot_2'],
      source: 'root',
    });
  });
});