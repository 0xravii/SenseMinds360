'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Zap, Wifi, Maximize2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { pwaAnalytics } from '@/services/analytics/pwa-analytics';

interface PWAInstallBannerProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function PWAInstallBanner({ onInstall, onDismiss }: PWAInstallBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      return isStandalone || isInWebAppiOS;
    };

    // Check if banner was dismissed
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed');
    const dismissedTime = wasDismissed ? parseInt(wasDismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Force show banner for testing - always show unless recently dismissed
    if (!wasDismissed || daysSinceDismissed > 7) {
      setIsVisible(true);
      // Track banner shown event
      pwaAnalytics.trackEvent('pwa_banner_shown');
    }

    setIsInstalled(checkIfInstalled());

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Track PWA prompt availability
      pwaAnalytics.trackEvent('pwa_prompt_available', {
        user_agent: navigator.userAgent
      });
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      pwaAnalytics.trackEvent('pwa_installed', {
        method: 'browser_prompt'
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);



  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      pwaAnalytics.trackEvent('pwa_install_prompt_result', {
        outcome
      });
      
      if (outcome === 'accepted') {
        setIsVisible(false);
        onInstall?.();
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      pwaAnalytics.trackEvent('pwa_manual_install_instructions', {});
      
      // Show manual installation instructions
      alert('To install this app:\n\n1. Open browser menu\n2. Select "Add to Home Screen" or "Install App"\n3. Follow the prompts');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
    
    pwaAnalytics.trackEvent('pwa_banner_dismissed', {
      had_install_prompt: isInstallable
    });
    
    onDismiss?.();
  };

  const handleBannerClick = () => {
    pwaAnalytics.trackEvent('pwa_banner_clicked', {});
  };

  if (isInstalled || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-lg border-b border-purple-500/30 shadow-lg"
        onClick={handleBannerClick}
      >
        <Card className="bg-transparent border-0 shadow-none">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Left side - Icon and main message */}
              <div className="flex items-center gap-3 flex-1">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="flex-shrink-0"
                >
                  <div className="relative">
                    <Smartphone className="h-8 w-8 text-purple-400" />
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm md:text-base">
                    Install SenseMinds 360 App
                  </h3>
                  <p className="text-gray-300 text-xs md:text-sm mt-1">
                    Get native app experience with offline access and real-time alerts
                  </p>
                </div>
              </div>

              {/* Center - Benefits (hidden on mobile) */}
              <div className="hidden lg:flex items-center gap-6 text-xs text-gray-300">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>Faster Performance</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wifi className="h-4 w-4 text-green-400" />
                  <span>Offline Access</span>
                </div>
                <div className="flex items-center gap-1">
                  <Maximize2 className="h-4 w-4 text-blue-400" />
                  <span>Full Screen</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  <span>Real-time Updates</span>
                </div>
              </div>

              {/* Right side - Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-4 py-2 text-xs md:text-sm transition-all duration-200 transform hover:scale-105"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Install Now</span>
                  <span className="sm:hidden">Install</span>
                </Button>
                
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/10 p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Mobile benefits row */}
            <div className="lg:hidden mt-2 flex items-center justify-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-400" />
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-green-400" />
                <span>Offline</span>
              </div>
              <div className="flex items-center gap-1">
                <Maximize2 className="h-3 w-3 text-blue-400" />
                <span>Full Screen</span>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-0 left-1/4 w-32 h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"
            animate={{
              x: [-100, 400],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.div
            className="absolute top-0 right-1/3 w-24 h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"
            animate={{
              x: [100, -300],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.5
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PWAInstallBanner;