// Mock data for the IoT Soil Monitoring Dashboard
import { Device, Alert, Plot, HistoricalReading, SensorReading } from '@/types/device';

// Helper to generate random values within a range
const randomInRange = (min: number, max: number, decimals = 1): number => {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
};

// Default thresholds for soil parameters
const defaultThresholds = {
  moisture: { min: 30, max: 70 },
  temperature: { min: 15, max: 35 },
  ph: { min: 5.5, max: 7.5 },
  ec: { min: 0.5, max: 2.5 },
};

// Plot definitions
export const plots: Plot[] = [
  { id: 'plot-1', name: 'North Field', description: 'Wheat cultivation area', deviceIds: ['device-1', 'device-2', 'device-3'] },
  { id: 'plot-2', name: 'South Greenhouse', description: 'Tomato and pepper greenhouse', deviceIds: ['device-4', 'device-5', 'device-6'] },
  { id: 'plot-3', name: 'East Orchard', description: 'Apple and pear trees', deviceIds: ['device-7', 'device-8', 'device-9'] },
];

// Generate sensor readings with occasional threshold breaches
const generateReadings = (includeNpk = false): SensorReading => {
  const readings: SensorReading = {
    moisture: randomInRange(20, 80),
    temperature: randomInRange(10, 40),
    ph: randomInRange(4.5, 8.5),
    ec: randomInRange(0.2, 3.5),
  };

  if (includeNpk) {
    readings.nitrogen = randomInRange(20, 200, 0);
    readings.phosphorus = randomInRange(10, 100, 0);
    readings.potassium = randomInRange(50, 300, 0);
  }

  return readings;
};

// Determine device status based on readings
const getDeviceStatus = (readings: SensorReading): Device['status'] => {
  const issues = [];
  
  if (readings.moisture < 30 || readings.moisture > 70) issues.push('moisture');
  if (readings.temperature < 15 || readings.temperature > 35) issues.push('temperature');
  if (readings.ph < 5.5 || readings.ph > 7.5) issues.push('ph');
  if (readings.ec < 0.5 || readings.ec > 2.5) issues.push('ec');

  if (issues.length >= 2) return 'offline';
  if (issues.length === 1) return 'warning';
  return 'online';
};

// Generate mock devices
export const generateDevices = (): Device[] => {
  const deviceConfigs = [
    { id: 'device-1', name: 'Sensor Alpha-01', plotName: 'North Field', plotId: 'plot-1' },
    { id: 'device-2', name: 'Sensor Alpha-02', plotName: 'North Field', plotId: 'plot-1' },
    { id: 'device-3', name: 'Sensor Alpha-03', plotName: 'North Field', plotId: 'plot-1' },
    { id: 'device-4', name: 'Sensor Beta-01', plotName: 'South Greenhouse', plotId: 'plot-2' },
    { id: 'device-5', name: 'Sensor Beta-02', plotName: 'South Greenhouse', plotId: 'plot-2' },
    { id: 'device-6', name: 'Sensor Beta-03', plotName: 'South Greenhouse', plotId: 'plot-2' },
    { id: 'device-7', name: 'Sensor Gamma-01', plotName: 'East Orchard', plotId: 'plot-3' },
    { id: 'device-8', name: 'Sensor Gamma-02', plotName: 'East Orchard', plotId: 'plot-3' },
    { id: 'device-9', name: 'Sensor Gamma-03', plotName: 'East Orchard', plotId: 'plot-3' },
  ];

  return deviceConfigs.map((config, index) => {
    const readings = generateReadings(index % 3 === 0); // Every 3rd device has NPK
    const status = getDeviceStatus(readings);
    
    return {
      ...config,
      status,
      signalStrength: randomInRange(60, 100, 0),
      batteryLevel: randomInRange(40, 100, 0),
      lastUpdated: new Date(Date.now() - randomInRange(0, 300000, 0)), // Within last 5 minutes
      readings,
      thresholds: defaultThresholds,
      location: {
        lat: 40.7128 + randomInRange(-0.1, 0.1, 4),
        lng: -74.006 + randomInRange(-0.1, 0.1, 4),
      },
    };
  });
};

// Generate historical data for charts
export const generateHistoricalData = (deviceId: string, hours: number): HistoricalReading[] => {
  const data: HistoricalReading[] = [];
  const now = Date.now();
  const interval = (hours * 60 * 60 * 1000) / 100; // 100 data points

  // Base values for continuity
  let baseMoisture = randomInRange(40, 60);
  let baseTemp = randomInRange(20, 28);
  let basePh = randomInRange(6, 7);
  let baseEc = randomInRange(1, 2);

  for (let i = 100; i >= 0; i--) {
    // Add slight variations for realistic data
    baseMoisture += randomInRange(-2, 2);
    baseTemp += randomInRange(-0.5, 0.5);
    basePh += randomInRange(-0.1, 0.1);
    baseEc += randomInRange(-0.1, 0.1);

    // Keep values in reasonable bounds
    baseMoisture = Math.max(20, Math.min(80, baseMoisture));
    baseTemp = Math.max(10, Math.min(40, baseTemp));
    basePh = Math.max(4.5, Math.min(8.5, basePh));
    baseEc = Math.max(0.2, Math.min(3.5, baseEc));

    data.push({
      timestamp: new Date(now - i * interval),
      readings: {
        moisture: Number(baseMoisture.toFixed(1)),
        temperature: Number(baseTemp.toFixed(1)),
        ph: Number(basePh.toFixed(2)),
        ec: Number(baseEc.toFixed(2)),
      },
    });
  }

  return data;
};

// Generate mock alerts
export const generateAlerts = (devices: Device[]): Alert[] => {
  const alerts: Alert[] = [];
  const parameters: (keyof SensorReading)[] = ['moisture', 'temperature', 'ph', 'ec'];
  const severities: Alert['severity'][] = ['info', 'warning', 'critical'];

  devices.forEach((device) => {
    // Generate 0-3 random alerts per device
    const alertCount = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < alertCount; i++) {
      const param = parameters[Math.floor(Math.random() * parameters.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const value = device.readings[param] as number;
      const threshold = device.thresholds[param as keyof typeof device.thresholds];
      
      if (threshold) {
        const isHigh = value > threshold.max;
        const thresholdValue = isHigh ? threshold.max : threshold.min;
        
        alerts.push({
          id: `alert-${device.id}-${i}-${Date.now()}`,
          deviceId: device.id,
          deviceName: device.name,
          plotName: device.plotName,
          parameter: param,
          value,
          threshold: thresholdValue,
          severity,
          message: `${param.charAt(0).toUpperCase() + param.slice(1)} is ${isHigh ? 'above' : 'below'} threshold`,
          timestamp: new Date(Date.now() - randomInRange(0, 3600000, 0)),
          acknowledged: Math.random() > 0.7,
          smsSent: severity === 'critical',
        });
      }
    }
  });

  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Initial mock data
export const initialDevices = generateDevices();
export const initialAlerts = generateAlerts(initialDevices);
