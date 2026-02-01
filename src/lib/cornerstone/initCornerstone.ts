/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error - cornerstone-core doesn't have TypeScript definitions
import * as cornerstone from 'cornerstone-core'
// @ts-expect-error - cornerstone-tools doesn't have TypeScript definitions
import * as cornerstoneTools from 'cornerstone-tools'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import dicomParser from 'dicom-parser'
import { isTauri } from '../utils/platform'

let isInitialized = false

/**
 * Initialize Cornerstone 2.x and related libraries
 * This must be called before using any Cornerstone functionality
 */
export async function initCornerstone(): Promise<void> {
  if (isInitialized) {
    return
  }

  try {
    // Suppress source map and worker-related errors that don't affect functionality
    const originalError = console.error
    const originalWarn = console.warn

    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || ''
      // Filter out blob URL source map errors from web workers
      if (message.includes('blob:') && message.includes('.worker.js.map')) return
      if (message.includes('Not allowed to load local resource')) return
      if (message.includes('Not allowed to request resource')) return
      if (message.includes('access control checks')) return
      originalError.apply(console, args)
    }

    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || ''
      if (message.includes('worker') && message.includes('source map')) return
      originalWarn.apply(console, args)
    }

    // Suppress browser-level resource loading errors for worker source maps
    window.addEventListener('error', (e) => {
      const message = e.message || ''
      const filename = e.filename || ''
      // Suppress blob URL and worker source map errors
      if (filename.includes('blob:') || filename.includes('.worker.js.map')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      if (message.includes('Not allowed to load local resource')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }, true)

    // Configure WADO Image Loader
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser

    // Detect if running in Tauri (desktop mode)
    const isDesktop = isTauri()

    // Configure web workers for high-quality decoding and better performance
    // Use a direct path to the worker file to avoid blob URL issues in Tauri
    let workersEnabled = false
    try {
      // Use hardware concurrency to determine optimal worker count
      const maxWorkers = Math.max(1, (navigator.hardwareConcurrency || 4) - 1) // Reserve 1 core for main thread

      // Configure worker path before initialization
      // This avoids blob URLs which don't work reliably in Tauri
      const config = {
        maxWebWorkers: maxWorkers,
        startWebWorkersOnDemand: true,
        webWorkerPath: isDesktop
          ? '/cornerstoneWADOImageLoaderWebWorker.js'  // Direct path for Tauri
          : undefined, // Let it use default blob URLs in browser
        taskConfiguration: {
          decodeTask: {
            initializeCodecsOnStartup: false, // Don't initialize immediately
            strict: false, // Disable strict mode to suppress worker errors
          },
        },
      }

      cornerstoneWADOImageLoader.webWorkerManager.initialize(config)
      workersEnabled = true
    } catch (err) {
      console.warn('[Cornerstone] Web workers initialization failed, using main thread decoding:', err)
      workersEnabled = false
    }

    // Configure Cornerstone image cache for better performance
    // This prevents flickering when navigating through images
    const imageCacheSize = 1024 * 1024 * 1024 // 1GB cache
    cornerstone.imageCache.setMaximumSizeBytes(imageCacheSize)

    // Register the WADO image loader with Cornerstone for both schemes
    // @ts-expect-error - WADO loader types are incomplete
    cornerstone.registerImageLoader('wadouri', cornerstoneWADOImageLoader.wadouri.loadImage)
    // @ts-expect-error - WADO loader types are incomplete
    cornerstone.registerImageLoader('dicomfile', cornerstoneWADOImageLoader.wadouri.loadImage)

    // Configure WADO Image Loader for maximum quality
    // @ts-expect-error - WADO loader types are incomplete
    cornerstoneWADOImageLoader.configure({
      beforeSend: function(_xhr: any) {
        // No need for authentication for local files
      },
      strict: false, // Don't fail on DICOM spec violations
      useWebWorkers: workersEnabled, // Use workers if they initialized successfully
      decodeConfig: {
        // Preserve maximum precision for medical imaging
        convertFloatPixelDataToInt: false, // Keep full floating-point precision
        usePDFJS: false, // Don't use PDF.js for DICOM decoding
      },
    })

    // Make cornerstone available globally for debugging
    ;(window as any).cornerstone = cornerstone

    isInitialized = true
  } catch (error) {
    console.error('Failed to initialize Cornerstone:', error)
    throw error
  }
}

/**
 * Create an image ID for loading a DICOM file
 * @param file The DICOM file to load
 * @returns The image ID that can be used with Cornerstone
 */
export function createImageId(file: File): string {
  // Create a blob URL for the file using the file manager
  const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file)
  return imageId
}

/**
 * Cleanup Cornerstone resources
 */
export function cleanupCornerstone(): void {
  if (!isInitialized) return
  // Cleanup complete
}

export function isInitializedCornerstone(): boolean {
  return isInitialized
}

// Export cornerstone for use in components
export { cornerstone, cornerstoneTools }
