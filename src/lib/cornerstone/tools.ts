import { MeasurementAnnotation, RegionAnnotation, Point2D } from '@/types/annotation'
import { PixelSpacing } from '../dicom/pixelSpacing'
import { useAnnotationStore } from '@/stores/annotationStore'
import { clearMeasurementToolState } from './initCornerstone'

/**
 * cornerstone-tools tool names for the measurement / ROI tools we register.
 * These string identifiers match the `name` of each built-in tool class and are
 * what `setToolActive` / `setToolPassive` and the `activeTool` store field use.
 */
export const MEASUREMENT_TOOL_NAMES = {
  Length: 'Length',
  Angle: 'Angle',
  EllipticalRoi: 'EllipticalRoi',
  RectangleRoi: 'RectangleRoi',
} as const

export type MeasurementToolName = keyof typeof MEASUREMENT_TOOL_NAMES

const MEASUREMENT_TOOL_SET = new Set<string>(Object.values(MEASUREMENT_TOOL_NAMES))

/**
 * Remove all measurement / ROI annotations for an instance — both the persisted
 * store overlay and cornerstone-tools' in-session copy. Backs the toolbar
 * "Clear measurements" button.
 */
export function clearMeasurements(sopInstanceUID: string): void {
  useAnnotationStore.getState().clearMeasurementsForInstance(sopInstanceUID)
  clearMeasurementToolState()
}

/**
 * Delete a single measurement / ROI annotation. We also drop cornerstone-tools'
 * own copies (we can't map one store annotation to one cornerstone measurement);
 * the remaining annotations stay rendered via the SVG overlay from the store.
 */
export function deleteMeasurement(annotationId: string): void {
  useAnnotationStore.getState().deleteAnnotation(annotationId)
  clearMeasurementToolState()
}

/** True when `toolName` is one of the cornerstone-tools measurement/ROI tools. */
export function isMeasurementTool(toolName: string): boolean {
  return MEASUREMENT_TOOL_SET.has(toolName)
}

/** A 2D handle as emitted in cornerstone-tools measurement data. */
interface ToolHandle {
  x: number
  y: number
}

/** Subset of cornerstone-tools measurement data we consume. */
export interface ToolMeasurementData {
  handles?: {
    start?: ToolHandle
    middle?: ToolHandle
    end?: ToolHandle
  }
  /** Length tool: computed length (mm when calibrated, px otherwise) */
  length?: number
  /** Angle tool: computed angle in degrees (rAngle) */
  rAngle?: number
  /** ROI tools: cached statistics */
  cachedStats?: {
    area?: number
    mean?: number
    stdDev?: number
    min?: number
    max?: number
  }
  unit?: string
}

interface BuildAnnotationContext {
  toolName: string
  data: ToolMeasurementData
  seriesInstanceUID: string
  sopInstanceUID: string
  instanceNumber: number
  /** Pixel spacing for the instance; null → measurements fall back to px */
  pixelSpacing: PixelSpacing | null
  /** Stable id (defaults to a generated one) */
  id: string
}

function toPoint(handle?: ToolHandle): Point2D | null {
  if (!handle || typeof handle.x !== 'number' || typeof handle.y !== 'number') return null
  return { x: handle.x, y: handle.y }
}

/**
 * Translate a completed cornerstone-tools measurement into the project's
 * persisted annotation shape (`MeasurementAnnotation` for length/angle,
 * `RegionAnnotation` for the ROI tools).
 *
 * Length and angle values come straight from cornerstone-tools, which already
 * applies the image's pixel spacing when present. When spacing is absent the
 * unit is reported as `px` / `°` and a caller can surface a calibration warning.
 *
 * @returns The annotation to persist, or `null` if the measurement data is
 *          incomplete (e.g. the user cancelled before placing all handles).
 */
export function buildAnnotationFromMeasurement(
  ctx: BuildAnnotationContext
): MeasurementAnnotation | RegionAnnotation | null {
  const { toolName, data, pixelSpacing } = ctx
  const base = {
    id: ctx.id,
    seriesInstanceUID: ctx.seriesInstanceUID,
    sopInstanceUID: ctx.sopInstanceUID,
    instanceNumber: ctx.instanceNumber,
    severity: 'normal' as const,
    createdAt: new Date().toISOString(),
    createdBy: 'user',
  }

  const hasSpacing = !!pixelSpacing

  switch (toolName) {
    case MEASUREMENT_TOOL_NAMES.Length: {
      const start = toPoint(data.handles?.start)
      const end = toPoint(data.handles?.end)
      if (!start || !end) return null
      const value = data.length ?? 0
      const unit = hasSpacing ? 'mm' : 'px'
      return {
        ...base,
        type: 'measurement',
        points: [start, end],
        measurementType: 'length',
        value,
        unit,
        description: `Length: ${value.toFixed(1)} ${unit}${hasSpacing ? '' : ' (uncalibrated)'}`,
      }
    }

    case MEASUREMENT_TOOL_NAMES.Angle: {
      const start = toPoint(data.handles?.start)
      const middle = toPoint(data.handles?.middle)
      const end = toPoint(data.handles?.end)
      if (!start || !middle || !end) return null
      const value = data.rAngle ?? 0
      return {
        ...base,
        type: 'measurement',
        points: [start, middle, end],
        measurementType: 'angle',
        value,
        unit: '°',
        description: `Angle: ${value.toFixed(1)}°`,
      }
    }

    case MEASUREMENT_TOOL_NAMES.EllipticalRoi:
    case MEASUREMENT_TOOL_NAMES.RectangleRoi: {
      const start = toPoint(data.handles?.start)
      const end = toPoint(data.handles?.end)
      if (!start || !end) return null
      const stats = data.cachedStats || {}
      const areaUnit = hasSpacing ? 'mm²' : 'px²'
      const mean = stats.mean
      const area = stats.area
      const shape = toolName === MEASUREMENT_TOOL_NAMES.EllipticalRoi ? 'Ellipse' : 'Rectangle'
      const parts: string[] = []
      if (typeof mean === 'number') parts.push(`Mean ${mean.toFixed(1)}`)
      if (typeof area === 'number') parts.push(`Area ${area.toFixed(1)} ${areaUnit}`)
      // ROI corners stored as a rectangle bounding box (top-left / bottom-right).
      return {
        ...base,
        type: 'region',
        points: [start, end],
        closed: true,
        description: parts.length ? `${shape} ROI: ${parts.join(', ')}` : `${shape} ROI`,
      }
    }

    default:
      return null
  }
}
