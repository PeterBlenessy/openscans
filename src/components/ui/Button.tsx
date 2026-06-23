import { ButtonHTMLAttributes, forwardRef } from 'react'
import type { Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { useUiTheme } from './theme'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  theme?: Theme
  /** Show a spinner and disable; for async actions (export, install…). */
  loading?: boolean
}

const SIZE: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}

function variantClasses(variant: Variant, t: Theme): string {
  switch (variant) {
    case 'primary':
      return 'bg-accent text-accent-foreground hover:opacity-90'
    case 'secondary':
      return `${themeClasses.bgSecondary(t)} border ${themeClasses.border(t)} ${themeClasses.text(t)} ${themeClasses.hoverBgSecondary(t)}`
    case 'ghost':
      return `${themeClasses.textSecondary(t)} ${themeClasses.hoverText(t)} ${themeClasses.hoverBgSecondary(t)}`
    case 'danger':
      return 'bg-error text-white hover:opacity-90'
    case 'icon':
      return `${themeClasses.textSecondary(t)} ${themeClasses.hoverText(t)} ${themeClasses.hoverBgSecondary(t)}`
  }
}

/**
 * The single button primitive. Unifies the ~8 hand-rolled button styles and the
 * blue-vs-gray primary split: `primary` is the OS accent everywhere. `icon` is a
 * square ghost button for toolbar/close affordances.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', theme, loading = false, disabled, className = '', children, ...rest },
  ref,
) {
  const t = useUiTheme(theme)
  const shape = variant === 'icon' ? 'p-2 rounded-lg' : `${SIZE[size]} rounded-lg`
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${shape} ${variantClasses(variant, t)} ${className}`}
      {...rest}
    >
      {loading && <Spinner size="sm" className={variant === 'primary' || variant === 'danger' ? 'text-current' : 'text-accent'} />}
      {children}
    </button>
  )
})
