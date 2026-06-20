/**
 * Frontend bridge to the bundled local AI (llama-server) sidecar.
 *
 * Wraps the Tauri `local_ai_*` commands (see `src-tauri/src/local_ai.rs`) and
 * provides {@link ensureLocalServer}, which guarantees the model is downloaded
 * and the server is ready before the local detector issues a request. All of
 * this is desktop-only and loopback-only — nothing leaves the device.
 */
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { isTauri } from '@/lib/utils/platform'

const DOWNLOAD_PROGRESS_EVENT = 'local-ai://download-progress'

export interface ModelStatus {
  model: string
  /** Both the GGUF and its mmproj projector are present on disk. */
  downloaded: boolean
  /** The model is in the built-in registry (auto-downloadable). */
  known: boolean
}

export interface ServerStatus {
  running: boolean
  model: string | null
  port: number
}

export interface DownloadProgress {
  /** Label of the file currently downloading ('model' | 'vision projector'). */
  file: string
  downloaded: number
  /** 0 when the source doesn't report a content length. */
  total: number
}

export function localModelStatus(model: string): Promise<ModelStatus> {
  return invoke<ModelStatus>('local_ai_model_status', { model })
}

export function downloadLocalModel(model: string): Promise<void> {
  return invoke<void>('local_ai_download_model', { model })
}

export function startLocalServer(model: string, port: number): Promise<ServerStatus> {
  return invoke<ServerStatus>('local_ai_start', { model, port })
}

export function stopLocalServer(): Promise<void> {
  return invoke<void>('local_ai_stop')
}

export function localServerStatus(): Promise<ServerStatus> {
  return invoke<ServerStatus>('local_ai_status')
}

/**
 * Subscribe to download-progress events. Returns an unlisten function.
 */
export async function onDownloadProgress(
  handler: (progress: DownloadProgress) => void
): Promise<() => void> {
  return listen<DownloadProgress>(DOWNLOAD_PROGRESS_EVENT, (e) => handler(e.payload))
}

/**
 * Ensure the local server is downloaded, started, and ready for `model`.
 *
 * Downloads the model on first use (reporting progress via `onProgress`), then
 * starts the sidecar and waits for it to become healthy. Idempotent: if the
 * server is already running with the same model it returns immediately.
 *
 * @throws if not running under Tauri, or if a model that isn't downloaded also
 *   isn't in the auto-download registry (e.g. a user-typed custom id meant for
 *   a self-managed server).
 */
export async function ensureLocalServer(
  model: string,
  port: number,
  onProgress?: (progress: DownloadProgress) => void
): Promise<ServerStatus> {
  if (!isTauri()) {
    throw new Error('Local AI requires the OpenScans desktop app.')
  }

  const status = await localModelStatus(model)
  if (!status.downloaded) {
    if (!status.known) {
      throw new Error(
        `Model "${model}" is not downloaded and not auto-downloadable. ` +
          `Use the preconfigured model, or point a self-managed server at port ${port}.`
      )
    }
    let unlisten: (() => void) | undefined
    try {
      if (onProgress) unlisten = await onDownloadProgress(onProgress)
      await downloadLocalModel(model)
    } finally {
      unlisten?.()
    }
  }

  return startLocalServer(model, port)
}
