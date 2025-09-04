import { Alert, LogEntry, SystemStatus, AlertSeverity, AlertType, LogLevel, ServiceHealthStatus, SystemHealth } from '@/types';
import { io, Socket } from 'socket.io-client';

const REALTIME_WS_URL = process.env.NEXT_PUBLIC_REALTIME_WS_URL || 'http://34.121.143.178:5000';

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
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;

  constructor() {
    console.log('REALTIME_WS_URL:', REALTIME_WS_URL);
    console.log('Connecting to real WebSocket server...');
    this.connectSocketIO();
  }
  
  private connectSocketIO() {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.warn('Max WebSocket connection attempts reached, using mock data mode');
      this.simulateMockEvents();
      return;
    }

    this.connectionAttempts++;
    
    try {
      this.socket = io(REALTIME_WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000, // 10 second timeout
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 2,
        forceNew: true
      });
      
      this.socket.on('connect', () => {
        console.log('✅ Connected to realtime server');
        this.isConnected = true;
        this.connectionAttempts = 0; // Reset on successful connection
      });
      
      this.socket.on('message', (data) => {
        console.log('Socket.IO message received:', data);
          
        // Handle the correct events from the API documentation
        if (data.event === 'connect') {
          console.log('Socket.IO connected with ID:', data.sid);
        } else if (data.event === 'disconnect') {
          console.log('Socket.IO disconnected');
          this.isConnected = false;
        } else if (data.event === 'fire_alert') {
          console.log('Alert received:', data.data);
          this.emit('new_alert', data.data);
        } else if (data.event === 'sensor_update') {
          console.log('Sensor update received:', data.data);
          this.emit('system_status_update', data.data);
        } else {
          // Handle any other events
          console.log('Unknown event received:', data);
        }
      });
      
      this.socket.on('connect_error', (error) => {
        console.warn('⚠️ WebSocket connection unavailable, using fallback mode');
        this.isConnected = false;
        // Don't log full error details to reduce console noise
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          this.simulateMockEvents();
        }
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.isConnected = false;
        
        // Only attempt manual reconnection for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'transport close') {
          console.log('Server initiated disconnect - attempting reconnection...');
          setTimeout(() => {
            if (!this.isConnected) {
              console.log('Attempting to reconnect Socket.IO...');
              this.connectSocketIO();
            }
          }, 5000);
        } else {
          console.log('Client initiated disconnect or network error - relying on auto-reconnection');
        }
      });
    } catch (error) {
      console.error('Error connecting to Socket.IO:', error);
      // Set a flag to indicate connection failed
      this.isConnected = false;
      console.warn('Socket.IO connection failed - this is expected if the remote WebSocket server is not running');
    }
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

  private simulateMockEvents(): void {
    console.log('Starting mock event simulation...');
    // Simulate periodic mock events when WebSocket is unavailable
    setInterval(() => {
      if (!this.isConnected) {
        // Simulate mock alerts or system updates
        console.log('Simulating mock events (WebSocket unavailable)');
      }
    }, 30000); // Every 30 seconds
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.isConnected = false;
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const realtimeService = new RealtimeService();