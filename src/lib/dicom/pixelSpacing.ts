import { DicomMetadata } from '@/types'
import { Point2D } from '@/types/annotation'

/**
 * Physical spacing between pixel centres, in millimetres.
 * `row` is the spacing between adjacent rows (vertical, the first value of
 * DICOM Pixel Spacing) and `col` is the spacing between adjacent columns
 * (horizontal, the second value).
 */
export interface PixelSpacing {
  row: number
  col: number
}

/**
 * Resolve the millimetre-per-pixel spacing for an image from its DICOM metadata.
 *
 * Resolution order, per the DICOM standard:
 * 1. Pixel Spacing (0028,0030) — the calibrated spacing of the reconstructed image
 * 2. Imager Pixel Spacing (0018,1164) — the physical detector spacing (fallback,
 *    common on projection radiography where 0028,0030 is absent)
 *
 * @param metadata - The instance metadata (may be undefined)
 * @returns The row/column spacing in mm, or `null` when neither tag is present
 *          or the values are non-positive / not finite.
 */
export function getPixelSpacing(metadata?: DicomMetadata): PixelSpacing | null {
  if (!metadata) return null

  const candidates: ReadonlyArray<[number, number] | undefined> = [
    metadata.pixelSpacing,
    metadata.imagerPixelSpacing,
  ]

  for (const spacing of candidates) {
    if (!spacing) continue
    const [row, col] = spacing
    if (isValidSpacing(row) && isValidSpacing(col)) {
      return { row, col }
    }
  }

  return null
}

function isValidSpacing(value: number): boolean {
  return Number.isFinite(value) && value > 0
}

/**
 * Convert the distance between two pixel coordinates into millimetres using the
 * supplied pixel spacing. Horizontal travel is scaled by the column spacing and
 * vertical travel by the row spacing, so non-square pixels are handled correctly.
 *
 * @param p1 - First point in image pixel coordinates
 * @param p2 - Second point in image pixel coordinates
 * @param spacing - Pixel spacing in mm (from {@link getPixelSpacing})
 * @returns The Euclidean distance in millimetres
 */
export function pixelDistanceToMm(p1: Point2D, p2: Point2D, spacing: PixelSpacing): number {
  const dx = (p2.x - p1.x) * spacing.col
  const dy = (p2.y - p1.y) * spacing.row
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Raw (uncalibrated) pixel distance between two points. Used as a fallback when
 * pixel spacing is unavailable so a measurement can still be reported in "px".
 */
export function pixelDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}
