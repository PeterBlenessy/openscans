import { RefObject, useEffect, useState, useRef } from 'react'
import { useViewportStore } from '../stores/viewportStore'
import { cornerstone } from '../lib/cornerstone/initCornerstone'

interface UseViewportPanAndZoomOptions {
  fitScaleRef: RefObject<number>
}

/**
 * Hook for handling pan (Ctrl+drag) and zoom (scroll wheel) interactions on a DICOM viewport.
 * Provides smooth pan/zoom by applying changes directly to Cornerstone during interactions
 * and updating the store only on completion.
 *
 * @param canvasRef - Reference to the viewport canvas element
 * @param isInitialized - Whether Cornerstone is initialized on the element
 * @param options - Configuration options including fitScaleRef for zoom calculations
 * @returns Object with isPanning and isActivelyZooming state
 *
 * @example
 * ```tsx
 * const canvasRef = useRef<HTMLDivElement>(null)
 * const fitScaleRef = useRef(1)
 * const [isInitialized, setIsInitialized] = useState(false)
 * const { isPanning, isActivelyZooming } = useViewportPanAndZoom(
 *   canvasRef,
 *   isInitialized,
 *   { fitScaleRef }
 * )
 * ```
 */
export function useViewportPanAndZoom(
  canvasRef: RefObject<HTMLDivElement>,
  isInitialized: boolean,
  options: UseViewportPanAndZoomOptions
) {
  const { fitScaleRef } = options

  const [isPanning, setIsPanning] = useState(false)
  const [isActivelyZooming, setIsActivelyZooming] = useState(false)

  const panDragStartPos = useRef({ x: 0, y: 0 })
  const dragStartPan = useRef({ x: 0, y: 0 })
  const currentPanRef = useRef({ x: 0, y: 0 })
  const zoomTimeoutRef = useRef<number | null>(null)
  const prevZoomRef = useRef(1)

  const settings = useViewportStore((s) => s.settings)
  const setPan = useViewportStore((s) => s.setPan)
  const setZoom = useViewportStore((s) => s.setZoom)

  // Mouse event handlers for pan (Ctrl/Cmd + drag)
  useEffect(() => {
    const element = canvasRef.current
    if (!element || !isInitialized) return

    let isCurrentlyPanning = false

    const handleMouseDown = (e: MouseEvent) => {
      // Left mouse button + Ctrl (Windows/Linux) or Cmd (Mac)
      if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
        isCurrentlyPanning = true
        setIsPanning(true)
        panDragStartPos.current = { x: e.clientX, y: e.clientY }
        // Store the starting pan values from current settings
        dragStartPan.current = { x: settings.pan.x, y: settings.pan.y }
        currentPanRef.current = { ...dragStartPan.current }
        e.preventDefault()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isCurrentlyPanning) return

      // Calculate total delta from initial mouse down position
      const totalDeltaX = e.clientX - panDragStartPos.current.x
      const totalDeltaY = e.clientY - panDragStartPos.current.y

      // Calculate new pan position
      const newPanX = dragStartPan.current.x + totalDeltaX
      const newPanY = dragStartPan.current.y + totalDeltaY

      // Store in ref for mouseUp
      currentPanRef.current = { x: newPanX, y: newPanY }

      // Apply directly to Cornerstone viewport (no store update yet)
      try {
        const viewport = cornerstone.getViewport(element)
        if (viewport) {
          viewport.translation = { x: newPanX, y: newPanY }
          cornerstone.setViewport(element, viewport)
        }
      } catch (err) {
        console.error('Failed to update pan during drag:', err)
      }
    }

    const handleMouseUp = () => {
      if (isCurrentlyPanning) {
        isCurrentlyPanning = false
        setIsPanning(false)
        // Now update the store with final values
        setPan(currentPanRef.current.x, currentPanRef.current.y)
      }
    }

    const handleMouseLeave = () => {
      if (isCurrentlyPanning) {
        isCurrentlyPanning = false
        setIsPanning(false)
        // Update store on mouse leave too
        setPan(currentPanRef.current.x, currentPanRef.current.y)
      }
    }

    element.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isInitialized, settings.pan.x, settings.pan.y, setPan])

  // Mouse wheel event handler for zoom
  useEffect(() => {
    const element = canvasRef.current
    if (!element || !isInitialized) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      // Calculate zoom delta (negative deltaY = scroll up = zoom in)
      const zoomDelta = -Math.sign(e.deltaY) * 0.05

      // Get current zoom from store and calculate new zoom
      const currentZoomValue = settings.zoom
      const newZoom = Math.max(0.1, Math.min(20, currentZoomValue + zoomDelta))

      // Apply zoom directly to viewport
      try {
        const viewport = cornerstone.getViewport(element)
        if (viewport) {
          viewport.scale = fitScaleRef.current! * newZoom
          cornerstone.setViewport(element, viewport)

          // Update store with new zoom value
          setZoom(newZoom)

          // Show prominent zoom indicator
          setIsActivelyZooming(true)

          // Clear existing timeout
          if (zoomTimeoutRef.current) {
            window.clearTimeout(zoomTimeoutRef.current)
          }

          // Fade to subtle after 1.5 seconds
          zoomTimeoutRef.current = window.setTimeout(() => {
            setIsActivelyZooming(false)
          }, 1500)
        }
      } catch (err) {
        console.error('Failed to update zoom:', err)
      }
    }

    element.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      element.removeEventListener('wheel', handleWheel)
      if (zoomTimeoutRef.current) {
        window.clearTimeout(zoomTimeoutRef.current)
      }
    }
  }, [isInitialized, settings.zoom, setZoom, fitScaleRef])

  // Watch for zoom changes from toolbar or other sources
  useEffect(() => {
    // Only trigger if zoom actually changed (not initial render)
    if (prevZoomRef.current !== settings.zoom && prevZoomRef.current !== 1) {
      setIsActivelyZooming(true)

      if (zoomTimeoutRef.current) {
        window.clearTimeout(zoomTimeoutRef.current)
      }

      zoomTimeoutRef.current = window.setTimeout(() => {
        setIsActivelyZooming(false)
      }, 1500)
    }

    prevZoomRef.current = settings.zoom
  }, [settings.zoom])

  return { isPanning, isActivelyZooming }
}
