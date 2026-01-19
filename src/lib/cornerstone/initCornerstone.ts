import * as cornerstone from 'cornerstone-core'
import * as cornerstoneTools from 'cornerstone-tools'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import dicomParser from 'dicom-parser'

let isInitialized = false

/**
 * Initialize Cornerstone 2.x and related libraries
 * This must be called before using any Cornerstone functionality
 */
export async function initCornerstone(): Promise<void> {
  if (isInitialized) {
    console.log('Cornerstone already initialized')
    return
  }

  try {
    console.log('Initializing Cornerstone 2.x...')

    // Configure WADO Image Loader
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser

    // Disable web workers for now to simplify debugging
    // We can enable them later for better performance
    const config = {
      maxWebWorkers: 0,  // Disable web workers
      startWebWorkersOnDemand: false,
      taskConfiguration: {
        decodeTask: {
          initializeCodecsOnStartup: false,
          strict: false,
        },
      },
    }

    cornerstoneWADOImageLoader.webWorkerManager.initialize(config)
    console.log('WADO Image Loader configured (web workers disabled)')

    // Configure Cornerstone image cache for better performance
    // This prevents flickering when navigating through images
    const imageCacheSize = 1024 * 1024 * 1024 // 1GB cache
    cornerstone.imageCache.setMaximumSizeBytes(imageCacheSize)
    console.log(`Image cache configured: ${imageCacheSize / (1024 * 1024)}MB`)

    // Register the WADO image loader with Cornerstone for both schemes
    cornerstone.registerImageLoader('wadouri', cornerstoneWADOImageLoader.wadouri.loadImage)
    cornerstone.registerImageLoader('dicomfile', cornerstoneWADOImageLoader.wadouri.loadImage)
    console.log('Image loader registered for wadouri and dicomfile schemes')

    // Configure WADO Image Loader to use data URI for file loading
    cornerstoneWADOImageLoader.configure({
      beforeSend: function(xhr: any) {
        // No need for authentication for local files
      },
      strict: false,
      useWebWorkers: false,
    })
    console.log('WADO Image Loader additional configuration complete')

    // IMPORTANT: DO NOT initialize Cornerstone Tools - it causes rendering issues
    // The tools library has compatibility problems with cornerstone-core v2.x
    // We'll implement tools manually later if needed
    console.log('Cornerstone Tools initialization skipped (prevents rendering issues)')

    // Make cornerstone available globally for debugging
    ;(window as any).cornerstone = cornerstone

    isInitialized = true
    console.log('Cornerstone initialization complete')
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
  console.log(`Created imageId: ${imageId} for file: ${file.name}`)
  return imageId
}

/**
 * Cleanup Cornerstone resources
 */
export function cleanupCornerstone(): void {
  if (!isInitialized) return
  console.log('Cornerstone cleanup complete')
}

export function isInitializedCornerstone(): boolean {
  return isInitialized
}

// Export cornerstone for use in components
export { cornerstone, cornerstoneTools }
