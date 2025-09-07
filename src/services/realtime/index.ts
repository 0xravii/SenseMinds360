import { Alert, LogEntry, SystemStatus, AlertSeverity, AlertType, LogLevel, ServiceHealthStatus, SystemHealth } from '@/types';
import { io, Socket } from 'socket.io-client';
import { apiService } from '@/services/api';

const REALTIME_WS_URL = process.env.NEXT_PUBLIC_REALTIME_WS_URL || 'ws://34.28.155.240:7000';

type RealtimeEvent = 
  | { type: 'new_alert'; payload: Alert }
  | { type: 'alert_update'; payload: Alert }
  | { type: 'new_log'; payload: LogEntry }
  | { type: 'system_status_update'; payload: SystemHealth }
  | { type: 'sensor_update'; payload: any }
  | { type: 'ml_analysis'; payload: any }
  | { type: 'pattern_analysis'; payload: any }
  | { type: 'fire_alert'; payload: any }
  | { type: 'pipeline_summary'; payload: any };

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'fallback';

class RealtimeService {
  private listeners: {
    [key: string]: ((payload: any) => void)[];
  } = {};

  private connectionState: ConnectionState = 'disconnected';
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  private fallbackInterval: NodeJS.Timeout | null = null;
  private fallbackPollingRate = 15000; // 15 seconds to match pipeline cycle
  private isInitialized = false;

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    console.log('Initializing WebSocket connection to:', REALTIME_WS_URL);
    this.connectionState = 'connecting';
    
    try {
      this.socket = io(REALTIME_WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval
      });
      
      this.setupSocketListeners();
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      this.activateFallbackMode();
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.deactivateFallbackMode();
      
