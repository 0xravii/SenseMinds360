

import { Alert, LogEntry, User, Incident, SystemStatus, AlertSeverity, AlertType, LogLevel, ServiceHealthStatus, SystemHealth } from '@/types';
import { fallbackApiService } from './fallback-api';


// SenseMinds 360 API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';


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
    try {
      const response = await apiClient.get<SystemHealthResponse>('/system/health');
      return response.data;
    } catch (error) {
      console.warn('Primary API unavailable, using fallback for system health');
      return await fallbackApiService.getSystemHealth();
    }
  },

  getSystemMetrics: async (): Promise<{ cpuUsage: number; memoryUsage: number; servicesHealthy: number; servicesTotal: number; uptime: number; memoryUsageMB: number }> => {
    try {
      // Use local system health endpoint to get metrics
      const response = await apiClient.get<any>('/system/health');
      
      if (response && response.metrics) {
        const metrics = {
          cpuUsage: response.metrics.cpu_usage || 0,
          memoryUsage: response.metrics.memory_usage || 0,
          memoryUsageMB: (response.metrics.memory_usage * 8192) / 100 || 0, // Convert percentage to MB
          servicesHealthy: Object.values(response.components || {}).filter((comp: any) => comp.status === 'operational').length,
          servicesTotal: Object.keys(response.components || {}).length,
          uptime: response.uptime || 0
        };
        return metrics;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.warn('Primary metrics API unavailable, using fallback');
      return await fallbackApiService.getSystemMetrics();
    }
  },

  getSystemHealthCheck: async (): Promise<any> => {
    return apiClient.get<any>('/system/healthcheck');
  },

  getSystemInfo: async (): Promise<SystemInfo> => {
    return apiClient.get<SystemInfo>('/system/info');
  },

  // Sensor endpoints
  getCurrentSensorData: async () => {
    try {
      return await apiClient.get<SensorData>('/sensors/current');
    } catch (error) {
      console.warn('Primary API unavailable, using fallback for sensor data');
      return await fallbackApiService.getCurrentSensorData();
    }
  },
  getSensorHistory: (hours: number) => apiClient.get<SensorData[]>(`/sensors/history/${hours}`),

  // ML endpoints
  getCurrentMLPredictions: async () => {
    try {
      return await apiClient.get<MLPrediction>('/ml/current');
    } catch (error) {
      console.warn('Primary API unavailable, using fallback for ML predictions');
      return await fallbackApiService.getCurrentMLPredictions();
    }
  },
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
    const response = await apiClient.get<any>(`/alerts/email?hours=${hours}&limit=${limit}`);
    return response.data?.email_alerts || [];
  },
  getRecentAlerts: async (hours: number = 24, limit: number = 20): Promise<Alert[]> => {
    try {
      const response = await apiClient.get<Alert[]>(`/alerts/recent?hours=${hours}&limit=${limit}`);
      return response;
    } catch (error) {
      console.warn('Primary API unavailable, using fallback for recent alerts');
      return await fallbackApiService.getRecentAlerts(hours, limit);
    }
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
  sendChatQuery: (message: string, sessionId: string = 'demo') => apiClient.post<any, { message: string, session_id: string }>('/chatbot/text', { message, session_id: sessionId }),
  sendVoiceMessage: (formData: FormData) => apiClient.post<any, FormData>('/chatbot/voice', formData),
  createChatSession: () => apiClient.post<ChatSession, {}>('/chatbot/sessions', {}),
  getChatHistory: (sessionId: string) => apiClient.get<any>(`/chatbot/sessions/${sessionId}/history`),
  generateTTS: async (text: string, lang: string = 'en-IN', voice: string = 'default') => {
    try {
      // Import audio cache service dynamically to avoid circular dependencies
      const { audioCacheService } = await import('@/services/audiocache');
      
      // Check cache first
      const cachedAudio = await audioCacheService.getCachedAudio(text, lang);
      if (cachedAudio) {
        return cachedAudio;
      }
      
      console.log('Generating TTS for:', text.substring(0, 50), 'Language:', lang);
      const response = await fetch(`${API_BASE_URL}/chat/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text, 
          lang, 
          voice 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status} - ${response.statusText}`);
      }
      
      const audioBlob = await response.blob();
      
      // Cache the audio for future use
      try {
        await audioCacheService.cacheAudio(text, lang, audioBlob);
      } catch (cacheError) {
        console.warn('Failed to cache audio:', cacheError);
        // Don't fail the request if caching fails
      }
      
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
    return apiClient.get<LogEntry[]>('/logs');
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