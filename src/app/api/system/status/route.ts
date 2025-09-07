import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock system status data
    const systemStatus = {
      status: 'active',
      uptime: '99.9%',
      lastUpdate: new Date().toISOString(),
      services: {
        database: 'healthy',
        api: 'healthy',
        sensors: 'healthy',
        ml: 'healthy'
      },
      performance: {
        cpu: 23,
        memory: 67,
        disk: 45
      }
    };

    return NextResponse.json({
      success: true,
      data: systemStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('System status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system status' },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}