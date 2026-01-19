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

  const currentInstance = useStudyStore((state) => state.currentInstance)
  const settings = useViewportStore((state) => state.settings)

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
        console.log('Image object:', {width: image.width, height: image.height, color: image.color})

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
  }, [isInitialized, currentInstance, settings])

  // Update viewport settings when they change
  useEffect(() => {
    if (!isInitialized || !currentInstance || !canvasRef.current) return

    const element = canvasRef.current

    try {
      const viewport = cornerstone.getViewport(element)
      if (viewport) {
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
  }, [isInitialized, currentInstance, settings])

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
    <div className={`bg-black ${className}`}>
      <div
        ref={canvasRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}
