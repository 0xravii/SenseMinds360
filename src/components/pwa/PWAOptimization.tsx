// src/components/pwa/PWAOptimization.tsx

import { useEffect } from 'react';

interface PWAOptimizationProps {
  enablePreloading?: boolean;
  enableCaching?: boolean;
}

export function PWAOptimization({ 
  enablePreloading = true, 
  enableCaching = true
}: PWAOptimizationProps = {}) {
  useEffect(() => {
    // Resource preloading optimization
    if (enablePreloading && typeof window !== 'undefined') {
      // Preload critical resources
      const preloadResources = [
        '/api/sensors/current',
        '/api/system/health',
        '/api/alerts/recent'
      ];

      // Only preload in development or when explicitly enabled
      if (process.env.NODE_ENV === 'development') {
        preloadResources.forEach(resource => {
          fetch(resource, { method: 'HEAD' }).catch(() => {
            // Silently fail for preloading
          });
        });
      } else {
        console.log('PWA: Resource preloading disabled for production deployment');
      }
    }

    // Cache optimization
    if (enableCaching && 'caches' in window) {
      // Cache management for PWA
      caches.keys().then(cacheNames => {
        // Clean up old caches if needed
        const currentCaches = ['senseminds-v1'];
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!currentCaches.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      }).catch(error => {
        console.warn('Cache cleanup failed:', error);
      });
    }

    // Performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor key performance metrics
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navigationEntry = entry as PerformanceNavigationTiming;
            console.log('PWA Navigation timing:', {
              domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
              loadComplete: navigationEntry.loadEventEnd - navigationEntry.loadEventStart
            });
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['navigation', 'paint'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }

      // Cleanup observer on unmount
      return () => {
        observer.disconnect();
      };
    }
  }, [enablePreloading, enableCaching]);

  // This component doesn't render anything visible
  return null;
}

// Default export for compatibility
export default PWAOptimization;

// Utility functions for PWA optimization
export const pwaUtils = {
  // Check if app is running as PWA
  isPWA: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  },

  // Preload critical resources
  preloadResource: (url: string) => {
    if (typeof window === 'undefined') return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  },

  // Cache resource
  cacheResource: async (url: string, cacheName = 'senseminds-v1') => {
    if (!('caches' in window)) return;
    try {
      const cache = await caches.open(cacheName);
      await cache.add(url);
    } catch (error) {
      console.warn('Failed to cache resource:', url, error);
    }
  }
};