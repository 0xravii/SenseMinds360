// src/components/alerts/AlertsPanel.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/types';
import { StatusChip } from './StatusChip';

type AlertsPanelProps = {
  alerts: Alert[];
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {alerts.length === 0 ? (
          <p className="text-text-secondary">No recent alerts.</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{alert.description}</p>
                <p className="text-sm text-text-secondary">
                  {new Date(alert.timestamp).toLocaleString()} - {alert.location}
                </p>
              </div>
              <StatusChip status={alert.severity} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}