import { describe, expect, it, vi } from 'vitest';
import {
  FirebaseDevicesData,
  generateAlertsFromReadings,
  transformFirebaseData,
  fallbackThresholds,
} from '@/lib/firebase-data';

const makeBaseDeviceData = (): FirebaseDevicesData => ({
  Plot_1A: {
    '2026-01-15-02-53-41': {
      moisture: 85,
      temperature: 40,
      ph: 7.2,
      ec: 3.1,
    },
  },
});

describe('transformFirebaseData', () => {
  it('maps Firebase payloads to devices with friendly plot names', () => {
    const data = makeBaseDeviceData();
    const devices = transformFirebaseData(data, {
      customThresholds: new Map(),
      defaultThresholds: fallbackThresholds,
    });

    expect(devices).toHaveLength(1);
    expect(devices[0].plotName).toBe('Plot 1A - North Field');
    expect(devices[0].readings.moisture).toBe(85);
    expect(devices[0].status).toBe('offline');
  });
});

describe('generateAlertsFromReadings', () => {
  it('creates alerts when readings exceed thresholds', () => {
    const now = new Date('2026-01-15T02:53:41Z');
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(now.getTime());

    const devices = transformFirebaseData(makeBaseDeviceData(), {
      customThresholds: new Map(),
      defaultThresholds: fallbackThresholds,
    });

    const alerts = generateAlertsFromReadings(devices);

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].severity).toBe('critical');
    expect(alerts[0].deviceId).toBe(devices[0].id);

    dateSpy.mockRestore();
  });
});
