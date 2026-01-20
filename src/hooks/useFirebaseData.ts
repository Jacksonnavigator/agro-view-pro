// Hook to subscribe to Firebase Realtime Database for sensor data
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { database, ref, onValue } from '@/lib/firebase';
import { Device, Alert, HistoricalReading, SensorThresholds } from '@/types/device';
import {
  FirebaseDevicesData,
  fallbackThresholds,
  generateAlertsFromReadings,
  transformFirebaseData,
  extractAllDeviceHistory,
} from '@/lib/firebase-data';

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
  }, [lastRefresh]);

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
                
                // Extract actual historical data from Firebase
                const actualHistory = extractAllDeviceHistory(data);
                setDeviceHistoryMap(actualHistory);
                console.log('[Firebase] Loaded actual historical data:', 
                  Array.from(actualHistory.entries()).map(([id, history]) => 
                    `${id}: ${history.length} readings`
                  )
                );
                
                setAlerts(generateAlertsFromReadings(transformedDevices));
                setError(null);
                setConnectionStatus('connected');
                retryCountRef.current = 0;
              } catch (transformErr) {
                console.error('Error transforming data:', transformErr);
                setError('Failed to process sensor data');
              }
            } else {
              setDevices([]);
              setAlerts([]);
              setDeviceHistoryMap(new Map());
              setConnectionStatus('connected');
            }

            setLastRefresh(new Date());
            setIsLoading(false);
          },
          (err) => {
            console.error('Firebase error:', err);
            setError(`Connection error: ${err.message}`);
            setConnectionStatus('disconnected');
            setIsLoading(false);

            if (retryCountRef.current < maxRetries) {
              retryCountRef.current += 1;
              const timeout = Math.pow(2, retryCountRef.current) * 1000;
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
    };
  }, [transformFirebaseDataCallback]);

  // Get historical data for a device from actual Firebase data
  const getDeviceHistory = useCallback((deviceId: string, hours: number): HistoricalReading[] => {
    const now = Date.now();
    const cutoff = now - hours * 60 * 60 * 1000;
    
    const history = deviceHistoryMap.get(deviceId);
    if (!history || history.length === 0) {
      console.log(`[getDeviceHistory] deviceId=${deviceId} - No actual data available`);
      return [];
    }
    
    const filtered = history.filter(r => r.timestamp.getTime() >= cutoff);
    const sorted = filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    console.log(`[getDeviceHistory] deviceId=${deviceId} hours=${hours} total=${history.length} filtered=${sorted.length}`);
    return sorted;
  }, [deviceHistoryMap]);

  // Update device thresholds
  const updateDeviceThresholds = useCallback((deviceId: string, thresholds: SensorThresholds) => {
    setCustomThresholds(prev => {
      const newMap = new Map(prev);
      newMap.set(deviceId, thresholds);
      return newMap;
    });
  }, []);

  // Manual refresh
  const refreshData = useCallback(() => {
    setIsLoading(true);
    if (connectionStatus === 'disconnected') {
      retryCountRef.current = 0;
    }
    setLastRefresh(new Date());
    setTimeout(() => setIsLoading(false), 500);
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
