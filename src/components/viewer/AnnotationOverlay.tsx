import { useEffect, useState, useMemo } from 'react'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useViewportStore } from '@/stores/viewportStore'
import { useStudyStore } from '@/stores/studyStore'
import { MarkerAnnotation } from '@/types/annotation'
import { severityStyles } from '@/types/annotation'
import cornerstone from 'cornerstone-core'

interface AnnotationOverlayProps {
  canvasElement: HTMLDivElement | null
}

export function AnnotationOverlay({ canvasElement }: AnnotationOverlayProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const showAnnotations = useViewportStore((state) => state.showAnnotations)
  const currentInstance = useStudyStore((state) => state.currentInstance)
  const allAnnotations = useAnnotationStore((state) => state.annotations)

  // Track canvas dimensions
  useEffect(() => {
    if (!canvasElement) return

    const updateDimensions = () => {
      const rect = canvasElement.getBoundingClientRect()
      setDimensions({ width: rect.width, height: rect.height })
    }

    // Initial dimensions
    updateDimensions()

    // Watch for resize
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(canvasElement)

    return () => {
      resizeObserver.disconnect()
    }
  }, [canvasElement])

  // Get annotations for current instance
  const annotations = useMemo(() => {
    if (!currentInstance || !showAnnotations) return []
    return allAnnotations.filter((ann) => ann.sopInstanceUID === currentInstance.sopInstanceUID)
  }, [currentInstance, showAnnotations, allAnnotations])

  if (!canvasElement || !currentInstance || !showAnnotations || annotations.length === 0) {
    return null
  }

  // Wait for dimensions to be set by ResizeObserver
  if (dimensions.width === 0 || dimensions.height === 0) {
    return null
  }

  return (
    <svg
      className="absolute inset-0"
      width={dimensions.width}
      height={dimensions.height}
      style={{ zIndex: 10, pointerEvents: 'none' }}
    >
      {annotations.map((annotation) => {
        if (annotation.type === 'marker') {
          return (
            <MarkerRenderer
              key={annotation.id}
              annotation={annotation}
              canvasElement={canvasElement}
            />
          )
        }
        return null
      })}
    </svg>
  )
}

interface MarkerRendererProps {
  annotation: MarkerAnnotation
  canvasElement: HTMLDivElement
}

function MarkerRenderer({ annotation, canvasElement }: MarkerRendererProps) {
  const style = severityStyles[annotation.severity]
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const updateAnnotation = useAnnotationStore((state) => state.updateAnnotation)

  // Convert image pixel coordinates to canvas coordinates using Cornerstone
  // This properly handles viewport transformations (scale, translation, rotation)
  const imageCoords = { x: annotation.position.x, y: annotation.position.y }
  const canvasCoords = cornerstone.pixelToCanvas(canvasElement, imageCoords)

  const viewportX = canvasCoords.x + dragOffset.x
  const viewportY = canvasCoords.y + dragOffset.y

  const radius = 8
  const labelOffsetX = 12
  const labelOffsetY = 5

  // Visual indicator: different border color for manually adjusted markers
  const borderColor = annotation.manuallyAdjusted ? '#3b82f6' : style.color // blue for adjusted, original color otherwise

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    setDragOffset({
      x: dragOffset.x + e.movementX,
      y: dragOffset.y + e.movementY
    })
  }

  const handleMouseUp = () => {
    if (!isDragging) return

    // Convert final canvas position back to image coordinates
    const finalCanvasX = canvasCoords.x + dragOffset.x
    const finalCanvasY = canvasCoords.y + dragOffset.y
    const finalImageCoords = cornerstone.canvasToPixel(canvasElement, { x: finalCanvasX, y: finalCanvasY })

    const deltaX = finalImageCoords.x - annotation.position.x
    const deltaY = finalImageCoords.y - annotation.position.y

    console.log(`[AnnotationOverlay] ${annotation.label} adjusted: (${deltaX.toFixed(1)}, ${deltaY.toFixed(1)})px`)

    // Update the annotation with corrected position
    updateAnnotation(annotation.id, {
      position: {
        x: finalImageCoords.x,
        y: finalImageCoords.y
      }
    })

    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
  }

  return (
    <g
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', pointerEvents: 'all' }}
    >
      {/* Marker circle */}
      <circle
        cx={viewportX}
        cy={viewportY}
        r={radius}
        fill={style.color}
        fillOpacity={style.fillOpacity}
        stroke={borderColor}
        strokeWidth={annotation.manuallyAdjusted ? 3 : style.lineWidth}
      />

      {/* Label */}
      {annotation.label && (
        <text
          x={viewportX + labelOffsetX}
          y={viewportY + labelOffsetY}
          fill={style.color}
          fontSize="14px"
          fontWeight="bold"
          fontFamily="sans-serif"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {annotation.label}
        </text>
      )}
    </g>
  )
}
