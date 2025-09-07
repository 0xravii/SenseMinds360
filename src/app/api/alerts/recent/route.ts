import { NextRequest, NextResponse } from 'next/server';

interface Alert {
  id: string;
  type: 'fire' | 'gas' | 'temperature' | 'humidity' | 'system' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  location?: string;
  sensor_id?: string;
  acknowledged: boolean;
  resolved: boolean;
  metadata?: Record<string, any>;
}

interface AlertsResponse {
  alerts: Alert[];
  total_count: number;
  unresolved_count: number;
  critical_count: number;
  timestamp: string;
}

// Mock alerts generator
function generateMockAlerts(): Alert[] {
  const alertTypes = ['fire', 'gas', 'temperature', 'humidity', 'system', 'security'] as const;
  const severities = ['low', 'medium', 'high', 'critical'] as const;
  
  const mockAlerts: Alert[] = [];
  
  // Generate 3-8 random alerts
  const alertCount = Math.floor(Math.random() * 6) + 3;
  
  for (let i = 0; i < alertCount; i++) {
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
    
    let title = '';
    let message = '';
    
    switch (type) {
      case 'fire':
        title = 'Fire Risk Detected';
        message = 'Elevated temperature and smoke levels detected in Room A';
        break;
      case 'gas':
        title = 'Gas Level Warning';
        message = 'CO2 levels above normal threshold';
        break;
      case 'temperature':
        title = 'Temperature Alert';
        message = 'Temperature outside normal operating range';
        break;
      case 'humidity':
        title = 'Humidity Warning';
        message = 'Humidity levels may affect equipment performance';
        break;
      case 'system':
        title = 'System Alert';
        message = 'Sensor connectivity issue detected';
        break;
      case 'security':
        title = 'Security Alert';
        message = 'Unauthorized access attempt detected';
        break;
    }
    
    mockAlerts.push({
      id: `alert_${Date.now()}_${i}`,
      type,
      severity,
      title,
      message,
      timestamp,
      location: 'Room A',
      sensor_id: `sensor_${Math.floor(Math.random() * 10) + 1}`,
      acknowledged: Math.random() > 0.7,
      resolved: Math.random() > 0.8,
      metadata: {
        source: 'iot_sensor',
        confidence: Math.round(Math.random() * 100),
        auto_generated: true
      }
    });
  }
  
  // Sort by timestamp (newest first)
  return mockAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const unresolved_only = searchParams.get('unresolved_only') === 'true';
    
    // Generate mock alerts
    let alerts = generateMockAlerts();
    
    // Apply filters
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }
    
    if (unresolved_only) {
      alerts = alerts.filter(alert => !alert.resolved);
    }
    
    // Apply pagination
    const totalCount = alerts.length;
    const paginatedAlerts = alerts.slice(offset, offset + limit);
    
    const unresolvedCount = alerts.filter(alert => !alert.resolved).length;
    const criticalCount = alerts.filter(alert => alert.severity === 'critical').length;
    
    const response: AlertsResponse = {
      alerts: paginatedAlerts,
      total_count: totalCount,
      unresolved_count: unresolvedCount,
      critical_count: criticalCount,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// Health check for this endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

// Create new alert (for testing purposes)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.type || !body.severity || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, severity, title, message' },
        { status: 400 }
      );
    }
    
    const newAlert: Alert = {
      id: `alert_${Date.now()}`,
      type: body.type,
      severity: body.severity,
      title: body.title,
      message: body.message,
      timestamp: new Date().toISOString(),
      location: body.location || 'Unknown',
      sensor_id: body.sensor_id,
      acknowledged: false,
      resolved: false,
      metadata: body.metadata || {}
    };
    
    // In a real application, you would save this to your database
    console.log('New alert created:', newAlert);
    
    return NextResponse.json(newAlert, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}