      // Join alerts room for fire detection events
      this.socket?.emit('join_alerts');
      this.emit('connection_status', { connected: true, mode: 'websocket' });
    });

    // Handle all WebSocket events from API documentation
    this.socket.on('sensor_update', (data) => {
      console.log('📊 Sensor update received:', data);
      this.emit('sensor_update', data);
      this.emit('system_status_update', data);
    });
    
    this.socket.on('ml_analysis', (data) => {
      console.log('🧠 ML analysis received:', data);
      this.emit('ml_analysis', data);
      this.emit('system_status_update', data);
    });

    this.socket.on('pattern_analysis', (data) => {
      console.log('🔍 Pattern analysis received:', data);
      this.emit('pattern_analysis', data);
    });

    this.socket.on('shap_result', (data) => {
      console.log('📈 SHAP analysis received:', data);
      this.emit('shap_result', data);
    });

    this.socket.on('llm_analysis', (data) => {
      console.log('💭 LLM analysis received:', data);
      this.emit('llm_analysis', data);
    });
    
    this.socket.on('fire_alert', (data) => {
      console.log('🚨 FIRE ALERT received:', data);
      this.emit('fire_alert', data);
      this.emit('new_alert', this.transformFireAlertToAlert(data));
    });

    this.socket.on('pipeline_summary', (data) => {
      console.log('⚙️ Pipeline summary received:', data);
      this.emit('pipeline_summary', data);
    });

    this.socket.on('status', (data) => {
      console.log('📡 Status update:', data.message);
      this.emit('status', data);
    });
    
    this.socket.on('connect_error', (error) => {
      console.warn('⚠️ WebSocket connection error:', error.message);
      this.handleConnectionError();
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.connectionState = 'disconnected';
      this.emit('connection_status', { connected: false, mode: 'websocket', reason });
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleConnectionError();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.deactivateFallbackMode();
    });

    this.socket.on('reconnect_error', (error) => {
      console.warn('❌ WebSocket reconnection failed:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('🔄 Max reconnection attempts reached, activating fallback mode');
        this.activateFallbackMode();
      }
    });
  }

  private handleConnectionError(): void {
    this.connectionState = 'disconnected';
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('⚠️ WebSocket connection unavailable, using fallback mode');
      this.activateFallbackMode();
    }
  }

  private activateFallbackMode(): void {
    if (this.connectionState === 'fallback') return;
    
    console.log('🔄 Activating REST API fallback mode');
    this.connectionState = 'fallback';
    this.emit('connection_status', { connected: false, mode: 'fallback' });
    
    // Start polling REST APIs for data
    this.startFallbackPolling();
  }

  private deactivateFallbackMode(): void {
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
      console.log('✅ Deactivated fallback polling mode');
    }
  }

  private startFallbackPolling(): void {
    if (this.fallbackInterval) return;
    
    console.log(`🔄 Starting fallback polling every ${this.fallbackPollingRate}ms`);
    
    // Initial fetch
    this.fetchFallbackData();
    
    // Set up interval polling
    this.fallbackInterval = setInterval(() => {
      this.fetchFallbackData();
    }, this.fallbackPollingRate);
  }

  private async fetchFallbackData(): Promise<void> {
    try {
      // Fetch data from REST APIs in parallel
      const [sensorData, mlData, systemHealth, alerts] = await Promise.allSettled([
        apiService.getCurrentSensorData(),
        apiService.getCurrentMLPredictions(),
        apiService.getSystemHealth(),
        apiService.getRecentAlerts(1, 10) // Last hour, max 10 alerts
      ]);

      // Emit sensor data
      if (sensorData.status === 'fulfilled') {
        this.emit('sensor_update', sensorData.value);
        this.emit('system_status_update', sensorData.value);
      }

      // Emit ML predictions
      if (mlData.status === 'fulfilled') {
        this.emit('ml_analysis', mlData.value);
      }

      // Emit system health
      if (systemHealth.status === 'fulfilled') {
        this.emit('system_status_update', systemHealth.value);
      }

      // Emit recent alerts
      if (alerts.status === 'fulfilled' && alerts.value.length > 0) {
        alerts.value.forEach(alert => {
          this.emit('new_alert', alert);
        });
      }

    } catch (error) {
      console.error('❌ Fallback data fetch failed:', error);
    }
  }

  private transformFireAlertToAlert(fireAlertData: any): Alert {
    return {
      id: `fire-${Date.now()}`,
      title: 'Fire Alert',
      severity: 'high' as AlertSeverity,
      type: 'fire' as AlertType,
      message: `Fire detected with ${(fireAlertData.confidence * 100).toFixed(1)}% confidence`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      metadata: fireAlertData
    };
  }

  // Event listener methods with comprehensive type support
  on(eventType: 'new_alert', listener: (payload: Alert) => void): void;
  on(eventType: 'alert_update', listener: (payload: Alert) => void): void;
  on(eventType: 'new_log', listener: (payload: LogEntry) => void): void;
  on(eventType: 'system_status_update', listener: (payload: SystemHealth) => void): void;
  on(eventType: 'sensor_update', listener: (payload: any) => void): void;
  on(eventType: 'ml_analysis', listener: (payload: any) => void): void;
  on(eventType: 'pattern_analysis', listener: (payload: any) => void): void;
  on(eventType: 'fire_alert', listener: (payload: any) => void): void;
  on(eventType: 'pipeline_summary', listener: (payload: any) => void): void;
  on(eventType: 'connection_status', listener: (payload: any) => void): void;
  on(eventType: string, listener: (payload: any) => void): void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(listener);
  }

  off(eventType: string, listener: (payload: any) => void): void {
    if (!this.listeners[eventType]) return;
    
    const index = this.listeners[eventType].indexOf(listener);
    if (index > -1) {
      this.listeners[eventType].splice(index, 1);
    }
  }

  private emit(eventType: string, payload: any): void {
    if (!this.listeners[eventType]) return;
    
    this.listeners[eventType].forEach(listener => {
      try {
        listener(payload);
      } catch (error) {
        console.error(`Error in realtime listener for ${eventType}:`, error);
      }
    });
  }

  // Connection management methods
  disconnect(): void {
    console.log('🔌 Disconnecting realtime service...');
    
    // Clean up fallback polling
    this.deactivateFallbackMode();
    
    // Disconnect WebSocket
    if (this.socket) {
      this.socket.emit('leave_alerts');
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
    this.isInitialized = false;
    
    this.emit('connection_status', { connected: false, mode: 'disconnected' });
  }

  reconnect(): void {
    console.log('🔄 Manual reconnection requested...');
    this.disconnect();
    setTimeout(() => {
      this.initializeConnection();
    }, 1000);
  }

  // Connection state getters
  get connected(): boolean {
    return this.connectionState === 'connected';
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  get isInFallbackMode(): boolean {
    return this.connectionState === 'fallback';
  }

  // Force fallback mode for testing
  forceFallbackMode(): void {
    console.log('🔧 Forcing fallback mode for testing...');
    if (this.socket) {
      this.socket.disconnect();
    }
    this.activateFallbackMode();
  }

  // Get connection statistics
  getConnectionStats(): {
    state: ConnectionState;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    fallbackActive: boolean;
    wsUrl: string;
  } {
    return {
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      fallbackActive: this.fallbackInterval !== null,
      wsUrl: REALTIME_WS_URL
    };
  }

  isSocketConnected(): boolean {
    return this.connected;
  }
}

export const realtimeService = new RealtimeService();