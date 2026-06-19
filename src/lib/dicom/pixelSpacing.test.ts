import { describe, it, expect } from 'vitest'
import { getPixelSpacing, pixelDistanceToMm, pixelDistance } from './pixelSpacing'
import { DicomMetadata } from '@/types'

describe('getPixelSpacing', () => {
  it('returns Pixel Spacing (0028,0030) when present', () => {
    const metadata: DicomMetadata = { pixelSpacing: [0.5, 0.6] }
    expect(getPixelSpacing(metadata)).toEqual({ row: 0.5, col: 0.6 })
  })

  it('falls back to Imager Pixel Spacing (0018,1164) when Pixel Spacing is absent', () => {
    const metadata: DicomMetadata = { imagerPixelSpacing: [0.2, 0.2] }
    expect(getPixelSpacing(metadata)).toEqual({ row: 0.2, col: 0.2 })
  })

  it('prefers Pixel Spacing over Imager Pixel Spacing', () => {
    const metadata: DicomMetadata = {
      pixelSpacing: [0.5, 0.5],
      imagerPixelSpacing: [0.143, 0.143],
    }
    expect(getPixelSpacing(metadata)).toEqual({ row: 0.5, col: 0.5 })
  })

  it('returns null when neither tag is present', () => {
    expect(getPixelSpacing({})).toBeNull()
  })

  it('returns null when metadata is undefined', () => {
    expect(getPixelSpacing(undefined)).toBeNull()
  })

  it('rejects non-positive spacing values', () => {
    expect(getPixelSpacing({ pixelSpacing: [0, 0.5] })).toBeNull()
    expect(getPixelSpacing({ pixelSpacing: [-1, 0.5] })).toBeNull()
  })

  it('rejects non-finite spacing values and tries the fallback', () => {
    const metadata: DicomMetadata = {
      pixelSpacing: [NaN, 0.5],
      imagerPixelSpacing: [0.3, 0.3],
    }
    expect(getPixelSpacing(metadata)).toEqual({ row: 0.3, col: 0.3 })
  })
})

describe('pixelDistanceToMm', () => {
  it('computes calibrated distance with square pixels', () => {
    const mm = pixelDistanceToMm({ x: 0, y: 0 }, { x: 3, y: 4 }, { row: 1, col: 1 })
    expect(mm).toBeCloseTo(5, 5) // 3-4-5 triangle
  })

  it('scales horizontal and vertical travel by column/row spacing respectively', () => {
    // 10px horizontal at 0.5mm/px col => 5mm
    const horizontal = pixelDistanceToMm({ x: 0, y: 0 }, { x: 10, y: 0 }, { row: 2, col: 0.5 })
    expect(horizontal).toBeCloseTo(5, 5)
    // 10px vertical at 2mm/px row => 20mm
    const vertical = pixelDistanceToMm({ x: 0, y: 0 }, { x: 0, y: 10 }, { row: 2, col: 0.5 })
    expect(vertical).toBeCloseTo(20, 5)
  })

  it('handles non-square pixels in a diagonal measurement', () => {
    // dx=4px*0.25=1mm, dy=3px*1=3mm => sqrt(1+9)=sqrt(10)
    const mm = pixelDistanceToMm({ x: 0, y: 0 }, { x: 4, y: 3 }, { row: 1, col: 0.25 })
    expect(mm).toBeCloseTo(Math.sqrt(10), 5)
  })

  it('returns 0 for coincident points', () => {
    expect(pixelDistanceToMm({ x: 5, y: 5 }, { x: 5, y: 5 }, { row: 1, col: 1 })).toBe(0)
  })
})

describe('pixelDistance', () => {
  it('computes raw pixel distance', () => {
    expect(pixelDistance({ x: 0, y: 0 }, { x: 6, y: 8 })).toBeCloseTo(10, 5)
  })
})
