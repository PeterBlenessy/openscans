import { useEffect } from 'react'
import { useMrEngineStore } from '@/stores/mrEngineStore'
import { MR_SEGMENTATION_AVAILABLE } from '@/lib/ai/segmentationServer'
import { isTauri } from '@/lib/utils/platform'
import type { Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { Badge } from '@/components/ui'

/**
 * Settings card for the MR-precision engine: shows install status and lets the
 * user pre-install or remove it (so the ~2 GB first-run download isn't a
 * surprise mid-workflow). The actual install runs in the global store and shows
 * the minimizable progress UI.
 */
export function MrEngineSettings({ theme }: { theme: Theme }) {
  const { engineReady, modelReady, job, refreshStatus, install, remove } = useMrEngineStore()

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  // Desktop-only feature, gated until enabled.
  if (!MR_SEGMENTATION_AVAILABLE || !isTauri()) return null

  const installing = job?.kind === 'install'
  const status = installing
    ? 'Installing…'
    : engineReady
      ? `Installed${modelReady ? ' · model ready' : ' · model downloads on first run'}`
      : 'Not installed'

  return (
    <div className={`p-4 rounded-lg border ${themeClasses.bgSecondary(theme)} ${themeClasses.border(theme)}`}>
      <p className={`text-sm font-medium ${themeClasses.text(theme)}`}>MR-Precision Segmentation</p>
      <p className={`text-xs mt-0.5 mb-3 ${themeClasses.textSecondary(theme)}`}>
        On-device vertebra segmentation for MR (TotalSegmentator-MRI). One-time
        setup (~2&nbsp;GB) installs the engine locally — nothing leaves your device.
      </p>
      <div className="mb-3">
        <Badge tone={engineReady ? 'success' : 'neutral'} theme={theme}>{status}</Badge>
      </div>
      <div className="flex justify-end gap-2">
        {engineReady && !installing && (
          <button
            onClick={() => {
              void remove()
            }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${themeClasses.textSecondary(theme)} ${themeClasses.hoverBgSecondary(theme)}`}
          >
            Remove
          </button>
        )}
        {!engineReady && (
          <button
            onClick={() => {
              void install()
            }}
            disabled={installing}
            className="px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {installing ? 'Installing…' : 'Install now'}
          </button>
        )}
      </div>
    </div>
  )
}
