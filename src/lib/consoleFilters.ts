/**
 * Suppress a benign, dev-only console warning from cornerstone-tools.
 *
 * In dev mode cornerstone-tools' segmentation module autogenerates a default
 * colorLUT and logs:
 *   "The provided colorLUT only provides 0 labels, whereas segmentsPerLabelmap
 *    is set to 65535. Autogenerating the rest."
 * We render annotations as SVG overlays (AnnotationOverlay), never as cornerstone
 * labelmaps, so the segmentation module is unused and this is pure noise. (In a
 * production build cornerstone-tools routes `logger.warn` to a disabled debug
 * logger, so the warning never appears there.)
 *
 * It can't be filtered from initCornerstone: cornerstone-tools binds
 * `logger.warn = console.warn.bind(console)` at IMPORT time, capturing whatever
 * console.warn is then. This module must therefore be imported FIRST in
 * main.tsx — before the import chain reaches cornerstone-tools — so the captured
 * reference is our filtered wrapper.
 */
const SUPPRESSED_WARNING_SUBSTRINGS = ['colorLUT only provides', 'segmentsPerLabelmap']

const originalWarn = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '')
  if (SUPPRESSED_WARNING_SUBSTRINGS.some((s) => message.includes(s))) return
  originalWarn(...args)
}
