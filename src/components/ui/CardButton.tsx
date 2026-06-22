import { ReactNode } from 'react'
import type { Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { useUiTheme } from './theme'

interface CardButtonProps {
  selected: boolean
  onClick: () => void
  theme?: Theme
  ariaLabel?: string
  className?: string
  children: ReactNode
}

/**
 * Selectable card/tile button. Replaces the three byte-identical
 * FormatButton/ResolutionButton/GridButton components. Selected state uses an
 * accent ring + bgActive (no token-opacity, which can't apply to the AccentColor
 * keyword).
 */
export function CardButton({ selected, onClick, theme, ariaLabel, className = '', children }: CardButtonProps) {
  const t = useUiTheme(theme)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`flex-1 rounded-lg border-2 p-3 text-sm transition-colors ${
        selected
          ? `border-accent ring-1 ring-accent ${themeClasses.bgActive(t)} ${themeClasses.text(t)}`
          : `${themeClasses.border(t)} ${themeClasses.bgSecondary(t)} ${themeClasses.textSecondary(t)} ${themeClasses.hoverBorder(t)}`
      } ${className}`}
    >
      {children}
    </button>
  )
}
