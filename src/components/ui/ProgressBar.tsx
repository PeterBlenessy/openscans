import type { Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { useUiTheme } from './theme'

interface ProgressBarProps {
  /** 0–100. Omit or pass null for an indeterminate (sliding) bar. */
  value?: number | null
  theme?: Theme
  className?: string
  /** Accessible label for the progressbar. */
  label?: string
}

/**
 * The single progress-bar primitive. Replaces the three hand-rolled bars
 * (MR-engine, model-download, batch-export — previously blue-500/blue-400/
 * gray-500) with one accent-filled track. The indeterminate mode reuses the
 * shared `mr-indeterminate` keyframe in index.css.
 */
export function ProgressBar({ value, theme, className = '', label }: ProgressBarProps) {
  const t = useUiTheme(theme)
  const indeterminate = value == null
  const pct = indeterminate ? undefined : Math.max(0, Math.min(100, value))

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={indeterminate ? undefined : pct}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : 100}
      className={`relative h-1.5 w-full overflow-hidden rounded-full ${themeClasses.bgSecondary(t)} ${className}`}
    >
      {indeterminate ? (
        <div className="animate-mr-indeterminate absolute inset-y-0 left-0 w-2/5 rounded-full bg-accent" />
      ) : (
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      )}
    </div>
  )
}
