/**
 * Desktop auto-update notification
 *
 * Renders nothing in the web build (the update check short-circuits via
 * `isTauri()`). On desktop, checks for an update shortly after launch and, if
 * one is available, shows an unobtrusive bottom-right banner with an
 * "Install & Restart" action.
 */

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { checkForUpdate, installUpdate, type UpdateInfo } from '../lib/utils/updater'

export function UpdateNotification() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Delay the check so it never competes with first paint / study load.
    const timer = setTimeout(async () => {
      const result = await checkForUpdate()
      if (!cancelled && result) {
        setUpdate(result)
      }
    }, 4000)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  if (!update || dismissed) return null

  const handleInstall = async () => {
    setInstalling(true)
    setError(null)
    try {
      // On success the app relaunches, so this never returns.
      await installUpdate()
    } catch (err) {
      setInstalling(false)
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-100">Update available</h3>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-200"
          aria-label="Dismiss update notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-300">
        Version {update.version} is ready to install. You're on {update.currentVersion}.
      </p>

      {error && <p className="mt-2 text-xs text-red-400">Update failed: {error}</p>}

      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={() => setDismissed(true)}
          disabled={installing}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          disabled={installing}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {installing ? 'Installing…' : 'Install & Restart'}
        </button>
      </div>
    </div>
  )
}
