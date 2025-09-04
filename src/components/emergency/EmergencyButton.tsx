// src/components/emergency/EmergencyButton.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

type EmergencyButtonProps = {
  onClick: () => void;
  label?: string;
};

export function EmergencyButton({ onClick, label = 'Trigger Emergency' }: EmergencyButtonProps) {
  return (
    <Button onClick={onClick} variant="destructive" className="h-16 text-lg">
      <AlertTriangle className="mr-2 h-6 w-6" />
      {label}
    </Button>
  );
}