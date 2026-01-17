// Device data context with Firebase Realtime Database integration
import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { Device, Alert, Plot, HistoricalReading, SensorThresholds } from '@/types/device';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useToast } from '@/hooks/use-toast';

interface DeviceContextType {
  devices: Device[];
  alerts: Alert[];
  plots: Plot[];
  isLoading: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastRefresh: Date;
  error: string | null;
  refreshData: () => void;
  getDevice: (id: string) => Device | undefined;
  getDeviceHistory: (id: string, hours: number) => HistoricalReading[];
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeAllAlerts: () => void;
  getPlotDevices: (plotId: string) => Device[];
  unacknowledgedAlertCount: number;
  updateDeviceThresholds: (deviceId: string, thresholds: SensorThresholds) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// Generate plots from device data
const generatePlotsFromDevices = (devices: Device[]): Plot[] => {
  const plotMap = new Map<string, Plot>();

  devices.forEach((device) => {
    if (!plotMap.has(device.plotId)) {
      plotMap.set(device.plotId, {
        id: device.plotId,
        name: device.plotName,
        description: `Monitoring zone for ${device.plotName}`,
        deviceIds: [],
        location: device.location,
      });
    }
    plotMap.get(device.plotId)!.deviceIds.push(device.id);
  });

  return Array.from(plotMap.values());
};

export function DeviceProvider({ children }: { children: ReactNode }) {
  const {
    devices,
    alerts: firebaseAlerts,
    isLoading,
    connectionStatus,
    error,
    lastRefresh,
    refreshData,
    getDeviceHistory,
    updateDeviceThresholds: updateThresholds,
  } = useFirebaseData();

  const { toast } = useToast();
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = React.useState<Set<string>>(new Set());

  // Merge Firebase alerts with acknowledgment state
  const alerts = React.useMemo(() => {
    return firebaseAlerts.map((alert) => ({
      ...alert,
      acknowledged: acknowledgedAlertIds.has(alert.id) || alert.acknowledged,
    }));
  }, [firebaseAlerts, acknowledgedAlertIds]);

  // Generate plots from devices
  const plots = React.useMemo(() => generatePlotsFromDevices(devices), [devices]);

  // Get single device by ID
  const getDevice = useCallback(
    (id: string) => devices.find((d) => d.id === id),
    [devices]
  );

  // Acknowledge an alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAcknowledgedAlertIds((prev) => new Set([...prev, alertId]));
  }, []);

  // Acknowledge all alerts
  const acknowledgeAllAlerts = useCallback(() => {
    const allIds = alerts.map((a) => a.id);
    setAcknowledgedAlertIds(new Set(allIds));
    toast({
      title: 'All Alerts Acknowledged',
      description: 'All pending alerts have been marked as acknowledged.',
    });
  }, [alerts, toast]);

  // Get devices for a specific plot
  const getPlotDevices = useCallback(
    (plotId: string): Device[] => {
      return devices.filter((d) => d.plotId === plotId);
    },
    [devices]
  );

  // Update device thresholds
  const updateDeviceThresholds = useCallback(
    (deviceId: string, thresholds: SensorThresholds) => {
      updateThresholds(deviceId, thresholds);
      toast({
        title: 'Thresholds Updated',
        description: 'Device thresholds have been saved successfully.',
      });
    },
    [updateThresholds, toast]
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
        connectionStatus,
        error,
        lastRefresh,
        refreshData,
        getDevice,
        getDeviceHistory,
        acknowledgeAlert,
        acknowledgeAllAlerts,
        getPlotDevices,
        unacknowledgedAlertCount,
        updateDeviceThresholds,
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
