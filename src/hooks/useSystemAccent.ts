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

    const refresh = () => {
      if (document.visibilityState === 'hidden') return
      void applySystemAccent()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
}
