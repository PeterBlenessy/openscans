/**
 * Formats DICOM series descriptions into more readable names
 *
 * Handles common MR imaging abbreviations and conventions:
 * - t1, t2 -> T1, T2
 * - sag, cor, tra, ax -> Sagittal, Coronal, Transverse, Axial
 * - tse, tir, stir -> TSE, TIR, STIR
 * - Replaces underscores with spaces
 * - Capitalizes appropriately
 */

const abbreviationMap: Record<string, string> = {
  // Sequences
  't1': 'T1',
  't2': 'T2',
  'pd': 'PD',
  'flair': 'FLAIR',
  'stir': 'STIR',
  'tse': 'TSE',
  'tir': 'TIR',
  'gre': 'GRE',
  'epi': 'EPI',
  'dwi': 'DWI',
  'adc': 'ADC',
  'swi': 'SWI',
  'mpr': 'MPR',
  'vibe': 'VIBE',
  'flash': 'FLASH',
  'space': 'SPACE',

  // Orientations
  'sag': 'Sagittal',
  'cor': 'Coronal',
  'tra': 'Transverse',
  'ax': 'Axial',
  'axial': 'Axial',
  'oblique': 'Oblique',

  // Modifiers
  'fs': 'Fat Sat',
  'iso': 'Isotropic',
  'dark': 'Dark',
  'fluid': 'Fluid',
  'ny': 'NY',
  'nv': 'NV',
  'p2': 'P2',
  'p3': 'P3',

  // Contrast
  'pre': 'Pre-contrast',
  'post': 'Post-contrast',
  'gd': 'Gd',

  // Other
  'min': 'min',
  'sec': 'sec',
  '3d': '3D',
  '2d': '2D'
}

export function formatSeriesDescription(description: string | undefined): string {
  if (!description) return 'Unknown Series'

  // Replace underscores with spaces
  let formatted = description.replace(/_/g, ' ')

  // Split into words
  const words = formatted.split(' ')

  // Process each word
  const processedWords = words.map(word => {
    const lowerWord = word.toLowerCase()

    // Check if it's a known abbreviation
    if (abbreviationMap[lowerWord]) {
      return abbreviationMap[lowerWord]
    }

    // Check if it's a number with fraction (like "2/1")
    if (/^\d+\/\d+$/.test(word)) {
      return word
    }

    // Capitalize first letter of other words
    if (word.length > 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    }

    return word
  })

  return processedWords.join(' ')
}
