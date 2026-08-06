// Device data context with Firebase Realtime Database integration
import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { AppSettings, Device, DeviceFreshness, Plot, HistoricalReading, SensorThresholds } from '@/types/device';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useToast } from '@/hooks/use-toast';

interface DeviceContextType {
  devices: Device[];
  plots: Plot[];
  isLoading: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastRefresh: Date;
  error: string | null;
  settings: AppSettings;
  deviceFreshness: DeviceFreshness;
  refreshData: () => void;
  getDevice: (id: string) => Device | undefined;
  getDeviceHistory: (id: string, hours: number) => HistoricalReading[];
  getPlotDevices: (plotId: string) => Device[];
  updateDeviceThresholds: (deviceId: string, thresholds: SensorThresholds) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  updatePlotLocations: (plotLocations: AppSettings['plotLocations']) => Promise<void>;
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
    isLoading,
    connectionStatus,
    error,
    settings,
    lastRefresh,
    refreshData,
    getDeviceHistory: getFirebaseHistory,
    updateDeviceThresholds: updateThresholds,
    updateSettings,
    updatePlotLocations,
  } = useFirebaseData();

  const { toast } = useToast();


  // Generate plots from devices
  const plots = React.useMemo(() => generatePlotsFromDevices(devices), [devices]);

  // Get single device by ID
  const getDevice = useCallback(
    (id: string) => devices.find((d) => d.id === id),
    [devices]
  );

  const deviceFreshness = React.useMemo<DeviceFreshness>(() => {
    const latestSensorTimestamp = devices.reduce<Date | null>((latest, device) => {
      if (!latest || device.lastUpdated > latest) return device.lastUpdated;
      return latest;
    }, null);
    const onlineCount = devices.filter((d) => d.status === 'online').length;

    return {
      onlineCount,
      offlineCount: devices.length - onlineCount,
      latestSensorTimestamp,
      hasLiveDevices: onlineCount > 0,
    };
  }, [devices]);

  // Get historical data for the selected wall-clock time range.
  const getDeviceHistory = useCallback((deviceId: string, hours: number): HistoricalReading[] => {
    return getFirebaseHistory(deviceId, hours);
  }, [getFirebaseHistory]);



  // Get devices for a specific plot
  const getPlotDevices = useCallback(
    (plotId: string): Device[] => {
      return devices.filter((d) => d.plotId === plotId);
    },
    [devices]
  );

  // Update device thresholds
  const updateDeviceThresholds = useCallback(
    async (deviceId: string, thresholds: SensorThresholds) => {
      await updateThresholds(deviceId, thresholds);
      toast({
        title: 'Thresholds Updated',
        description: 'Device thresholds have been saved successfully.',
      });
    },
    [updateThresholds, toast]
  );



  return (
    <DeviceContext.Provider
      value={{
        devices,
        plots,
        isLoading,
        connectionStatus,
        error,
        settings,
        deviceFreshness,
        lastRefresh,
        refreshData,
        getDevice,
        getDeviceHistory,
        getPlotDevices,
        updateDeviceThresholds,
        updateSettings,
        updatePlotLocations,
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
