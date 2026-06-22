import { ReactNode } from 'react'
import type { Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { useUiTheme } from './theme'

interface Option<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  ariaLabel: string
  theme?: Theme
  className?: string
}

/**
 * Horizontal segmented control (radiogroup). Used for the theme picker and
 * other small fixed option sets.
 *
 * The active-segment background is a *freshly-mounted keyed node* rather than a
 * toggled class on a persistent button — WKWebView (Tauri) fails to repaint a
 * toggled background onto the newly-active element, so we remount it instead
 * (same fix as the settings sidebar).
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  theme,
  className = '',
}: SegmentedControlProps<T>) {
  const t = useUiTheme(theme)
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex gap-1 rounded-lg border p-1 ${themeClasses.bgSecondary(t)} ${themeClasses.border(t)} ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm transition-colors ${
              active ? themeClasses.text(t) : `${themeClasses.textSecondary(t)} ${themeClasses.hoverText(t)}`
            }`}
          >
            {active && (
              <span key="seg-active" aria-hidden className={`absolute inset-0 rounded-md ${themeClasses.bgActive(t)}`} />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
