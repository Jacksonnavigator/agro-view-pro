/**
 * Application Configuration
 * Centralized configuration for all hardcoded values, thresholds, and system settings
 */

// ============ SENSOR THRESHOLDS ============
export const DEFAULT_SENSOR_THRESHOLDS = {
  moisture: { min: 30, max: 70, unit: '%' },
  temperature: { min: 15, max: 35, unit: '°C' },
  ph: { min: 6.0, max: 7.5, unit: 'pH' },
  ec: { min: 0, max: 2.0, unit: 'mS/cm' },
} as const;

// Default sensor readings when data is unavailable
export const DEFAULT_SENSOR_VALUES = {
  moisture: 0,
  temperature: 0,
  ph: 7,
  ec: 0,
} as const;

// ============ SYSTEM SETTINGS ============
export const SYSTEM_CONFIG = {
  refreshInterval: 30, // seconds
  dataRetention: 30, // days
  offlineTimeout: 5, // minutes after which device is marked offline
  maxHistoryPoints: 1000, // maximum data points to retrieve for historical data
} as const;

// ============ CHART CONFIGURATION ============
export const CHART_CONFIG = {
  margins: {
    top: 5,
    right: 16,
    left: 0,
    bottom: 36,
  },
  dotSize: {
    normal: 2,
    active: 4,
  },
  dataPointThreshold: 40, // hide dots if more than this many points
  timeRanges: [
    { label: '1 Hour', value: '1h', hours: 1 },
    { label: '24 Hours', value: '24h', hours: 24 },
    { label: '7 Days', value: '7d', hours: 168 },
    { label: '30 Days', value: '30d', hours: 720 },
  ] as const,
} as const;

// ============ UI CONFIGURATION ============
export const UI_CONFIG = {
  pagination: {
    itemsPerPage: 10,
    maxDisplayedRecords: 200,
  },
  map: {
    defaultZoom: 13,
  },
  sidebar: {
    collapsedWidth: 64, // pixels
    expandedWidth: 256, // pixels
  },
  offsetDefaults: {
    popover: 4,
    tooltip: 4,
    dropdown: 4,
    hover: 4,
    menubar: 8,
  },
} as const;

// ============ STATUS COLORS ============
export const STATUS_COLORS = {
  online: '#22c55e', // green
  offline: '#ef4444', // red
  warning: '#eab308', // yellow
  processing: '#3b82f6', // blue
} as const;

// ============ CHART COLORS ============
export const CHART_COLORS = {
  moisture: '#0ea5e9', // light blue
  temperature: '#f59e0b', // amber
  ph: '#10b981', // emerald
  ec: '#a78bfa', // purple
  npk: '#f97316', // orange
} as const;

// ============ PLACEHOLDER TEXT ============
export const PLACEHOLDERS = {
  search: 'Search devices...',
  selectPlot: 'Select a plot',
  selectDevice: 'Select device',
  selectTimeRange: 'Time Range',
  selectStatus: 'Status',
  allPlots: 'All Plots',
  selectPlotForLocation: 'Choose a plot to manage its location',
  email: 'name@example.com',
  latitude: 'e.g., 37.7749',
  longitude: 'e.g., -122.4194',
  password: '••••••••',
} as const;

// ============ FORM VALIDATION ============
export const VALIDATION = {
  latitude: { min: -90, max: 90 },
  longitude: { min: -180, max: 180 },
} as const;

// ============ ERROR MESSAGES ============
export const ERROR_MESSAGES = {
  settingsSaveFailure: 'Unable to save settings to Firebase.',
  settingsSaveSuccess: 'Configuration has been persisted to Firebase.',
  connectionError: 'Connection error: ',
  settingsError: 'Settings error: ',
} as const;

// ============ LOADING & STATE ============
export const APP_STATE = {
  loadingDelay: 300, // milliseconds for UX simulation
} as const;
