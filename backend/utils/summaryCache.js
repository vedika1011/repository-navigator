// summaryCache.js — In-memory cache for AI summaries keyed by file content hash.

const cache = new Map();
let hits = 0;
let misses = 0;

/**
 * Returns a simple 32-bit integer hash of a string, formatted as base36.
 * Uses the djb2 algorithm.
 * @param {string} content - The file content to hash
 * @returns {string} The base36 hash string
 */
function hashContent(content) {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) + content.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Retrieves a summary from the cache if it exists.
 * @param {string} hash - The content hash key
 * @returns {string|null} The cached summary, or null if not found
 */
function get(hash) {
  if (cache.has(hash)) {
    hits++;
    return cache.get(hash);
  } else {
    misses++;
    return null;
  }
}

/**
 * Stores a summary in the cache. Clears the cache if it exceeds 500 entries.
 * @param {string} hash - The content hash key
 * @param {string} summary - The generated summary to cache
 */
function set(hash, summary) {
  if (cache.size >= 500) {
    console.log("[SummaryCache] Cache full (500 entries) — clearing");
    cache.clear();
  }
  cache.set(hash, summary);
}

/**
 * Returns statistics about cache usage.
 * @returns {Object} Cache statistics
 */
function getStats() {
  return {
    hits,
    misses,
    size: cache.size,
    hitRate: hits / (hits + misses) || 0
  };
}

module.exports = {
  hashContent,
  get,
  set,
  getStats
};
