'use client';

import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { realtimeService } from '@/services/realtime';

export default function TestPage() {
  const [apiData, setApiData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Test API
    const fetchData = async () => {
      try {
        console.log('Fetching system health data...');
        const data = await apiService.getSystemHealth();
        console.log('API data received:', data);
        setApiData(data);
      } catch (error) {
        console.error('API error:', error);
        setApiError(error instanceof Error ? error.message : String(error));
      }
    };

    fetchData();

    // Test Realtime
    const handleAlert = (alert: any) => {
      console.log('Realtime alert received:', alert);
      setRealtimeEvents(prev => [...prev, { type: 'alert', data: alert, time: new Date().toISOString() }]);
    };

    const handleSystemUpdate = (systemData: any) => {
      console.log('Realtime system update received:', systemData);
      setRealtimeEvents(prev => [...prev, { type: 'system_update', data: systemData, time: new Date().toISOString() }]);
    };

    // Check connection status
    const checkConnection = () => {
      setIsConnected(realtimeService.isSocketConnected());
    };

    // Set up event listeners
    realtimeService.on('new_alert', handleAlert);
    realtimeService.on('system_status_update', handleSystemUpdate);

    // Check connection periodically
    const interval = setInterval(checkConnection, 2000);
    checkConnection(); // Initial check

    return () => {
      realtimeService.off('new_alert', handleAlert);
      realtimeService.off('system_status_update', handleSystemUpdate);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">API and Realtime Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">API Test</h2>
        {apiError ? (
          <div className="p-4 bg-red-100 text-red-800 rounded">
            <p className="font-bold">Error:</p>
            <p>{apiError}</p>
          </div>
        ) : apiData ? (
          <div className="p-4 bg-green-100 text-green-800 rounded">
            <p className="font-bold">API Data:</p>
            <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(apiData, null, 2)}</pre>
          </div>
        ) : (
          <div className="p-4 bg-blue-100 text-blue-800 rounded">Loading API data...</div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Realtime Events</h2>
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <span className={`h-2 w-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {realtimeEvents.length === 0 ? (
          <div className="p-4 bg-blue-100 text-blue-800 rounded">
            {isConnected ? 'Waiting for realtime events...' : 'Not connected to realtime service'}
          </div>
        ) : (
          <div className="space-y-4">
            {realtimeEvents.map((event, index) => (
              <div key={index} className="p-4 bg-purple-100 text-purple-800 rounded">
                <p className="font-bold">{event.type} at {new Date(event.time).toLocaleTimeString()}</p>
                <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(event.data, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}