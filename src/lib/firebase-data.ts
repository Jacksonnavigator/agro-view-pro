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
        signalStrength: 85 + Math.floor(Math.random() * 15), // Simulated
        batteryLevel: 70 + Math.floor(Math.random() * 30), // Simulated
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
