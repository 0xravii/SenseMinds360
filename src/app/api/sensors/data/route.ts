import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock sensor data with realistic values
    const sensorData = {
      dht_temp_c: 31.2,
      dht_humidity: 80.5,
      co2_ppm: 420,
      tvoc_ppb: 0,
      light_lux: 950,
      distance_cm: 125,
      thermal_ambient_temp_c: 30.8,
      thermal_object_temp_c: 32.1,
      thermal_max_temp_c: 35.4,
      thermal_min_temp_c: 28.9,
      thermal_avg_temp_c: 31.7,
      thermal_center_temp_c: 31.9,
      air_quality_index: 45,
      pressure_hpa: 1013.25,
      altitude_m: 150.2,
      uv_index: 3.2,
      sound_level_db: 42.1,
      vibration_level: 0.02,
      motion_detected: false,
      battery_level: 87,
      signal_strength: -65,
      last_reading: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: sensorData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sensors data API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sensor data' },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}