import { describe, it, expect } from 'vitest'
import { calculateRoiStats } from './roiStatistics'

describe('calculateRoiStats', () => {
  it('computes mean/min/max/stdDev over raw values (no rescale)', () => {
    const stats = calculateRoiStats({ pixelValues: [10, 20, 30, 40] })
    expect(stats.mean).toBeCloseTo(25, 5)
    expect(stats.min).toBe(10)
    expect(stats.max).toBe(40)
    expect(stats.pixelCount).toBe(4)
    // population std dev of [10,20,30,40] = sqrt(125) ≈ 11.18
    expect(stats.stdDev).toBeCloseTo(Math.sqrt(125), 5)
  })

  it('applies rescale slope/intercept (CT Hounsfield Units)', () => {
    // stored 0 -> -1000, stored 1000 -> 0 with slope 1, intercept -1000
    const stats = calculateRoiStats({
      pixelValues: [0, 1000, 2000],
      rescaleSlope: 1,
      rescaleIntercept: -1000,
      modality: 'CT',
    })
    expect(stats.min).toBe(-1000)
    expect(stats.max).toBe(1000)
    expect(stats.mean).toBeCloseTo(0, 5)
    expect(stats.valueUnit).toBe('HU')
  })

  it('reports AU for non-CT modalities', () => {
    const stats = calculateRoiStats({ pixelValues: [1, 2, 3], modality: 'MR' })
    expect(stats.valueUnit).toBe('AU')
  })

  it('computes area in mm² when pixel spacing is provided', () => {
    const stats = calculateRoiStats({
      pixelValues: [1, 2, 3, 4], // 4 pixels
      pixelSpacing: { row: 0.5, col: 0.5 }, // 0.25 mm² each
    })
    expect(stats.area).toBeCloseTo(1, 5) // 4 * 0.25
    expect(stats.areaUnit).toBe('mm²')
  })

  it('falls back to px² area when pixel spacing is missing', () => {
    const stats = calculateRoiStats({ pixelValues: [1, 2, 3, 4] })
    expect(stats.area).toBe(4)
    expect(stats.areaUnit).toBe('px²')
  })

  it('handles non-square pixel spacing for area', () => {
    const stats = calculateRoiStats({
      pixelValues: [1, 2, 3, 4, 5], // 5 pixels
      pixelSpacing: { row: 2, col: 0.5 }, // 1 mm² each
    })
    expect(stats.area).toBeCloseTo(5, 5)
  })

  it('returns all-zero stats for an empty ROI', () => {
    const stats = calculateRoiStats({ pixelValues: [] })
    expect(stats).toMatchObject({ mean: 0, stdDev: 0, min: 0, max: 0, pixelCount: 0, area: 0 })
  })

  it('treats a degenerate single-pixel ROI sensibly', () => {
    const stats = calculateRoiStats({ pixelValues: [42] })
    expect(stats.mean).toBe(42)
    expect(stats.min).toBe(42)
    expect(stats.max).toBe(42)
    expect(stats.stdDev).toBe(0)
    expect(stats.pixelCount).toBe(1)
  })
})
