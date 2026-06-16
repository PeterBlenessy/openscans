import { RefObject, useCallback, useEffect, useState } from 'react'

/**
 * Subset of the vendor-prefixed Fullscreen API surface we rely on. Safari (and
 * older WebKit, including some Tauri/macOS WebViews) still ships the `webkit`
 * prefixed variants instead of the standard ones.
 */
interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void
}

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

function getFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

interface UseFullscreenReturn {
  /** Whether a fullscreen element is currently active */
  isFullscreen: boolean
  /** Toggle the referenced element in/out of fullscreen */
  toggleFullscreen: () => Promise<void>
}

/**
 * Manage browser fullscreen for a given element.
 *
 * Handles the standard Fullscreen API plus the `webkit`-prefixed fallbacks for
 * Safari/WebKit, and keeps `isFullscreen` in sync with the
 * `fullscreenchange` / `webkitfullscreenchange` events (so the browser's own
 * Escape-to-exit is reflected in state). Listeners are cleaned up on unmount.
 *
 * @param elementRef - Ref to the element that should fill the screen
 * @returns `{ isFullscreen, toggleFullscreen }`
 */
export function useFullscreen(elementRef: RefObject<HTMLElement>): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = useCallback(async () => {
    const doc = document as FullscreenDocument
    try {
      if (getFullscreenElement()) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen()
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen()
        }
      } else {
        const element = elementRef.current as FullscreenElement | null
        if (!element) return
        if (element.requestFullscreen) {
          await element.requestFullscreen()
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen()
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err)
    }
  }, [elementRef])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!getFullscreenElement())

    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)

    // Initialise in case we mount while already fullscreen.
    handler()

    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  return { isFullscreen, toggleFullscreen }
}
