import { useEffect } from 'react'
import { useMrEngineStore } from '@/stores/mrEngineStore'
import { MR_SEGMENTATION_AVAILABLE } from '@/lib/ai/segmentationServer'
import { isTauri } from '@/lib/utils/platform'

/**
 * Settings card for the MR-precision engine: shows install status and lets the
 * user pre-install or remove it (so the ~2 GB first-run download isn't a
 * surprise mid-workflow). The actual install runs in the global store and shows
 * the minimizable progress UI.
 */
export function MrEngineSettings({ isDark }: { isDark: boolean }) {
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
    <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f0f0f] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
      <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        MR-Precision Segmentation
      </p>
      <p className="text-xs text-gray-500 mb-3">
        On-device vertebra segmentation for MR (TotalSegmentator-MRI). One-time
        setup (~2&nbsp;GB) installs the engine locally — nothing leaves your device.
        Status: <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{status}</span>
      </p>
      <div className="flex justify-end gap-2">
        {engineReady && !installing && (
          <button
            onClick={() => {
              void remove()
            }}
            className={`px-3 py-1.5 rounded text-sm ${isDark ? 'text-gray-300 hover:bg-[#1a1a1a]' : 'text-gray-700 hover:bg-gray-100'}`}
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
            className="px-3 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {installing ? 'Installing…' : 'Install now'}
          </button>
        )}
      </div>
    </div>
  )
}
