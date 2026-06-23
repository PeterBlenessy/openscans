import { ReactNode } from 'react'
import type { Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { useUiTheme } from './theme'

type Tone = 'neutral' | 'success' | 'warn' | 'error' | 'accent'

interface BadgeProps {
  tone?: Tone
  theme?: Theme
  className?: string
  children: ReactNode
}

function toneText(tone: Tone, t: Theme): string {
  switch (tone) {
    case 'success': return 'text-success'
    case 'warn': return 'text-warning'
    case 'error': return 'text-error'
    case 'accent': return 'text-accent'
    case 'neutral': return themeClasses.textSecondary(t)
  }
}

/**
 * Small status pill. Replaces raw status text like "Installed" / "Unavailable"
 * / "Click to reload" with a consistent, tone-colored badge.
 */
export function Badge({ tone = 'neutral', theme, className = '', children }: BadgeProps) {
  const t = useUiTheme(theme)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${themeClasses.bgSecondary(t)} ${toneText(tone, t)} ${className}`}
    >
      {children}
    </span>
  )
}
