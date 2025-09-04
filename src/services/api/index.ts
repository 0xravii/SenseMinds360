

import { Alert, LogEntry, User, Incident, SystemStatus, AlertSeverity, AlertType, LogLevel, ServiceHealthStatus, SystemHealth } from '@/types';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.28.155.240/api/v1';


// Response types for API endpoints
export interface SystemHealthResponse {
  data: SystemHealth;
  status: string;
  details: Record<string, any>;
}

interface SystemInfo {
  version: string;
  environment: string;
  uptime: number;
}

interface SensorData {
  timestamp: string;
  readings: Record<string, number>;
}

interface MLPrediction {
  timestamp: string;
  predictions: Record<string, any>;
  confidence: number;
}

interface Pattern {
  id: string;
  type: string;
  description: string;
  confidence: number;
}

interface PatternStatistics {
  total: number;
  byType: Record<string, number>;
  timeDistribution: Record<string, number>;
}

interface PipelineStatus {
  status: string;
  progress: number;
  currentStep: string;
  errors: string[];
}

interface PipelineNotification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface PipelineHistory {
  executions: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    result: string;
  }>;
}

interface EmailAlert {
  id: string;
  recipient: string;
  subject: string;
  sentAt: string;
  status: string;
}

interface ShapValue {
  feature: string;
  value: number;
  impact: number;
}

interface DashboardAnalytics {
  metrics: Record<string, number>;
  trends: Record<string, any[]>;
  insights: string[];
}

interface ChatSession {
  id: string;
  startTime: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
}

