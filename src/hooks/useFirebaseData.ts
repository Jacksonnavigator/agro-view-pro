// Hook to subscribe to Firebase Realtime Database for sensor data
import { useEffect, useState, useCallback, useMemo } from 'react';
import { database, ref, onValue } from '@/lib/firebase';
import { Device, Alert, HistoricalReading, SensorReading, SensorThresholds } from '@/types/device';

// Firebase data structure types
interface FirebaseReading {
  ec: number;
  moisture: number;
  ph: number;
  temperature: number;
}

interface FirebasePlotData {
  [timestamp: string]: FirebaseReading;
}

interface FirebaseDevicesData {
  [plotId: string]: FirebasePlotData;
}

// Fallback thresholds if not in localStorage
const fallbackThresholds: SensorThresholds = {
  moisture: { min: 30, max: 70 },
  temperature: { min: 15, max: 35 },
  ph: { min: 5.5, max: 7.5 },
  ec: { min: 0.5, max: 2.5 },
};

// Plot configurations mapping Firebase plot IDs to friendly names
const plotConfigs: Record<string, { name: string; description: string }> = {
  'Plot_1A': { name: 'Plot 1A - North Field', description: 'Primary monitoring zone' },
  'Plot_1B': { name: 'Plot 1B - South Field', description: 'Secondary monitoring zone' },
  'Plot_2A': { name: 'Plot 2A - Greenhouse', description: 'Controlled environment' },
  'Plot_2B': { name: 'Plot 2B - Orchard', description: 'Fruit tree area' },
};

// Determine device status based on readings
const getDeviceStatus = (readings: SensorReading, thresholds: SensorThresholds): Device['status'] => {
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
const parseFirebaseTimestamp = (key: string): Date => {
  const parts = key.split('-');
  if (parts.length === 6) {
    const [year, month, day, hour, minute, second] = parts.map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  }
  return new Date();
};

// Generate alerts from device readings
const generateAlertsFromReadings = (devices: Device[]): Alert[] => {
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

export function useFirebaseData() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [customThresholds, setCustomThresholds] = useState<Map<string, SensorThresholds>>(new Map());

  // Retrieve global default thresholds from localStorage or use fallback
  const defaultThresholds = useMemo(() => {
    const saved = localStorage.getItem('user_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.thresholds) {
          return parsed.thresholds as SensorThresholds;
        }
      } catch (e) {
        console.error('Failed to parse settings for thresholds', e);
      }
    }
    return fallbackThresholds;
  }, [lastRefresh]); // Re-read when refresh happens (hacky way to update if settings changed)

  // Transform Firebase data to Device array
  const transformFirebaseData = useCallback((data: FirebaseDevicesData): Device[] => {
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
          description: 'Monitoring zone'
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
  }, [customThresholds, defaultThresholds]);

  // Subscribe to Firebase Realtime Database
  useEffect(() => {
    setIsLoading(true);
    const devicesRef = ref(database, 'devices');

    const unsubscribe = onValue(
      devicesRef,
      (snapshot) => {
        const data = snapshot.val() as FirebaseDevicesData | null;

        if (data) {
          const transformedDevices = transformFirebaseData(data);
          setDevices(transformedDevices);
          setAlerts(generateAlertsFromReadings(transformedDevices));
          setError(null);
        } else {
          setDevices([]);
          setAlerts([]);
        }

        setLastRefresh(new Date());
        setIsLoading(false);
      },
      (err) => {
        console.error('Firebase error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [transformFirebaseData]);

  // Get historical data for a device from Firebase
  const getDeviceHistory = useCallback((deviceId: string, hours: number): HistoricalReading[] => {
    // For now, we'll generate synthetic historical data based on current readings
    // In a real implementation, you'd query Firebase for historical timestamps
    const device = devices.find(d => d.id === deviceId);
    if (!device) return [];

    const now = Date.now();
    const interval = (hours * 60 * 60 * 1000) / 100;

    let baseMoisture = device.readings.moisture;
    let baseTemp = device.readings.temperature;
    let basePh = device.readings.ph;
    let baseEc = device.readings.ec;
    const historicalData: HistoricalReading[] = [];

    for (let i = 100; i >= 0; i--) {
      baseMoisture += (Math.random() - 0.5) * 4;
      baseTemp += (Math.random() - 0.5) * 1;
      basePh += (Math.random() - 0.5) * 0.2;
      baseEc += (Math.random() - 0.5) * 0.2;

      baseMoisture = Math.max(0, Math.min(100, baseMoisture));
      baseTemp = Math.max(0, Math.min(50, baseTemp));
      basePh = Math.max(0, Math.min(14, basePh));
      baseEc = Math.max(0, Math.min(5, baseEc));

      historicalData.push({
        timestamp: new Date(now - i * interval),
        readings: {
          moisture: Number(baseMoisture.toFixed(1)),
          temperature: Number(baseTemp.toFixed(1)),
          ph: Number(basePh.toFixed(2)),
          ec: Number(baseEc.toFixed(2)),
        },
      });
    }

    return historicalData;
  }, [devices]);

  // Update device thresholds
  const updateDeviceThresholds = useCallback((deviceId: string, thresholds: SensorThresholds) => {
    setCustomThresholds(prev => {
      const newMap = new Map(prev);
      newMap.set(deviceId, thresholds);
      return newMap;
    });
  }, []);

  // Manual refresh (forces re-fetch)
  const refreshData = useCallback(() => {
    setLastRefresh(new Date());
    // In a real scenario, this might force a re-fetch if we weren't using real-time subscription
    // But here it triggers a re-read of localStorage due to dependency in defaultThresholds
  }, []);

  return {
    devices,
    alerts,
    isLoading,
    lastRefresh,
    error,
    refreshData,
    getDeviceHistory,
    updateDeviceThresholds,
  };
}
