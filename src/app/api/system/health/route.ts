import { NextRequest, NextResponse } from 'next/server';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  components: {
    database: ComponentStatus;
    api_server: ComponentStatus;
    ml_engine: ComponentStatus;
    sensor_network: ComponentStatus;
    alert_system: ComponentStatus;
  };
  metrics: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_latency: number;
    active_connections: number;
  };
  last_updated: string;
}

interface ComponentStatus {
  status: 'operational' | 'degraded' | 'offline';
  response_time_ms: number;
  last_check: string;
  message?: string;
}

// Static system health data generator
function getStaticSystemHealth(): SystemHealth {
  const now = new Date().toISOString();
  
  // Static realistic metrics
  const cpuUsage = 45.2;
  const memoryUsage = 62.8;
  const diskUsage = 28.5;
  const networkLatency = 25.3;
  const activeConnections = 87;
  
  // Static component statuses
  const components = {
    database: {
      status: 'operational' as const,
      response_time_ms: 12.5,
      last_check: now,
      message: 'All database operations normal'
    },
    api_server: {
      status: 'operational' as const,
      response_time_ms: 5.2,
      last_check: now,
      message: 'API server responding normally'
    },
    ml_engine: {
      status: 'operational' as const,
      response_time_ms: 125.8,
      last_check: now,
      message: 'ML predictions processing normally'
    },
    sensor_network: {
      status: 'operational' as const,
      response_time_ms: 245.3,
      last_check: now,
      message: 'All sensors reporting data'
    },
    alert_system: {
      status: 'operational' as const,
      response_time_ms: 18.7,
      last_check: now,
      message: 'Alert notifications active'
    }
  };
  
  // Determine overall system status
  const hasOffline = Object.values(components).some(comp => comp.status === 'offline');
  const hasDegraded = Object.values(components).some(comp => comp.status === 'degraded');
  const highResourceUsage = cpuUsage > 80 || memoryUsage > 85 || diskUsage > 90;
  
  let overallStatus: 'healthy' | 'degraded' | 'critical';
  if (hasOffline || highResourceUsage) {
    overallStatus = 'critical';
  } else if (hasDegraded || cpuUsage > 70 || memoryUsage > 75) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }
  
  return {
    status: overallStatus,
    timestamp: now,
    uptime: 432000, // 5 days uptime in seconds
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    components,
    metrics: {
      cpu_usage: cpuUsage,
      memory_usage: memoryUsage,
      disk_usage: diskUsage,
      network_latency: networkLatency,
      active_connections: activeConnections
    },
    last_updated: now
  };
}

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would fetch actual system metrics
    // from monitoring tools like Prometheus, New Relic, DataDog, etc.
    const systemHealth = getStaticSystemHealth();
    
    // Set appropriate HTTP status based on system health
    const statusCode = systemHealth.status === 'healthy' ? 200 :
                      systemHealth.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(systemHealth, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    
    const errorResponse: SystemHealth = {
      status: 'critical',
      timestamp: new Date().toISOString(),
      uptime: 0,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      components: {
        database: { status: 'offline', response_time_ms: 0, last_check: new Date().toISOString(), message: 'Health check failed' },
        api_server: { status: 'offline', response_time_ms: 0, last_check: new Date().toISOString(), message: 'Health check failed' },
        ml_engine: { status: 'offline', response_time_ms: 0, last_check: new Date().toISOString(), message: 'Health check failed' },
        sensor_network: { status: 'offline', response_time_ms: 0, last_check: new Date().toISOString(), message: 'Health check failed' },
        alert_system: { status: 'offline', response_time_ms: 0, last_check: new Date().toISOString(), message: 'Health check failed' }
      },
      metrics: {
        cpu_usage: 0,
        memory_usage: 0,
        disk_usage: 0,
        network_latency: 0,
        active_connections: 0
      },
      last_updated: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 503 });
  }
}

// Health check for this endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}