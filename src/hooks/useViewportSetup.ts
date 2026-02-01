/* eslint-disable react-hooks/exhaustive-deps */
import { RefObject, MutableRefObject, useEffect, useState } from 'react'
import { initCornerstone, cornerstone } from '../lib/cornerstone/initCornerstone'
import { DicomInstance, ViewportSettings } from '../types'

interface UseViewportSetupOptions {
  canvasRef: RefObject<HTMLDivElement>
  currentInstance: DicomInstance | null
  settings: ViewportSettings
  fitScaleRef: MutableRefObject<number>
  currentImageIdRef: MutableRefObject<string | null>
  setModality: (modality: string, dicomCenter?: number, dicomWidth?: number) => void
}

interface UseViewportSetupReturn {
  isInitialized: boolean
  error: string | null
}

/**
 * Hook for managing Cornerstone viewport setup and lifecycle.
 * Handles initialization, element enabling/disabling, image loading, and viewport updates.
 *
 * @param options - Configuration including canvas ref, instance, settings, and callbacks
 * @returns Object with isInitialized, error, and isLoadingImage state
 *
 * @example
 * ```tsx
 * const canvasRef = useRef<HTMLDivElement>(null)
 * const fitScaleRef = useRef(1)
 * const currentImageIdRef = useRef<string | null>(null)
 *
 * const { isInitialized, error, isLoadingImage } = useViewportSetup({
 *   canvasRef,
 *   currentInstance,
 *   settings,
 *   fitScaleRef,
 *   currentImageIdRef,
 *   setModality
 * })
 * ```
 */
