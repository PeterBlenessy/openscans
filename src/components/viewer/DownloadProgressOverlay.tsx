import { useEffect, useState } from 'react'
import { isTauri } from '@/lib/utils/platform'
import { onDownloadProgress } from '@/lib/ai/localServer'

interface Progress {
  file: string
  downloaded: number
  total: number
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(0)
}

/**
 * Viewport overlay showing on-demand download progress for the bundled local
 * AI (llama) model. Self-contained: it subscribes to the Tauri progress event
 * directly, so it can be mounted without prop plumbing. Renders nothing when no
 * download is active (or on the web build).
 *
 * NOTE: MR-engine progress is intentionally NOT handled here — it has its own
 * consent + minimizable progress UI (see MrEngineSetup); subscribing to it here
 * too caused a duplicate "Downloading <stage>…" overlay.
 */
export function DownloadProgressOverlay() {
  const [progress, setProgress] = useState<Progress | null>(null)

  useEffect(() => {
    if (!isTauri()) return

    let unlistenLocal: (() => void) | undefined
    let clearTimer: ReturnType<typeof setTimeout> | undefined

    const handle = (p: Progress) => {
      setProgress(p)
      if (clearTimer) clearTimeout(clearTimer)
      // Auto-dismiss shortly after a file completes.
      if (p.total > 0 && p.downloaded >= p.total) {
        clearTimer = setTimeout(() => setProgress(null), 1500)
      }
    }

    onDownloadProgress(handle).then((u) => {
      unlistenLocal = u
    })

    return () => {
      unlistenLocal?.()
      if (clearTimer) clearTimeout(clearTimer)
    }
  }, [])

  if (!progress) return null

  const pct = progress.total ? Math.round((progress.downloaded / progress.total) * 100) : 0

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
      <div className="bg-black/80 text-white px-5 py-3 rounded-lg shadow-xl w-80">
        <div className="flex items-center justify-between text-sm mb-2">
          <span>Downloading {progress.file}…</span>
          <span className="tabular-nums">
            {progress.total ? `${pct}%` : `${formatMB(progress.downloaded)} MB`}
          </span>
        </div>
        <div className="h-1.5 w-full rounded bg-white/20 overflow-hidden">
          <div
            className="h-full bg-blue-400 transition-all"
            style={{ width: progress.total ? `${pct}%` : '100%' }}
          />
        </div>
        {progress.total > 0 && (
          <div className="mt-1 text-xs text-white/60 tabular-nums">
            {formatMB(progress.downloaded)} / {formatMB(progress.total)} MB
          </div>
        )}
      </div>
    </div>
  )
}
