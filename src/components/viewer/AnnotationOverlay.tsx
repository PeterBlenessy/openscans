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
  const allAnnotations = useAnnotationStore((state) => state.annotations) // Subscribe to annotations array directly

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
    if (!currentInstance || !showAnnotations) {
      console.log('[AnnotationOverlay] Not showing annotations:', { hasInstance: !!currentInstance, showAnnotations })
      return []
    }
    const anns = allAnnotations.filter((ann) => ann.sopInstanceUID === currentInstance.sopInstanceUID)
    console.log(`[AnnotationOverlay] Found ${anns.length} annotations for sopInstanceUID: ${currentInstance.sopInstanceUID}`)
    return anns
  }, [currentInstance, showAnnotations, allAnnotations])

  if (!canvasElement || !currentInstance || !showAnnotations || annotations.length === 0) {
    console.log('[AnnotationOverlay] Not rendering:', { canvasElement: !!canvasElement, currentInstance: !!currentInstance, showAnnotations, annotationsCount: annotations.length })
    return null
  }

  // Wait for dimensions to be set by ResizeObserver
  if (dimensions.width === 0 || dimensions.height === 0) {
    console.log('[AnnotationOverlay] Waiting for dimensions...')
    return null
  }

  console.log('[AnnotationOverlay] Rendering:', {
    annotationCount: annotations.length,
    canvasDimensions: `${dimensions.width}x${dimensions.height}`
  })

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={dimensions.width}
      height={dimensions.height}
      style={{ zIndex: 10 }}
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

  // Convert image pixel coordinates to canvas coordinates using Cornerstone
  // This properly handles viewport transformations (scale, translation, rotation)
  const imageCoords = { x: annotation.position.x, y: annotation.position.y }
  const canvasCoords = cornerstone.pixelToCanvas(canvasElement, imageCoords)

  const viewportX = canvasCoords.x
  const viewportY = canvasCoords.y

  const radius = 8
  const labelOffsetX = 12
  const labelOffsetY = 5

  return (
    <g>
      {/* Marker circle */}
      <circle
        cx={viewportX}
        cy={viewportY}
        r={radius}
        fill={style.color}
        fillOpacity={style.fillOpacity}
        stroke={style.color}
        strokeWidth={style.lineWidth}
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
        >
          {annotation.label}
        </text>
      )}
    </g>
  )
}
