'use client';

import { useEffect, useState } from 'react';
import { AlertsPanel } from '@/components/alerts/AlertsPanel';
import { EmergencyButton } from '@/components/emergency/EmergencyButton';
import { AssistantDock } from '@/components/assistant/AssistantDock';
import { apiService } from '@/services/api';
import { realtimeService } from '@/services/realtime';
import { Alert } from '@/types';
import { SystemHealth } from '@/types';
import {
  Activity, Users, Flame, TrendingUp, Zap, Brain,
  AlertTriangle, Thermometer, Droplets, Wind, CheckCircle2, CircleAlert,
  Sparkles, Gauge, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis,
  RadialBarChart, RadialBar, PolarAngleAxis, Line
} from 'recharts';

export default function Home() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemHealth | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [sensorData, setSensorData] = useState<any>(null);
  const [mlPredictions, setMlPredictions] = useState<any>(null);

  useEffect(() => {
    // Fetch initial data
    apiService.getRecentAlerts().then(response => {
      console.log('Alerts response:', response);
      if (response?.data?.alerts && Array.isArray(response.data.alerts)) {
        setAlerts(response.data.alerts);
      } else {
        setAlerts([]);
      }
    }).catch(error => {
      console.error('Failed to fetch alerts:', error);
      // Use mock data as fallback
      setAlerts([
        {
          id: '1',
          title: 'High Temperature Alert',
          message: 'Temperature sensor reading above threshold',
          severity: 'high' as const,
          type: 'sensor' as const,
          timestamp: new Date().toISOString(),
          acknowledged: false
        }
      ]);
    });

    apiService.getSystemHealth().then(response => {
      console.log('System Health response:', response);
      setSystemStatus(response);
    }).catch(error => {
      console.error('Failed to fetch system status:', error);
      // Use mock data as fallback
      setSystemStatus({
        status: 'HEALTHY',
        services: {
          database: 'healthy' as const,
          api: 'healthy' as const,
          websocket: 'degraded' as const
        },
        uptime: 86400,
        lastCheck: new Date().toISOString()
      });
    });

    apiService.getCurrentSensorData().then(response => {
      console.log('Sensor Data response:', response);
      setSensorData(response);
    }).catch(error => {
      console.error('Failed to fetch sensor data:', error);
      // Use mock data as fallback
      setSensorData({
        data: {
          dht_temp_c: '22.5',
          dht_humidity_pct: '45.2',
          co2_ppm: '420',
          tvoc_ppb: '15',
          light_adc: '512',
          ultrasonic_cm: '150'
        }
      });
    });

    apiService.getCurrentMLPredictions().then(response => {
      console.log('ML Predictions response:', response);
      setMlPredictions(response);
    }).catch(error => {
      console.error('Failed to fetch ML predictions:', error);
      // Use mock data as fallback
      setMlPredictions({
        data: {
          fire_risk_score: 25,
          fire_risk_level: 'LOW',
          confidence: 0.85,
          anomaly_score: 0.12,
          processing_time: 45,
          model_version: 'v2.1'
        }
      });
    });

    apiService.getSystemMetrics().then(response => {
      console.log('System Metrics response:', response);
      setSystemMetrics(response);
    }).catch(error => {
      console.error('Failed to fetch system metrics:', error);
      // Use mock data as fallback
      setSystemMetrics({
        cpuUsage: 35,
        memoryUsage: 68,
        memoryUsageMB: 2048,
        diskUsage: 45,
        networkLatency: 12
      });
    });

    // Realtime events (names unchanged)
    const newAlertListener = (newAlert: Alert) => {
      console.log('New Alert received:', newAlert);
      setAlerts((prev) => [newAlert, ...prev]);
    };
    const alertUpdateListener = (updatedAlert: Alert) => {
      console.log('Alert Update received:', updatedAlert);
      setAlerts((prev) => prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a)));
    };
    const systemStatusListener = (st: SystemHealth) => {
      console.log('System Status Update received:', st);
      setSystemStatus(st);
    };

    realtimeService.on('new_alert', newAlertListener);
    realtimeService.on('alert_update', alertUpdateListener);
    realtimeService.on('system_status_update', systemStatusListener);

    return () => {
      realtimeService.off('new_alert', newAlertListener);
      realtimeService.off('alert_update', alertUpdateListener);
      realtimeService.off('system_status_update', systemStatusListener);
    };
  }, []);

  const handleEmergency = () => {
    alert('Emergency triggered!');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': case 'normal': case 'healthy': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'critical': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const statusPill = (label?: string) => {
    const s = (label || 'unknown').toLowerCase();
    const map: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
      normal:   { bg: 'bg-[rgba(34,197,94,0.12)]', text: 'text-[#98F7B1]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
      healthy:  { bg: 'bg-[rgba(34,197,94,0.12)]', text: 'text-[#98F7B1]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
      online:   { bg: 'bg-[rgba(34,197,94,0.12)]', text: 'text-[#98F7B1]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
      warning:  { bg: 'bg-[rgba(245,158,11,0.14)]', text: 'text-[#FDE68A]', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
      critical: { bg: 'bg-[rgba(239,68,68,0.14)]', text: 'text-[#FCA5A5]', icon: <CircleAlert className="h-3.5 w-3.5" /> },
      unknown:  { bg: 'bg-slate-500/10', text: 'text-slate-300', icon: <Activity className="h-3.5 w-3.5" /> },
    };
    const { bg, text, icon } = map[s] || map.unknown;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${bg} ${text} backdrop-blur-sm`}>
        {icon}
        <span className="uppercase tracking-wider font-medium">{(label || 'Unknown')}</span>
      </span>
    );
  };

  const generateMockChartData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      time: new Date(Date.now() - (11 - i) * 3600000).toLocaleTimeString('en-US', { hour: '2-digit' }),
      temperature: Math.floor(Math.random() * 10) + 20,
      humidity: Math.floor(Math.random() * 20) + 40,
    }));
  };

  const [chartData] = useState(generateMockChartData());

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, when: "beforeChildren" } },
  };
  
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } as const },
  };

  const isLoadingSensors = !sensorData;
  const isLoadingML = !mlPredictions;
  const isLoadingSystem = !systemStatus;

  const fireRiskScore = Math.round(parseFloat((mlPredictions?.data?.fire_risk_score || mlPredictions?.fire_risk_score || 0).toString()));
  const fireRiskData = [{
    name: 'Risk', value: fireRiskScore,
    fill: fireRiskScore > 70 ? '#EF4444' : fireRiskScore > 40 ? '#F59E0B' : '#22C55E'
  }];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const [theme, setTheme] = useState('dark');
  
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0B0F19] text-[#E6EDF3]' : 'bg-gray-50 text-gray-900'
    }`}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="fixed top-4 right-4 z-50 p-3 rounded-full bg-gray-200 dark:bg-gray-800 shadow-lg transition-all duration-300 hover:scale-110"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        {/* Subtle sparkle effect */}
        <div className="sparkle-container fixed inset-0 pointer-events-none z-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="sparkle"
            style={{
              left: `${(i * 6.66) + 5}%`,
              top: `${((i * 7) % 80) + 10}%`,
              width: `${2 + (i % 3)}px`,
              height: `${1 + (i % 2)}px`,
              animationDelay: `${(i * 0.2)}s`
            }}
          />
        ))}
      </div>
      
      <div className="h-[3px] bg-gradient-to-r from-[#8B5CF6] to-[#F59E0B]" />
      
      {/* Mobile Navigation Arrows - Standardized Sizing */}
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 lg:hidden flex items-center gap-1 sm:gap-2 bg-[#1A1F2E]/90 backdrop-blur-sm border border-[#3B82F6]/30 rounded-full px-2 sm:px-4 py-1 sm:py-2 shadow-lg">
        <button 
          onClick={() => scrollToSection('temperature-section')}
          className="bg-[#3B82F6]/90 hover:bg-[#3B82F6] text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-200"
          title="Go to Temperature"
        >
          <Thermometer className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <button 
          onClick={() => scrollToSection('alerts-section')}
          className="bg-[#F59E0B]/90 hover:bg-[#F59E0B] text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-200"
          title="Go to Alerts"
        >
          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <button 
          onClick={() => scrollToSection('sensors-section')}
          className="bg-[#10B981]/90 hover:bg-[#10B981] text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-200"
          title="Go to Sensors"
        >
          <Gauge className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>

      <div className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8">
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <img 
                src="/logo.png" 
                alt="SenseMinds 360 Logo" 
                className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 object-contain"
              />
              <div>
                <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#F59E0B] bg-clip-text text-transparent leading-tight">
                  SenseMinds 360
                </h1>
                <p className="text-[#9CA3AF] mt-1 text-sm sm:text-base">Unified Intelligence for Real-World Infrastructure</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {statusPill(systemStatus?.status || 'NORMAL')}
              {statusPill(mlPredictions?.data?.fire_risk_level || mlPredictions?.fire_risk_level || 'LOW')}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs bg-[#8B5CF6]/10 text-[#A78BFA] backdrop-blur-sm">
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> 
                <span className="uppercase tracking-wider font-medium">Secure</span>
              </span>
            </div>
          </div>
        </motion.header>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <Card className="glass glow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400"></span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF] text-xs uppercase tracking-wide">AI System Status</span>
                    <div className="text-emerald-300 font-semibold">Active</div>
                  </div>
                </div>
                <Brain className="w-5 h-5 text-[#8B5CF6]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          variants={container} 
          initial="hidden" 
          animate="show" 
          className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 lg:gap-6"
        >
          <motion.div variants={item} className="md:col-span-6 lg:col-span-4 xl:col-span-3 space-y-4 sm:space-y-5 lg:space-y-6">
            <Card className="glass glow">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#9CA3AF] text-xs uppercase tracking-wide">Fire Risk Assessment</h3>
                  <Flame className="w-5 h-5 text-[#F59E0B]" />
                </div>
                {isLoadingML ? (
                  <div className="animate-pulse space-y-3"><div className="h-32 w-32 mx-auto bg-[#2C3144] rounded-full" /><div className="h-4 w-24 mx-auto bg-[#2C3144] rounded" /></div>
                ) : (
                  <>
                    <div className="relative h-40 w-40 mx-auto mb-4 ai-insights-box">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={fireRiskData}>
                          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                          <RadialBar dataKey="value" cornerRadius={10} fill={fireRiskData[0].fill} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                           <div className="text-5xl font-bold text-[var(--text-primary)] key-field-display">{fireRiskScore}%</div>
                           <div className="text-xs text-[var(--text-secondary)]">Risk Score</div>
                         </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                        ${fireRiskScore > 70 ? 'bg-[rgba(239,68,68,0.14)] text-[#FCA5A5]' :
                          fireRiskScore > 40 ? 'bg-[rgba(245,158,11,0.14)] text-[#FDE68A]' :
                          'bg-[rgba(34,197,94,0.12)] text-[#98F7B1]'}`}>
                        <Gauge className="w-4 h-4" />
                        {mlPredictions?.data?.fire_risk_level || mlPredictions?.fire_risk_level || 'LOW'} RISK
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="glass glow p-4 sm:p-5 lg:p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[var(--text-secondary)] text-xs uppercase tracking-wide">System Health</h3>
                <Activity className={`w-5 h-5 ${getStatusColor(systemStatus?.status || 'NORMAL')}`} />
              </div>
              {isLoadingSystem ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-8 w-32 bg-[#2C3144] rounded"></div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-[#2C3144] rounded"></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`text-3xl font-bold mb-4 ${getStatusColor(systemStatus?.status || 'NORMAL')}`}>{systemStatus?.status || 'HEALTHY'}</div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--text-secondary)]">Memory</span>
                        <span className="text-[var(--text-primary)] metric temperature-display">
                          {systemMetrics?.memoryUsage || 0}% ({Math.round(systemMetrics?.memoryUsageMB || 0)} MB)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${systemMetrics?.memoryUsage || 0}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} className={`h-full rounded-full ${(systemMetrics?.memoryUsage || 0) >= 90 ? 'bg-[#EF4444]' : (systemMetrics?.memoryUsage || 0) >= 70 ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'}`} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          <motion.div variants={item} className="md:col-span-6 lg:col-span-5 xl:col-span-6 space-y-4 sm:space-y-5 lg:space-y-6">
            <Card id="temperature-section" className="glass glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#9CA3AF] text-xs uppercase tracking-wide flex items-center justify-between">
                  <span>Environmental Trends</span>
                  <div className="flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B5CF6] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#8B5CF6]"></span></span><span className="text-[10px] text-[#9CA3AF]">LIVE</span></div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs><linearGradient id="areaViolet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.55} /><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                      <XAxis dataKey="time" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#0B0F19', border: '1px solid #23263B', borderRadius: '12px', color: '#E6EDF3' }} labelStyle={{ color: '#9CA3AF' }} />
                      <Area type="monotone" dataKey="temperature" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#areaViolet)" />
                      <Line type="monotone" dataKey="humidity" stroke="#FDE68A" strokeWidth={2} strokeDasharray="6 6" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 sm:gap-6 mt-3 sm:mt-4">
                  <div className="flex items-center gap-1.5 sm:gap-2"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#8B5CF6]" /><span className="text-[10px] sm:text-xs text-[var(--text-secondary)]">Temperature</span></div>
                  <div className="flex items-center gap-1.5 sm:gap-2"><div className="w-2.5 h-0.5 sm:w-3 sm:h-0.5" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #FDE68A 0, #FDE68A 6px, transparent 6px, transparent 12px)' }} /><span className="text-[10px] sm:text-xs text-[var(--text-secondary)]">Humidity</span></div>
                </div>
              </CardContent>
            </Card>
            <div id="sensors-section" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
              {[
                { title: 'Temperature', value: sensorData?.data?.dht_temp_c ? Math.round(parseFloat(sensorData.data.dht_temp_c)) : '0', unit: '°C', icon: Thermometer, accent: '#EF4444' },
                { title: 'Humidity', value: sensorData?.data?.dht_humidity_pct ? Math.round(parseFloat(sensorData.data.dht_humidity_pct)) : '0', unit: '%', icon: Droplets, accent: '#60A5FA' },
                { title: 'CO₂', value: sensorData?.data?.co2_ppm ? Math.round(parseFloat(sensorData.data.co2_ppm)) : '0', unit: 'ppm', icon: Wind, accent: '#22C55E' },
                { title: 'TVOC', value: sensorData?.data?.tvoc_ppb ? Math.round(parseFloat(sensorData.data.tvoc_ppb)) : '0', unit: 'ppb', icon: Zap, accent: '#8B5CF6' },
                { title: 'Light', value: sensorData?.data?.light_adc ? Math.round(parseFloat(sensorData.data.light_adc)) : '0', unit: 'ADC', icon: Activity, accent: '#F59E0B' },
                { title: 'Distance', value: sensorData?.data?.ultrasonic_cm ? Math.round(parseFloat(sensorData.data.ultrasonic_cm)) : '0', unit: 'cm', icon: Users, accent: '#EC4899' },
              ].map((sensor) => (
                <motion.div key={sensor.title} variants={item} whileHover={{ y: -2, transition: { type: 'spring', stiffness: 300 } }} whileTap={{ scale: 0.98 }}>
                  <Card className="glass glow h-full">
                    <CardContent className="p-3 sm:p-4">
                      {isLoadingSensors ? (
                      <div className="animate-pulse space-y-2"><div className="h-5 w-5 rounded bg-[var(--border-color)]" /><div className="h-7 w-16 bg-[var(--border-color)] rounded" /><div className="h-3 w-20 bg-[var(--border-color)] rounded" /></div>
                    ) : (
                        <>
                          <div className="flex items-center justify-between mb-2"><sensor.icon className="w-4 h-4" style={{ color: sensor.accent }} /><span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{sensor.unit}</span></div>
                           <div className="font-bold text-[var(--text-primary)] metric temperature-display">{sensor.value}</div>
                     <div className="text-xs sm:text-sm text-[var(--text-secondary)] uppercase tracking-wide mt-1">{sensor.title}</div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div id="alerts-section" variants={item} className="md:col-span-12 lg:col-span-3 xl:col-span-3 space-y-4 sm:space-y-5 lg:space-y-6">
            <div className="glass glow border-2 border-[#F59E0B]/30 bg-[#1A1F2E]/90 rounded-2xl p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#FDE68A] text-xs uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FDE68A]" />Active Alerts
                </h3>
                <span className="text-[10px] bg-[#F59E0B]/20 text-[#FDE68A] px-2 py-1 rounded-full font-medium">{alerts.length}</span>
              </div>
              <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                <AlertsPanel alerts={alerts} />
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <div className="bg-gradient-to-r from-[#EF4444]/20 to-[#DC2626]/20 border-2 border-[#EF4444]/50 rounded-2xl p-1">
                <EmergencyButton onClick={handleEmergency} />
              </div>
            </motion.div>
            <Card className="glass glow h-[400px] sm:h-[450px] lg:h-[500px]"><AssistantDock /></Card>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
          <div className="glass glow rounded-2xl">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#9CA3AF] text-xs uppercase tracking-wide flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#8B5CF6]" />AI Insights & Predictions
                </h3>
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" /><span className="text-[10px] text-[#A78BFA]">Processing</span>
                </motion.div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { title: 'Confidence', value: mlPredictions?.data?.confidence ? Math.round(parseFloat(mlPredictions.data.confidence)) : '0', unit: '%', icon: Brain, color: 'text-[#60A5FA]' },
                  { title: 'Anomaly Score', value: mlPredictions?.data?.anomaly_score ? parseFloat(mlPredictions.data.anomaly_score).toFixed(2) : '0', unit: '', icon: AlertTriangle, color: 'text-[#F59E0B]' },
                  { title: 'Processing Time', value: mlPredictions?.data?.processing_time ? Math.round(parseFloat(mlPredictions.data.processing_time)) : '0', unit: 'ms', icon: Zap, color: 'text-[#22C55E]' },
                  { title: 'Model Version', value: mlPredictions?.data?.model_version ?? 'v2.1', unit: '', icon: Sparkles, color: 'text-[#8B5CF6]' },
                ].map((metric, index) => (
                  <motion.div key={metric.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index }} whileHover={{ y: -2 }}>
                    <div className="text-center p-3 sm:p-4 rounded-[14px] bg-[var(--glass-bg)] border border-[var(--border-color)] hover:border-[#8B5CF6]/30 transition-all ai-insights-box">
                      {isLoadingML ? (
                    <div className="animate-pulse space-y-2"><div className="h-8 w-8 mx-auto bg-[var(--border-color)] rounded-full" /><div className="h-8 w-20 mx-auto bg-[var(--border-color)] rounded" /><div className="h-3 w-full bg-[var(--border-color)] rounded" /></div>
                  ) : (
                        <>
                          <metric.icon className={`w-6 h-6 mx-auto mb-2 ${metric.color}`} />
                          <div className="font-bold text-[var(--text-primary)] metric key-field-display">{metric.value}{metric.unit}</div>
                         <div className="text-xs sm:text-sm text-[var(--text-secondary)] uppercase tracking-wide mt-1">{metric.title}</div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        :root {
          --bg-primary: #0B0F19;
          --bg-secondary: #1A1F2E;
          --text-primary: #E6EDF3;
          --text-secondary: #9CA3AF;
          --border-color: rgba(255, 255, 255, 0.05);
          --glass-bg: rgba(18, 19, 28, 0.95);
          --shadow-color: rgba(0, 0, 0, 0.4);
        }

        .light {
          --bg-primary: #f8fafc;
          --bg-secondary: #e2e8f0;
          --text-primary: #1e293b;
          --text-secondary: #64748b;
          --border-color: rgba(0, 0, 0, 0.1);
          --glass-bg: rgba(248, 250, 252, 0.9);
          --shadow-color: rgba(0, 0, 0, 0.1);
        }

        body {
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .glass { 
          background: var(--glass-bg); 
          backdrop-filter: blur(8px); 
          border: 1px solid var(--border-color); 
          border-radius: 20px; 
          box-shadow: 0 14px 40px -18px var(--shadow-color);
          transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        .glow:hover { 
          box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.4), 0 20px 44px -20px var(--shadow-color); 
          border-color: rgba(139, 92, 246, 0.5); 
          transition: all 0.2s ease; 
        }
        
        .metric { font-variant-numeric: tabular-nums lining-nums; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--text-secondary); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--border-color); }
        :where(button, a, input, [role='button']):focus-visible { outline: none; box-shadow: 0 0 0 2px #A78BFA, 0 0 0 4px var(--shadow-color); border-radius: 12px; }
        
        @media (max-width: 768px) {
          .text-xs { font-size: 0.75rem; }
          .text-sm { font-size: 0.875rem; }
          .text-lg { font-size: 1.125rem; }
        }
        
        @media (prefers-reduced-motion: reduce) { 
          *, *::before, *::after { 
            animation-duration: 0.01ms !important; 
            animation-iteration-count: 1 !important; 
            transition-duration: 0.01ms !important; 
            scroll-behavior: auto !important; 
          } 
        }
      `}</style>
    </div>
  );
}