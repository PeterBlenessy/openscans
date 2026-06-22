import { useSettingsStore } from '@/stores/settingsStore'
import type { Theme } from '@/stores/settingsStore'

/**
 * Resolve the theme a UI primitive should render with: an explicit `override`
 * (when a parent already has the theme in hand) or the live resolved theme from
 * the settings store. Always calls the store hook so the rule-of-hooks holds.
 */
export function useUiTheme(override?: Theme): Theme {
  const storeTheme = useSettingsStore((s) => s.theme)
  return override ?? storeTheme
}
