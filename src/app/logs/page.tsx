// src/app/logs/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { LogEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { realtimeService } from '@/services/realtime';

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    apiService.getLogs().then(setLogs);

    const logListener = (newLog: LogEntry) => {
      setLogs((prev) => [newLog, ...prev]);
    };

    realtimeService.on('new_log', logListener);

    return () => {
      realtimeService.off('new_log', logListener);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100vh-200px)]">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-text-secondary">No log entries.</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-md bg-surface-secondary text-sm"
                  >
                    <span className="font-semibold mr-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={`font-mono ${
                        log.level === 'error' ? 'text-red-500' :
                        log.level === 'warn' ? 'text-yellow-500' :
                        'text-text-primary'
                      }`}>
                      [{log.level.toUpperCase()}] 
                    </span>
                    <span className="text-text-secondary">{log.source}: </span>
                    <span>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}