import { ReactNode, useState } from 'react'
import { Info, AlertTriangle, AlertCircle, ChevronDown } from 'lucide-react'
import type { Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { useUiTheme } from './theme'

type Tone = 'info' | 'warn' | 'error'

interface CalloutProps {
  tone?: Tone
  title: ReactNode
  children?: ReactNode
  /** Collapse the body behind the title (default expanded/static). */
  collapsible?: boolean
  defaultOpen?: boolean
  theme?: Theme
  className?: string
}

const TONE_ICON = { info: Info, warn: AlertTriangle, error: AlertCircle } as const

function toneColor(tone: Tone, t: Theme): string {
  if (tone === 'warn') return 'text-warning'
  if (tone === 'error') return 'text-error'
  return themeClasses.textSecondary(t)
}

/**
 * Quiet notice/callout box. Generalizes the settings `InlineNote` into the one
 * shared callout for info/warning/error notices across the app — replacing the
 * amber-vs-yellow split and the emoji-bulleted boxes with consistent lucide
 * icons and the `--warning`/`--error` tokens.
 */
export function Callout({
  tone = 'info',
  title,
  children,
  collapsible = false,
  defaultOpen = false,
  theme,
  className = '',
}: CalloutProps) {
  const t = useUiTheme(theme)
  const [open, setOpen] = useState(defaultOpen)
  const Icon = TONE_ICON[tone]
  const showBody = children && (!collapsible || open)

  const header = (
    <>
      <Icon className={`w-4 h-4 flex-shrink-0 ${toneColor(tone, t)}`} aria-hidden="true" />
      <span className={`flex-1 text-xs font-medium ${themeClasses.text(t)}`}>{title}</span>
      {collapsible && (
        <ChevronDown
          className={`w-4 h-4 ${themeClasses.textSecondary(t)} transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      )}
    </>
  )

  return (
    <div className={`rounded-lg border ${themeClasses.bgSecondary(t)} ${themeClasses.border(t)} ${className}`}>
      {collapsible ? (
        <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-left">
          {header}
        </button>
      ) : (
        <div className="flex items-center gap-2 px-3 pt-3 pb-1">{header}</div>
      )}
      {showBody && (
        <div className={`px-3 pb-3 pl-9 text-xs ${themeClasses.textSecondary(t)}`}>{children}</div>
      )}
    </div>
  )
}
