/**
 * In-memory cache for parsed DICOM studies
 * Prevents re-reading and re-parsing files when switching between studies from the same folder
 *
 * Note: Cannot use localStorage because DicomStudy objects contain File objects and
 * blob URLs that are session-specific and cannot be serialized.
 */

import { DicomStudy } from '@/types'

// In-memory cache: Key = folderPath or directoryHandleId, Value = parsed studies
const cache = new Map<string, DicomStudy[]>()

/**
 * Produce a short, non-reversible token for a cache key so logs never expose
 * the raw folder path or directory-handle id (which can embed a patient's name
 * or folder). Returns the first 8 chars of a simple non-cryptographic hash.
 */
function keyToken(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0 // force 32-bit
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 8)
}

/**
 * Get cached studies for a folder/directory
 */
export function getCachedStudies(key: string): DicomStudy[] | undefined {
  const cached = cache.get(key)
  if (cached) {
    console.log(`[StudyCache] ⚡ Cache hit for study folder <${keyToken(key)}>`)
  }
  return cached
}

/**
 * Cache studies for a folder/directory
 */
export function cacheStudies(key: string, studies: DicomStudy[]): void {
  cache.set(key, studies)
  console.log(`[StudyCache] Cached ${studies.length} studies for study folder <${keyToken(key)}>`)
}

/**
 * Clear a specific cache entry
 */
export function clearCachedStudies(key: string): void {
  cache.delete(key)
  console.log(`[StudyCache] Cleared cache for study folder <${keyToken(key)}>`)
}

/**
 * Clear all cached studies
 */
export function clearAllCache(): void {
  cache.clear()
  console.log(`[StudyCache] Cleared all cached studies`)
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    totalStudies: Array.from(cache.values()).reduce((sum, studies) => sum + studies.length, 0),
    keys: Array.from(cache.keys()),
  }
}