export function useViewportSetup(options: UseViewportSetupOptions): UseViewportSetupReturn {
  const {
    canvasRef,
    currentInstance,
    settings,
    fitScaleRef,
    currentImageIdRef,
    setModality
  } = options

  const [isInitialized, setIsInitialized] = useState(false)
  const [isElementEnabled, setIsElementEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)

  // Update modality when current image changes
  useEffect(() => {
    if (currentInstance?.metadata) {
      const modality = currentInstance.metadata.modality || 'OT'
      const dicomCenter = currentInstance.metadata.windowCenter
      const dicomWidth = currentInstance.metadata.windowWidth

      // Update modality with this image's DICOM metadata
      // This updates the reset target while preserving user adjustments
      setModality(modality, dicomCenter, dicomWidth)
    }
  }, [currentInstance?.sopInstanceUID, setModality])

  // Initialize Cornerstone
  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        await initCornerstone()
        if (mounted) {
          setIsInitialized(true)
        }
      } catch (err) {
        console.error('Failed to initialize Cornerstone:', err)
        if (mounted) {
          setError('Failed to initialize DICOM viewer')
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  // Enable the element as a Cornerstone viewport
  useEffect(() => {
    if (!isInitialized || !canvasRef.current) return

    const element = canvasRef.current

    try {
      cornerstone.enable(element)
      // Force resize to ensure canvas fills container and uses devicePixelRatio for High-DPI displays
      // The 'true' parameter enables high-DPI support (scales canvas by devicePixelRatio)
      cornerstone.resize(element, true)
    } catch (err) {
      // Log the error but don't block the viewport - cornerstone-tools may throw
      // errors during initialization but the viewport still works for basic viewing
      console.warn('Cornerstone enable warning (non-critical):', err)
    }

    // Mark element as enabled even if there were non-critical warnings
    setIsElementEnabled(true)

    // Handle window resize for responsive high-DPI scaling
    const handleResize = () => {
      try {
        cornerstone.resize(element, true) // Re-apply high-DPI scaling on resize

        // Recalculate fit scale and reapply viewport after resize
        const viewport = cornerstone.getViewport(element)
        if (viewport) {
          // Try to get the current image
          const image = cornerstone.getImage(element)
          if (image) {
            const elementRect = element.getBoundingClientRect()
            const elementWidth = elementRect.width
            const elementHeight = elementRect.height

            // Recalculate the fit scale for the new container size
            const scaleX = elementWidth / image.width
            const scaleY = elementHeight / image.height
            const newFitScale = Math.min(scaleX, scaleY)

            // Calculate current zoom level to preserve it
            const oldFitScale = fitScaleRef.current || 1
            const currentZoom = viewport.scale / oldFitScale

            // Update the stored fit scale
            fitScaleRef.current = newFitScale

            // Reapply viewport with new fit scale and preserved zoom
            viewport.scale = newFitScale * currentZoom
            cornerstone.setViewport(element, viewport)
          }
        }
      } catch (err) {
        console.warn('Error resizing viewport:', err)
      }
    }

    window.addEventListener('resize', handleResize)

    // Use ResizeObserver to detect container size changes (e.g., when sidebars show/hide)
    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })

    resizeObserver.observe(element)

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      setIsElementEnabled(false)
      try {
        cornerstone.disable(element)
      } catch (err) {
        console.error('Error disabling element:', err)
      }
    }
  }, [isInitialized, canvasRef])

  // Load and display image
  useEffect(() => {
    if (!isInitialized || !isElementEnabled || !currentInstance || !canvasRef.current) return

    const element = canvasRef.current
    const imageId = currentInstance.imageId

    // Skip if this is already the displayed image
    if (currentImageIdRef.current === imageId) {
      return
    }

    // Verify element is actually enabled before trying to load
    try {
      const enabledElement = cornerstone.getEnabledElement(element)
      if (!enabledElement) {
        return
      }
    } catch (err) {
      return
    }

    // Mark image as loading to prevent viewport settings from interfering
    setIsLoadingImage(true)
    currentImageIdRef.current = imageId

    async function loadAndDisplayImage() {
      try {
        // Load the image
        const image = await cornerstone.loadImage(imageId)

        // Display it
        cornerstone.displayImage(element, image)

        // Resize canvas to fit container after image is loaded
        cornerstone.resize(element, true)

        // Apply viewport settings
        const viewport = cornerstone.getViewport(element)
        if (viewport) {
          // Use store values (modality-specific settings already loaded by setModality)
          const windowWidth = settings.windowWidth
          const windowCenter = settings.windowCenter

          // Calculate scale to fit image in viewport
          const elementRect = element.getBoundingClientRect()
          const elementWidth = elementRect.width
          const elementHeight = elementRect.height

          // Fit the image to the viewport by calculating the appropriate scale
          const scaleX = elementWidth / image.width
          const scaleY = elementHeight / image.height
          const fitScale = Math.min(scaleX, scaleY)

          // Store fitScale for zoom calculations
          fitScaleRef.current = fitScale

          viewport.voi.windowWidth = windowWidth
          viewport.voi.windowCenter = windowCenter
          viewport.scale = fitScale * settings.zoom
          viewport.translation = { x: settings.pan.x, y: settings.pan.y }
          viewport.rotation = settings.rotation
          viewport.hflip = settings.flipHorizontal
          viewport.vflip = settings.flipVertical
          viewport.invert = settings.invert

          cornerstone.setViewport(element, viewport)
        }

        setIsLoadingImage(false)
      } catch (err) {
        console.error('Failed to load DICOM image:', err)
        setError(`Failed to load DICOM image: ${err instanceof Error ? err.message : String(err)}`)
        setIsLoadingImage(false)
      }
    }

    loadAndDisplayImage()
  }, [isInitialized, isElementEnabled, currentInstance, settings, fitScaleRef, currentImageIdRef, canvasRef])

  // Update viewport settings when they change (but not during image loading)
  // Note: Interaction hooks (pan, zoom, window/level) handle their own direct viewport updates
  useEffect(() => {
    if (!isInitialized || !isElementEnabled || !currentInstance || !canvasRef.current || isLoadingImage) return

    const element = canvasRef.current

    try {
      const viewport = cornerstone.getViewport(element)
      if (viewport) {
        // Use stored settings (user adjustments take priority)
        // DICOM metadata is only used on initial image load, not here
        viewport.voi.windowWidth = settings.windowWidth
        viewport.voi.windowCenter = settings.windowCenter
        viewport.scale = fitScaleRef.current! * settings.zoom
        viewport.translation = { x: settings.pan.x, y: settings.pan.y }
        viewport.rotation = settings.rotation
        viewport.hflip = settings.flipHorizontal
        viewport.vflip = settings.flipVertical
        viewport.invert = settings.invert

        cornerstone.setViewport(element, viewport)
      }
    } catch (err) {
      console.error('Failed to update viewport:', err)
    }
  }, [isInitialized, isElementEnabled, currentInstance, settings, isLoadingImage, fitScaleRef, canvasRef])

  // Return Cornerstone initialization state for UI rendering
  // Element enablement happens automatically after canvas is rendered
  return { isInitialized, error }
}
