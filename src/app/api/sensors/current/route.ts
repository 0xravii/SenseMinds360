import { NextRequest, NextResponse } from 'next/server';

interface SensorReading {
  id: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  location?: string;
  status: 'normal' | 'warning' | 'critical';
}

interface SensorData {
  timestamp: string;
  sensors: SensorReading[];
  summary: {
    total_sensors: number;
    active_sensors: number;
    warning_count: number;
    critical_count: number;
  };
}

// Cache for consistent data
let cachedSensorData: SensorData | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Mock sensor data generator
function generateMockSensorData(): SensorData {
  const now = new Date().toISOString();
  
  const sensors: SensorReading[] = [
    {
      id: 'temp_001',
      type: 'temperature',
      value: Math.round((20 + Math.random() * 15) * 100) / 100,
      unit: '°C',
      timestamp: now,
      location: 'Room A',
      status: 'normal'
    },
    {
      id: 'hum_001',
      type: 'humidity',
      value: Math.round((40 + Math.random() * 30) * 100) / 100,
      unit: '%',
      timestamp: now,
      location: 'Room A',
      status: 'normal'
    },
    {
      id: 'co2_001',
      type: 'co2',
      value: Math.round((400 + Math.random() * 200) * 100) / 100,
      unit: 'ppm',
      timestamp: now,
      location: 'Room A',
      status: Math.random() > 0.8 ? 'warning' : 'normal'
    },
    {
      id: 'tvoc_001',
      type: 'tvoc',
      value: Math.round((10 + Math.random() * 50) * 100) / 100,
      unit: 'ppb',
      timestamp: now,
      location: 'Room A',
      status: 'normal'
    },
    {
      id: 'light_001',
      type: 'light',
      value: Math.round((200 + Math.random() * 800) * 100) / 100,
      unit: 'lux',
      timestamp: now,
      location: 'Room A',
      status: 'normal'
    },
    {
      id: 'dist_001',
      type: 'distance',
      value: Math.round((50 + Math.random() * 200) * 100) / 100,
      unit: 'cm',
      timestamp: now,
      location: 'Room A',
      status: 'normal'
    }
  ];

  const warningCount = sensors.filter(s => s.status === 'warning').length;
  const criticalCount = sensors.filter(s => s.status === 'critical').length;

  return {
    timestamp: now,
    sensors,
    summary: {
      total_sensors: sensors.length,
      active_sensors: sensors.length,
      warning_count: warningCount,
      critical_count: criticalCount
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    
    // Check if we need to refresh cached data
    if (!cachedSensorData || (now - cacheTimestamp) > CACHE_DURATION) {
      // Fetch real data from external API
      try {
        const response = await fetch('http://34.28.155.240:7000/api/v1/sensors/current');
        if (response.ok) {
          const realData = await response.json();
          
          // Transform the real data to match our expected format
           const warningCount = (realData.data.co2_ppm > 1000 ? 1 : 0) + 
                               (realData.data.thermal_max_temp_c > 40 ? 1 : 0) + 
                               (realData.data.thermal_hotspot_count > 0 ? 1 : 0);
           
           cachedSensorData = {
             timestamp: realData.timestamp || new Date().toISOString(),
             sensors: [
               // Basic Environmental Sensors
               {
                 id: 'temp_001',
                 type: 'temperature',
                 value: realData.data.dht_temp_c || 0,
                 unit: '°C',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: realData.data.dht_temp_c > 35 ? 'warning' : 'normal'
               },
               {
                 id: 'hum_001',
                 type: 'humidity',
                 value: realData.data.dht_humidity_pct || 0,
                 unit: '%',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: (realData.data.dht_humidity_pct < 30 || realData.data.dht_humidity_pct > 70) ? 'warning' : 'normal'
               },
               {
                 id: 'co2_001',
                 type: 'co2',
                 value: realData.data.co2_ppm || 0,
                 unit: 'ppm',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: realData.data.co2_ppm > 1000 ? 'warning' : 'normal'
               },
               {
                 id: 'tvoc_001',
                 type: 'tvoc',
                 value: realData.data.tvoc_ppb || 0,
                 unit: 'ppb',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: realData.data.tvoc_ppb > 500 ? 'warning' : 'normal'
               },
               {
                 id: 'light_001',
                 type: 'light',
                 value: realData.data.light_adc || 0,
                 unit: 'lux',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: 'normal'
               },
               {
                 id: 'distance_001',
                 type: 'distance',
                 value: realData.data.ultrasonic_cm || 0,
                 unit: 'cm',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: 'normal'
               },
               // Thermal Analysis Sensors
               {
                 id: 'thermal_ambient_001',
                 type: 'thermal_ambient',
                 value: realData.data.thermal_ambient_temp_c || 0,
                 unit: '°C',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: 'normal'
               },
               {
                 id: 'thermal_max_001',
                 type: 'thermal_max',
                 value: realData.data.thermal_max_temp_c || 0,
                 unit: '°C',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: realData.data.thermal_max_temp_c > 40 ? 'warning' : 'normal'
               },
               {
                 id: 'thermal_mean_001',
                 type: 'thermal_mean',
                 value: realData.data.thermal_mean_temp_c || 0,
                 unit: '°C',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: 'normal'
               },
               {
                 id: 'thermal_std_001',
                 type: 'thermal_std',
                 value: realData.data.thermal_std_temp_c || 0,
                 unit: '°C',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: 'normal'
               },
               {
                 id: 'thermal_range_001',
                 type: 'thermal_range',
                 value: realData.data.thermal_temp_range_c || 0,
                 unit: '°C',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: 'normal'
               },
               {
                 id: 'thermal_contrast_001',
                 type: 'thermal_contrast',
                 value: realData.data.thermal_contrast_ratio || 0,
                 unit: 'ratio',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: 'normal'
               },
               {
                 id: 'thermal_gradient_001',
                 type: 'thermal_gradient',
                 value: realData.data.thermal_gradient_magnitude || 0,
                 unit: '°C/px',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: 'normal'
               },
               {
                 id: 'thermal_hotspot_count_001',
                 type: 'thermal_hotspot_count',
                 value: realData.data.thermal_hotspot_count || 0,
                 unit: 'count',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: realData.data.thermal_hotspot_count > 0 ? 'warning' : 'normal'
               },
               {
                 id: 'thermal_hotspot_area_001',
                 type: 'thermal_hotspot_area',
                 value: realData.data.thermal_hotspot_area || 0,
                 unit: 'px²',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: 'normal'
               },
               {
                 id: 'thermal_hotspot_growth_001',
                 type: 'thermal_hotspot_growth',
                 value: realData.data.thermal_hotspot_growth_rate || 0,
                 unit: 'px²/s',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: 'normal'
               },
               {
                 id: 'thermal_temp_change_001',
                 type: 'thermal_temp_change',
                 value: realData.data.thermal_temp_change_rate || 0,
                 unit: '°C/s',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: 'normal'
               },
               {
                 id: 'thermal_normalized_max_001',
                 type: 'thermal_normalized_max',
                 value: realData.data.thermal_normalized_max_temp || 0,
                 unit: 'normalized',
                 timestamp: realData.timestamp || new Date().toISOString(),
                 location: 'Room A',
                 status: 'normal'
               }
             ],
             summary: {
               total_sensors: 18,
               active_sensors: 18,
               warning_count: warningCount,
               critical_count: 0
             }
           };
        } else {
          // Fallback to mock data if external API fails
          cachedSensorData = generateMockSensorData();
        }
      } catch (fetchError) {
        console.error('Failed to fetch real sensor data, using mock data:', fetchError);
        // Fallback to mock data if external API fails
        cachedSensorData = generateMockSensorData();
      }
      
      cacheTimestamp = now;
    }
    
    return NextResponse.json(cachedSensorData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sensor data' },
      { status: 500 }
    );
  }
}

// Health check for this endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}