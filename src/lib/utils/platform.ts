/**
 * Platform detection utilities
 *
 * Detect whether the app is running in:
 * - Web browser (standard deployment)
 * - Tauri desktop app (with Python ML capabilities)
 */

// Cache the detection result since it won't change during runtime
let tauriDetected: boolean | null = null

/**
 * Check if running inside Tauri desktop app
 *
 * @returns true if running in Tauri, false if running in web browser
 */
export function isTauri(): boolean {
  // Check if window object exists (SSR safety)
  if (typeof window === 'undefined') {
    return false
  }

  // Return cached result if available
  if (tauriDetected !== null) {
    return tauriDetected
  }

  // Tauri v2 detection: Check for __TAURI_INTERNALS__
  // This is more reliable than __TAURI__ which may not be injected
  const detected = '__TAURI_INTERNALS__' in window ||
                   '__TAURI__' in window ||
                   // Additional check: Tauri specific user agent
                   navigator.userAgent.includes('Tauri')

  tauriDetected = detected
  return detected
}

/**
 * Get the current platform
 *
 * @returns 'desktop' if Tauri, 'web' if browser
 */
export function getPlatform(): 'web' | 'desktop' {
  return isTauri() ? 'desktop' : 'web'
}

/**
 * Get platform display name
 *
 * @returns Human-readable platform name
 */
export function getPlatformName(): string {
  return isTauri() ? 'Desktop App' : 'Web App'
}

/**
 * Check if AI detection is available (real, not mock)
 *
 * @returns true if real AI is available (desktop only)
 */
export function hasRealAI(): boolean {
  return isTauri()
}
