import { Alert, LogEntry, SystemStatus, AlertSeverity, AlertType, LogLevel, ServiceHealthStatus, SystemHealth } from '@/types';
import { io, Socket } from 'socket.io-client';

const REALTIME_WS_URL = process.env.NEXT_PUBLIC_REALTIME_WS_URL || 'ws://34.28.155.240:7000';

type RealtimeEvent = 
  | { type: 'new_alert'; payload: Alert }
  | { type: 'alert_update'; payload: Alert }
  | { type: 'new_log'; payload: LogEntry }
  | { type: 'system_status_update'; payload: SystemHealth };

class RealtimeService {
  private listeners: {
    [key: string]: ((payload: Alert | LogEntry | SystemHealth) => void)[];
  } = {};

  private isConnected = false;
  private socket: Socket | null = null;

  constructor() {
    this.socket = io(REALTIME_WS_URL);
    
    this.socket.on('connect', () => {
      console.log('Connected to realtime server');
      this.isConnected = true;
    });
    
    this.socket.on('sensor_update', (data) => {
      this.emit('system_status_update', data);
    });
    
    this.socket.on('ml_analysis', (data) => {
      this.emit('system_status_update', data);
    });
    
    this.socket.on('fire_alert', (data) => {
      this.emit('new_alert', data);
    });
    
    this.socket.on('connect_error', () => {
      console.warn('WebSocket connection unavailable');
      this.isConnected = false;
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      this.isConnected = false;
    });
  }

  on(eventType: 'new_alert', listener: (payload: Alert) => void): void;
  on(eventType: 'alert_update', listener: (payload: Alert) => void): void;
  on(eventType: 'new_log', listener: (payload: LogEntry) => void): void;
  on(eventType: 'system_status_update', listener: (payload: SystemHealth) => void): void;
  on<T extends Alert | LogEntry | SystemHealth>(
    eventType: string,
    listener: (payload: T) => void
  ): void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(listener as (payload: Alert | LogEntry | SystemHealth) => void);
  }

  off(eventType: 'new_alert', listener: (payload: Alert) => void): void;
  off(eventType: 'alert_update', listener: (payload: Alert) => void): void;
  off(eventType: 'new_log', listener: (payload: LogEntry) => void): void;
  off(eventType: 'system_status_update', listener: (payload: SystemHealth) => void): void;
  off<T extends Alert | LogEntry | SystemHealth>(
    eventType: string,
    listener: (payload: T) => void
  ): void {
    if (!this.listeners[eventType]) {
      return;
    }
    this.listeners[eventType] = this.listeners[eventType].filter(
      (l) => l !== listener
    );
  }

  private emit(eventType: string, payload: Alert | LogEntry | SystemHealth): void {
    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach((listener) => listener(payload));
    }
  }



  disconnect(): void {
    if (this.socket) {
      // Leave alerts room before disconnecting
      this.socket.emit('leave_alerts');
      this.socket.disconnect();
    }
    this.isConnected = false;
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const realtimeService = new RealtimeService();