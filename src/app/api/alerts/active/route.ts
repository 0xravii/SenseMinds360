import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock alerts data
    const alerts = {
      active_alerts: [],
      alert_count: 0,
      last_alert: null,
      system_status: 'normal',
      emergency_level: 'low',
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      recent_events: [
        {
          id: '1',
          type: 'info',
          message: 'System health check completed',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          severity: 'low'
        },
        {
          id: '2',
          type: 'warning',
          message: 'Sensor calibration due in 7 days',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          severity: 'medium'
        }
      ],
      thresholds: {
        temperature: { min: 15, max: 35 },
        humidity: { min: 30, max: 70 },
        co2: { max: 1000 },
        tvoc: { max: 500 }
      }
    };

    return NextResponse.json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts data' },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}