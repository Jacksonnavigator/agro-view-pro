// Hook to subscribe to Firebase Realtime Database for sensor data
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import React from 'react';
import { database, ref, onValue } from '@/lib/firebase';
import { Device, Alert, HistoricalReading, SensorThresholds } from '@/types/device';
import {
  FirebaseDevicesData,
  fallbackThresholds,
  generateAlertsFromReadings,
  transformFirebaseData,
} from '@/lib/firebase-data';
import { getOrCreateExtendedHistory, updateDeviceHistory } from '@/lib/device-history';

export function useFirebaseData() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [customThresholds, setCustomThresholds] = useState<Map<string, SensorThresholds>>(new Map());
  const [deviceHistoryMap, setDeviceHistoryMap] = useState<Map<string, HistoricalReading[]>>(new Map());
  const retryCountRef = useRef(0);
  const maxRetries = 3;

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

  // Initialize history for devices that don't have it yet
  React.useEffect(() => {
    if (devices.length > 0) {
      setDeviceHistoryMap((prev) => {
        const nextMap = new Map(prev);
        devices.forEach((device) => {
          if (!nextMap.has(device.id)) {
            // Generate 30 days of extended history
            nextMap.set(device.id, getOrCreateExtendedHistory(device.id, device.readings));
          }
        });
        return nextMap;
      });
    }
  }, [devices]);

  // Transform Firebase data to Device array
  const transformFirebaseDataCallback = useCallback(
    (data: FirebaseDevicesData): Device[] =>
      transformFirebaseData(data, { customThresholds, defaultThresholds }),
    [customThresholds, defaultThresholds]
  );

  // Subscribe to Firebase Realtime Database
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const devicesRef = ref(database, 'devices');

    const connectToFirebase = () => {
      setIsLoading(true);
      setConnectionStatus('connecting');
      setError(null);

      try {
        unsubscribe = onValue(
          devicesRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val() as FirebaseDevicesData;
              try {
                const transformedDevices = transformFirebaseDataCallback(data);
                setDevices(transformedDevices);
                setDeviceHistoryMap((prev) => {
                  const nextMap = new Map(prev);
                  transformedDevices.forEach((device) => {
                    const updatedHistory = updateDeviceHistory({
                      deviceId: device.id,
                      nextReadings: device.readings,
                      timestamp: device.lastUpdated,
                    });
                    nextMap.set(device.id, updatedHistory);
                  });
                  return nextMap;
                });
                setAlerts(generateAlertsFromReadings(transformedDevices));
                setError(null);
                setConnectionStatus('connected');
                retryCountRef.current = 0; // Reset retries on success
              } catch (transformErr) {
                console.error('Error transforming data:', transformErr);
                setError('Failed to process sensor data');
                // Don't disconnect, just show error
              }
            } else {
              setDevices([]);
              setAlerts([]);
              setConnectionStatus('connected'); // Empty but connected
            }

            setLastRefresh(new Date());
            setIsLoading(false);
          },
          (err) => {
            console.error('Firebase error:', err);
            setError(`Connection error: ${err.message}`);
            setConnectionStatus('disconnected');
            setIsLoading(false);

            // Auto-retry logic
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current += 1;
              const timeout = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
              console.log(`Retrying connection in ${timeout}ms...`);
              setTimeout(connectToFirebase, timeout);
            }
          }
        );
      } catch (e) {
        console.error('Setup error:', e);
        setError('Failed to initialize connection');
        setConnectionStatus('disconnected');
        setIsLoading(false);
      }
    };

    connectToFirebase();

    return () => {
      if (unsubscribe) unsubscribe();
      // Also ensure we clean up the listener reference if off is needed explicitly
      // off(devicesRef); // onValue returns unsubscribe which handles this
    };
  }, [transformFirebaseDataCallback]);

  // Get historical data for a device from Firebase
  const getDeviceHistory = useCallback((deviceId: string, hours: number): HistoricalReading[] => {
    const now = Date.now();
    const cutoff = now - hours * 60 * 60 * 1000;
    
    // Check if we have cached data
    const cached = deviceHistoryMap.get(deviceId);
    if (cached && cached.length > 0) {
      const filtered = cached.filter(r => r.timestamp.getTime() >= cutoff);
      const sorted = filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      console.log(`[getDeviceHistory] deviceId=${deviceId} hours=${hours} cached=${cached.length} filtered=${sorted.length}`);
      return sorted;
    }
    
    // Fallback: generate extended history
    const device = devices.find(d => d.id === deviceId);
    if (!device) return [];
    const generated = getOrCreateExtendedHistory(deviceId, device.readings);
    const filteredGenerated = generated.filter(r => r.timestamp.getTime() >= cutoff);
    console.log(`[getDeviceHistory] deviceId=${deviceId} hours=${hours} generated=${filteredGenerated.length}`);
    return filteredGenerated;
  }, [deviceHistoryMap, devices]);

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
    setIsLoading(true);
    // In a real scenario, this might force a re-fetch if we weren't using real-time subscription
    // But here it triggers a re-read of localStorage due to dependency in defaultThresholds
    // And we can simulate a "reconnect" if we were disconnected
    if (connectionStatus === 'disconnected') {
      retryCountRef.current = 0;
      // The effect dependency on connectionStatus or a manual trigger would be needed
      // For now, we just update lastRefresh which might trigger things depending on implementation
    }
    setLastRefresh(new Date());
    setTimeout(() => setIsLoading(false), 500); // Fake delay for UX
  }, [connectionStatus]);

  return {
    devices,
    alerts,
    isLoading,
    connectionStatus,
    lastRefresh,
    error,
    refreshData,
    getDeviceHistory,
    updateDeviceThresholds,
  };
}
