/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error - cornerstone-core doesn't have TypeScript definitions
import * as cornerstone from 'cornerstone-core'
// @ts-expect-error - cornerstone-tools doesn't have TypeScript definitions
import * as cornerstoneTools from 'cornerstone-tools'
// @ts-expect-error - cornerstone-math doesn't ship TypeScript definitions
import * as cornerstoneMath from 'cornerstone-math'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import dicomParser from 'dicom-parser'
// @ts-expect-error - hammerjs may not ship type defs in this install
import Hammer from 'hammerjs'
import { isTauri } from '../utils/platform'
import { DEFAULT_TOOL_COLOR } from '../colors'

let isInitialized = false
let toolsInitialized = false

/**
 * Initialize cornerstone-tools and register the built-in measurement / ROI tools.
 *
 * cornerstone-tools needs its external peer dependencies (cornerstone-core,
 * cornerstone-math, hammerjs) wired before `init()`. After init we register the
 * length (ruler), angle, elliptical-ROI and rectangle-ROI tools so they can be
 * activated per-element from the viewport. Idempotent — safe to call repeatedly.
 *
 * Wrapped in a try/catch so a failure to load tools never blocks plain viewing.
 */
function initCornerstoneTools(): void {
  if (toolsInitialized) return

  try {
    cornerstoneTools.external.cornerstone = cornerstone
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath
    cornerstoneTools.external.Hammer = Hammer

    // Let Cornerstone read pixel spacing/rescale from the WADO image so the
    // measurement tools report calibrated mm / HU values where available.
    cornerstoneTools.init({
      mouseEnabled: true,
      touchEnabled: true,
      showSVGCursors: true,
    })

    // Built-in measurement + ROI tools (cornerstone-tools v6), plus the eraser
    // (click an annotation to delete it).
    cornerstoneTools.addTool(cornerstoneTools.LengthTool)
    cornerstoneTools.addTool(cornerstoneTools.AngleTool)
    cornerstoneTools.addTool(cornerstoneTools.CobbAngleTool)
    cornerstoneTools.addTool(cornerstoneTools.EllipticalRoiTool)
    cornerstoneTools.addTool(cornerstoneTools.RectangleRoiTool)
    cornerstoneTools.addTool(cornerstoneTools.ProbeTool)
    cornerstoneTools.addTool(cornerstoneTools.EraserTool)
    // Passive, always-on overlays (no interaction): L/R/A/P orientation letters
    // and a calibrated mm scale bar.
    cornerstoneTools.addTool(cornerstoneTools.OrientationMarkersTool)
    cornerstoneTools.addTool(cornerstoneTools.ScaleOverlayTool)

    toolsInitialized = true

    // Default measurement color; the `toolColor` setting overrides this live
    // (applied by useViewportTools).
    applyToolColor(DEFAULT_TOOL_COLOR)
  } catch (err) {
    console.warn('[CornerstoneTools] Initialization failed (measurement tools disabled):', err)
  }
}

export function areToolsInitialized(): boolean {
  return toolsInitialized
}

/**
 * Set the global color cornerstone-tools uses to draw measurements / ROIs and
 * redraw any enabled elements so the change is immediate. No-op until tools
 * are initialized; safe to call repeatedly.
 */
export function applyToolColor(color: string): void {
  if (!toolsInitialized) return
  try {
    cornerstoneTools.toolColors.setToolColor(color)
    cornerstoneTools.toolColors.setActiveColor(color)
    cornerstone.getEnabledElements?.().forEach((e: any) => {
      try {
        cornerstone.updateImage(e.element)
      } catch {
        /* element has no image displayed yet — nothing to redraw */
      }
    })
  } catch {
    /* toolColors API missing — non-fatal */
  }
}

/**
 * Register the measurement / ROI tools on a specific enabled element.
 *
 * Global `cornerstoneTools.addTool` only attaches tools to elements that
 * cornerstone-tools is tracking, and it only starts tracking an element via the
 * `ELEMENT_ENABLED` event that fires *after* `cornerstoneTools.init()`. Our
 * viewport element is enabled before tools-init completes, so it never receives
 * the global tools and `setToolActiveForElement` warns "Unable to find tool …"
 * (the toolbar's measure buttons then do nothing). Adding per-element here is
 * timing-independent. Idempotent — skips when the tools are already present.
 */
export function addMeasurementToolsForElement(element: HTMLElement): void {
  if (!toolsInitialized) return
  try {
    // Already registered on this element? (avoids "tool already added" noise.)
    if (cornerstoneTools.getToolForElement(element, 'Length')) return
  } catch {
    // getToolForElement throws if the element isn't tracked yet — fall through
    // and add the tools below.
  }
  try {
    cornerstoneTools.addToolForElement(element, cornerstoneTools.LengthTool)
    cornerstoneTools.addToolForElement(element, cornerstoneTools.AngleTool)
    cornerstoneTools.addToolForElement(element, cornerstoneTools.CobbAngleTool)
    cornerstoneTools.addToolForElement(element, cornerstoneTools.EllipticalRoiTool)
    cornerstoneTools.addToolForElement(element, cornerstoneTools.RectangleRoiTool)
    cornerstoneTools.addToolForElement(element, cornerstoneTools.ProbeTool)
    cornerstoneTools.addToolForElement(element, cornerstoneTools.EraserTool)
    // Always-on overlays (orientation markers + mm scale bar). Enabled = drawn
    // on every render, no mouse interaction.
    cornerstoneTools.addToolForElement(element, cornerstoneTools.OrientationMarkersTool)
    cornerstoneTools.addToolForElement(element, cornerstoneTools.ScaleOverlayTool)
    cornerstoneTools.setToolEnabledForElement(element, 'OrientationMarkers')
    cornerstoneTools.setToolEnabledForElement(element, 'ScaleOverlay')
  } catch (err) {
    console.warn('[CornerstoneTools] Failed to add measurement tools for element:', err)
  }
}

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

    // Register measurement / ROI tools (non-fatal if it fails).
    initCornerstoneTools()

    // Register the WADO image loader's own metaData provider so cornerstone-tools
    // (the position-sync synchronizer, orientation markers, probe HU, scale
    // overlay) can read slice geometry / VOI / scaling straight from the parsed
    // DICOM — no custom provider needed.
    cornerstone.metaData.addProvider(cornerstoneWADOImageLoader.wadouri.metaData.metaDataProvider)

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
