import { Alert, SystemHealth, AlertSeverity, AlertType } from '@/types';

// Mock data generators
const generateMockSystemHealth = (): SystemHealth => ({
  status: 'healthy',
  services: {
    api: 'healthy',
    database: 'healthy',
    websocket: 'healthy'
  },
  uptime: Math.floor(Math.random() * 86400) + 3600,
  lastCheck: new Date().toISOString()
});

const generateMockSystemMetrics = () => ({
  cpuUsage: Math.floor(Math.random() * 30) + 20,
  memoryUsage: Math.floor(Math.random() * 20) + 60,
  memoryUsageMB: Math.floor(Math.random() * 2000) + 4000,
  servicesHealthy: 8,
  servicesTotal: 8,
  uptime: Math.floor(Math.random() * 86400) + 3600
});

const generateMockSensorData = () => ({
  timestamp: new Date().toISOString(),
  readings: {
    temperature: 25.5 + Math.random() * 5,
    humidity: 45 + Math.random() * 10,
    smoke_level: 0.1 + Math.random() * 0.3,
    co_level: 15 + Math.random() * 5,
    heat_index: 28 + Math.random() * 3
  }
});

const generateMockAlerts = (): Alert[] => [
  {
    id: 'mock-1',
    title: 'Temperature Alert',
    severity: 'medium' as AlertSeverity,
    type: 'sensor' as AlertType,
    message: 'Temperature sensor reading above normal range',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    acknowledged: false
  }
];

export const fallbackApiService = {
  getSystemHealth: async (): Promise<SystemHealth> => {
    console.warn('Using fallback system health data');
    return generateMockSystemHealth();
  },

  getSystemMetrics: async () => {
    console.warn('Using fallback system metrics');
    return generateMockSystemMetrics();
  },

  getCurrentSensorData: async () => {
    console.warn('Using fallback sensor data');
    return generateMockSensorData();
  },

  getRecentAlerts: async (hours: number = 24, limit: number = 20) => {
    console.warn('Using fallback alerts data');
    return generateMockAlerts().slice(0, limit);
  }
};