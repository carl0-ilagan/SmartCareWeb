// Local storage for metrics when Firestore is unavailable
let localMetricsCache = []
const MAX_CACHE_SIZE = 100

/**
 * Store metrics in local memory when Firestore is unavailable
 */
export function storeMetricsLocally(metrics) {
  // Add timestamp if not present
  if (!metrics.timestamp) {
    metrics.timestamp = new Date()
  }

  // Add to cache
  localMetricsCache.push(metrics)

  // Trim cache if it gets too large
  if (localMetricsCache.length > MAX_CACHE_SIZE) {
    localMetricsCache = localMetricsCache.slice(-MAX_CACHE_SIZE)
  }

  console.log(`Stored metrics locally. Cache size: ${localMetricsCache.length}`)
  return true
}

/**
 * Get metrics from local cache
 */
export function getLocalMetrics(limit = 10) {
  return localMetricsCache.slice(-limit)
}

/**
 * Get the latest metrics from local cache
 */
export function getLatestLocalMetrics() {
  if (localMetricsCache.length === 0) {
    return null
  }
  return localMetricsCache[localMetricsCache.length - 1]
}

/**
 * Clear the local metrics cache
 */
export function clearLocalMetricsCache() {
  const count = localMetricsCache.length
  localMetricsCache = []
  return count
}
