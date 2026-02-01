import { create } from 'zustand'
import { ViewportSettings, Tool } from '@/types'

/**
 * Window/Level settings specific to each imaging modality.
 *
 * Stores both user-adjusted values and original DICOM metadata values.
 * This allows resetting to DICOM defaults per image while preserving user
 * preferences across different images of the same modality.
 */
interface ModalityWindowLevel {
  /** Current window center value (user-adjusted or default) */
  windowCenter: number
  /** Current window width value (user-adjusted or default) */
  windowWidth: number
  /** Original DICOM metadata values for the current image (used by reset button) */
  dicomDefault?: { windowCenter: number; windowWidth: number }
}

/**
 * Viewport store state interface.
 *
 * Manages all viewport display settings including:
 * - Modality-specific window/level (brightness/contrast)
 * - Geometric transformations (zoom, pan, rotation, flip)
 * - Tool activation and overlay visibility
 * - AI detection state
 *
 * Key features:
 * - Per-modality window/level memory (CT, MR, CR, etc.)
 * - DICOM metadata-aware defaults with user override capability
 * - Independent reset behavior per modality
 */
interface ViewportState {
  /** Current viewport display settings (W/L, zoom, pan, etc.) */
  settings: ViewportSettings
  /** Current imaging modality (MR, CT, CR, DX, etc.) */
  currentModality: string
  /** Window/Level settings per modality (preserves user adjustments) */
  modalitySettings: Record<string, ModalityWindowLevel>
  /** Currently active tool name */
  activeTool: string
  /** Available tools and their modes */
  tools: Tool[]
  /** Whether annotations are visible */
  showAnnotations: boolean
  /** Whether DICOM metadata panel is visible */
  showMetadata: boolean
  /** Whether AI detection is in progress */
  isDetecting: boolean
  /** Error message from AI detection, null if no error */
  detectionError: string | null

  // Actions
  /** Set window/level for current modality */
  setWindowLevel: (center: number, width: number) => void
  /** Switch modality and apply its settings */
  setModality: (modality: string, defaultCenter?: number, defaultWidth?: number) => void
  /** Set zoom level */
  setZoom: (zoom: number) => void
  /** Set pan offset */
  setPan: (x: number, y: number) => void
  /** Set rotation angle in degrees */
  setRotation: (rotation: number) => void
  /** Toggle image inversion (negative) */
  setInvert: (invert: boolean) => void
  /** Toggle horizontal flip */
  setFlipHorizontal: (flip: boolean) => void
  /** Toggle vertical flip */
  setFlipVertical: (flip: boolean) => void
  /** Activate a specific tool */
  setActiveTool: (toolName: string) => void
  /** Toggle annotation overlay visibility */
  toggleAnnotations: () => void
  /** Toggle metadata panel visibility */
  toggleMetadata: () => void
  /** Set AI detection state */
  setDetecting: (detecting: boolean, error?: string | null) => void
  /** Reset settings to defaults (DICOM defaults if available) */
  resetSettings: () => void
}

// Modality-specific default W/L values based on typical imaging ranges
const modalityDefaults: Record<string, ModalityWindowLevel> = {
  'MR': { windowCenter: 600, windowWidth: 1200 },     // Magnetic Resonance
  'CT': { windowCenter: 40, windowWidth: 400 },       // Computed Tomography (soft tissue)
  'CR': { windowCenter: 2048, windowWidth: 4096 },    // Computed Radiography (X-ray)
  'DX': { windowCenter: 2048, windowWidth: 4096 },    // Digital Radiography (X-ray)
  'RF': { windowCenter: 2048, windowWidth: 4096 },    // Radio Fluoroscopy
  'XA': { windowCenter: 2048, windowWidth: 4096 },    // X-ray Angiography
  'MG': { windowCenter: 1500, windowWidth: 3000 },    // Mammography
  'OT': { windowCenter: 600, windowWidth: 1200 },     // Other (default to MR-like)
}

// Default viewport settings (non W/L settings)
// W/L is now managed per-modality in modalitySettings
const defaultSettings: ViewportSettings = {
  windowCenter: 600,   // Will be overridden by modality-specific values
  windowWidth: 1200,   // Will be overridden by modality-specific values
  zoom: 1,
  pan: { x: 0, y: 0 },
  rotation: 0,
  invert: false,
  flipHorizontal: false,
  flipVertical: false,
}

