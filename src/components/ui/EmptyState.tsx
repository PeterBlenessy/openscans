import { ReactNode } from 'react'
import type { Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { useUiTheme } from './theme'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  theme?: Theme
  className?: string
}

/**
 * Centered zero-data placeholder. Unifies the four hand-rolled empty states
 * ("No marked images yet", "No DICOM files loaded", "No recent studies", …).
 */
export function EmptyState({ icon, title, description, action, theme, className = '' }: EmptyStateProps) {
  const t = useUiTheme(theme)
  return (
    <div className={`flex flex-col items-center justify-center gap-2 px-6 py-8 text-center ${className}`}>
      {icon && <div className={`mb-1 ${themeClasses.textTertiary(t)}`}>{icon}</div>}
      <p className={`text-sm font-medium ${themeClasses.text(t)}`}>{title}</p>
      {description && <p className={`text-xs ${themeClasses.textSecondary(t)}`}>{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
