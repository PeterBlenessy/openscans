/**
 * Frontend bridge to the on-demand MR segmentation engine (Phase 3).
 *
 * Wraps the Tauri `mr_seg_*` commands (see `src-tauri/src/mr_seg.rs`). The
 * engine (a PyInstaller'd TotalSegmentator-MRI / MONAI runtime) and its weights
 * are downloaded on first use — nothing is bundled — and inference runs locally
 * over a DICOM series directory, so no data leaves the device.
 */
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { isTauri } from '@/lib/utils/platform'
import { MarkerAnnotation } from '@/types/annotation'
import {
  parseSegmentationResult,
  segmentationToMarkers,
  type MarkerContext,
} from './mrSegmentation'

const MR_DOWNLOAD_PROGRESS_EVENT = 'mr-seg://download-progress'

export interface MrEngineStatus {
  /** The PyInstaller engine binary is present on disk. */
  engineReady: boolean
  /** The model weights are present on disk. */
  modelReady: boolean
}

export interface MrDownloadProgress {
  file: string
  downloaded: number
  total: number
}

export function mrEngineStatus(): Promise<MrEngineStatus> {
  return invoke<MrEngineStatus>('mr_seg_status')
}

export function downloadMrEngine(): Promise<void> {
  return invoke<void>('mr_seg_download')
}

/** Run inference over a DICOM series directory; returns raw (unvalidated) JSON. */
export function runMrSegmentation(seriesDir: string): Promise<unknown> {
  return invoke<unknown>('mr_seg_run', { seriesDir })
}

export async function onMrDownloadProgress(
  handler: (progress: MrDownloadProgress) => void
): Promise<() => void> {
  return listen<MrDownloadProgress>(MR_DOWNLOAD_PROGRESS_EVENT, (e) => handler(e.payload))
}

/**
 * Ensure the engine binary is downloaded (on first use). The model weights are
 * fetched by the engine itself on its first run (reported via `modelReady` for
 * UI display), so only the engine binary gates here.
 * @throws outside the desktop app.
 */
export async function ensureMrEngine(
  onProgress?: (progress: MrDownloadProgress) => void
): Promise<void> {
  if (!isTauri()) {
    throw new Error('MR segmentation requires the OpenScans desktop app.')
  }
  const status = await mrEngineStatus()
  if (status.engineReady) return

  let unlisten: (() => void) | undefined
  try {
    if (onProgress) unlisten = await onMrDownloadProgress(onProgress)
    await downloadMrEngine()
  } finally {
    unlisten?.()
  }
}

/**
 * End-to-end MR segmentation for a series: ensure the engine, run it, validate
 * the output, and convert the resolved landmarks into marker annotations
 * spanning the series.
 */
export async function segmentSeries(
  seriesDir: string,
  ctx: MarkerContext,
  onProgress?: (progress: MrDownloadProgress) => void
): Promise<MarkerAnnotation[]> {
  await ensureMrEngine(onProgress)
  const raw = await runMrSegmentation(seriesDir)
  const result = parseSegmentationResult(raw)
  return segmentationToMarkers(result, ctx)
}