const defaultTools: Tool[] = [
  { name: 'WindowLevel', mode: 'active' },
  { name: 'Zoom', mode: 'passive' },
  { name: 'Pan', mode: 'passive' },
  { name: 'StackScroll', mode: 'active' },
]

/**
 * Zustand store for managing DICOM viewport display settings.
 *
 * This store manages modality-specific window/level settings with intelligent defaults:
 *
 * 1. **Hard-coded defaults**: Each modality (CT, MR, CR, etc.) has typical W/L ranges
 * 2. **DICOM metadata**: Images can provide their own W/L in metadata
 * 3. **User adjustments**: User can customize W/L, which persists per modality
 *
 * The priority is:
 * - Display: User adjustments > DICOM defaults > Hard-coded defaults
 * - Reset: DICOM defaults > Hard-coded defaults
 *
 * When switching between images:
 * - Same modality: User adjustments are preserved
 * - Different modality: Switches to that modality's settings
 * - New image with DICOM W/L: Updates only if user hasn't customized
 *
 * @example
 * ```tsx
 * // Select state
 * const settings = useViewportStore((state) => state.settings)
 * const zoom = useViewportStore((state) => state.settings.zoom)
 *
 * // Call actions
 * const { setWindowLevel, setZoom, resetSettings } = useViewportStore()
 * setWindowLevel(400, 800)
 * setZoom(1.5)
 * resetSettings() // Reset to DICOM defaults or hard-coded defaults
 * ```
 *
 * @example
 * ```tsx
 * // Switch modality with DICOM metadata
 * const { setModality } = useViewportStore()
 *
 * // Load new CT image with DICOM W/L
 * setModality('CT', 40, 400) // Uses DICOM values if user hasn't customized
 *
 * // User adjusts window/level
 * setWindowLevel(100, 500) // Saves to CT modality settings
 *
 * // Load another CT image with different DICOM W/L
 * setModality('CT', 50, 350) // Preserves user's 100/500, ignores new DICOM values
 * ```
 */
