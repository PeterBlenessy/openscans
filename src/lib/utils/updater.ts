/**
 * Auto-update helpers (desktop only)
 *
 * The actual update check / download / install runs in the Rust backend
 * (see `src-tauri/src/lib.rs`). The frontend only invokes the commands.
 *
 * Every entry point is guarded by `isTauri()` so the web-browser build never
 * touches a Tauri API — in the browser these are no-ops.
 */

import { isTauri } from './platform'

export interface UpdateInfo {
  /** The version available to install (e.g. "0.6.0"). */
  version: string
  /** The currently running version. */
  currentVersion: string
  /** Release notes, if the manifest provides them. */
  notes?: string | null
  /** Release date (RFC3339), if available. */
  date?: string | null
}

/**
 * Check the configured GitHub release endpoint for a newer version.
 *
 * Returns `null` in the browser, when the app is up to date, or when the
 * updater is not yet configured (no signing pubkey). Never throws — failures
 * are logged and treated as "no update available".
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  if (!isTauri()) return null

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke<UpdateInfo | null>('check_for_update')
  } catch (error) {
    // Not configured yet (empty pubkey), offline, or no manifest — all benign.
    console.warn('[updater] Update check skipped:', error)
    return null
  }
}

/**
 * Download and install the available update, then relaunch the app.
 *
 * No-op in the browser. Rejects if the install fails so the caller can surface
 * an error to the user.
 */
export async function installUpdate(): Promise<void> {
  if (!isTauri()) return

  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('install_update')
}
