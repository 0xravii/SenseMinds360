// src/components/emergency/EmergencyButton.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type EmergencyButtonProps = {
  onClick: () => void;
  label?: string;
};

export function EmergencyButton({ onClick, label = 'Emergency Protocol' }: EmergencyButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleEmergencyClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    onClick();
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setCountdown(0);
  };

  return (
    <>
      <Button 
        onClick={handleEmergencyClick} 
        variant="destructive" 
        className="w-full h-16 text-lg font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-2 border-red-500 shadow-lg transition-all duration-200 hover:shadow-red-500/25"
        aria-label="Trigger emergency protocol - requires confirmation"
      >
        <AlertTriangle className="mr-2 h-6 w-6 animate-pulse" />
        {label}
      </Button>

      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1F2E] border-2 border-red-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  Confirm Emergency Protocol
                </h3>
                
                <p className="text-gray-300 mb-6 text-sm">
                  This will trigger the emergency response system. Are you sure you want to proceed?
                </p>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={handleConfirm}
                    variant="destructive"
                    className="flex-1 bg-red-600 hover:bg-red-700 font-bold"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Confirm Emergency
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}