// Base API client
const apiClient = {
  get: async <TResponse>(path: string): Promise<TResponse> => {
    try {
      console.log(`API Request: GET ${API_BASE_URL}${path}`);
      const response = await fetch(`${API_BASE_URL}${path}`);
      console.log(`API Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorMessage = response.status === 404 ? 'Endpoint not found' :
                           response.status === 405 ? 'Method not allowed - check if correct HTTP method is used' :
                           response.status === 500 ? 'Server error - please try again later' :
                           response.statusText || 'Unknown error';
        throw new Error(`API error: ${response.status} - ${errorMessage}`);
      }
      
      const data = await response.json();
      console.log(`API Response Data:`, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch from ${path}:`, error);
      
      // In development, allow mock data fallback
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        console.warn('Using mock data for development');
        return null as TResponse;
      }
      
      throw error;
    }
  },

  post: async <TResponse, TData>(path: string, data: TData): Promise<TResponse> => {
    try {
      console.log(`API Request: POST ${API_BASE_URL}${path}`, data);
      
      // Handle FormData differently from JSON data
      const isFormData = data instanceof FormData;
      const requestOptions: RequestInit = {
        method: 'POST',
        body: isFormData ? data : JSON.stringify(data),
      };
      
      // Only set Content-Type for JSON, let browser set it for FormData
      if (!isFormData) {
        requestOptions.headers = { 'Content-Type': 'application/json' };
      }
      
      const response = await fetch(`${API_BASE_URL}${path}`, requestOptions);
      console.log(`API Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorMessage = response.status === 404 ? 'Endpoint not found' :
                           response.status === 405 ? 'Method not allowed - check if correct HTTP method is used' :
                           response.status === 400 ? 'Bad request - check request body format' :
                           response.status === 500 ? 'Server error - please try again later' :
                           response.statusText || 'Unknown error';
        throw new Error(`API error: ${response.status} - ${errorMessage}`);
      }
      
      const result = await response.json();
      console.log(`API Response Data:`, result);
      return result;
    } catch (error) {
      console.error(`Failed to post to ${path}:`, error);
      throw error;
    }
  },
};




import { supabase } from '@/lib/supabase';

export const apiService = {
  // System endpoints
  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await apiClient.get<SystemHealthResponse>('/system/health');
    return response.data;
  },

  getSystemMetrics: async (): Promise<{ cpuUsage: number; memoryUsage: number; servicesHealthy: number; servicesTotal: number; uptime: number; memoryUsageMB: number }> => {
    try {
      const response = await fetch('http://34.28.155.240/metrics');
      const text = await response.text();
      
      // Parse metrics from Prometheus format
      const lines = text.split('\n');
      const metrics = {
        cpuUsage: 0, // CPU usage percentage (0% as no CPU metric available)
        memoryUsage: 0, // Memory usage percentage
        memoryUsageMB: 0, // Memory usage in MB
        servicesHealthy: 0,
        servicesTotal: 0,
        uptime: 0
      };
      
      lines.forEach(line => {
        if (line.startsWith('senseminds_services_healthy')) {
          metrics.servicesHealthy = parseInt(line.split(' ')[1]);
        } else if (line.startsWith('senseminds_services_total')) {
          metrics.servicesTotal = parseInt(line.split(' ')[1]);
        } else if (line.startsWith('senseminds_memory_usage_mb')) {
          metrics.memoryUsageMB = parseFloat(line.split(' ')[1]);
          // Calculate memory usage percentage (assuming 8GB total system memory)
          metrics.memoryUsage = Math.round((metrics.memoryUsageMB / 8192) * 100);
        } else if (line.startsWith('senseminds_uptime_seconds')) {
          metrics.uptime = parseFloat(line.split(' ')[1]);
        }
      });
      
      return metrics;
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        memoryUsageMB: 0,
        servicesHealthy: 8,
        servicesTotal: 8,
        uptime: 0
      };
    }
  },

  getSystemHealthCheck: async (): Promise<any> => {
    return apiClient.get<any>('/system/healthcheck');
  },

  getSystemInfo: async (): Promise<SystemInfo> => {
    return apiClient.get<SystemInfo>('/system/info');
  },

  // Sensor endpoints
  getCurrentSensorData: () => apiClient.get<SensorData>('/sensors/current'),
  getSensorHistory: (hours: number) => apiClient.get<SensorData[]>(`/sensors/history/${hours}`),

  // ML endpoints
  getCurrentMLPredictions: () => apiClient.get<MLPrediction>('/ml/current'),
  getMLHistory: (hours: number) => apiClient.get<MLPrediction[]>(`/ml/history/${hours}`),

  // Pattern endpoints
  getCurrentPatterns: () => apiClient.get<Pattern[]>('/patterns/current'),
  getPatternStatistics: () => apiClient.get<PatternStatistics>('/patterns/statistics'),

  // Pipeline endpoints
  executePipeline: (config: any) => apiClient.post<any, any>('/pipeline/execute', config),
  getPipelineStatus: () => apiClient.get<PipelineStatus>('/pipeline/status'),
  getPipelineNotifications: () => apiClient.get<PipelineNotification[]>('/pipeline/notifications'),
  getPipelineHistory: () => apiClient.get<PipelineHistory>('/pipeline/history'),

  // Alert endpoints
  getAlerts: async (hours: number = 24, limit: number = 20): Promise<Alert[]> => {
    const response = await apiClient.get<any>(`/alerts/email-alerts?hours=${hours}&limit=${limit}`);
    return response.data?.email_alerts || [];
  },
  getRecentAlerts: async (hours: number = 24, limit: number = 20): Promise<any> => {
    const response = await apiClient.get<any>(`/alerts/recent?hours=${hours}&limit=${limit}`);
    return response.data; // Returns the full response including data.alerts, status, message
  },
  getAlertsHistory: async (days: number = 7): Promise<Alert[]> => {
    return apiClient.get<Alert[]>(`/alerts/history?days=${days}`);
  },

  // SHAP endpoints
  getCurrentShapValues: () => apiClient.get<ShapValue[]>('/shap/current'),
  getShapHistory: () => apiClient.get<ShapValue[]>('/shap/history'),

  // Analytics endpoints
  getDashboardAnalytics: () => apiClient.get<DashboardAnalytics>('/analytics/dashboard'),
  getTrends: (hours: number) => apiClient.get<any>(`/analytics/trends/${hours}`),

  // Chat endpoints
  sendChatQuery: (message: string, sessionId: string = 'demo') => apiClient.post<any, { message: string, session_id: string }>('/chat/text', { message, session_id: sessionId }),
  sendVoiceMessage: (formData: FormData) => apiClient.post<any, FormData>('/chat/voice', formData),
  createChatSession: () => apiClient.post<ChatSession, {}>('/chat/sessions', {}),
  getChatHistory: (sessionId: string) => apiClient.get<any>(`/chat/sessions/${sessionId}/history`),
  generateTTS: async (text: string, lang: string = 'en-IN', voice: string = 'default') => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      return audioBlob;
    } catch (error) {
      console.error('TTS generation failed:', error);
      throw error;
    }
  },

  // Test endpoints
  testVoiceService: () => apiClient.get<any>('/test/voice'),
  testServices: () => apiClient.get<any>('/test/services'),

  // Documentation
  getDocs: () => apiClient.get<any>('/docs'),
  
  // Health check endpoints
  getHealth: () => apiClient.get<any>('/health'),
  getReady: () => apiClient.get<any>('/ready'),
  getMetrics: () => apiClient.get<any>('/metrics'),

  // Log endpoints
  getLogs: async (): Promise<LogEntry[]> => {
    try {
      return await apiClient.get<LogEntry[]>('/logs');
    } catch (error) {
      console.warn('Failed to fetch logs, using mock data:', error);
      return [
        {
          id: 'log-1',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'info',
          message: 'System health check completed',
          source: 'health-monitor'
        },
        {
          id: 'log-2',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          level: 'warn',
          message: 'High temperature detected in zone 3',
          source: 'sensor-monitor'
        },
        {
          id: 'log-3',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          level: 'error',
          message: 'Connection timeout to external service',
          source: 'api-gateway'
        },
        {
          id: 'log-4',
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          level: 'info',
          message: 'Alert processing completed',
          source: 'alert-processor'
        },
        {
          id: 'log-5',
          timestamp: new Date(Date.now() - 1500000).toISOString(),
          level: 'debug',
          message: 'Background task executed successfully',
          source: 'scheduler'
        }
      ];
    }
  },
};

export const supabaseService = {
  getSensorData: async () => {
    const { data, error } = await supabase
      .from('sensors')
      .select('*');

    if (error) {
      console.error('Error fetching sensor data from Supabase:', error);
      throw error;
    }
    return data;
  },
};