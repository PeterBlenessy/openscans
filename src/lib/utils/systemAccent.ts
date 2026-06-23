import { invoke } from '@tauri-apps/api/core'
import { isTauri } from './platform'

/**
 * Pull the OS accent color into the `--accent` CSS variable (desktop only).
 *
 * On macOS the `get_system_accent_color` Tauri command returns an oklch string
 * derived from `NSColor.controlAccentColor`; we set it as a *real* value on the
 * document root so every accent-driven surface (primary buttons, the selected
 * thumbnail ring, sliders) follows the system color. This avoids the CSS
 * `AccentColor` keyword, which doesn't reliably resolve through a variable into
 * a box-shadow/ring in WebKit.
 *
 * On the web build, non-macOS, or any failure, we leave the brand-blue fallback
 * baked into index.css in place.
 */
export async function applySystemAccent(): Promise<void> {
  if (!isTauri()) return
  const root = document.documentElement
  const reset = () => {
    // Fall back to the static --accent / --accent-foreground from index.css.
    root.style.removeProperty('--accent')
    root.style.removeProperty('--accent-foreground')
  }
  try {
    const value = await invoke<string | null>('get_system_accent_color')
    if (value) {
      root.style.setProperty('--accent', value)
      // Keep CTA text legible: white on dark/saturated accents, near-black on
      // light ones (e.g. a yellow/graphite macOS accent would wash out white).
      root.style.setProperty('--accent-foreground', accentForeground(value))
    } else {
      reset()
    }
  } catch {
    // Command unavailable (e.g. non-desktop) — keep the CSS fallback.
    reset()
  }
}

/**
 * Pick a legible foreground for an oklch accent by its lightness (L%). The
 * crossover (~65%) is where black text starts to out-contrast white on a
 * mid-chroma accent.
 */
function accentForeground(accentOklch: string): string {
  const m = accentOklch.match(/oklch\(\s*([\d.]+)%/i)
  const l = m ? parseFloat(m[1]) : 0
  return l >= 65 ? 'oklch(20% 0 0)' : '#ffffff'
}
