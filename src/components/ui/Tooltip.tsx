import { ReactNode } from 'react'
import * as RT from '@radix-ui/react-tooltip'
import type { Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { useUiTheme } from './theme'

interface TooltipProps {
  /** Tooltip text. If empty, the trigger renders without a tooltip. */
  label: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  theme?: Theme
  /** The trigger element (rendered via asChild — no extra DOM wrapper). */
  children: ReactNode
}

/**
 * Themed tooltip wrapper over Radix Tooltip — the single tooltip for the app,
 * replacing scattered native `title=` attributes. Requires a `TooltipProvider`
 * ancestor (mounted once at the app root). Uses `asChild`, so the child element
 * stays the rendered node and toolbar/flex layouts are unaffected.
 */
export function Tooltip({ label, side = 'top', theme, children }: TooltipProps) {
  const t = useUiTheme(theme)
  if (label == null || label === '') return <>{children}</>
  return (
    <RT.Root>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          side={side}
          sideOffset={6}
          className={`z-[60] select-none rounded-md border px-2 py-1 text-xs shadow-lg ${themeClasses.bg(t)} ${themeClasses.border(t)} ${themeClasses.text(t)}`}
        >
          {label}
          <RT.Arrow className={t === 'dark' ? 'fill-[#1a1a1a]' : 'fill-white'} />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  )
}

/** Mount once near the app root so every <Tooltip> has a provider ancestor. */
export const TooltipProvider = RT.Provider
