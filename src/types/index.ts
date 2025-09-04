// src/types/index.ts

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'fire' | 'medical' | 'crime' | 'natural_disaster' | 'sensor' | 'other';

export type Alert = {
  id: string;
  title: string;
  timestamp: string;
  location?: string;
  severity: AlertSeverity;
  type: AlertType;
  description?: string;
  message?: string;
  status?: 'new' | 'acknowledged' | 'resolved' | 'false_alarm';
  acknowledged?: boolean;
  assignedTo?: string;
};

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
};

export type User = {
  id: string;
  username: string;
  role: 'admin' | 'dispatcher' | 'first_responder';
  status: 'active' | 'inactive' | 'on_duty' | 'off_duty';
  currentLocation?: string;
};

export type Incident = {
  id: string;
  timestamp: string;
  type: string;
  location: string;
  status: 'active' | 'resolved' | 'archived';
  alerts: Alert[];
  assignedUsers: User[];
  notes: string[];
};

export type SystemStatus = {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkTraffic: number;
  serviceHealth: {
    [key: string]: ServiceHealthStatus;
  };
};

export type ServiceHealthStatus = 'operational' | 'degraded' | 'offline' | 'healthy';

export type SystemHealth = {
  status: 'ONLINE' | 'NORMAL' | 'HEALTHY' | 'CRITICAL' | 'WARNING' | 'healthy';
  services: {
    database: ServiceHealthStatus;
    api: ServiceHealthStatus;
    websocket: ServiceHealthStatus;
  };
  uptime: number;
  lastCheck: string;
};