import { RefObject, useCallback, useEffect, useState } from 'react'
import { isTauri } from '@/lib/utils/platform'

/**
 * Subset of the vendor-prefixed Fullscreen API surface we rely on. Safari (and
 * older WebKit) still ships the `webkit` prefixed variants instead of the
 * standard ones.
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
  /** Whether fullscreen is currently active */
  isFullscreen: boolean
  /** Toggle in/out of fullscreen */
  toggleFullscreen: () => Promise<void>
}

/**
 * Manage fullscreen for a given element.
 *
 * On the web this uses the HTML Fullscreen API (standard + `webkit` fallbacks).
 * In the Tauri desktop app that API is a no-op in WKWebView, so we toggle the
 * **native window** fullscreen via `@tauri-apps/api/window` instead — this is
 * why the button "did nothing" on desktop. State is kept in sync with the
 * browser `fullscreenchange` events (web) or the window resize event (Tauri),
 * so the OS's own Escape/exit is reflected.
 *
 * @param elementRef - Ref to the element that should fill the screen (web only)
 * @returns `{ isFullscreen, toggleFullscreen }`
 */
export function useFullscreen(elementRef: RefObject<HTMLElement>): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const tauri = isTauri()

  const toggleFullscreen = useCallback(async () => {
    if (tauri) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const win = getCurrentWindow()
        const next = !(await win.isFullscreen())
        await win.setFullscreen(next)
        setIsFullscreen(next)
      } catch (err) {
        console.error('Fullscreen toggle failed:', err)
      }
      return
    }

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
  }, [tauri, elementRef])

  useEffect(() => {
    if (tauri) {
      // Track native-window fullscreen (covers OS-initiated exit via the green
      // button / Esc, which fires a resize).
      let cancelled = false
      let unlisten: (() => void) | undefined
      ;(async () => {
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window')
          const win = getCurrentWindow()
          if (!cancelled) setIsFullscreen(await win.isFullscreen())
          unlisten = await win.onResized(async () => {
            if (!cancelled) setIsFullscreen(await win.isFullscreen())
          })
        } catch (err) {
          console.error('Fullscreen state sync failed:', err)
        }
      })()
      return () => {
        cancelled = true
        unlisten?.()
      }
    }

    const handler = () => setIsFullscreen(!!getFullscreenElement())
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    handler() // initialise in case we mount while already fullscreen
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [tauri])

  return { isFullscreen, toggleFullscreen }
}
