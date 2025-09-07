'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  Ruler,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface SensorReading {
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastUpdate: string;
}

const sensorConfigs = {
  temperature: {
    name: 'Temperature',
    icon: Thermometer,
    color: 'red',
    unit: '°C',
    normalRange: [18, 28],
    warningRange: [15, 30]
  },
  humidity: {
    name: 'Humidity',
    icon: Droplets,
    color: 'blue',
    unit: '%',
    normalRange: [30, 60],
    warningRange: [20, 70]
  },
  co2: {
    name: 'CO₂ Level',
    icon: Wind,
    color: 'green',
    unit: 'ppm',
    normalRange: [300, 800],
    warningRange: [250, 1000]
  },
  tvoc: {
    name: 'TVOC',
    icon: Wind,
    color: 'purple',
    unit: 'ppb',
    normalRange: [0, 200],
    warningRange: [0, 300]
  },
  light: {
    name: 'Light Level',
    icon: Sun,
    color: 'yellow',
    unit: 'lux',
    normalRange: [200, 1000],
    warningRange: [100, 1500]
  },
  distance: {
    name: 'Distance',
    icon: Ruler,
    color: 'indigo',
    unit: 'cm',
    normalRange: [50, 200],
    warningRange: [20, 300]
  }
};

export default function SensorWidget() {
  const searchParams = useSearchParams();
  const sensorType = searchParams.get('type') || 'temperature';
  const theme = searchParams.get('theme') || 'dark';
  const compact = searchParams.get('compact') === 'true';
  
  const [reading, setReading] = useState<SensorReading>({
    value: 0,
    unit: '',
    status: 'normal',
    trend: 'stable',
    lastUpdate: new Date().toLocaleTimeString()
  });
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<number[]>([]);

  const config = sensorConfigs[sensorType as keyof typeof sensorConfigs] || sensorConfigs.temperature;
  const IconComponent = config.icon;

  const fetchSensorValue = async (type: string): Promise<number> => {
    try {
      const response = await fetch('/api/sensors/current');
      if (!response.ok) throw new Error('Failed to fetch sensor data');
      
      const data = await response.json();
      const sensor = data.sensors?.find((s: any) => s.type === type);
      
      if (sensor) {
        return sensor.value;
      }
      
      // Fallback values if sensor not found
      switch (type) {
        case 'temperature': return 24.5;
        case 'humidity': return 50;
        case 'co2': return 450;
        case 'tvoc': return 150;
        case 'light': return 750;
        case 'distance': return 125;
        default: return 0;
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      // Fallback values on error
      switch (type) {
        case 'temperature': return 24.5;
        case 'humidity': return 50;
        case 'co2': return 450;
        case 'tvoc': return 150;
        case 'light': return 750;
        case 'distance': return 125;
        default: return 0;
      }
    }
  };

  const getStatus = (value: number): 'normal' | 'warning' | 'critical' => {
    const [normalMin, normalMax] = config.normalRange;
    const [warningMin, warningMax] = config.warningRange;
    
    if (value < warningMin || value > warningMax) return 'critical';
    if (value < normalMin || value > normalMax) return 'warning';
    return 'normal';
  };

  const getTrend = (currentValue: number, previousValues: number[]): 'up' | 'down' | 'stable' => {
    if (previousValues.length < 2) return 'stable';
    
    const recent = previousValues.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    
    if (currentValue > avg + 1) return 'up';
    if (currentValue < avg - 1) return 'down';
    return 'stable';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const newValue = await fetchSensorValue(sensorType);
        const newHistory = [...history, newValue].slice(-10); // Keep last 10 readings
        
        setReading({
          value: newValue,
          unit: config.unit,
          status: getStatus(newValue),
          trend: getTrend(newValue, history),
          lastUpdate: new Date().toLocaleTimeString()
        });
        
        setHistory(newHistory);
        setIsOnline(true);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setIsOnline(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [sensorType, history, config]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-400 border-red-500/50 bg-red-500/10';
      case 'warning': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
      default: return 'text-green-400 border-green-500/50 bg-green-500/10';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  const getColorClasses = (color: string, theme: string) => {
    const colors = {
      red: theme === 'dark' ? 'bg-red-600/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-600',
      blue: theme === 'dark' ? 'bg-blue-600/10 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-600',
      green: theme === 'dark' ? 'bg-green-600/10 border-green-500/30 text-green-300' : 'bg-green-50 border-green-200 text-green-600',
      purple: theme === 'dark' ? 'bg-purple-600/10 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-600',
      yellow: theme === 'dark' ? 'bg-yellow-600/10 border-yellow-500/30 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-600',
      indigo: theme === 'dark' ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
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
        <Card className={getColorClasses(config.color, theme)}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-semibold">{config.name}</span>
              </div>
              {isOnline ? (
                <Wifi className="w-3 h-3 text-green-500" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-500" />
              )}
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {reading.value.toFixed(sensorType === 'humidity' || sensorType === 'co2' || sensorType === 'tvoc' || sensorType === 'light' || sensorType === 'distance' ? 0 : 1)}
                <span className="text-sm ml-1">{reading.unit}</span>
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className={`text-xs ${getStatusColor(reading.status)}`}>
                  {reading.status}
                </Badge>
                <span className="text-xs">{getTrendIcon(reading.trend)}</span>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-600/30">
              <p className="text-xs text-gray-400 text-center">{reading.lastUpdate}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-purple-50 to-gray-50 text-gray-900'}`}>
      <div className="max-w-sm mx-auto">
        <Card className={getColorClasses(config.color, theme)}>
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">{config.name}</h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Live Sensor Data</p>
                </div>
              </div>
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
            </div>

            {/* Main Reading */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold mb-2">
                {reading.value.toFixed(sensorType === 'humidity' || sensorType === 'co2' || sensorType === 'tvoc' || sensorType === 'light' || sensorType === 'distance' ? 0 : 1)}
                <span className="text-lg ml-2">{reading.unit}</span>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <Badge variant="outline" className={`${getStatusColor(reading.status)} px-3 py-1`}>
                  {reading.status.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1">
                  <span className="text-lg">{getTrendIcon(reading.trend)}</span>
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {reading.trend}
                  </span>
                </div>
              </div>
            </div>

            {/* Range Information */}
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} mb-4`}>
              <h3 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Normal Range</h3>
              <div className="flex justify-between text-sm">
                <span>{config.normalRange[0]} {config.unit}</span>
                <span>to</span>
                <span>{config.normalRange[1]} {config.unit}</span>
              </div>
            </div>

            {/* Mini History Chart */}
            {history.length > 1 && (
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} mb-4`}>
                <h3 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Recent Trend</h3>
                <div className="flex items-end justify-between h-8 gap-1">
                  {history.slice(-8).map((value, index) => {
                    const height = Math.max(10, (value / Math.max(...history)) * 100);
                    return (
                      <div
                        key={index}
                        className={`bg-current opacity-60 rounded-t`}
                        style={{ height: `${height}%`, width: '10px' }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-600/30">
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Last updated: {reading.lastUpdate}
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                Auto-refresh every 30 seconds
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}