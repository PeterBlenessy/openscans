import { describe, it, expect } from 'vitest'
import { isMeasurementTool } from './tools'

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
    expect(isMeasurementTool('Pointer')).toBe(false)
    expect(isMeasurementTool('Eraser')).toBe(false)
    expect(isMeasurementTool('')).toBe(false)
  })
})
