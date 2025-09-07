import { Alert, SystemHealth, AlertSeverity, AlertType } from '@/types';

// Static fallback data (no random generation)
const getStaticSystemHealth = (): SystemHealth => ({
  status: 'healthy',
  services: {
    api: 'healthy',
    database: 'healthy',
    websocket: 'healthy'
  },
  uptime: 86400, // 24 hours
  lastCheck: new Date().toISOString()
});

const getStaticSystemMetrics = () => ({
  cpuUsage: 25,
  memoryUsage: 65,
  memoryUsageMB: 5120,
  servicesHealthy: 8,
  servicesTotal: 8,
  uptime: 86400
});

const getStaticSensorData = () => ({
  timestamp: new Date().toISOString(),
  sensors: [
    {
      id: 'temp_001',
      type: 'temperature',
      value: 26.5,
      unit: '°C',
      timestamp: new Date().toISOString(),
      location: 'Room A',
      status: 'normal' as const
    },
    {
      id: 'hum_001',
      type: 'humidity',
      value: 55,
      unit: '%',
      timestamp: new Date().toISOString(),
      location: 'Room A',
      status: 'normal' as const
    },
    {
      id: 'co2_001',
      type: 'co2',
      value: 450,
      unit: 'ppm',
      timestamp: new Date().toISOString(),
      location: 'Room A',
      status: 'normal' as const
    }
  ],
  summary: {
    total_sensors: 18,
    active_sensors: 18,
    warning_count: 0,
    critical_count: 0
  }
});

const getStaticAlerts = (): Alert[] => [
  {
    id: 'fallback-1',
    title: 'System Operating Normally',
    severity: 'low' as AlertSeverity,
    type: 'system' as AlertType,
    message: 'All systems operational - using fallback data',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    acknowledged: false
  }
];

const getStaticMLPredictions = () => ({
  timestamp: new Date().toISOString(),
  data: {
    predictions: {
      fire_risk: 0.05,
      smoke_detection: 0.02,
      temperature_anomaly: 0.01,
      humidity_anomaly: 0.01,
      co2_anomaly: 0.01,
      overall_risk_score: 0.05
    },
    confidence: 0.90,
    model_version: '2.1.0',
    processing_time_ms: 100,
    status: 'normal',
    alerts: [],
    recommendations: [
      'System operating within normal parameters',
      'Continue regular monitoring',
      'No immediate action required'
    ]
  }
});

export const fallbackApiService = {
  getSystemHealth: async (): Promise<SystemHealth> => {
    console.warn('Using fallback system health data');
    return getStaticSystemHealth();
  },

  getSystemMetrics: async () => {
    console.warn('Using fallback system metrics');
    return getStaticSystemMetrics();
  },

  getCurrentSensorData: async () => {
    console.warn('Using fallback sensor data');
    return getStaticSensorData();
  },

  getRecentAlerts: async (hours: number = 24, limit: number = 20) => {
    console.warn('Using fallback alerts data');
    return getStaticAlerts().slice(0, limit);
  },

  getCurrentMLPredictions: async () => {
    console.warn('Using fallback ML predictions data');
    return getStaticMLPredictions();
  }
};