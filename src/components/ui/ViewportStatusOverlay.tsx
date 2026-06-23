import { ReactNode } from 'react'
import type { Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { useUiTheme } from './theme'
import { Spinner } from './Spinner'
import { ProgressBar } from './ProgressBar'

interface ViewportStatusOverlayProps {
  title: string
  detail?: string
  /** Leading element; defaults to a Spinner unless `progress` is provided. */
  icon?: ReactNode
  /** 0–100 ⇒ a determinate bar; null ⇒ indeterminate; undefined ⇒ no bar. */
  progress?: number | null
  theme?: Theme
}

/**
 * Centered busy/status card shown over the viewport. Replaces the duplicated
 * "Detecting vertebrae…" / "Analyzing image…" overlays and the model-download
 * overlay with one component.
 */
export function ViewportStatusOverlay({ title, detail, icon, progress, theme }: ViewportStatusOverlayProps) {
  const t = useUiTheme(theme)
  const hasBar = progress !== undefined
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex flex-col items-center gap-3 rounded-lg border px-6 py-4 shadow-2xl min-w-[16rem] ${themeClasses.bg(t)} ${themeClasses.border(t)}`}
      >
        <div className="flex items-center gap-3">
          {icon ?? (!hasBar && <Spinner size="md" />)}
          <span className={`text-sm font-medium ${themeClasses.text(t)}`}>{title}</span>
        </div>
        {hasBar && <ProgressBar value={progress} theme={t} className="w-full" label={title} />}
        {detail && <span className={`text-xs ${themeClasses.textSecondary(t)}`}>{detail}</span>}
      </div>
    </div>
  )
}
