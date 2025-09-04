// src/components/dashboard/DashboardCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type DashboardCardProps = {
  title: string;
  value: string | number;
  unit?: string;
  status?: 'NORMAL' | 'HEALTHY' | 'ONLINE' | 'CRITICAL' | 'WARNING';
  description?: string;
  icon?: React.ReactNode;
};

export function DashboardCard({
  title,
  value,
  unit,
  status,
  description,
  icon,
}: DashboardCardProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'NORMAL':
      case 'HEALTHY':
      case 'ONLINE':
        return {
          borderColor: 'var(--ok)',
          bgColor: 'var(--ok-bg)',
          textColor: 'var(--ok)',
        };
      case 'CRITICAL':
        return {
          borderColor: 'var(--status-critical)',
          bgColor: 'var(--critical-bg, #FEF2F2)',
          textColor: 'var(--status-critical)',
        };
      case 'WARNING':
        return {
          borderColor: 'var(--status-warning)',
          bgColor: 'var(--warn-bg, #FFFBEB)',
          textColor: 'var(--status-warning)',
        };
      default:
        return {
          borderColor: 'transparent',
          bgColor: 'transparent',
          textColor: 'var(--text-muted)',
        };
    }
  };

  const { borderColor, bgColor, textColor } = getStatusStyles();
  const showStatusIndicator = status !== undefined;

  return (
    <Card className={cn(
      "relative overflow-hidden",
      showStatusIndicator && "border-l-4"
    )} 
    style={{ borderLeftColor: showStatusIndicator ? borderColor : undefined }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{title}</CardTitle>
        <div className="text-[var(--text-muted)]">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold [font-variant-numeric:tabular-nums]">
          {value}
          {unit && <span className="ml-1 text-sm font-normal text-[var(--text-muted)]">{unit}</span>}
        </div>
        {status && (
          <div 
            className="mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ 
              backgroundColor: bgColor,
              color: textColor
            }}
          >
            {status}
          </div>
        )}
        {description && <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>}
      </CardContent>
    </Card>
  );
}