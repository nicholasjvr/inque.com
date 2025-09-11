#!/usr/bin/env node

/**
 * AI Response Cache Manager
 * Manages caching of AI responses to improve performance and reduce API costs
 */

import fs from "fs";
import crypto from "crypto";

class AICacheManager {
  constructor(options = {}) {
    this.cacheDir = options.cacheDir || ".ai-cache";
    this.maxCacheSize = options.maxCacheSize || 100; // MB
    this.defaultTTL = options.defaultTTL || 24 * 60 * 60 * 1000; // 24 hours
    this.cacheIndex = new Map();

    this.initializeCache();
    console.log("[AI CACHE] Cache manager initialized successfully");
  }

  initializeCache() {
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      console.log(`[AI CACHE] Created cache directory: ${this.cacheDir}`);
    }

    // Load existing cache index
    this.loadCacheIndex();

    // Clean up expired entries
    this.cleanupExpiredEntries();
  }

  generateCacheKey(prompt, options = {}) {
    // Create a hash of the prompt and options for consistent caching
    const keyData = {
      prompt: prompt.trim().toLowerCase(),
      model: options.model || "gemini-pro",
      maxTokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
    };

    const keyString = JSON.stringify(keyData);
    return crypto.createHash("sha256").update(keyString).digest("hex");
  }

  async getCachedResponse(prompt, options = {}) {
    const cacheKey = this.generateCacheKey(prompt, options);
    const cacheEntry = this.cacheIndex.get(cacheKey);

    if (!cacheEntry) {
      console.log("[AI CACHE] No cached response found");
      return null;
    }

    // Check if entry is expired
    if (this.isExpired(cacheEntry)) {
      console.log("[AI CACHE] Cached response expired, removing");
      this.removeCacheEntry(cacheKey);
      return null;
    }

    // Load cached response
    try {
      const cacheFilePath = path.join(this.cacheDir, `${cacheKey}.json`);
      const cachedData = JSON.parse(fs.readFileSync(cacheFilePath, "utf8"));

      console.log("[AI CACHE] Retrieved cached response");
      return cachedData.response;
    } catch (error) {
      console.error("[AI CACHE] Error loading cached response:", error);
      this.removeCacheEntry(cacheKey);
      return null;
    }
  }

  async setCachedResponse(prompt, response, options = {}) {
    const cacheKey = this.generateCacheKey(prompt, options);
    const ttl = options.ttl || this.defaultTTL;

    const cacheEntry = {
      key: cacheKey,
      prompt: prompt.substring(0, 100) + "...", // Truncated for index
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttl).toISOString(),
      size: JSON.stringify(response).length,
      hitCount: 0,
    };

    try {
      // Save response to file
      const cacheFilePath = path.join(this.cacheDir, `${cacheKey}.json`);
      const cacheData = {
        prompt: prompt,
        response: response,
        metadata: cacheEntry,
        options: options,
      };

      fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData, null, 2));

      // Update index
      this.cacheIndex.set(cacheKey, cacheEntry);
      this.saveCacheIndex();

      console.log(`[AI CACHE] Cached response (${cacheEntry.size} bytes)`);

      // Check cache size and cleanup if needed
      this.enforceCacheSizeLimit();

      return true;
    } catch (error) {
      console.error("[AI CACHE] Error caching response:", error);
      return false;
    }
  }

  isExpired(cacheEntry) {
    return new Date() > new Date(cacheEntry.expiresAt);
  }

  removeCacheEntry(cacheKey) {
    try {
      const cacheFilePath = path.join(this.cacheDir, `${cacheKey}.json`);
      if (fs.existsSync(cacheFilePath)) {
        fs.unlinkSync(cacheFilePath);
      }
      this.cacheIndex.delete(cacheKey);
      this.saveCacheIndex();
      console.log(`[AI CACHE] Removed expired cache entry: ${cacheKey}`);
    } catch (error) {
      console.error("[AI CACHE] Error removing cache entry:", error);
    }
  }

  cleanupExpiredEntries() {
    console.log("[AI CACHE] Cleaning up expired entries...");
    let removedCount = 0;

    for (const [key, entry] of this.cacheIndex.entries()) {
      if (this.isExpired(entry)) {
        this.removeCacheEntry(key);
        removedCount++;
      }
    }

    console.log(`[AI CACHE] Cleaned up ${removedCount} expired entries`);
  }

  enforceCacheSizeLimit() {
    const totalSize = this.getTotalCacheSize();
    const maxSizeBytes = this.maxCacheSize * 1024 * 1024; // Convert MB to bytes

    if (totalSize > maxSizeBytes) {
      console.log(
        `[AI CACHE] Cache size limit exceeded (${totalSize} bytes), cleaning up...`
      );
      this.cleanupOldestEntries();
    }
  }

  getTotalCacheSize() {
    let totalSize = 0;
    for (const entry of this.cacheIndex.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  cleanupOldestEntries() {
    // Sort entries by creation date and remove oldest ones
    const entries = Array.from(this.cacheIndex.entries())
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const targetSize = this.maxCacheSize * 1024 * 1024 * 0.8; // Clean to 80% of limit
    let currentSize = this.getTotalCacheSize();
    let removedCount = 0;

    for (const entry of entries) {
      if (currentSize <= targetSize) break;

      this.removeCacheEntry(entry.key);
      currentSize -= entry.size;
      removedCount++;
    }

    console.log(`[AI CACHE] Removed ${removedCount} oldest entries`);
  }

  loadCacheIndex() {
    const indexPath = path.join(this.cacheDir, "index.json");

    if (fs.existsSync(indexPath)) {
      try {
        const indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));
        this.cacheIndex = new Map(indexData.entries || []);
        console.log(
          `[AI CACHE] Loaded cache index with ${this.cacheIndex.size} entries`
        );
      } catch (error) {
        console.error("[AI CACHE] Error loading cache index:", error);
        this.cacheIndex = new Map();
      }
    }
  }

  saveCacheIndex() {
    const indexPath = path.join(this.cacheDir, "index.json");
    const indexData = {
      entries: Array.from(this.cacheIndex.entries()),
      lastUpdated: new Date().toISOString(),
      totalEntries: this.cacheIndex.size,
    };

    try {
      fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
    } catch (error) {
      console.error("[AI CACHE] Error saving cache index:", error);
    }
  }

  getCacheStats() {
    const totalSize = this.getTotalCacheSize();
    const expiredCount = Array.from(this.cacheIndex.values()).filter((entry) =>
      this.isExpired(entry)
    ).length;

    return {
      totalEntries: this.cacheIndex.size,
      totalSize: Math.round(totalSize / 1024), // KB
      expiredEntries: expiredCount,
      hitRate: this.calculateHitRate(),
      lastCleanup: new Date().toISOString(),
    };
  }

  calculateHitRate() {
    // This would need to track hits vs misses over time
    // For now, return a placeholder
    return "N/A - tracking not implemented";
  }

  clearCache() {
    console.log("[AI CACHE] Clearing all cached responses...");

    try {
      // Remove all cache files
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith(".json") && file !== "index.json") {
          fs.unlinkSync(path.join(this.cacheDir, file));
        }
      }

      // Clear index
      this.cacheIndex.clear();
      this.saveCacheIndex();

      console.log("[AI CACHE] Cache cleared successfully");
      return true;
    } catch (error) {
      console.error("[AI CACHE] Error clearing cache:", error);
      return false;
    }
  }
}

export default AICacheManager;

// Run cache manager if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cacheManager = new AICacheManager();

  console.log("[AI CACHE] Cache statistics:");
  console.log(JSON.stringify(cacheManager.getCacheStats(), null, 2));

  // Example usage
  const testPrompt = "What is the purpose of this application?";
  const testResponse = "This is a web application for creative collaboration.";

  cacheManager.setCachedResponse(testPrompt, testResponse);
  const cached = cacheManager.getCachedResponse(testPrompt);

  console.log("[AI CACHE] Test completed:", { cached: !!cached });
}
