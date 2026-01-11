// Device data context with simulated real-time updates
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Device, Alert, Plot, HistoricalReading } from '@/types/device';
import { 
  initialDevices, 
  initialAlerts, 
  plots, 
  generateDevices, 
  generateAlerts,
  generateHistoricalData 
} from '@/data/mockData';

interface DeviceContextType {
  devices: Device[];
  alerts: Alert[];
  plots: Plot[];
  isLoading: boolean;
  lastRefresh: Date;
  refreshData: () => void;
  getDevice: (id: string) => Device | undefined;
  getDeviceHistory: (id: string, hours: number) => HistoricalReading[];
  acknowledgeAlert: (alertId: string) => void;
  getPlotDevices: (plotId: string) => Device[];
  unacknowledgedAlertCount: number;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// Refresh interval in milliseconds (30 seconds)
const REFRESH_INTERVAL = 30000;

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Refresh data (simulate API fetch)
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const newDevices = generateDevices();
    const newAlerts = generateAlerts(newDevices);
    
    setDevices(newDevices);
    setAlerts((prev) => {
      // Merge new alerts with existing (keep acknowledged status)
      const acknowledgedIds = new Set(prev.filter((a) => a.acknowledged).map((a) => a.id));
      return newAlerts.map((alert) => ({
        ...alert,
        acknowledged: acknowledgedIds.has(alert.id) || alert.acknowledged,
      }));
    });
    setLastRefresh(new Date());
    setIsLoading(false);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    const interval = setInterval(refreshData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Get single device by ID
  const getDevice = useCallback(
    (id: string) => devices.find((d) => d.id === id),
    [devices]
  );

  // Get historical data for a device
  const getDeviceHistory = useCallback(
    (id: string, hours: number): HistoricalReading[] => {
      return generateHistoricalData(id, hours);
    },
    []
  );

  // Acknowledge an alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  // Get devices for a specific plot
  const getPlotDevices = useCallback(
    (plotId: string): Device[] => {
      const plot = plots.find((p) => p.id === plotId);
      if (!plot) return [];
      return devices.filter((d) => plot.deviceIds.includes(d.id));
    },
    [devices]
  );

  // Count unacknowledged alerts
  const unacknowledgedAlertCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <DeviceContext.Provider
      value={{
        devices,
        alerts,
        plots,
        isLoading,
        lastRefresh,
        refreshData,
        getDevice,
        getDeviceHistory,
        acknowledgeAlert,
        getPlotDevices,
        unacknowledgedAlertCount,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevices() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
}
