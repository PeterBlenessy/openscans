import { Point2D } from '@/types/annotation'

/**
 * Calculate the (unsigned) interior angle in degrees formed at `vertex` by the
 * two rays vertex→p1 and vertex→p2.
 *
 * Uses `atan2(|cross|, dot)` which is numerically robust across the full range
 * (it does not suffer the precision loss of `acos` near 0° / 180°). The result
 * is always in [0, 180].
 *
 * @param p1 - End of the first ray
 * @param vertex - The shared vertex where the two rays meet
 * @param p2 - End of the second ray
 * @returns Angle in degrees, in the range [0, 180]. Returns 0 when either ray
 *          has zero length (coincident points).
 */
export function calculateAngle(p1: Point2D, vertex: Point2D, p2: Point2D): number {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y }
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y }

  const len1 = Math.hypot(v1.x, v1.y)
  const len2 = Math.hypot(v2.x, v2.y)
  if (len1 === 0 || len2 === 0) return 0

  const dot = v1.x * v2.x + v1.y * v2.y
  const cross = v1.x * v2.y - v1.y * v2.x
  const radians = Math.atan2(Math.abs(cross), dot)
  return radians * (180 / Math.PI)
}
