import { useEffect, useState } from 'react'
import { ScanLine, Minus, X, AlertTriangle, Lock, Package, Trash2, Clock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Spinner, ProgressBar } from '@/components/ui'
import { useMrEngineStore } from '@/stores/mrEngineStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'

function fmtBytes(n: number): string {
  if (!n) return ''
  const mb = n / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`
}

/**
 * MR-engine setup surface (mounted once, app-wide):
 *  - blocking consent dialog before the one-time install,
 *  - a NON-blocking floating progress card the user can minimize to a chip and
 *    keep working while the engine installs / segments in the background,
 *  - a dismissable error card.
 *
 * All state lives in {@link useMrEngineStore}, so progress survives minimizing
 * and component remounts.
 */
export function MrEngineSetup() {
  const theme = useSettingsStore((s) => s.theme)
  const { job, minimized, error, consent } = useMrEngineStore()
  const { confirmConsent, cancelConsent, minimize, restore, dismissError, refreshStatus } =
    useMrEngineStore()

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  // Elapsed-time counter while a job runs — the long phases (engine install,
  // segmentation) report no fine-grained progress, so this + the animated
  // indeterminate bar make clear it's working, not stuck.
  const active = !!job
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!active) return
    setElapsed(0)
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [active])
  const mmss = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`

  const pct = job && job.total > 0 ? Math.round((job.downloaded / job.total) * 100) : null

  return (
    <>
      {/* Consent — blocking, one-time setup */}
      <Modal
        show={!!consent}
        onClose={cancelConsent}
        title="Set up MR-precision segmentation"
        icon={<ScanLine className="w-5 h-5" />}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelConsent}
              className={`px-3 py-1.5 rounded ${themeClasses.textSecondary(theme)} ${themeClasses.hoverBgSecondary(theme)}`}
            >
              Cancel
            </button>
            <button
              onClick={confirmConsent}
              className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              Set up &amp; run
            </button>
          </div>
        }
      >
        <div className={`space-y-3 text-sm ${themeClasses.textSecondary(theme)}`}>
          <p>
            MR-precision segmentation runs a dedicated AI model
            (TotalSegmentator-MRI) <strong>entirely on your device</strong>.
          </p>
          <p>
            First use needs a <strong>one-time setup</strong> — it downloads
            about 2&nbsp;GB (a few GB on disk) and takes a few minutes.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>Runs fully on-device — no images or data ever leave your computer.</span>
            </li>
            <li className="flex items-start gap-2">
              <Package className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Everything installs inside OpenScans’ own folder. It won’t touch
                your system Python or any other app, and isn’t shared with them.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Trash2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>You can remove it anytime in Settings to free up the space.</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>You can minimize the progress and keep working while it installs.</span>
            </li>
          </ul>
        </div>
      </Modal>

      {/* Floating progress / error — non-blocking */}
      {(job || error) && (
        <div className="fixed bottom-4 right-4 z-40">
          {error ? (
            <div
              className={`flex items-start gap-3 p-3 rounded-lg shadow-2xl border ${themeClasses.border(theme)} ${themeClasses.bg(theme)} max-w-sm`}
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className={`text-sm font-medium ${themeClasses.text(theme)}`}>
                  MR segmentation failed
                </p>
                <p className={`text-xs ${themeClasses.textSecondary(theme)} break-words`}>{error}</p>
              </div>
              <button
                onClick={dismissError}
                aria-label="Dismiss"
                className={`p-1 rounded ${themeClasses.textSecondary(theme)} ${themeClasses.hoverBgSecondary(theme)}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : minimized ? (
            // Minimized chip — click to restore
            <button
              onClick={restore}
              className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-2xl border ${themeClasses.border(theme)} ${themeClasses.bg(theme)} ${themeClasses.hoverBgSecondary(theme)}`}
              title={job?.stage}
            >
              <Spinner size="sm" />
              <span className={`text-xs ${themeClasses.text(theme)}`}>
                MR engine{pct !== null ? ` · ${pct}%` : '…'}
              </span>
            </button>
          ) : (
            // Expanded progress card
            <div
              className={`p-4 rounded-lg shadow-2xl border ${themeClasses.border(theme)} ${themeClasses.bg(theme)} w-80`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${themeClasses.text(theme)}`}>
                  {job?.kind === 'install' ? 'Installing MR engine' : 'MR-precision segmentation'}
                </span>
                <button
                  onClick={minimize}
                  aria-label="Minimize"
                  title="Minimize and keep working"
                  className={`p-1 rounded ${themeClasses.textSecondary(theme)} ${themeClasses.hoverBgSecondary(theme)}`}
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-xs ${themeClasses.textSecondary(theme)} mb-2 flex justify-between gap-2`}>
                <span className="truncate">
                  {job?.stage}
                  {pct !== null && job ? ` · ${fmtBytes(job.downloaded)} / ${fmtBytes(job.total)}` : ''}
                </span>
                <span className="tabular-nums shrink-0">{mmss}</span>
              </p>
              <ProgressBar value={pct} theme={theme} label={job?.stage} />
              <p className={`text-[11px] ${themeClasses.textSecondary(theme)} mt-2`}>
                Runs on-device · you can minimize and keep working.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
