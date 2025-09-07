'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Download, Maximize, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WidgetNotificationProps {
  onDismiss?: () => void;
  autoShow?: boolean;
}

export function WidgetNotification({ onDismiss, autoShow = true }: WidgetNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if PWA is installable
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Auto-show notification after 3 seconds if enabled
    if (autoShow) {
      const timer = setTimeout(() => {
        const hasSeenNotification = localStorage.getItem('widget-notification-seen');
        if (!hasSeenNotification) {
          setIsVisible(true);
        }
      }, 3000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [autoShow]);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
        handleDismiss();
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('widget-notification-seen', 'true');
    onDismiss?.();
  };

  const openFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  const openInNewWindow = () => {
    const width = 400;
    const height = 600;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    
    window.open(
      window.location.href,
      'SenseMinds360Widget',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 right-6 z-40 max-w-sm"
        >
          <Card className="bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-lg border border-purple-500/30 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Smartphone className="h-5 w-5 text-purple-400" />
                  </motion.div>
                  <h3 className="text-sm font-semibold text-white">Widget Experience</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-gray-300 mb-4">
                Get the best experience with our full-screen widget mode!
              </p>
              
              <div className="space-y-2">
                {isInstallable && (
                  <Button
                    onClick={handleInstallPWA}
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs"
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Install App
                  </Button>
                )}
                
                <Button
                  onClick={openFullScreen}
                  size="sm"
                  variant="outline"
                  className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/20 text-xs"
                >
                  <Maximize className="h-3 w-3 mr-2" />
                  Full Screen
                </Button>
                
                <Button
                  onClick={openInNewWindow}
                  size="sm"
                  variant="outline"
                  className="w-full border-blue-500/50 text-blue-300 hover:bg-blue-500/20 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Widget Window
                </Button>
              </div>
              
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                <motion.div
                  className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500/20 rounded-full blur-sm"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <motion.div
                  className="absolute -bottom-1 -left-1 w-6 h-6 bg-blue-500/20 rounded-full blur-sm"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WidgetNotification;