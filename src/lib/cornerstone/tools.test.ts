import { describe, it, expect } from 'vitest'
import {
  isMeasurementTool,
  buildAnnotationFromMeasurement,
  MEASUREMENT_TOOL_NAMES,
} from './tools'
import { MeasurementAnnotation, RegionAnnotation } from '@/types/annotation'

const baseCtx = {
  seriesInstanceUID: 'series-1',
  sopInstanceUID: 'sop-1',
  instanceNumber: 3,
  id: 'm-1',
}

describe('isMeasurementTool', () => {
  it('recognises the four measurement/ROI tools', () => {
    expect(isMeasurementTool('Length')).toBe(true)
    expect(isMeasurementTool('Angle')).toBe(true)
    expect(isMeasurementTool('EllipticalRoi')).toBe(true)
    expect(isMeasurementTool('RectangleRoi')).toBe(true)
  })

  it('rejects non-measurement tools', () => {
    expect(isMeasurementTool('WindowLevel')).toBe(false)
    expect(isMeasurementTool('Pan')).toBe(false)
    expect(isMeasurementTool('')).toBe(false)
  })
})

describe('buildAnnotationFromMeasurement', () => {
  it('builds a calibrated length measurement (mm)', () => {
    const result = buildAnnotationFromMeasurement({
      ...baseCtx,
      toolName: MEASUREMENT_TOOL_NAMES.Length,
      data: { handles: { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }, length: 12.5 },
      pixelSpacing: { row: 1, col: 1 },
    }) as MeasurementAnnotation

    expect(result).not.toBeNull()
    expect(result.type).toBe('measurement')
    expect(result.measurementType).toBe('length')
    expect(result.value).toBe(12.5)
    expect(result.unit).toBe('mm')
    expect(result.points).toHaveLength(2)
    expect(result.description).toContain('12.5 mm')
    expect(result.instanceNumber).toBe(3)
  })

  it('falls back to px and flags uncalibrated when spacing is null', () => {
    const result = buildAnnotationFromMeasurement({
      ...baseCtx,
      toolName: MEASUREMENT_TOOL_NAMES.Length,
      data: { handles: { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }, length: 10 },
      pixelSpacing: null,
    }) as MeasurementAnnotation

    expect(result.unit).toBe('px')
    expect(result.description).toContain('uncalibrated')
  })

  it('builds an angle measurement with three points', () => {
    const result = buildAnnotationFromMeasurement({
      ...baseCtx,
      toolName: MEASUREMENT_TOOL_NAMES.Angle,
      data: {
        handles: { start: { x: 1, y: 0 }, middle: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
        rAngle: 90,
      },
      pixelSpacing: null,
    }) as MeasurementAnnotation

    expect(result.measurementType).toBe('angle')
    expect(result.value).toBe(90)
    expect(result.unit).toBe('°')
    expect(result.points).toHaveLength(3)
  })

  it('builds an elliptical ROI region with stats in the description', () => {
    const result = buildAnnotationFromMeasurement({
      ...baseCtx,
      toolName: MEASUREMENT_TOOL_NAMES.EllipticalRoi,
      data: {
        handles: { start: { x: 0, y: 0 }, end: { x: 10, y: 10 } },
        cachedStats: { mean: 42.3, area: 156.2 },
      },
      pixelSpacing: { row: 1, col: 1 },
    }) as RegionAnnotation

    expect(result.type).toBe('region')
    expect(result.closed).toBe(true)
    expect(result.points).toHaveLength(2)
    expect(result.description).toContain('Ellipse ROI')
    expect(result.description).toContain('Mean 42.3')
    expect(result.description).toContain('156.2 mm²')
  })

  it('builds a rectangle ROI region', () => {
    const result = buildAnnotationFromMeasurement({
      ...baseCtx,
      toolName: MEASUREMENT_TOOL_NAMES.RectangleRoi,
      data: { handles: { start: { x: 0, y: 0 }, end: { x: 5, y: 5 } }, cachedStats: {} },
      pixelSpacing: null,
    }) as RegionAnnotation

    expect(result.type).toBe('region')
    expect(result.description).toContain('Rectangle ROI')
  })

  it('returns null for incomplete handle data', () => {
    const result = buildAnnotationFromMeasurement({
      ...baseCtx,
      toolName: MEASUREMENT_TOOL_NAMES.Length,
      data: { handles: { start: { x: 0, y: 0 } } },
      pixelSpacing: null,
    })
    expect(result).toBeNull()
  })

  it('returns null for an unknown tool name', () => {
    const result = buildAnnotationFromMeasurement({
      ...baseCtx,
      toolName: 'WindowLevel',
      data: {},
      pixelSpacing: null,
    })
    expect(result).toBeNull()
  })
})
