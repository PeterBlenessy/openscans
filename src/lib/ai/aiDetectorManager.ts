/**
 * AI Detector Manager - Lazy loads AI providers on demand
 *
 * This module provides a centralized way to access AI detectors while
 * using dynamic imports to avoid bundling all AI SDKs in the initial load.
 *
 * Only the selected AI provider SDK is loaded when first used, reducing
 * initial bundle size by ~1.8MB (600KB × 3 providers).
 */

import { VisionDetector } from './types'
import { AIProvider } from '@/stores/settingsStore'

// Cache loaded detectors to avoid re-importing
const detectorCache: Partial<Record<AIProvider, VisionDetector>> = {}

/**
 * Get the AI detector for the specified provider, loading it dynamically if needed.
 *
 * This function uses dynamic imports to load only the requested provider's SDK,
 * keeping other providers out of the bundle until needed.
 *
 * @param provider - AI provider ('claude', 'gemini', 'openai', or 'none')
 * @returns Promise resolving to the detector instance, or null for 'none'
 *
 * @example
 * ```ts
 * const detector = await getDetector('claude')
 * if (detector) {
 *   detector.setApiKey(apiKey)
 *   const result = await detector.detectVertebrae(instance)
 * }
 * ```
 */
export async function getDetector(provider: AIProvider): Promise<VisionDetector | null> {
  if (provider === 'none') {
    return null
  }

  // Return cached detector if already loaded
  if (detectorCache[provider]) {
    return detectorCache[provider]!
  }

  // Dynamically import the provider
  switch (provider) {
    case 'claude': {
      const { claudeDetector } = await import('./claudeVisionDetector')
      detectorCache.claude = claudeDetector
      return claudeDetector
    }
    case 'gemini': {
      const { geminiDetector } = await import('./geminiVisionDetector')
      detectorCache.gemini = geminiDetector
      return geminiDetector
    }
    case 'openai': {
      const { openaiDetector } = await import('./openaiVisionDetector')
      detectorCache.openai = openaiDetector
      return openaiDetector
    }
    default:
      return null
  }
}

/**
 * Initialize the detector with an API key.
 *
 * Convenience function that combines getting the detector and setting its API key.
 *
 * @param provider - AI provider
 * @param apiKey - API key for the provider
 * @returns Promise resolving to the configured detector, or null if none
 *
 * @example
 * ```ts
 * const detector = await initDetector('claude', settings.aiApiKey)
 * if (detector) {
 *   // Detector is ready to use
 *   const result = await detector.analyzeImage(instance)
 * }
 * ```
 */
export async function initDetector(
  provider: AIProvider,
  apiKey: string
): Promise<VisionDetector | null> {
  const detector = await getDetector(provider)
  if (detector && apiKey) {
    detector.setApiKey(apiKey)
  }
  return detector
}

/**
 * Check if a detector is configured (loaded and has API key set).
 *
 * @param provider - AI provider to check
 * @returns Promise resolving to true if detector is configured
 *
 * @example
 * ```ts
 * if (await isDetectorConfigured('claude')) {
 *   // Detector is ready, no need to prompt for API key
 * }
 * ```
 */
export async function isDetectorConfigured(provider: AIProvider): Promise<boolean> {
  if (provider === 'none') {
    return false
  }

  const detector = await getDetector(provider)
  return detector ? detector.isConfigured() : false
}

/**
 * Get API key for a specific provider from settings.
 *
 * Helper function to get the correct API key based on provider.
 *
 * @param provider - AI provider
 * @param settings - Settings object with API keys
 * @returns API key string or empty string if none
 */
export function getApiKeyForProvider(
  provider: AIProvider,
  settings: { aiApiKey: string; geminiApiKey: string; openaiApiKey: string }
): string {
  switch (provider) {
    case 'claude':
      return settings.aiApiKey
    case 'gemini':
      return settings.geminiApiKey
    case 'openai':
      return settings.openaiApiKey
    default:
      return ''
  }
}
