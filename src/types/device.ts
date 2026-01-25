// Device and sensor data types for the IoT soil monitoring system

export type DeviceStatus = 'online' | 'offline';

export type UserRole = 'admin' | 'viewer';

export interface SensorReading {
  moisture: number;      // Percentage (0-100)
  temperature: number;   // Celsius
  ph: number;            // pH scale (0-14)
  ec: number;            // Electrical Conductivity (mS/cm)
  nitrogen?: number;     // NPK - N (mg/kg)
  phosphorus?: number;   // NPK - P (mg/kg)
  potassium?: number;    // NPK - K (mg/kg)
}

export interface SensorThresholds {
  moisture: { min: number; max: number };
  temperature: { min: number; max: number };
  ph: { min: number; max: number };
  ec: { min: number; max: number };
}

export interface Device {
  id: string;
  name: string;
  plotName: string;
  plotId: string;
  status: DeviceStatus;

  lastUpdated: Date;
  readings: SensorReading;
  thresholds: SensorThresholds;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface HistoricalReading {
  timestamp: Date;
  readings: SensorReading;
}



export interface Plot {
  id: string;
  name: string;
  description: string;
  deviceIds: string[];
  location?: {
    lat: number;
    lng: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface TimeRange {
  label: string;
  value: '1h' | '24h' | '7d' | '30d' | 'custom';
  hours: number;
}
