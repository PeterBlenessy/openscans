import { useEffect } from 'react'
import { applySystemAccent } from '@/lib/utils/systemAccent'

/**
 * Keep the `--accent` CSS variable in sync with the OS accent color.
 *
 * macOS doesn't push accent changes into a running app, so we re-read on window
 * focus / visibility change: when the user changes the accent in System
 * Settings they almost always switch back to the app, and the focus event
 * catches it without any native notification observer. Runs once on mount too.
 */
export function useSystemAccent(): void {
  useEffect(() => {
    void applySystemAccent()

    // focus + visibilitychange both fire when returning to the app; coalesce
    // them into a single in-flight fetch so we don't double-invoke the command.
    let inFlight = false
    const refresh = () => {
      if (document.visibilityState === 'hidden' || inFlight) return
      inFlight = true
      void applySystemAccent().finally(() => {
        inFlight = false
      })
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
}
