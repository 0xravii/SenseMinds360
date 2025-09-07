'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  AlertTriangle, 
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface SensorData {
  temperature: number;
  humidity: number;
  co2: number;
  tvoc: number;
  light: number;
  distance: number;
  alerts: number;
  status: 'normal' | 'warning' | 'critical';
  lastUpdate: string;
}

export default function DashboardWidget() {
  const searchParams = useSearchParams();
  const compact = searchParams.get('compact') === 'true';
  const theme = searchParams.get('theme') || 'dark';
  
  const [data, setData] = useState<SensorData>({
    temperature: 23.5,
    humidity: 45,
    co2: 420,
    tvoc: 150,
    light: 750,
    distance: 125,
    alerts: 2,
    status: 'normal',
    lastUpdate: new Date().toLocaleTimeString()
  });
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch real sensor data
        const [sensorResponse, alertsResponse] = await Promise.all([
          fetch('/api/sensors/current'),
          fetch('/api/alerts/recent')
        ]);
        
        if (!sensorResponse.ok || !alertsResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const sensorData = await sensorResponse.json();
        const alertsData = await alertsResponse.json();
        
        // Extract sensor values
        const sensors = sensorData.sensors || [];
        const tempSensor = sensors.find((s: any) => s.type === 'temperature');
        const humiditySensor = sensors.find((s: any) => s.type === 'humidity');
        const co2Sensor = sensors.find((s: any) => s.type === 'co2');
        const tvocSensor = sensors.find((s: any) => s.type === 'tvoc');
        const lightSensor = sensors.find((s: any) => s.type === 'light');
        const distanceSensor = sensors.find((s: any) => s.type === 'distance');
        
        const warningCount = sensorData.summary?.warning_count || 0;
        const criticalCount = sensorData.summary?.critical_count || 0;
        const totalAlerts = warningCount + criticalCount;
        
        setData({
          temperature: tempSensor?.value || 24.5,
          humidity: humiditySensor?.value || 50,
          co2: co2Sensor?.value || 450,
          tvoc: tvocSensor?.value || 150,
          light: lightSensor?.value || 750,
          distance: distanceSensor?.value || 125,
          alerts: totalAlerts,
          status: criticalCount > 0 ? 'critical' : (warningCount > 0 ? 'warning' : 'normal'),
          lastUpdate: new Date().toLocaleTimeString()
        });
        setIsOnline(true);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setIsOnline(false);
        // Set fallback data on error
        setData(prev => ({
          ...prev,
          lastUpdate: new Date().toLocaleTimeString()
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-400 border-red-500/50';
      case 'warning': return 'text-yellow-400 border-yellow-500/50';
      default: return 'text-green-400 border-green-500/50';
    }
  };

  const getSensorStatus = (value: number, type: string) => {
    switch (type) {
      case 'temperature':
        if (value > 30 || value < 15) return 'critical';
        if (value > 28 || value < 18) return 'warning';
        return 'normal';
      case 'humidity':
        if (value > 70 || value < 20) return 'critical';
        if (value > 60 || value < 30) return 'warning';
        return 'normal';
      case 'co2':
        if (value > 1000) return 'critical';
        if (value > 800) return 'warning';
        return 'normal';
      default:
        return 'normal';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`min-h-screen p-2 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <Card className={`${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'} backdrop-blur-sm`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <h1 className="text-sm font-bold">SenseMinds 360</h1>
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-green-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-500" />
                )}
                <Badge variant="outline" className={`text-xs ${getStatusColor(data.status)}`}>
                  {data.status}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Thermometer className={`w-3 h-3 ${getSensorStatus(data.temperature, 'temperature') === 'normal' ? 'text-blue-400' : 'text-red-400'}`} />
                <span className="text-xs font-medium">{data.temperature.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className={`w-3 h-3 ${getSensorStatus(data.humidity, 'humidity') === 'normal' ? 'text-blue-400' : 'text-yellow-400'}`} />
                <span className="text-xs font-medium">{data.humidity.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className={`w-3 h-3 ${getSensorStatus(data.co2, 'co2') === 'normal' ? 'text-green-400' : 'text-orange-400'}`} />
                <span className="text-xs font-medium">{data.co2.toFixed(0)} ppm</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-3 h-3 ${data.alerts > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
                <span className="text-xs font-medium">{data.alerts} alerts</span>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-600/30">
              <p className="text-xs text-gray-400">Updated: {data.lastUpdate}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-purple-50 to-gray-50 text-gray-900'}`}>
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-6 h-6 text-purple-500" />
            <h1 className="text-xl font-bold">SenseMinds 360</h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <Badge variant="outline" className={getStatusColor(data.status)}>
              System {data.status}
            </Badge>
          </div>
        </div>

        {/* Sensor Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Temperature */}
          <Card className={`${theme === 'dark' ? 'bg-red-600/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>Temperature</p>
                  <p className="text-lg font-bold">{data.temperature.toFixed(1)}°C</p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs mt-1 ${
                      getSensorStatus(data.temperature, 'temperature') === 'normal' 
                        ? 'border-green-500/50 text-green-400' 
                        : 'border-red-500/50 text-red-400'
                    }`}
                  >
                    {getSensorStatus(data.temperature, 'temperature')}
                  </Badge>
                </div>
                <Thermometer className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          {/* Humidity */}
          <Card className={`${theme === 'dark' ? 'bg-blue-600/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>Humidity</p>
                  <p className="text-lg font-bold">{data.humidity.toFixed(0)}%</p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs mt-1 ${
                      getSensorStatus(data.humidity, 'humidity') === 'normal' 
                        ? 'border-green-500/50 text-green-400' 
                        : 'border-yellow-500/50 text-yellow-400'
                    }`}
                  >
                    {getSensorStatus(data.humidity, 'humidity')}
                  </Badge>
                </div>
                <Droplets className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          {/* CO2 */}
          <Card className={`${theme === 'dark' ? 'bg-green-600/10 border-green-500/30' : 'bg-green-50 border-green-200'}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>CO₂ Level</p>
                  <p className="text-lg font-bold">{data.co2.toFixed(0)}</p>
                  <p className="text-xs text-gray-400">ppm</p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs mt-1 ${
                      getSensorStatus(data.co2, 'co2') === 'normal' 
                        ? 'border-green-500/50 text-green-400' 
                        : 'border-orange-500/50 text-orange-400'
                    }`}
                  >
                    {getSensorStatus(data.co2, 'co2')}
                  </Badge>
                </div>
                <Wind className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className={`${theme === 'dark' ? 'bg-yellow-600/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-600'}`}>Active Alerts</p>
                  <p className="text-lg font-bold">{data.alerts}</p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs mt-1 ${
                      data.alerts === 0 
                        ? 'border-green-500/50 text-green-400' 
                        : 'border-yellow-500/50 text-yellow-400'
                    }`}
                  >
                    {data.alerts === 0 ? 'All Clear' : 'Active'}
                  </Badge>
                </div>
                <AlertTriangle className={`w-8 h-8 ${data.alerts > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Last updated: {data.lastUpdate}
          </p>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
            Auto-refresh every 30 seconds
          </p>
        </div>
      </div>
    </div>
  );
}