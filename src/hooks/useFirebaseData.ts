// Hook to subscribe to Firebase Realtime Database for recent sensor data only.
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { auth, database, ref, onValue, set, query, orderByKey, startAt, limitToLast, get } from '@/lib/firebase';
import { AppSettings, Device, HistoricalReading, SensorThresholds } from '@/types/device';
import {
  FirebasePlotData,
  fallbackSettings,
  transformFirebaseData,
  extractHistoricalReadings,
} from '@/lib/firebase-data';

const HISTORY_POINT_LIMIT = 5000;

function toFirebaseTimestampKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('-');
}

function mergeSettings(value: Partial<AppSettings> | null | undefined): AppSettings {
  return {
    ...fallbackSettings,
    ...value,
    thresholds: {
      ...fallbackSettings.thresholds,
      ...value?.thresholds,
    },
    system: {
      ...fallbackSettings.system,
      ...value?.system,
    },
    account: {
      ...fallbackSettings.account,
      ...value?.account,
    },
    plotLocations: {
      ...fallbackSettings.plotLocations,
      ...value?.plotLocations,
    },
  };
}

export function getFirebasePlotIdsFromSnapshot(snapshotValue: unknown): { plotIds: string[]; source: 'devices' | 'root' } {
  const root = snapshotValue && typeof snapshotValue === 'object' ? snapshotValue as Record<string, unknown> : {};

  if (root.devices && typeof root.devices === 'object' && !Array.isArray(root.devices)) {
    const devicePlotIds = Object.keys(root.devices as Record<string, unknown>);
    if (devicePlotIds.length > 0) {
      return { plotIds: devicePlotIds, source: 'devices' };
    }
  }

  const rootPlotIds = Object.keys(root).filter((key) => {
    if (key === 'settings' || key === 'users' || key === 'devices') return false;

    const value = root[key];
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

    const record = value as Record<string, unknown>;
    return !!record.latest || !!record.readings;
  });

  if (rootPlotIds.length > 0) {
    return { plotIds: rootPlotIds, source: 'root' };
  }

  return { plotIds: [], source: 'root' };
}

async function fetchPlotIds(): Promise<{ plotIds: string[]; source: 'devices' | 'root' }> {
  const snapshot = await get(ref(database));
  if (!snapshot.exists()) {
    return { plotIds: [], source: 'root' };
  }

  return getFirebasePlotIdsFromSnapshot(snapshot.val());
}