export const useViewportStore = create<ViewportState>((set) => ({
  settings: defaultSettings,
  currentModality: 'MR',  // Default to MR
  modalitySettings: { ...modalityDefaults },  // Initialize with all modality defaults
  activeTool: 'WindowLevel',
  tools: defaultTools,
  showAnnotations: true,
  showMetadata: true,
  isDetecting: false,
  detectionError: null,

  /**
   * Update window/level for the current modality.
   *
   * This saves the W/L to the current modality's settings, so switching
   * to a different modality and back will restore these values.
   *
   * IMPORTANT: Preserves dicomDefault so reset button works correctly.
   *
   * @param center - Window center value
   * @param width - Window width value
   *
   * @example
   * ```ts
   * // User drags to adjust brightness/contrast
   * setWindowLevel(400, 800)
   * ```
   */
  setWindowLevel: (center, width) =>
    set((state) => ({
      modalitySettings: {
        ...state.modalitySettings,
        [state.currentModality]: {
          ...state.modalitySettings[state.currentModality],  // Preserve dicomDefault
          windowCenter: center,
          windowWidth: width,
        },
      },
      settings: {
        ...state.settings,
        windowCenter: center,
        windowWidth: width,
      },
    })),

  /**
   * Switch to a different modality and apply its stored W/L settings.
   *
   * This is called when loading a new image. The behavior is:
   *
   * 1. If no DICOM W/L provided: Use stored modality settings or hard-coded defaults
   * 2. If DICOM W/L provided AND user hasn't customized: Use DICOM values
   * 3. If DICOM W/L provided BUT user has customized: Keep user values, but update reset target
   *
   * "User has customized" means: Current W/L differs from both hard-coded defaults AND previous DICOM defaults
   *
   * @param modality - Modality code (MR, CT, CR, DX, etc.)
   * @param defaultCenter - Optional window center from DICOM metadata
   * @param defaultWidth - Optional window width from DICOM metadata
   *
   * @example
   * ```ts
   * // Load new image without DICOM W/L
   * setModality('CT') // Uses stored CT settings or hard-coded defaults
   *
   * // Load new image with DICOM W/L
   * setModality('MR', 600, 1200) // Uses DICOM values if user hasn't customized
   * ```
   */
  setModality: (modality, defaultCenter, defaultWidth) =>
    set((state) => {
      // Get stored settings for this modality, or use defaults
      let modalityWL = state.modalitySettings[modality]

      // Fall back to modality default if no stored settings
      if (!modalityWL) {
        modalityWL = modalityDefaults[modality] || modalityDefaults['OT']
      }

      // If we have DICOM metadata, always update the reset target
      // Apply DICOM values only if user hasn't customized yet
      if (defaultCenter !== undefined && defaultWidth !== undefined) {
        const hasNoDicomDefault = !modalityWL.dicomDefault

        // Check if user has customized (current values differ from any DICOM or hard-coded defaults)
        const isAtHardCodedDefault =
          modalityWL.windowCenter === modalityDefaults[modality]?.windowCenter &&
          modalityWL.windowWidth === modalityDefaults[modality]?.windowWidth

        const isAtPreviousDicomDefault =
          modalityWL.dicomDefault &&
          modalityWL.windowCenter === modalityWL.dicomDefault.windowCenter &&
          modalityWL.windowWidth === modalityWL.dicomDefault.windowWidth

        // User hasn't customized if they're at either hard-coded defaults OR previous DICOM defaults
        const userHasNotCustomized = isAtHardCodedDefault || isAtPreviousDicomDefault || hasNoDicomDefault

        if (userHasNotCustomized) {
          // Apply new DICOM metadata (user hasn't made manual adjustments)
          modalityWL = {
            windowCenter: defaultCenter,
            windowWidth: defaultWidth,
            dicomDefault: { windowCenter: defaultCenter, windowWidth: defaultWidth },
          }
        } else {
          // Keep user adjustments but update the DICOM reset target for current image
          modalityWL = {
            ...modalityWL,
            dicomDefault: { windowCenter: defaultCenter, windowWidth: defaultWidth },
          }
        }
      }

      return {
        currentModality: modality,
        modalitySettings: {
          ...state.modalitySettings,
          [modality]: modalityWL,
        },
        settings: {
          ...state.settings,
          windowCenter: modalityWL.windowCenter,
          windowWidth: modalityWL.windowWidth,
        },
      }
    }),

  setZoom: (zoom) =>
    set((state) => ({
      settings: { ...state.settings, zoom },
    })),

  setPan: (x, y) =>
    set((state) => ({
      settings: { ...state.settings, pan: { x, y } },
    })),

  setRotation: (rotation) =>
    set((state) => ({
      settings: { ...state.settings, rotation },
    })),

  setInvert: (invert) =>
    set((state) => ({
      settings: { ...state.settings, invert },
    })),

  setFlipHorizontal: (flip) =>
    set((state) => ({
      settings: { ...state.settings, flipHorizontal: flip },
    })),

  setFlipVertical: (flip) =>
    set((state) => ({
      settings: { ...state.settings, flipVertical: flip },
    })),

  setActiveTool: (toolName) => set({ activeTool: toolName }),

  toggleAnnotations: () =>
    set((state) => ({ showAnnotations: !state.showAnnotations })),

  toggleMetadata: () =>
    set((state) => ({ showMetadata: !state.showMetadata })),

  setDetecting: (detecting, error = null) =>
    set({ isDetecting: detecting, detectionError: error }),

  /**
   * Reset viewport settings to defaults.
   *
   * Resets all geometric transforms (zoom, pan, rotation, flip) to defaults.
   * For window/level, resets to the best available defaults:
   *
   * Priority:
   * 1. Current image's DICOM metadata W/L (if available)
   * 2. Hard-coded modality defaults (CT: 40/400, MR: 600/1200, etc.)
   *
   * This allows the reset button to restore image-specific DICOM values
   * rather than generic defaults when possible.
   *
   * @example
   * ```ts
   * // User has zoomed, panned, and adjusted W/L
   * resetSettings()
   * // Result: zoom=1, pan={0,0}, W/L restored to DICOM or modality defaults
   * ```
   */
  resetSettings: () =>
    set((state) => {
      const currentModalitySettings = state.modalitySettings[state.currentModality]

      // Prefer DICOM defaults if available, otherwise use hard-coded modality defaults
      const resetTarget = currentModalitySettings?.dicomDefault ||
                          modalityDefaults[state.currentModality] ||
                          modalityDefaults['OT']

      return {
        modalitySettings: {
          ...state.modalitySettings,
          [state.currentModality]: {
            ...resetTarget,
            dicomDefault: currentModalitySettings?.dicomDefault, // Preserve DICOM defaults for future resets
          },
        },
        settings: {
          ...defaultSettings,
          windowCenter: resetTarget.windowCenter,
          windowWidth: resetTarget.windowWidth,
        },
      }
    }),
}))
