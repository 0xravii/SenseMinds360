'use client';

import { useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, notify user
                  if (confirm('New version available! Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data);
      });
    }

    // Handle PWA install prompt
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      
      // Show install button or notification
      showInstallPromotion();
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      deferredPrompt = null;
      hideInstallPromotion();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show install promotion
    const showInstallPromotion = () => {
      // Create install notification
      const installBanner = document.createElement('div');
      installBanner.id = 'install-banner';
      installBanner.className = 'fixed top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
      installBanner.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h3 class="font-semibold text-sm">Install SenseMinds 360</h3>
            <p class="text-xs opacity-90 mt-1">Get the full app experience!</p>
          </div>
          <div class="flex gap-2 ml-3">
            <button id="install-btn" class="bg-white text-purple-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors">
              Install
            </button>
            <button id="dismiss-btn" class="text-white opacity-70 hover:opacity-100 transition-opacity">
              ✕
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(installBanner);

      // Handle install button click
      const installBtn = document.getElementById('install-btn');
      const dismissBtn = document.getElementById('dismiss-btn');

      installBtn?.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          deferredPrompt = null;
          hideInstallPromotion();
        }
      });

      dismissBtn?.addEventListener('click', () => {
        hideInstallPromotion();
      });

      // Auto-hide after 10 seconds
      setTimeout(() => {
        hideInstallPromotion();
      }, 10000);
    };

    const hideInstallPromotion = () => {
      const banner = document.getElementById('install-banner');
      if (banner) {
        banner.remove();
      }
    };

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isStandalone || isInWebAppiOS || isInWebAppChrome) {
      console.log('App is running in standalone mode');
      // Add any standalone-specific functionality here
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      hideInstallPromotion();
    };
  }, []);

  return null; // This component doesn't render anything
}

// Utility function to check if PWA is installable
export const isPWAInstallable = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Utility function to check if app is installed
export const isPWAInstalled = (): boolean => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppiOS = (window.navigator as any).standalone === true;
  return isStandalone || isInWebAppiOS;
};

// Utility function to request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }
  return 'denied';
};

// Utility function to show notification
export const showNotification = (title: string, options?: NotificationOptions): void => {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-192x192.svg',
          ...options,
        });
      });
    }
  }
};