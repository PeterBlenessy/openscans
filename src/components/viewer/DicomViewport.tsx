import { useEffect, useRef, useState } from 'react'
import { useStudyStore } from '@/stores/studyStore'
import { useViewportStore } from '@/stores/viewportStore'
import { initCornerstone, cornerstone } from '@/lib/cornerstone/initCornerstone'
import { ViewportToolbar } from './ViewportToolbar'
import { ExportDialog } from '@/components/export/ExportDialog'

interface DicomViewportProps {
  className?: string
}

export function DicomViewport({ className = '' }: DicomViewportProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [isModifierKeyPressed, setIsModifierKeyPressed] = useState(false)
  const [currentWL, setCurrentWL] = useState({ width: 0, center: 0 })
  const [isActivelyZooming, setIsActivelyZooming] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const dragStartWL = useRef({ width: 0, center: 0 })
  const dragStartPan = useRef({ x: 0, y: 0 })
  const currentWLRef = useRef({ width: 0, center: 0 })
  const currentPanRef = useRef({ x: 0, y: 0 })
  const fitScaleRef = useRef(1)
  const currentImageIdRef = useRef<string | null>(null)
  const zoomTimeoutRef = useRef<number | null>(null)

  const currentInstance = useStudyStore((state) => state.currentInstance)
  const settings = useViewportStore((state) => state.settings)
  const setWindowLevel = useViewportStore((state) => state.setWindowLevel)
  const setModality = useViewportStore((state) => state.setModality)
  const setZoom = useViewportStore((state) => state.setZoom)
  const setPan = useViewportStore((state) => state.setPan)

  // When current image changes, update the DICOM reset target
  // W/L is per-image in DICOM, so each image can have different optimal values
  useEffect(() => {
    if (currentInstance?.metadata) {
      const modality = currentInstance.metadata.modality || 'OT'
      const dicomCenter = currentInstance.metadata.windowCenter
      const dicomWidth = currentInstance.metadata.windowWidth

      console.log(`Image changed: ${modality}, instance #${currentInstance.instanceNumber}, DICOM W/L: ${dicomCenter}/${dicomWidth}`)

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
      console.log('Enabling cornerstone element...')
      cornerstone.enable(element)
      console.log('✓ Element enabled')
      // Force resize to ensure canvas fills container and uses devicePixelRatio for High-DPI displays
      // The 'true' parameter enables high-DPI support (scales canvas by devicePixelRatio)
      cornerstone.resize(element, true)
      console.log(`✓ Element resized (devicePixelRatio: ${window.devicePixelRatio || 1})`)
      console.log('Cornerstone element enabled and resized successfully')
    } catch (err) {
      // Log the error but don't block the viewport - cornerstone-tools may throw
      // errors during initialization but the viewport still works for basic viewing
      console.warn('Warning during enable (non-critical):', err)
    }

    // Handle window resize for responsive high-DPI scaling
    const handleResize = () => {
      try {
        cornerstone.resize(element, true) // Re-apply high-DPI scaling on resize

        // Recalculate fit scale and reapply viewport after resize
        const viewport = cornerstone.getViewport(element)
        if (viewport && currentInstance) {
          const image = cornerstone.getImage(element)
          if (image) {
            const elementRect = element.getBoundingClientRect()
            const elementWidth = elementRect.width
            const elementHeight = elementRect.height

            // Recalculate the fit scale for the new container size
            const scaleX = elementWidth / image.width
            const scaleY = elementHeight / image.height
            const newFitScale = Math.min(scaleX, scaleY)

            // Update the stored fit scale
            fitScaleRef.current = newFitScale

            // Reapply viewport with new fit scale
            viewport.scale = newFitScale * settings.zoom
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
      try {
        cornerstone.disable(element)
      } catch (err) {
        console.error('Error disabling element:', err)
      }
    }
  }, [isInitialized])

  // Track modifier key state for cursor indication
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        setIsModifierKeyPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsModifierKeyPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Load and display image
  useEffect(() => {
    if (!isInitialized || !currentInstance || !canvasRef.current) return

    const element = canvasRef.current
    const imageId = currentInstance.imageId

    // Skip if this is already the displayed image
    if (currentImageIdRef.current === imageId) {
      console.log('Image already displayed, skipping reload:', imageId)
      return
    }

    // Mark image as loading to prevent viewport settings from interfering
    setIsLoadingImage(true)
    currentImageIdRef.current = imageId

    async function loadAndDisplayImage() {
      try {
        console.log('=== Starting image load ===')
        console.log('ImageId:', imageId)
        console.log('ImageId type:', typeof imageId)
        console.log('Current instance:', currentInstance)
        console.log('Element:', element)
        console.log('Element enabled?:', cornerstone.getEnabledElement ? 'getEnabledElement exists' : 'NO getEnabledElement')

        // Load the image
        console.log('Calling cornerstone.loadImage with imageId:', imageId)
        const image = await cornerstone.loadImage(imageId)
        console.log('✓ Image loaded successfully')

        // Display it
        console.log('Displaying image on element...')
        cornerstone.displayImage(element, image)
        console.log('Image displayed on element')

        // Resize canvas to fit container after image is loaded
        cornerstone.resize(element, true)
        console.log('Canvas resized after image load')

        // Apply viewport settings
        const viewport = cornerstone.getViewport(element)
        if (viewport) {
          // Use store values (modality-specific settings already loaded by setModality)
          const windowWidth = settings.windowWidth
          const windowCenter = settings.windowCenter

          console.log(`Applying W/L for ${currentInstance?.metadata?.modality}: center=${windowCenter}, width=${windowWidth}`)


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

          // Initialize currentWL state with the actual applied values
          setCurrentWL({ width: windowWidth, center: windowCenter })
        }

        console.log('Image displayed successfully')
        setIsLoadingImage(false)
      } catch (err) {
        console.error('Failed to load/display image:', err)
        console.error('Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
        console.error('Stack trace:', err instanceof Error ? err.stack : 'No stack trace')
        setError(`Failed to load DICOM image: ${err instanceof Error ? err.message : String(err)}`)
        setIsLoadingImage(false)
      }
    }

    loadAndDisplayImage()
  }, [isInitialized, currentInstance])

  // Update viewport settings when they change (but not during dragging, panning, or image loading)
  useEffect(() => {
    if (!isInitialized || !currentInstance || !canvasRef.current || isDragging || isPanning || isLoadingImage) return

    const element = canvasRef.current

    try {
      const viewport = cornerstone.getViewport(element)
      if (viewport) {
        // Use stored settings (user adjustments take priority)
        // DICOM metadata is only used on initial image load, not here
        viewport.voi.windowWidth = settings.windowWidth
        viewport.voi.windowCenter = settings.windowCenter
        viewport.scale = fitScaleRef.current * settings.zoom
        viewport.translation = { x: settings.pan.x, y: settings.pan.y }
        viewport.rotation = settings.rotation
        viewport.hflip = settings.flipHorizontal
        viewport.vflip = settings.flipVertical
        viewport.invert = settings.invert

        cornerstone.setViewport(element, viewport)

        // Update currentWL state to match the applied values
        setCurrentWL({ width: settings.windowWidth, center: settings.windowCenter })
      }
    } catch (err) {
      console.error('Failed to update viewport:', err)
    }
  }, [isInitialized, currentInstance, settings, isDragging, isPanning, isLoadingImage])

  // Mouse event handlers for window/level adjustment
  useEffect(() => {
    const element = canvasRef.current
    if (!element || !isInitialized) return

    let isCurrentlyDragging = false

    const handleMouseDown = (e: MouseEvent) => {
      // Left mouse button without modifier keys (Ctrl/Cmd are for pan)
      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
        isCurrentlyDragging = true
        setIsDragging(true)
        dragStartPos.current = { x: e.clientX, y: e.clientY }
        // Store the starting window/level values from current settings
        dragStartWL.current = { width: settings.windowWidth, center: settings.windowCenter }
        currentWLRef.current = { ...dragStartWL.current }
        setCurrentWL(dragStartWL.current)
        e.preventDefault()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isCurrentlyDragging) return

      // Calculate total delta from initial mouse down position
      const totalDeltaX = e.clientX - dragStartPos.current.x
      const totalDeltaY = e.clientY - dragStartPos.current.y

      // Adjust window/level based on mouse movement
      // Horizontal movement: window width (contrast)
      // Vertical movement: window center (brightness)
      const newWidth = Math.max(1, dragStartWL.current.width + totalDeltaX * 1.5)
      const newCenter = dragStartWL.current.center - totalDeltaY * 1.5

      // Store in ref for mouseUp
      currentWLRef.current = { width: newWidth, center: newCenter }

      // Apply directly to Cornerstone viewport (no store update yet)
      try {
        const viewport = cornerstone.getViewport(element)
        if (viewport) {
          viewport.voi.windowWidth = newWidth
          viewport.voi.windowCenter = newCenter
          cornerstone.setViewport(element, viewport)

          // Update local state for display only
          setCurrentWL({ width: newWidth, center: newCenter })
        }
      } catch (err) {
        console.error('Failed to update viewport during drag:', err)
      }
    }

    const handleMouseUp = () => {
      if (isCurrentlyDragging) {
        isCurrentlyDragging = false
        setIsDragging(false)
        // Now update the store with final values
        setWindowLevel(currentWLRef.current.center, currentWLRef.current.width)
      }
    }

    const handleMouseLeave = () => {
      if (isCurrentlyDragging) {
        isCurrentlyDragging = false
        setIsDragging(false)
        // Update store on mouse leave too
        setWindowLevel(currentWLRef.current.center, currentWLRef.current.width)
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
  }, [isInitialized, settings.windowWidth, settings.windowCenter, setWindowLevel])

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
        dragStartPos.current = { x: e.clientX, y: e.clientY }
        // Store the starting pan values from current settings
        dragStartPan.current = { x: settings.pan.x, y: settings.pan.y }
        currentPanRef.current = { ...dragStartPan.current }
        e.preventDefault()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isCurrentlyPanning) return

      // Calculate total delta from initial mouse down position
      const totalDeltaX = e.clientX - dragStartPos.current.x
      const totalDeltaY = e.clientY - dragStartPos.current.y

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

      console.log('[Zoom] Wheel - current:', currentZoomValue.toFixed(2), 'delta:', zoomDelta.toFixed(2), '→ new:', newZoom.toFixed(2))

      // Apply zoom directly to viewport
      try {
        const viewport = cornerstone.getViewport(element)
        if (viewport) {
          viewport.scale = fitScaleRef.current * newZoom
          cornerstone.setViewport(element, viewport)

          // Update store with new zoom value
          setZoom(newZoom)

          // Show prominent zoom indicator
          setIsActivelyZooming(true)

          // Clear existing timeout
          if (zoomTimeoutRef.current) {
            clearTimeout(zoomTimeoutRef.current)
          }

          // Fade to subtle after 1.5 seconds
          zoomTimeoutRef.current = setTimeout(() => {
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
        clearTimeout(zoomTimeoutRef.current)
      }
    }
  }, [isInitialized, settings.zoom, setZoom])

  // Watch for zoom changes from toolbar or other sources
  const prevZoomRef = useRef(settings.zoom)
  useEffect(() => {
    // Only trigger if zoom actually changed (not initial render)
    if (prevZoomRef.current !== settings.zoom && prevZoomRef.current !== 1) {
      setIsActivelyZooming(true)

      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current)
      }

      zoomTimeoutRef.current = setTimeout(() => {
        setIsActivelyZooming(false)
      }, 1500)
    }

    prevZoomRef.current = settings.zoom
  }, [settings.zoom])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-gray-400 text-center">
          <p className="text-xl">Initializing DICOM viewer...</p>
        </div>
      </div>
    )
  }

  if (!currentInstance) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-gray-400 text-center">
          <p className="text-xl">No image loaded</p>
          <p className="text-sm mt-2">Load DICOM files to begin</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-black ${className} relative`}>
      <div
        ref={canvasRef}
        className="w-full h-full bg-black"
        style={{
          cursor: isDragging ? 'crosshair' : isPanning ? 'grabbing' : isModifierKeyPressed ? 'grab' : 'crosshair',
          imageRendering: 'crisp-edges' // Pixel-perfect rendering for medical images - no interpolation
        }}
      />

      {/* Viewport Toolbar */}
      <ViewportToolbar
        className="absolute top-4 left-1/2 -translate-x-1/2 transition-all duration-300 ease-in-out"
        onExportClick={() => setShowExportDialog(true)}
      />

      {/* Export Dialog */}
      <ExportDialog
        show={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        viewportElement={canvasRef.current}
      />

      {/* Window/Level indicator - bottom-left corner (above zoom) */}
      <div
        className={`absolute bottom-[3.125rem] left-4 transition-all duration-300 ${
          isDragging
            ? 'bg-black/90 px-4 py-2.5 rounded-lg shadow-xl scale-110'
            : 'bg-black/60 px-3 py-1.5 rounded shadow-md'
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`transition-all duration-300 ${
              isDragging ? 'w-4 h-4 text-amber-400' : 'w-3 h-3 text-gray-500'
            }`}
          >
            <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
          </svg>
          <div
            className={`font-mono font-medium transition-all duration-300 flex gap-3 ${
              isDragging
                ? 'text-sm text-white'
                : 'text-[11px] text-gray-400'
            }`}
          >
            <span>C: {Math.round(currentWL.width)}</span>
            <span>B: {Math.round(currentWL.center)}</span>
          </div>
        </div>
      </div>


      {/* Pan indicator overlay */}
      {isPanning && (
        <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded shadow-lg">
          <div className="text-sm font-mono">
            <div>Panning</div>
          </div>
        </div>
      )}

      {/* Zoom level indicator - bottom-left corner */}
      <div
        className={`absolute bottom-4 left-4 transition-all duration-300 ${
          isActivelyZooming
            ? 'bg-black/90 px-4 py-2.5 rounded-lg shadow-xl scale-110'
            : 'bg-black/60 px-3 py-1.5 rounded shadow-md'
        }`}
      >
        <div className="flex items-baseline gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`transition-all duration-300 ${
              isActivelyZooming ? 'w-4 h-4 text-blue-400' : 'w-3 h-3 text-gray-500'
            }`}
          >
            <path d="M9 6a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 6z" />
            <path fillRule="evenodd" d="M2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9zm7-5.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" clipRule="evenodd" />
          </svg>
          <span
            className={`font-mono font-medium transition-all duration-300 ${
              isActivelyZooming
                ? 'text-base text-white'
                : 'text-xs text-gray-400'
            }`}
          >
            {settings.zoom.toFixed(1)}x
          </span>
        </div>
      </div>
    </div>
  )
}
