import { useEffect, useRef, forwardRef, useState } from 'react'
import { useStudyStore } from '@/stores/studyStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { useAiAnalysisStore } from '@/stores/aiAnalysisStore'
import { useAnnotationStore } from '@/stores/annotationStore'
import { cornerstone } from '@/lib/cornerstone/initCornerstone'
import { DicomInstance } from '@/types'

export function ThumbnailStrip() {
  const currentSeries = useStudyStore((state) => state.currentSeries)
  const currentInstanceIndex = useStudyStore((state) => state.currentInstanceIndex)
  const setCurrentInstance = useStudyStore((state) => state.setCurrentInstance)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([])

  // Auto-scroll to selected thumbnail when index changes
  useEffect(() => {
    const selectedThumbnail = thumbnailRefs.current[currentInstanceIndex]
    if (selectedThumbnail && scrollContainerRef.current) {
      selectedThumbnail.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
    }
  }, [currentInstanceIndex])

  if (!currentSeries || currentSeries.instances.length === 0) {
    return null
  }

  return (
    <div className="bg-[#0f0f0f] border-t border-[#2a2a2a] p-3 w-full">
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto pb-2 max-w-full"
      >
        {currentSeries.instances.map((instance, index) => (
          <Thumbnail
            key={instance.sopInstanceUID}
            instance={instance}
            index={index}
            isSelected={index === currentInstanceIndex}
            onClick={() => setCurrentInstance(index)}
            ref={(el) => (thumbnailRefs.current[index] = el)}
          />
        ))}
      </div>
    </div>
  )
}

interface ThumbnailProps {
  instance: DicomInstance
  index: number
  isSelected: boolean
  onClick: () => void
}

