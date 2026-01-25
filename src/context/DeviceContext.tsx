// Device data context with Firebase Realtime Database integration
import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { Device, Plot, HistoricalReading, SensorThresholds } from '@/types/device';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useToast } from '@/hooks/use-toast';

interface DeviceContextType {
  devices: Device[];
  plots: Plot[];
  isLoading: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastRefresh: Date;
  error: string | null;
  refreshData: () => void;
  getDevice: (id: string) => Device | undefined;
  getDeviceHistory: (id: string, hours: number) => HistoricalReading[];
  getPlotDevices: (plotId: string) => Device[];
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

  // Load saved plot locations and merge with generated plots
  const savedLocations = localStorage.getItem('plot_locations');
  if (savedLocations) {
    try {
      const locations = JSON.parse(savedLocations);
      plotMap.forEach((plot, plotId) => {
        if (locations[plotId]) {
          plot.location = locations[plotId];
        }
      });
    } catch (e) {
      console.error('Failed to load plot locations:', e);
    }
  } else {
    // Add some default locations for testing
    const defaultLocations = {
      'north-field': { lat: 37.7749, lng: -122.4194 },
      'south-field': { lat: 37.7849, lng: -122.4094 },
      'east-field': { lat: 37.7649, lng: -122.4294 },
      'west-field': { lat: 37.7949, lng: -122.4394 },
    };

    plotMap.forEach((plot, plotId) => {
      if (defaultLocations[plotId as keyof typeof defaultLocations]) {
        plot.location = defaultLocations[plotId as keyof typeof defaultLocations];
      }
    });
  }

  return Array.from(plotMap.values());
};

export function DeviceProvider({ children }: { children: ReactNode }) {
  const {
    devices,
    isLoading,
    connectionStatus,
    error,
    lastRefresh,
    refreshData,
    getDeviceHistory: getFirebaseHistory,
    updateDeviceThresholds: updateThresholds,
  } = useFirebaseData();

  const { toast } = useToast();


  // Generate plots from devices
  const plots = React.useMemo(() => generatePlotsFromDevices(devices), [devices]);

  // Get single device by ID
  const getDevice = useCallback(
    (id: string) => devices.find((d) => d.id === id),
    [devices]
  );

  // Get historical data with improved filtering and fallback
  const getDeviceHistory = useCallback((deviceId: string, hours: number): HistoricalReading[] => {
    const now = Date.now();
    const cutoff = now - hours * 60 * 60 * 1000;

    // Get actual Firebase historical data
    const firebaseHistory = getFirebaseHistory(deviceId, hours);

    if (!firebaseHistory || firebaseHistory.length === 0) {
      console.warn(`[DeviceContext] No Firebase data for deviceId=${deviceId}`);
      return [];
    }

    // Log all timestamps to see the data range
    const timestamps = firebaseHistory.map(r => r.timestamp.getTime());
    const oldestTimestamp = Math.min(...timestamps);
    const newestTimestamp = Math.max(...timestamps);

    console.log(`[DeviceContext.getDeviceHistory] Device: ${deviceId}
      Total points: ${firebaseHistory.length}
      Oldest: ${new Date(oldestTimestamp).toISOString()}
      Newest: ${new Date(newestTimestamp).toISOString()}
      Requested hours: ${hours}
      Cutoff: ${new Date(cutoff).toISOString()}
      Now: ${new Date(now).toISOString()}
    `);

    // Filter by time range
    const filtered = firebaseHistory.filter(r => r.timestamp.getTime() >= cutoff);

    // If no data in range, return all data with a warning
    if (filtered.length === 0) {
      console.warn(`[DeviceContext] No data in requested time range. Showing all ${firebaseHistory.length} points instead.`);
      return firebaseHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    const sorted = filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    console.log(`[DeviceContext] Returning ${sorted.length} filtered points`);

    return sorted;
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
    (deviceId: string, thresholds: SensorThresholds) => {
      updateThresholds(deviceId, thresholds);
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
        lastRefresh,
        refreshData,
        getDevice,
        getDeviceHistory,
        getPlotDevices,
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