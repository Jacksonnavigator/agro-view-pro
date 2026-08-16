import { describe, expect, it } from 'vitest';
import { buildComparisonChartData } from '../DeviceComparisonChart';

describe('buildComparisonChartData', () => {
  it('fills a meaningful time series across selected devices and ranges', () => {
    const now = new Date('2026-08-16T12:00:00Z').getTime();
    const oneHourAgo = now - 60 * 60 * 1000;

    const deviceHistories = {
      deviceA: [
        { timestamp: new Date(oneHourAgo + 5 * 60 * 1000), readings: { moisture: 30, temperature: 22, ph: 6.2, ec: 1.0 } },
        { timestamp: new Date(oneHourAgo + 25 * 60 * 1000), readings: { moisture: 35, temperature: 23, ph: 6.4, ec: 1.2 } },
      ],
      deviceB: [
        { timestamp: new Date(oneHourAgo + 10 * 60 * 1000), readings: { moisture: 45, temperature: 24, ph: 6.5, ec: 1.5 } },
        { timestamp: new Date(oneHourAgo + 30 * 60 * 1000), readings: { moisture: 50, temperature: 25, ph: 6.7, ec: 1.6 } },
      ],
    };

    const data = buildComparisonChartData({
      deviceHistories,
      selectedDevices: ['deviceA', 'deviceB'],
      selectedParameter: 'moisture',
      rangeHours: 1,
    });

    expect(data.length).toBeGreaterThan(0);
    expect(data.every((point) => point.time)).toBe(true);
    expect(data[0]).toHaveProperty('deviceA');
    expect(data[0]).toHaveProperty('deviceB');
    expect(data.some((point) => point.deviceA !== null && point.deviceB !== null)).toBe(true);
  });
});
