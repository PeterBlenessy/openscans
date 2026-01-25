import { useEffect, useState, useMemo } from 'react'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useViewportStore } from '@/stores/viewportStore'
import { useStudyStore } from '@/stores/studyStore'
import { MarkerAnnotation } from '@/types/annotation'
import { severityStyles } from '@/types/annotation'

interface AnnotationOverlayProps {
  canvasElement: HTMLDivElement | null
}

export function AnnotationOverlay({ canvasElement }: AnnotationOverlayProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const showAnnotations = useViewportStore((state) => state.showAnnotations)
  const currentInstance = useStudyStore((state) => state.currentInstance)
  const getAnnotationsForInstance = useAnnotationStore((state) => state.getAnnotationsForInstance)

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
    return getAnnotationsForInstance(currentInstance.sopInstanceUID)
  }, [currentInstance, showAnnotations, getAnnotationsForInstance])

  if (!canvasElement || !currentInstance || !showAnnotations || annotations.length === 0) {
    return null
  }

  // Calculate scale factors from image coordinates to viewport coordinates
  const scaleX = dimensions.width / currentInstance.columns
  const scaleY = dimensions.height / currentInstance.rows

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
              scaleX={scaleX}
              scaleY={scaleY}
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
  scaleX: number
  scaleY: number
}

function MarkerRenderer({ annotation, scaleX, scaleY }: MarkerRendererProps) {
  const style = severityStyles[annotation.severity]

  // Convert image coordinates to viewport coordinates
  const viewportX = annotation.position.x * scaleX
  const viewportY = annotation.position.y * scaleY

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