const Thumbnail = forwardRef<HTMLDivElement, ThumbnailProps>(
  ({ instance, index, isSelected, onClick }, ref) => {
    const canvasRef = useRef<HTMLDivElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const loadedRef = useRef(false)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    const currentStudy = useStudyStore((state) => state.currentStudy)
    const currentSeries = useStudyStore((state) => state.currentSeries)
    const currentInstanceIndex = useStudyStore((state) => state.currentInstanceIndex)
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)

    // Subscribe to favorites array to trigger re-render on changes
    const isFavorite = useFavoritesStore((state) =>
      state.favorites.some(f => f.sopInstanceUID === instance.sopInstanceUID)
    )

    // Subscribe to analyses to check if this image has analysis
    const hasAnalysis = useAiAnalysisStore((state) =>
      state.analyses.some(a => a.sopInstanceUID === instance.sopInstanceUID)
    )
    const showModal = useAiAnalysisStore((state) => state.showModal)
    const getAnalysisForInstance = useAiAnalysisStore((state) => state.getAnalysisForInstance)

    // Subscribe to annotations to check if this image has detector markers
    const hasAnnotations = useAnnotationStore((state) =>
      state.annotations.some(a => a.sopInstanceUID === instance.sopInstanceUID)
    )
    const toggleMarkerVisibility = useAnnotationStore((state) => state.toggleMarkerVisibility)
    const areMarkersVisible = useAnnotationStore((state) => state.areMarkersVisible(instance.sopInstanceUID))

    // Set up Intersection Observer for lazy loading with priority for nearby thumbnails
    useEffect(() => {
      const element = containerRef.current
      if (!element) return

      // Priority loading:
      // 1. Always load the selected thumbnail immediately
      // 2. Preload thumbnails within 5 positions of current (for smooth navigation)
      // 3. Lazy load others when they enter viewport
      const distanceFromCurrent = Math.abs(index - currentInstanceIndex)
      const shouldPreload = isSelected || distanceFromCurrent <= 5

      if (shouldPreload) {
        setIsVisible(true)
        return
      }

      // For other thumbnails, use Intersection Observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true)
              // Once visible, stop observing
              observerRef.current?.disconnect()
            }
          })
        },
        {
          root: null,
          rootMargin: '100px', // Start loading slightly before entering viewport
          threshold: 0.1,
        }
      )

      observerRef.current.observe(element)

      return () => {
        observerRef.current?.disconnect()
      }
    }, [isSelected, index, currentInstanceIndex])

    // Load the thumbnail image when it becomes visible
    useEffect(() => {
      if (!canvasRef.current || loadedRef.current || !isVisible) return

      const element = canvasRef.current

      async function loadThumbnail() {
        try {
          // Enable the element
          cornerstone.enable(element)

          // Load and display the image
          const image = await cornerstone.loadImage(instance.imageId)
          cornerstone.displayImage(element, image)

          // Fit the image to the thumbnail size
          const viewport = cornerstone.getViewport(element)
          if (viewport) {
            // Calculate scale to fit 80x80 thumbnail
            const scale = Math.min(80 / image.width, 80 / image.height)
            viewport.scale = scale
            cornerstone.setViewport(element, viewport)
          }

          loadedRef.current = true
          setIsLoaded(true)
        } catch (err) {
          console.error(`Failed to load thumbnail for instance ${index}:`, err)
          setIsLoaded(true) // Set loaded even on error to stop showing spinner
        }
      }

      loadThumbnail()

      return () => {
        try {
          if (loadedRef.current) {
            cornerstone.disable(element)
          }
        } catch (err) {
          // Ignore disable errors
        }
      }
    }, [instance.imageId, index, isVisible])

    return (
      <div
        ref={(el) => {
          // Set both refs - our internal ref and the forwarded ref
          containerRef.current = el
          if (typeof ref === 'function') {
            ref(el)
          } else if (ref && 'current' in ref) {
            // TypeScript guard - ensure ref is mutable
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = el
          }
        }}
        onClick={onClick}
        className={`flex-shrink-0 relative group cursor-pointer ${
          isSelected ? 'ring-2 ring-[#4a4a4a]' : 'ring-1 ring-[#2a2a2a]'
        } rounded overflow-hidden transition-all hover:ring-[#3a3a3a]`}
      >
        <div
          ref={canvasRef}
          className="w-20 h-20 bg-black relative"
          style={{
            minWidth: '80px',
            minHeight: '80px',
            imageRendering: 'crisp-edges' // Pixel-perfect rendering
          }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0f0f0f]">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-0.5 text-center">
          {index + 1}
        </div>
        {isSelected && (
          <div className="absolute inset-0 border-2 border-[#4a4a4a] pointer-events-none" />
        )}
        {/* Star icon for favorites - clickable to toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (currentStudy && currentSeries) {
              toggleFavorite({
                sopInstanceUID: instance.sopInstanceUID,
                studyInstanceUID: currentStudy.studyInstanceUID,
                seriesInstanceUID: currentSeries.seriesInstanceUID,
                instanceNumber: instance.instanceNumber,
                imageId: instance.imageId,
                patientName: instance.metadata?.patientName,
                studyDate: instance.metadata?.studyDate,
                seriesNumber: instance.metadata?.seriesNumber,
                seriesDescription: instance.metadata?.seriesDescription,
                modality: instance.metadata?.modality,
                favoritedAt: Date.now(),
              })
            }
          }}
          className="absolute top-1 right-1 p-0.5 rounded bg-black/40 hover:bg-black/70 transition-colors group"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isFavorite ? 0 : 1.5}
            className={`w-4 h-4 drop-shadow-[0_0_3px_rgba(0,0,0,0.8)] transition-colors ${
              isFavorite ? 'text-white' : 'text-gray-400 group-hover:text-white'
            }`}
          >
            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
          </svg>
        </button>
        {/* AI Analysis indicator - clickable */}
        {hasAnalysis && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              const analysis = getAnalysisForInstance(instance.sopInstanceUID)
              if (analysis) {
                showModal(analysis.id)
              }
            }}
            className="absolute top-1 left-1 p-0.5 rounded bg-black/40 hover:bg-black/70 transition-colors group"
            title="View AI analysis"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 drop-shadow-[0_0_3px_rgba(0,0,0,0.8)] transition-colors text-gray-400 group-hover:text-white"
            >
              <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {/* Detector markers toggle indicator - clickable */}
        {hasAnnotations && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleMarkerVisibility(instance.sopInstanceUID)
            }}
            className="absolute bottom-1 left-1 p-0.5 rounded bg-black/60 hover:bg-black/80 transition-colors group"
            title={areMarkersVisible ? "Hide markers" : "Show markers"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-3.5 h-3.5 drop-shadow-[0_0_3px_rgba(0,0,0,0.8)] transition-colors ${
                areMarkersVisible ? 'text-white' : 'text-gray-400 group-hover:text-white'
              }`}
            >
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

Thumbnail.displayName = 'Thumbnail'
