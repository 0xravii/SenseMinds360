'use client';

// PWA Analytics Service for tracking installation conversion rates
export interface PWAAnalyticsEvent {
  event: string;
  data: any;
  timestamp: string;
  sessionId?: string;
  userId?: string;
}

export interface PWAConversionMetrics {
  totalBannerViews: number;
  totalBannerClicks: number;
  totalInstallPrompts: number;
  totalInstallations: number;
  totalDismissals: number;
  conversionRate: number;
  clickThroughRate: number;
  dismissalRate: number;
}

class PWAAnalyticsService {
  private sessionId: string;
  private storageKey = 'pwa-analytics';
  private metricsKey = 'pwa-metrics';
  private apiEndpoint = '/api/analytics/pwa'; // Future API endpoint

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track PWA-related events
  trackEvent(eventName: string, data: any = {}): void {
    const event: PWAAnalyticsEvent = {
      event: eventName,
      data: {
        ...data,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        referrer: document.referrer,
        url: window.location.href
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    // Store locally
    this.storeEventLocally(event);

    // Send to server (if endpoint exists)
    this.sendToServer(event);

    // Update metrics
    this.updateMetrics(eventName);

    console.log('PWA Analytics Event:', event);
  }

  private storeEventLocally(event: PWAAnalyticsEvent): void {
    try {
      const events = this.getStoredEvents();
      events.push(event);
      
      // Keep only last 1000 events to prevent storage overflow
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store PWA analytics event:', error);
    }
  }

  private async sendToServer(event: PWAAnalyticsEvent): Promise<void> {
    try {
      // Only attempt if we're in a browser environment
      if (typeof window === 'undefined') return;

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.debug('PWA analytics server tracking failed:', error);
    }
  }

  private updateMetrics(eventName: string): void {
    try {
      const metrics = this.getMetrics();
      
      switch (eventName) {
        case 'pwa_banner_shown':
          metrics.totalBannerViews++;
          break;
        case 'pwa_banner_clicked':
          metrics.totalBannerClicks++;
          break;
        case 'pwa_install_prompt_shown':
          metrics.totalInstallPrompts++;
          break;
        case 'pwa_installed':
        case 'pwa_install_prompt_result':
          if (eventName === 'pwa_installed') {
            metrics.totalInstallations++;
          }
          break;
        case 'pwa_banner_dismissed':
          metrics.totalDismissals++;
          break;
      }

      // Calculate rates
      metrics.conversionRate = metrics.totalBannerViews > 0 
        ? (metrics.totalInstallations / metrics.totalBannerViews) * 100 
        : 0;
      
      metrics.clickThroughRate = metrics.totalBannerViews > 0 
        ? (metrics.totalBannerClicks / metrics.totalBannerViews) * 100 
        : 0;
      
      metrics.dismissalRate = metrics.totalBannerViews > 0 
        ? (metrics.totalDismissals / metrics.totalBannerViews) * 100 
        : 0;

      localStorage.setItem(this.metricsKey, JSON.stringify(metrics));
    } catch (error) {
      console.error('Failed to update PWA metrics:', error);
    }
  }

  getStoredEvents(): PWAAnalyticsEvent[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve PWA analytics events:', error);
      return [];
    }
  }

  getMetrics(): PWAConversionMetrics {
    try {
      const stored = localStorage.getItem(this.metricsKey);
      return stored ? JSON.parse(stored) : {
        totalBannerViews: 0,
        totalBannerClicks: 0,
        totalInstallPrompts: 0,
        totalInstallations: 0,
        totalDismissals: 0,
        conversionRate: 0,
        clickThroughRate: 0,
        dismissalRate: 0
      };
    } catch (error) {
      console.error('Failed to retrieve PWA metrics:', error);
      return {
        totalBannerViews: 0,
        totalBannerClicks: 0,
        totalInstallPrompts: 0,
        totalInstallations: 0,
        totalDismissals: 0,
        conversionRate: 0,
        clickThroughRate: 0,
        dismissalRate: 0
      };
    }
  }

  // Get events by type
  getEventsByType(eventType: string): PWAAnalyticsEvent[] {
    return this.getStoredEvents().filter(event => event.event === eventType);
  }

  // Get events within date range
  getEventsByDateRange(startDate: Date, endDate: Date): PWAAnalyticsEvent[] {
    return this.getStoredEvents().filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }

  // Export analytics data for external analysis
  exportAnalyticsData(): {
    events: PWAAnalyticsEvent[];
    metrics: PWAConversionMetrics;
    exportedAt: string;
  } {
    return {
      events: this.getStoredEvents(),
      metrics: this.getMetrics(),
      exportedAt: new Date().toISOString()
    };
  }

  // Clear all analytics data
  clearAnalyticsData(): void {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.metricsKey);
      console.log('PWA analytics data cleared');
    } catch (error) {
      console.error('Failed to clear PWA analytics data:', error);
    }
  }

  // Generate analytics report
  generateReport(): string {
    const metrics = this.getMetrics();
    const events = this.getStoredEvents();
    
    return `
PWA Analytics Report
===================
Generated: ${new Date().toLocaleString()}

Conversion Metrics:
- Banner Views: ${metrics.totalBannerViews}
- Banner Clicks: ${metrics.totalBannerClicks}
- Install Prompts: ${metrics.totalInstallPrompts}
- Installations: ${metrics.totalInstallations}
- Dismissals: ${metrics.totalDismissals}

Conversion Rates:
- Overall Conversion Rate: ${metrics.conversionRate.toFixed(2)}%
- Click-Through Rate: ${metrics.clickThroughRate.toFixed(2)}%
- Dismissal Rate: ${metrics.dismissalRate.toFixed(2)}%

Total Events Tracked: ${events.length}
Session ID: ${this.sessionId}
    `;
  }
}

// Export singleton instance
export const pwaAnalytics = new PWAAnalyticsService();
export default pwaAnalytics;

// Convenience functions for common tracking scenarios
export const trackPWABannerShown = () => pwaAnalytics.trackEvent('pwa_banner_shown');
export const trackPWABannerClicked = () => pwaAnalytics.trackEvent('pwa_banner_clicked');
export const trackPWAInstallPrompt = () => pwaAnalytics.trackEvent('pwa_install_prompt_shown');
export const trackPWAInstalled = (method: string = 'unknown') => 
  pwaAnalytics.trackEvent('pwa_installed', { installMethod: method });
export const trackPWABannerDismissed = (reason: string = 'user_action') => 
  pwaAnalytics.trackEvent('pwa_banner_dismissed', { dismissReason: reason });