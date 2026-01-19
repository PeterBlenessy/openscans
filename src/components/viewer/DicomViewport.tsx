import { useEffect, useRef, useState } from 'react'
import { useStudyStore } from '@/stores/studyStore'
import { useViewportStore } from '@/stores/viewportStore'
import { initCornerstone, cornerstone } from '@/lib/cornerstone/initCornerstone'

interface DicomViewportProps {
  className?: string
}

export function DicomViewport({ className = '' }: DicomViewportProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [currentWL, setCurrentWL] = useState({ width: 0, center: 0 })
  const dragStartPos = useRef({ x: 0, y: 0 })
  const dragStartWL = useRef({ width: 0, center: 0 })
  const currentWLRef = useRef({ width: 0, center: 0 })

  const currentInstance = useStudyStore((state) => state.currentInstance)
  const settings = useViewportStore((state) => state.settings)
  const setWindowLevel = useViewportStore((state) => state.setWindowLevel)

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
      // Force resize to ensure canvas fills the container
      cornerstone.resize(element, true)
      console.log('✓ Element resized')
      console.log('Cornerstone element enabled and resized successfully')
    } catch (err) {
      // Log the error but don't block the viewport - cornerstone-tools may throw
      // errors during initialization but the viewport still works for basic viewing
      console.warn('Warning during enable (non-critical):', err)
    }

    return () => {
      try {
        cornerstone.disable(element)
      } catch (err) {
        console.error('Error disabling element:', err)
      }
    }
  }, [isInitialized])

  // Load and display image
  useEffect(() => {
    if (!isInitialized || !currentInstance || !canvasRef.current) return

    const element = canvasRef.current
    const imageId = currentInstance.imageId

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
        console.log('Image object:', {
          width: image.width,
          height: image.height,
          color: image.color,
          minPixelValue: image.minPixelValue,
          maxPixelValue: image.maxPixelValue
        })

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
          // Use DICOM metadata window/level if available, otherwise use stored settings
          // This is crucial for different modalities (MR vs X-ray) which have very different ranges
          const windowWidth = currentInstance.metadata.windowWidth || settings.windowWidth
          const windowCenter = currentInstance.metadata.windowCenter || settings.windowCenter

          console.log('[W/L] Image load - DICOM metadata W/L:', currentInstance.metadata.windowWidth, '/', currentInstance.metadata.windowCenter)
          console.log('[W/L] Image load - Using W/L:', windowWidth, '/', windowCenter)

          // Calculate scale to fit image in viewport
          const elementRect = element.getBoundingClientRect()
          const elementWidth = elementRect.width
          const elementHeight = elementRect.height

          // Fit the image to the viewport by calculating the appropriate scale
          const scaleX = elementWidth / image.width
          const scaleY = elementHeight / image.height
          const fitScale = Math.min(scaleX, scaleY)

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

        console.log('Image displayed successfully')
      } catch (err) {
        console.error('Failed to load/display image:', err)
        console.error('Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
        console.error('Stack trace:', err instanceof Error ? err.stack : 'No stack trace')
        setError(`Failed to load DICOM image: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    loadAndDisplayImage()
  }, [isInitialized, currentInstance])

  // Update viewport settings when they change (but not during dragging)
  useEffect(() => {
    if (!isInitialized || !currentInstance || !canvasRef.current || isDragging) return

    const element = canvasRef.current

    try {
      const viewport = cornerstone.getViewport(element)
      if (viewport) {
        console.log('[W/L] Applying settings from store - W:', settings.windowWidth, 'L:', settings.windowCenter)
        viewport.voi.windowWidth = settings.windowWidth
        viewport.voi.windowCenter = settings.windowCenter
        viewport.scale = settings.zoom
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
  }, [isInitialized, currentInstance, settings, isDragging])

  // Mouse event handlers for window/level adjustment
  useEffect(() => {
    const element = canvasRef.current
    if (!element || !isInitialized) return

    let isCurrentlyDragging = false
    let moveCounter = 0

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left mouse button
        isCurrentlyDragging = true
        setIsDragging(true)
        dragStartPos.current = { x: e.clientX, y: e.clientY }
        // Store the starting window/level values from current settings
        dragStartWL.current = { width: settings.windowWidth, center: settings.windowCenter }
        currentWLRef.current = { ...dragStartWL.current }
        setCurrentWL(dragStartWL.current)
        console.log('[W/L] Mouse down - starting values:', dragStartWL.current)
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
      const newWidth = Math.max(1, dragStartWL.current.width + totalDeltaX * 4)
      const newCenter = dragStartWL.current.center - totalDeltaY * 4

      // Store in ref for mouseUp
      currentWLRef.current = { width: newWidth, center: newCenter }

      // Apply directly to Cornerstone viewport (no store update yet)
      try {
        const viewport = cornerstone.getViewport(element)
        if (viewport) {
          // Log every 10th move to avoid spam
          if (moveCounter++ % 10 === 0) {
            console.log('[W/L] Drag - deltaX:', totalDeltaX, 'deltaY:', totalDeltaY, '→ W:', Math.round(newWidth), 'L:', Math.round(newCenter))
          }
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
        console.log('[W/L] Mouse up - final values:', currentWLRef.current)
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
        className="w-full h-full"
        style={{
          minHeight: '400px',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      />

      {/* Window/Level indicator overlay */}
      {isDragging && (
        <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded shadow-lg">
          <div className="text-sm font-mono">
            <div>W: {Math.round(currentWL.width)}</div>
            <div>L: {Math.round(currentWL.center)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
