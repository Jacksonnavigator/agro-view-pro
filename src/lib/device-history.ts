import { HistoricalReading, SensorReading } from '@/types/device';

interface HistoryOptions {
  seed: SensorReading;
  hours: number;
}

export const generateDeviceHistory = ({ seed, hours }: HistoryOptions): HistoricalReading[] => {
  const now = Date.now();
  const interval = (hours * 60 * 60 * 1000) / 100;

  let baseMoisture = seed.moisture;
  let baseTemp = seed.temperature;
  let basePh = seed.ph;
  let baseEc = seed.ec;
  const historicalData: HistoricalReading[] = [];

  for (let i = 100; i >= 0; i--) {
    baseMoisture += (Math.random() - 0.5) * 4;
    baseTemp += (Math.random() - 0.5) * 1;
    basePh += (Math.random() - 0.5) * 0.2;
    baseEc += (Math.random() - 0.5) * 0.2;

    baseMoisture = Math.max(0, Math.min(100, baseMoisture));
    baseTemp = Math.max(0, Math.min(50, baseTemp));
    basePh = Math.max(0, Math.min(14, basePh));
    baseEc = Math.max(0, Math.min(5, baseEc));

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

interface UpdateHistoryOptions {
  previous?: HistoricalReading[];
  nextReadings: SensorReading;
  hours: number;
  timestamp?: Date;
}

export const updateDeviceHistory = ({
  previous,
  nextReadings,
  hours,
  timestamp,
}: UpdateHistoryOptions): HistoricalReading[] => {
  if (!previous || previous.length === 0) {
    return generateDeviceHistory({ seed: nextReadings, hours });
  }

  const updated = [...previous];
  const lastTimestamp = updated[updated.length - 1]?.timestamp?.getTime() ?? 0;
  const nextTimestamp = (timestamp ?? new Date()).getTime();

  if (nextTimestamp <= lastTimestamp) {
    return previous;
  }

  updated.push({
    timestamp: new Date(nextTimestamp),
    readings: {
      ...nextReadings,
    },
  });

  const maxPoints = 101;
  if (updated.length > maxPoints) {
    return updated.slice(updated.length - maxPoints);
  }

  return updated;
};
