// src/services/audiocache/index.ts

// Audio cache service for TTS responses
class AudioCacheService {
  private cache: Map<string, Blob> = new Map();
  private maxCacheSize = 50; // Maximum number of cached audio files
  private cacheKeys: string[] = []; // Track insertion order for LRU eviction

  // Generate cache key from text and language
  private generateCacheKey(text: string, lang: string): string {
    // Simple hash function for cache key
    const content = `${text}_${lang}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `audio_${Math.abs(hash)}`;
  }

  // Get cached audio blob
  async getCachedAudio(text: string, lang: string): Promise<Blob | null> {
    const key = this.generateCacheKey(text, lang);
    const cachedBlob = this.cache.get(key);
    
    if (cachedBlob) {
      // Move to end of cache keys (most recently used)
      const keyIndex = this.cacheKeys.indexOf(key);
      if (keyIndex > -1) {
        this.cacheKeys.splice(keyIndex, 1);
        this.cacheKeys.push(key);
      }
      console.log('Audio cache hit for:', text.substring(0, 30));
      return cachedBlob;
    }
    
    return null;
  }

  // Cache audio blob
  async cacheAudio(text: string, lang: string, audioBlob: Blob): Promise<void> {
    const key = this.generateCacheKey(text, lang);
    
    // Check if we need to evict old entries
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry (LRU)
      const oldestKey = this.cacheKeys.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        console.log('Evicted old audio cache entry:', oldestKey);
      }
    }
    
    // Add new entry
    this.cache.set(key, audioBlob);
    this.cacheKeys.push(key);
    
    console.log('Cached audio for:', text.substring(0, 30), 'Cache size:', this.cache.size);
  }

  // Clear all cached audio
  clearCache(): void {
    this.cache.clear();
    this.cacheKeys = [];
    console.log('Audio cache cleared');
  }

  // Get cache statistics
  getCacheStats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      keys: [...this.cacheKeys]
    };
  }

  // Check if audio is cached
  isCached(text: string, lang: string): boolean {
    const key = this.generateCacheKey(text, lang);
    return this.cache.has(key);
  }

  // Remove specific cached audio
  removeCachedAudio(text: string, lang: string): boolean {
    const key = this.generateCacheKey(text, lang);
    const keyIndex = this.cacheKeys.indexOf(key);
    
    if (keyIndex > -1) {
      this.cacheKeys.splice(keyIndex, 1);
      return this.cache.delete(key);
    }
    
    return false;
  }

  // Set maximum cache size
  setMaxCacheSize(size: number): void {
    this.maxCacheSize = Math.max(1, size);
    
    // Evict entries if current size exceeds new max
    while (this.cache.size > this.maxCacheSize) {
      const oldestKey = this.cacheKeys.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }
}

// Create singleton instance
export const audioCacheService = new AudioCacheService();

// Export the class for testing or custom instances
export { AudioCacheService };

// Export default for compatibility
export default audioCacheService;