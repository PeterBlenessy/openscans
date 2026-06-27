/**
 * Standardized color palette for OpenScans
 *
 * Medical imaging applications require high-contrast colors that remain visible
 * on both dark and bright areas of grayscale images. This palette follows
 * PACS (Picture Archiving and Communication System) industry standards.
 */

/**
 * Annotation overlay colors - optimized for visibility on grayscale medical images
 * These colors are used for markers, measurements, and other annotations that
 * appear directly on top of DICOM images.
 */
export const annotationColors = {
  // Primary annotation colors (use these for normal annotations)
  cyan: '#00D9FF',      // Excellent visibility on all backgrounds - RECOMMENDED
  yellow: '#FFD700',    // Industry standard, best overall contrast
  magenta: '#FF00FF',   // Good visibility, distinct from other colors
  orange: '#FF6B35',    // Pure orange for markers - high visibility

  // Severity-based colors
  normal: '#FF6B35',    // Orange - warm and highly visible
  warning: '#FFC107',   // Amber - warm warning color
  critical: '#EF4444',  // Red - urgent/critical (preserve existing)

  // Special states
  adjusted: '#FFD700',  // Yellow - indicates user-modified annotations
  selected: '#FF00FF',  // Magenta - selected/active state
} as const

/** Default color for measurement / ROI tools (the cornerstone tool color). */
export const DEFAULT_TOOL_COLOR: string = annotationColors.orange

/**
 * Selectable colors for the measurement / ROI tool color picker in Settings.
 * All chosen for high contrast on grayscale medical images.
 */
export const TOOL_COLOR_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Orange', value: annotationColors.orange },
  { label: 'Yellow', value: annotationColors.yellow },
  { label: 'Cyan', value: annotationColors.cyan },
  { label: 'Magenta', value: annotationColors.magenta },
  { label: 'Green', value: '#22C55E' },
  { label: 'White', value: '#FFFFFF' },
]

/**
 * Stable, distinct color for an anatomical structure label so each segmented
 * structure (e.g. vertebra L1 vs T12 vs an organ) gets its own consistent color
 * across slices. The `vertebrae_` prefix is stripped so the same vertebra from
 * different AI sources (cloud "L1" vs engine "vertebrae_L1") matches.
 *
 * Uses a hashed HSL hue (fixed saturation/lightness tuned for contrast on the
 * grayscale image) rather than a fixed palette, so the ~100 structures
 * TotalSegmentator can emit stay distinguishable instead of colliding.
 */
export function colorForStructure(label: string): string {
  const key = label.trim().toLowerCase().replace(/^vertebrae[_-]/, '')
  if (!key) return annotationColors.orange
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  // Spread hues around the wheel; golden-angle stepping keeps nearby labels apart.
  const hue = (hash * 137) % 360
  return `hsl(${hue}, 80%, 62%)`
}

/**
 * UI element colors - for toolbar buttons, indicators, and interface elements
 * These appear in the UI chrome, not on the medical images themselves.
 */
export const uiColors = {
  // Primary UI colors
  white: '#FFFFFF',        // White - selected/active states
  grey: '#9CA3AF',         // Grey - default/unselected states
  darkGrey: '#6B7280',     // Dark grey - disabled state

  // Legacy/alternate UI colors
  primary: '#60A5FA',       // Soft blue - alternate primary actions
  primaryHover: '#3B82F6', // Darker blue - alternate hover state

  // Status indicators
  success: '#10B981',      // Green - successful operations
  warning: '#F59E0B',      // Orange - warnings
  error: '#EF4444',        // Red - errors
  info: '#60A5FA',         // Blue - informational

  // Special UI elements
  favorite: '#FBBF24',     // Gold - favorite/starred items (legacy)
  active: '#FFFFFF',       // White - active/selected state
  disabled: '#6B7280',     // Dark grey - disabled state
} as const

/**
 * Annotation style presets combining color with visual properties
 */
export const annotationStyles = {
  normal: {
    color: annotationColors.normal,
    lineWidth: 1.5,
    fillOpacity: 0.15,
  },
  warning: {
    color: annotationColors.warning,
    lineWidth: 1.5,
    fillOpacity: 0.2,
  },
  critical: {
    color: annotationColors.critical,
    lineWidth: 2,
    fillOpacity: 0.25,
  },
} as const

/**
 * Helper function to get RGBA color with custom opacity
 * Useful for creating semi-transparent overlays
 */
export function withOpacity(hexColor: string, opacity: number): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Tailwind-compatible color classes for annotation colors
 * Use these when you need Tailwind utility classes
 */
export const annotationColorClasses = {
  cyan: 'text-[#00D9FF]',
  yellow: 'text-[#FFD700]',
  magenta: 'text-[#FF00FF]',
  normal: 'text-[#00D9FF]',
  warning: 'text-[#FFC107]',
  critical: 'text-[#EF4444]',
  adjusted: 'text-[#FFD700]',
  selected: 'text-[#FF00FF]',
} as const

/**
 * Color palette rationale:
 *
 * 1. ORANGE (#FF6B35): Primary marker color
 *    - Excellent visibility on all grayscale backgrounds
 *    - Warm, attention-grabbing without being alarming
 *    - Used for all vertebrae markers (automatic and manual)
 *    - Fill opacity indicates manual adjustment (solid 80%) vs automatic (transparent 15%)
 *    - Narrow 1.5px stroke for clean appearance
 *
 * 2. WHITE (#FFFFFF): UI selected/active states
 *    - All selected/active buttons and icons appear white
 *    - Hover states change from grey to white
 *    - Maximum contrast against dark interface
 *
 * 3. GREY (#9CA3AF): UI default states
 *    - Default state for unselected buttons and icons
 *    - Changes to white on hover
 *
 * 4. CYAN (#00D9FF): UI indicators and alternate annotations
 *    - Used for zoom indicators and other UI elements
 *    - Excellent contrast on both dark and light areas
 *
 * 5. YELLOW (#FFD700): Best overall visibility
 *    - Industry standard in medical imaging
 *    - Used for window/level indicators
 *
 * 6. RED (#EF4444): Critical findings
 *    - Universal color for critical/urgent
 *    - High contrast and attention-grabbing
 */
