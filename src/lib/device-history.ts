import { HistoricalReading, SensorReading } from '@/types/device';

interface HistoryOptions {
  seed: SensorReading;
  hours: number;
}

// Store for extended historical data (up to 30 days)
const extendedHistoryCache = new Map<string, HistoricalReading[]>();

export const generateDeviceHistory = ({ seed, hours }: HistoryOptions): HistoricalReading[] => {
  const now = Date.now();
  // Calculate number of points based on time range:
  // - 1 point per 15 minutes for data density
  const pointsPerHour = 4;
  const totalPoints = Math.min(hours * pointsPerHour, 2880); // Cap at 30 days worth
  const interval = (hours * 60 * 60 * 1000) / totalPoints;

  let baseMoisture = seed.moisture;
  let baseTemp = seed.temperature;
  let basePh = seed.ph;
  let baseEc = seed.ec;
  const historicalData: HistoricalReading[] = [];

  for (let i = totalPoints; i >= 0; i--) {
    // Add some realistic daily variation for temperature
    const hourOfDay = new Date(now - i * interval).getHours();
    const dayNightVariation = Math.sin((hourOfDay - 6) * Math.PI / 12) * 3; // Warmer during day

    baseMoisture += (Math.random() - 0.5) * 2;
    baseTemp += (Math.random() - 0.5) * 0.5;
    basePh += (Math.random() - 0.5) * 0.1;
    baseEc += (Math.random() - 0.5) * 0.1;

    baseMoisture = Math.max(20, Math.min(80, baseMoisture));
    baseTemp = Math.max(15, Math.min(35, baseTemp + dayNightVariation * 0.1));
    basePh = Math.max(5.5, Math.min(8.5, basePh));
    baseEc = Math.max(0.5, Math.min(3.5, baseEc));

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

  return historicalData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

// Get or create extended history for a device
export const getOrCreateExtendedHistory = (deviceId: string, seed: SensorReading): HistoricalReading[] => {
  if (!extendedHistoryCache.has(deviceId)) {
    // Generate 30 days of historical data
    const history = generateDeviceHistory({ seed, hours: 720 });
    extendedHistoryCache.set(deviceId, history);
  }
  return extendedHistoryCache.get(deviceId)!;
};

interface UpdateHistoryOptions {
  deviceId: string;
  nextReadings: SensorReading;
  timestamp?: Date;
}

export const updateDeviceHistory = ({
  deviceId,
  nextReadings,
  timestamp,
}: UpdateHistoryOptions): HistoricalReading[] => {
  let history = extendedHistoryCache.get(deviceId);
  
  if (!history || history.length === 0) {
    history = generateDeviceHistory({ seed: nextReadings, hours: 720 });
    extendedHistoryCache.set(deviceId, history);
    return history;
  }

  const lastTimestamp = history[history.length - 1]?.timestamp?.getTime() ?? 0;
  const nextTimestamp = (timestamp ?? new Date()).getTime();

  // Only add if this is a new reading (at least 1 minute apart)
  if (nextTimestamp <= lastTimestamp + 60000) {
    return history;
  }

  const updated = [...history];
  updated.push({
    timestamp: new Date(nextTimestamp),
    readings: { ...nextReadings },
  });

  // Keep max 30 days of data (2880 points at 15min intervals)
  const maxPoints = 2880;
  if (updated.length > maxPoints) {
    const trimmed = updated.slice(updated.length - maxPoints);
    extendedHistoryCache.set(deviceId, trimmed);
    return trimmed;
  }

  extendedHistoryCache.set(deviceId, updated);
  return updated;
};

// Clear cache for a device (useful for testing)
export const clearDeviceHistoryCache = (deviceId?: string) => {
  if (deviceId) {
    extendedHistoryCache.delete(deviceId);
  } else {
    extendedHistoryCache.clear();
  }
};
