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
  try {
    const value = await invoke<string | null>('get_system_accent_color')
    if (value) {
      document.documentElement.style.setProperty('--accent', value)
    } else {
      document.documentElement.style.removeProperty('--accent')
    }
  } catch {
    // Command unavailable (e.g. non-desktop) — keep the CSS fallback.
    document.documentElement.style.removeProperty('--accent')
  }
}