export function useFirebaseData() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettingsState] = useState<AppSettings>(fallbackSettings);
  const [customThresholds, setCustomThresholds] = useState<Map<string, SensorThresholds>>(new Map());
  const [deviceHistoryMap, setDeviceHistoryMap] = useState<Map<string, HistoricalReading[]>>(new Map());
  const [refreshNonce, setRefreshNonce] = useState(0);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  const thresholdDefaults = settings.thresholds;

  const transformOptions = useMemo(
    () => ({
      customThresholds,
      defaultThresholds: thresholdDefaults,
      plotLocations: settings.plotLocations,
      offlineAfterMinutes: settings.system.offlineAfterMinutes,
      offlineDetection: settings.system.offlineDetection,
    }),
    [customThresholds, thresholdDefaults, settings.plotLocations, settings.system.offlineAfterMinutes, settings.system.offlineDetection]
  );

  useEffect(() => {
    return onValue(
      ref(database, 'settings/global'),
      (snapshot) => {
        const value = snapshot.exists() ? snapshot.val() as Partial<AppSettings> : null;
        setSettingsState(mergeSettings(value));
      },
      (err) => {
        // Settings load error, using defaults
        setError(`Settings error: ${err.message}`);
      }
    );
  }, []);

  useEffect(() => {
    return onValue(
      ref(database, 'settings/deviceThresholds'),
      (snapshot) => {
        const values = snapshot.exists() ? snapshot.val() as Record<string, SensorThresholds> : {};
        setCustomThresholds(new Map(Object.entries(values)));
      },
      (err) => {
        // Device thresholds load error, using defaults
      }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    unsubscribersRef.current.forEach((unsubscribe) => unsubscribe());
    unsubscribersRef.current = [];
    setIsLoading(true);
    setConnectionStatus('connecting');
    setError(null);

    const latestByPlot = new Map<string, FirebasePlotData>();
    const historiesByDevice = new Map<string, HistoricalReading[]>();

    const rebuildDevices = () => {
      const firebaseData: Record<string, FirebasePlotData> = {};
      latestByPlot.forEach((plotData, plotId) => {
        firebaseData[plotId] = plotData;
      });

      setDevices(transformFirebaseData(firebaseData, transformOptions));
      setDeviceHistoryMap(new Map(historiesByDevice));
      setLastRefresh(new Date());
    };

    const subscribe = async () => {
      try {
        const { plotIds, source } = await fetchPlotIds();
        if (cancelled) return;

        if (plotIds.length === 0) {
          setDevices([]);
          setDeviceHistoryMap(new Map());
          setConnectionStatus('connected');
          setIsLoading(false);
          setLastRefresh(new Date());
          return;
        }

        const retentionHours = Math.max(settings.system.retention, 1) * 24;
        const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
        const cutoffKey = toFirebaseTimestampKey(cutoff);
        let completedInitialSnapshots = 0;
        const expectedInitialSnapshots = plotIds.length * 2;

        const markInitialSnapshot = () => {
          completedInitialSnapshots += 1;
          if (completedInitialSnapshots >= expectedInitialSnapshots) {
            setConnectionStatus('connected');
            setIsLoading(false);
          }
        };

        plotIds.forEach((plotId) => {
          const latestRef = source === 'devices'
            ? ref(database, `devices/${plotId}`)
            : ref(database, `${plotId}/latest`);

          const latestQuery = source === 'devices'
            ? query(latestRef, orderByKey(), limitToLast(1))
            : latestRef;

          const latestUnsubscribe = onValue(
            latestQuery,
            (snapshot) => {
              const latestValue = snapshot.exists() ? snapshot.val() : null;
              if (source === 'root' && latestValue && typeof latestValue === 'object' && !('latest' in latestValue) && !('readings' in latestValue)) {
                latestByPlot.set(plotId, { latest: latestValue as FirebasePlotData });
              } else if (source === 'root') {
                latestByPlot.set(plotId, { latest: latestValue as FirebasePlotData } as FirebasePlotData);
              } else {
                latestByPlot.set(plotId, (latestValue as FirebasePlotData) || {});
              }
              rebuildDevices();
              markInitialSnapshot();
            },
            (err) => {
              setError(`Connection error: ${err.message}`);
              setConnectionStatus('disconnected');
              setIsLoading(false);
            }
          );

          const historyRef = source === 'devices'
            ? ref(database, `devices/${plotId}`)
            : ref(database, `${plotId}/readings`);

          const historyQuery = source === 'devices'
            ? query(historyRef, orderByKey(), startAt(cutoffKey), limitToLast(HISTORY_POINT_LIMIT))
            : historyRef;

          const historyUnsubscribe = onValue(
            historyQuery,
            (snapshot) => {
              const deviceId = `device-${plotId}`;
              const historyValue = snapshot.exists() ? snapshot.val() : null;
              const normalizedHistory = historyValue && typeof historyValue === 'object'
                ? extractHistoricalReadings(historyValue as FirebasePlotData)
                : [];

              historiesByDevice.set(deviceId, normalizedHistory);
              rebuildDevices();
              markInitialSnapshot();
            },
            (err) => {
              setError(`Connection error: ${err.message}`);
              setConnectionStatus('disconnected');
              setIsLoading(false);
            }
          );

          unsubscribersRef.current.push(latestUnsubscribe, historyUnsubscribe);
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize Firebase subscriptions';
        // Firebase initialization error
        setError(message);
        setConnectionStatus('disconnected');
        setIsLoading(false);
      }
    };

    void subscribe();

    return () => {
      cancelled = true;
      unsubscribersRef.current.forEach((unsubscribe) => unsubscribe());
      unsubscribersRef.current = [];
    };
  }, [settings.system.retention, transformOptions, refreshNonce]);

  const getDeviceHistory = useCallback((deviceId: string, hours: number): HistoricalReading[] => {
    const history = deviceHistoryMap.get(deviceId) || [];
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return history
      .filter((reading) => reading.timestamp.getTime() >= cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [deviceHistoryMap]);

  const updateDeviceThresholds = useCallback(async (deviceId: string, thresholds: SensorThresholds) => {
    setCustomThresholds((prev) => {
      const next = new Map(prev);
      next.set(deviceId, thresholds);
      return next;
    });
    await set(ref(database, `settings/deviceThresholds/${deviceId}`), thresholds);
  }, []);

  const updateSettings = useCallback(async (nextSettings: AppSettings) => {
    const merged = mergeSettings(nextSettings);
    await set(ref(database, 'settings/global'), merged);
    setSettingsState(merged);
  }, []);

  const updatePlotLocations = useCallback(async (plotLocations: AppSettings['plotLocations']) => {
    const nextSettings = { ...settings, plotLocations };
    await updateSettings(nextSettings);
  }, [settings, updateSettings]);

  const refreshData = useCallback(() => {
    setLastRefresh(new Date());
    setRefreshNonce((value) => value + 1);
  }, []);

  return {
    devices,
    isLoading,
    connectionStatus,
    lastRefresh,
    error,
    settings,
    refreshData,
    getDeviceHistory,
    updateDeviceThresholds,
    updateSettings,
    updatePlotLocations,
  };
}
