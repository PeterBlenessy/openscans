import { InputHTMLAttributes, ReactNode, useId } from 'react'
import type { Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { useUiTheme } from './theme'

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'checked'> {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  theme?: Theme
  ariaLabel?: string
  className?: string
}

/**
 * Themed checkbox. A styled native `<input type="checkbox">` so it picks up the
 * OS accent for free via the global `accent-color: auto` (set in index.css) —
 * no new dependency, no hand-drawn indicator. Replaces the two ad-hoc native
 * checkboxes that weren't theme-aware.
 */
export function Checkbox({ checked, onChange, label, theme, ariaLabel, className = '', ...rest }: CheckboxProps) {
  const t = useUiTheme(theme)
  const id = useId()
  const input = (
    <input
      id={label ? id : undefined}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={label ? undefined : ariaLabel}
      className="h-4 w-4 cursor-pointer rounded"
      {...rest}
    />
  )
  if (!label) return input
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-center gap-2 text-sm ${themeClasses.text(t)} ${className}`}>
      {input}
      {label}
    </label>
  )
}
