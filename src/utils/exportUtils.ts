// Export utilities for CSV and data download
import { Device, HistoricalReading } from '@/types/device';
import { format } from 'date-fns';

// Convert data to CSV string
export function convertToCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (data.length === 0) return '';

  const keys = headers || Object.keys(data[0]);
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(keys.join(','));

  // Add data rows
  for (const row of data) {
    const values = keys.map((key) => {
      const value = row[key];
      // Handle special cases
      if (value instanceof Date) {
        return `"${format(value, 'yyyy-MM-dd HH:mm:ss')}"`;
      }
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      if (value === null || value === undefined) {
        return '';
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Download content as a file
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv'): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export devices to CSV
export function exportDevicesCSV(devices: Device[]): void {
  const data = devices.map((device) => ({
    device_id: device.id,
    device_name: device.name,
    plot_name: device.plotName,
    status: device.status,

    last_updated: device.lastUpdated,
    moisture_percent: device.readings.moisture,
    temperature_celsius: device.readings.temperature,
    ph_level: device.readings.ph,
    ec_mS_cm: device.readings.ec,
    nitrogen_mg_kg: device.readings.nitrogen || '',
    phosphorus_mg_kg: device.readings.phosphorus || '',
    potassium_mg_kg: device.readings.potassium || '',
    latitude: device.location?.lat || '',
    longitude: device.location?.lng || '',
  }));

  const csv = convertToCSV(data);
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
  downloadFile(csv, `soil_devices_${timestamp}.csv`);
}

// Export alerts to CSV


// Export historical data for devices (requires getDeviceHistory function from context)
export function exportHistoricalDataCSV(
  devices: Device[],
  startDate: Date,
  endDate: Date,
  getDeviceHistory: (deviceId: string, hours: number) => HistoricalReading[]
): void {
  const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
  const allData: Record<string, unknown>[] = [];

  devices.forEach((device) => {
    const history = getDeviceHistory(device.id, hours);

    history.forEach((reading) => {
      if (reading.timestamp >= startDate && reading.timestamp <= endDate) {
        allData.push({
          device_id: device.id,
          device_name: device.name,
          plot_name: device.plotName,
          timestamp: reading.timestamp,
          moisture_percent: reading.readings.moisture,
          temperature_celsius: reading.readings.temperature,
          ph_level: reading.readings.ph,
          ec_mS_cm: reading.readings.ec,
        });
      }
    });
  });

  // Sort by timestamp
  allData.sort((a, b) =>
    (a.timestamp as Date).getTime() - (b.timestamp as Date).getTime()
  );

  const csv = convertToCSV(allData);
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
  downloadFile(csv, `soil_historical_data_${timestamp}.csv`);
}

// Quick export helpers (now require getDeviceHistory parameter)
export function exportDailySummary(
  devices: Device[],
  getDeviceHistory: (deviceId: string, hours: number) => HistoricalReading[]
): void {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  exportHistoricalDataCSV(devices, yesterday, now, getDeviceHistory);
}

export function exportWeeklyReport(
  devices: Device[],
  getDeviceHistory: (deviceId: string, hours: number) => HistoricalReading[]
): void {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  exportHistoricalDataCSV(devices, weekAgo, now, getDeviceHistory);
}

export function exportMonthlyReport(
  devices: Device[],
  getDeviceHistory: (deviceId: string, hours: number) => HistoricalReading[]
): void {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  exportHistoricalDataCSV(devices, monthAgo, now, getDeviceHistory);
}
