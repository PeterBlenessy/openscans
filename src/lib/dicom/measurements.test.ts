import { describe, it, expect } from 'vitest'
import { calculateAngle } from './measurements'

describe('calculateAngle', () => {
  const vertex = { x: 0, y: 0 }

  it('measures a 90° right angle', () => {
    const angle = calculateAngle({ x: 1, y: 0 }, vertex, { x: 0, y: 1 })
    expect(angle).toBeCloseTo(90, 5)
  })

  it('measures a 45° acute angle', () => {
    const angle = calculateAngle({ x: 1, y: 0 }, vertex, { x: 1, y: 1 })
    expect(angle).toBeCloseTo(45, 5)
  })

  it('measures a 135° obtuse angle', () => {
    const angle = calculateAngle({ x: 1, y: 0 }, vertex, { x: -1, y: 1 })
    expect(angle).toBeCloseTo(135, 5)
  })

  it('measures a 180° straight line', () => {
    const angle = calculateAngle({ x: 1, y: 0 }, vertex, { x: -1, y: 0 })
    expect(angle).toBeCloseTo(180, 5)
  })

  it('measures a 0° (coincident direction) angle', () => {
    const angle = calculateAngle({ x: 2, y: 0 }, vertex, { x: 1, y: 0 })
    expect(angle).toBeCloseTo(0, 5)
  })

  it('is sign-independent (returns the unsigned angle)', () => {
    const a = calculateAngle({ x: 0, y: 1 }, vertex, { x: 1, y: 0 })
    const b = calculateAngle({ x: 1, y: 0 }, vertex, { x: 0, y: 1 })
    expect(a).toBeCloseTo(b, 5)
    expect(a).toBeCloseTo(90, 5)
  })

  it('works with a vertex away from the origin', () => {
    const angle = calculateAngle({ x: 10, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 15 })
    expect(angle).toBeCloseTo(90, 5)
  })

  it('returns 0 when a ray has zero length (coincident points)', () => {
    expect(calculateAngle(vertex, vertex, { x: 1, y: 1 })).toBe(0)
    expect(calculateAngle({ x: 1, y: 1 }, vertex, vertex)).toBe(0)
  })
})
