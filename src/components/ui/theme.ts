import { useSettingsStore } from '@/stores/settingsStore'
import type { Theme } from '@/stores/settingsStore'

/**
 * Resolve the theme a UI primitive should render with: an explicit `override`
 * (when a parent already has the theme in hand) or the live resolved theme from
 * the settings store. Always calls the store hook so the rule-of-hooks holds.
 */
export function useUiTheme(override?: Theme): Theme {
  // Selecting `override ?? s.theme` means callers that pass an explicit theme
  // get a stable value and don't re-render on store theme changes.
  return useSettingsStore((s) => override ?? s.theme)
}
