import { PixelSpacing } from './pixelSpacing'

/**
 * Region-of-interest pixel statistics, expressed in physical units where the
 * modality LUT (rescale slope/intercept) and pixel spacing are available.
 */
export interface RoiStats {
  /** Mean rescaled pixel value */
  mean: number
  /** Population standard deviation of rescaled pixel values */
  stdDev: number
  /** Minimum rescaled pixel value */
  min: number
  /** Maximum rescaled pixel value */
  max: number
  /** Number of pixels sampled inside the ROI */
  pixelCount: number
  /** ROI area in mm² when pixel spacing is known, otherwise in px² */
  area: number
  /** Unit of `mean`/`stdDev`/`min`/`max`: 'HU' for CT, otherwise 'AU' */
  valueUnit: 'HU' | 'AU'
  /** Unit of `area`: 'mm²' when calibrated, otherwise 'px²' */
  areaUnit: 'mm²' | 'px²'
}

interface RoiStatsOptions {
  /** Raw stored pixel values sampled inside the ROI */
  pixelValues: ArrayLike<number>
  /** Modality LUT rescale slope (0028,1053); defaults to 1 */
  rescaleSlope?: number
  /** Modality LUT rescale intercept (0028,1052); defaults to 0 */
  rescaleIntercept?: number
  /** Pixel spacing for area calibration; null/undefined → area reported in px² */
  pixelSpacing?: PixelSpacing | null
  /** DICOM modality code (CT yields Hounsfield Units) */
  modality?: string
}

/**
 * Compute ROI statistics from a flat list of stored pixel values.
 *
 * Each stored value is converted to a physical value via
 * `rescaled = stored * slope + intercept` (DICOM Modality LUT). For CT this
 * yields Hounsfield Units; for other modalities the values are reported as
 * arbitrary units. Area is `pixelCount * rowSpacing * colSpacing` (mm²) when
 * spacing is known, otherwise the raw pixel count (px²).
 *
 * Pure function: no Cornerstone dependency, fully unit-testable.
 *
 * @param options - Pixel sample plus rescale/spacing/modality context
 * @returns Computed {@link RoiStats}. An empty sample yields all-zero stats.
 */
export function calculateRoiStats(options: RoiStatsOptions): RoiStats {
  const {
    pixelValues,
    rescaleSlope = 1,
    rescaleIntercept = 0,
    pixelSpacing,
    modality,
  } = options

  const pixelCount = pixelValues.length
  const isCt = (modality || '').toUpperCase() === 'CT'
  const valueUnit: 'HU' | 'AU' = isCt ? 'HU' : 'AU'
  const hasSpacing = !!pixelSpacing && pixelSpacing.row > 0 && pixelSpacing.col > 0
  const areaUnit: 'mm²' | 'px²' = hasSpacing ? 'mm²' : 'px²'

  if (pixelCount === 0) {
    return { mean: 0, stdDev: 0, min: 0, max: 0, pixelCount: 0, area: 0, valueUnit, areaUnit }
  }

  let sum = 0
  let min = Infinity
  let max = -Infinity

  for (let i = 0; i < pixelCount; i++) {
    const value = pixelValues[i] * rescaleSlope + rescaleIntercept
    sum += value
    if (value < min) min = value
    if (value > max) max = value
  }

  const mean = sum / pixelCount

  let varianceSum = 0
  for (let i = 0; i < pixelCount; i++) {
    const value = pixelValues[i] * rescaleSlope + rescaleIntercept
    const diff = value - mean
    varianceSum += diff * diff
  }
  const stdDev = Math.sqrt(varianceSum / pixelCount)

  const area = hasSpacing
    ? pixelCount * pixelSpacing!.row * pixelSpacing!.col
    : pixelCount

  return { mean, stdDev, min, max, pixelCount, area, valueUnit, areaUnit }
}
