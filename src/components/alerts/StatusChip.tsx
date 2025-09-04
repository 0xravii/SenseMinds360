// src/components/alerts/StatusChip.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

type StatusChipProps = {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
};

export function StatusChip({ status, variant }: StatusChipProps) {
  const getStatusConfig = () => {
    const lowercaseStatus = status?.toLowerCase() || '';
    
    switch (lowercaseStatus) {
      case 'new':
      case 'active':
      case 'critical':
        return {
          bgColor: 'bg-[#EF4444]/20',
          textColor: 'text-[#FCA5A5]',
          borderColor: 'border-[#EF4444]/30',
          icon: <XCircle className="w-3 h-3" />,
          label: 'CRITICAL'
        };
      case 'acknowledged':
      case 'in_progress':
      case 'high':
      case 'warning':
        return {
          bgColor: 'bg-[#F59E0B]/20',
          textColor: 'text-[#FDE68A]',
          borderColor: 'border-[#F59E0B]/30',
          icon: <AlertTriangle className="w-3 h-3" />,
          label: 'WARNING'
        };
      case 'resolved':
      case 'completed':
      case 'low':
      case 'normal':
      case 'healthy':
      case 'online':
        return {
          bgColor: 'bg-[#22C55E]/20',
          textColor: 'text-[#98F7B1]',
          borderColor: 'border-[#22C55E]/30',
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'OK'
        };
      case 'false_alarm':
      case 'archived':
      case 'medium':
      case 'info':
        return {
          bgColor: 'bg-[#3B82F6]/20',
          textColor: 'text-[#93C5FD]',
          borderColor: 'border-[#3B82F6]/30',
          icon: <Info className="w-3 h-3" />,
          label: 'INFO'
        };
      default:
        return {
          bgColor: 'bg-[#374151]/20',
          textColor: 'text-[#9CA3AF]',
          borderColor: 'border-[#374151]/30',
          icon: <Info className="w-3 h-3" />,
          label: status.toUpperCase()
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.bgColor,
        config.textColor,
        config.borderColor
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}