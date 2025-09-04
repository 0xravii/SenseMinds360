// Advanced caching utilities for production optimization

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  staleWhileRevalidate: boolean; // Return stale data while fetching fresh
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  stale: boolean;
}

// In-memory cache with LRU eviction
class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      staleWhileRevalidate: true,
      ...config,
    };
  }

  set(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      stale: false,
    };

    // Evict if at max size
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      if (this.config.staleWhileRevalidate) {
        entry.stale = true;
        this.accessOrder.set(key, ++this.accessCounter);
        return entry.data;
      } else {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        return null;
      }
    }

    this.accessOrder.set(key, ++this.accessCounter);
    return entry.data;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    return entry.stale || (now - entry.timestamp > entry.ttl);
  }

  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;

    for (const [key, accessTime] of this.accessOrder) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.accessCounter > 0 ? this.cache.size / this.accessCounter : 0,
    };
  }
}

// Global cache instances
const apiCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 200,
  staleWhileRevalidate: true,
});

const staticCache = new MemoryCache({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 50,
  staleWhileRevalidate: false,
});

// Browser storage cache
class BrowserStorageCache {
  private storage: Storage;
  private prefix: string;

  constructor(type: 'localStorage' | 'sessionStorage' = 'localStorage', prefix = 'app_cache_') {
    this.storage = typeof window !== 'undefined' ? window[type] : null as any;
    this.prefix = prefix;
  }

  set(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000): void {
    if (!this.storage) return;

    const entry = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    try {
      this.storage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to set cache in browser storage:', error);
    }
  }

  get<T = any>(key: string): T | null {
    if (!this.storage) return null;

    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) return null;

      const entry = JSON.parse(item);
      const now = Date.now();

      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to get cache from browser storage:', error);
      return null;
    }
  }

  delete(key: string): void {
    if (!this.storage) return;
    this.storage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (!this.storage) return;
    
    const keys = Object.keys(this.storage).filter(key => 
      key.startsWith(this.prefix)
    );
    
    keys.forEach(key => this.storage.removeItem(key));
  }
}

// Persistent cache instance
const persistentCache = new BrowserStorageCache('localStorage');
const sessionCache = new BrowserStorageCache('sessionStorage');

// Cache-aware fetch wrapper
export async function cachedFetch<T = any>(
  url: string,
  options: RequestInit & {
    cacheKey?: string;
    cacheTtl?: number;
    useStale?: boolean;
    bypassCache?: boolean;
  } = {}
): Promise<T> {
  const {
    cacheKey = url,
    cacheTtl = 5 * 60 * 1000,
    useStale = true,
    bypassCache = false,
    ...fetchOptions
  } = options;

  // Check cache first
  if (!bypassCache) {
    const cached = apiCache.get(cacheKey);
    if (cached !== null) {
      // If data is stale but we allow stale data, return it and fetch fresh in background
      if (apiCache.isStale(cacheKey) && useStale) {
        // Background refresh
        setTimeout(() => {
          fetch(url, fetchOptions)
            .then(response => response.json())
            .then(data => apiCache.set(cacheKey, data, cacheTtl))
            .catch(console.error);
        }, 0);
      }
      return cached;
    }
  }

  // Fetch fresh data
  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result
    if (!bypassCache) {
      apiCache.set(cacheKey, data, cacheTtl);
    }

    return data;
  } catch (error) {
    // If fetch fails and we have stale data, return it
    if (useStale) {
      const staleData = apiCache.get(cacheKey);
      if (staleData !== null) {
        console.warn('Returning stale data due to fetch error:', error);
        return staleData;
      }
    }
    throw error;
  }
}

// React hook for cached data
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    staleWhileRevalidate?: boolean;
    persistent?: boolean;
  } = {}
) {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true, persistent = false } = options;
  
  const cache = persistent ? persistentCache : apiCache;
  
  // This would typically be implemented with React hooks
  // For now, providing the utility functions
  return {
    data: cache.get(key),
    isStale: cache instanceof MemoryCache ? cache.isStale(key) : false,
    refresh: async () => {
      const data = await fetcher();
      cache.set(key, data, ttl);
      return data;
    },
    invalidate: () => cache.delete(key),
  };
}

// Cache management utilities
export const cacheManager = {
  // Get cache instances
  api: apiCache,
  static: staticCache,
  persistent: persistentCache,
  session: sessionCache,

  // Bulk operations
  clearAll() {
    apiCache.clear();
    staticCache.clear();
    persistentCache.clear();
    sessionCache.clear();
  },

  // Cache statistics
  getStats() {
    return {
      api: apiCache.getStats(),
      static: staticCache.getStats(),
    };
  },

  // Preload data
  async preload(key: string, fetcher: () => Promise<any>, ttl?: number) {
    if (!apiCache.has(key)) {
      try {
        const data = await fetcher();
        apiCache.set(key, data, ttl);
      } catch (error) {
        console.warn('Failed to preload data for key:', key, error);
      }
    }
  },

  // Invalidate by pattern
  invalidatePattern(pattern: RegExp) {
    // This would require extending the cache to track keys
    // For now, clear all as a fallback
    console.warn('Pattern invalidation not fully implemented, clearing all caches');
    this.clearAll();
  },
};

// Export cache utilities
export { MemoryCache, BrowserStorageCache };
export default cacheManager;