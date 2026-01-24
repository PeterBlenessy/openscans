import { useEffect, useRef, forwardRef } from 'react'
import { useStudyStore } from '@/stores/studyStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { cornerstone } from '@/lib/cornerstone/initCornerstone'
import { DicomInstance } from '@/types'

export function ThumbnailStrip() {
  const currentSeries = useStudyStore((state) => state.currentSeries)
  const currentInstanceIndex = useStudyStore((state) => state.currentInstanceIndex)
  const setCurrentInstance = useStudyStore((state) => state.setCurrentInstance)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([])

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

const Thumbnail = forwardRef<HTMLButtonElement, ThumbnailProps>(
  ({ instance, index, isSelected, onClick }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null)
    const loadedRef = useRef(false)

    // Subscribe to favorites array to trigger re-render on changes
    const isFavorite = useFavoritesStore((state) =>
      state.favorites.some(f => f.sopInstanceUID === instance.sopInstanceUID)
    )

    useEffect(() => {
      if (!canvasRef.current || loadedRef.current) return

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
        } catch (err) {
          console.error(`Failed to load thumbnail for instance ${index}:`, err)
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
    }, [instance.imageId, index])

    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`flex-shrink-0 relative group ${
          isSelected ? 'ring-2 ring-[#4a4a4a]' : 'ring-1 ring-[#2a2a2a]'
        } rounded overflow-hidden transition-all hover:ring-[#3a3a3a]`}
      >
        <div
          ref={canvasRef}
          className="w-20 h-20 bg-black"
          style={{
            minWidth: '80px',
            minHeight: '80px',
            imageRendering: 'crisp-edges' // Pixel-perfect rendering
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-0.5 text-center">
          {index + 1}
        </div>
        {isSelected && (
          <div className="absolute inset-0 border-2 border-[#4a4a4a] pointer-events-none" />
        )}
        {isFavorite && (
          <div className="absolute top-1 right-1 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-yellow-500 drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]"
            >
              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </button>
    )
  }
)

Thumbnail.displayName = 'Thumbnail'
