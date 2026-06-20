import { create } from 'zustand'
import {
  mrEngineStatus,
  downloadMrEngine,
  removeMrEngine,
  segmentSeries,
  onMrDownloadProgress,
  type MrDownloadProgress,
} from '@/lib/ai/segmentationServer'
import { useAnnotationStore } from '@/stores/annotationStore'
import type { MarkerContext } from '@/lib/ai/mrSegmentation'

/**
 * Global MR-precision segmentation engine state.
 *
 * Owns the long-running install + segmentation lifecycle so it survives the
 * progress panel being minimized (the user keeps working) and component
 * unmounts. The actual work runs in Rust (`mr_seg_*` commands); a single global
 * listener feeds progress here regardless of which UI is open.
 */

export interface MrJob {
  /** 'install' = pre-install from Settings; 'segment' = a full run. */
  kind: 'install' | 'segment'
  /** Current stage label (from the Rust progress events). */
  stage: string
  downloaded: number
  total: number
}

/** Pending segmentation params held while we ask for first-run consent. */
interface PendingSeg {
  seriesDir: string
  seriesUid?: string
  ctx: MarkerContext
}

interface MrEngineState {
  engineReady: boolean
  modelReady: boolean
  job: MrJob | null
  /** Progress panel is minimized to the background indicator. */
  minimized: boolean
  error: string | null
  /** Set when a run needs the one-time setup consent. */
  consent: PendingSeg | null

  refreshStatus: () => Promise<void>
  /** Entry point for the toolbar: gate on consent, then run. */
  requestSegmentation: (params: PendingSeg) => Promise<void>
  confirmConsent: () => void
  cancelConsent: () => void
  /** Pre-install the engine (Settings "Install now"). */
  install: () => Promise<void>
  /** Remove the provisioned engine. */
  remove: () => Promise<void>
  minimize: () => void
  restore: () => void
  dismissError: () => void
}

let progressUnlisten: (() => void) | null = null

export const useMrEngineStore = create<MrEngineState>()((set, get) => {
  // One global progress listener for the whole app lifetime.
  onMrDownloadProgress((p: MrDownloadProgress) => {
    const job = get().job
    if (!job) return
    set({ job: { ...job, stage: p.file || job.stage, downloaded: p.downloaded, total: p.total } })
  }).then((un) => {
    progressUnlisten = un
  })

  /** Run the full segmentation flow as the active job. */
  async function runSegment({ seriesDir, seriesUid, ctx }: PendingSeg) {
    set({
      job: { kind: 'segment', stage: 'Starting…', downloaded: 0, total: 0 },
      error: null,
      minimized: false,
    })
    try {
      const markers = await segmentSeries(seriesDir, ctx, { seriesUid })
      useAnnotationStore.getState().addAnnotations(markers)
      set({ job: null })
      await get().refreshStatus()
    } catch (e) {
      const err = e as Error
      set({ job: null, error: err?.message || String(e) })
    }
  }

  return {
    engineReady: false,
    modelReady: false,
    job: null,
    minimized: false,
    error: null,
    consent: null,

    refreshStatus: async () => {
      try {
        const s = await mrEngineStatus()
        set({ engineReady: s.engineReady, modelReady: s.modelReady })
      } catch {
        /* desktop-only; ignore on web */
      }
    },

    requestSegmentation: async (params) => {
      if (get().job) return // already busy
      await get().refreshStatus()
      // First-time setup (engine not provisioned) → ask for consent first.
      if (!get().engineReady) {
        set({ consent: params })
        return
      }
      await runSegment(params)
    },

    confirmConsent: () => {
      const pending = get().consent
      if (!pending) return
      set({ consent: null })
      void runSegment(pending)
    },

    cancelConsent: () => set({ consent: null }),

    install: async () => {
      if (get().job) return
      set({
        job: { kind: 'install', stage: 'Starting…', downloaded: 0, total: 0 },
        error: null,
        minimized: false,
      })
      try {
        await downloadMrEngine()
        set({ job: null })
        await get().refreshStatus()
      } catch (e) {
        const err = e as Error
        set({ job: null, error: err?.message || String(e) })
      }
    },

    remove: async () => {
      try {
        await removeMrEngine()
      } finally {
        await get().refreshStatus()
      }
    },

    minimize: () => set({ minimized: true }),
    restore: () => set({ minimized: false }),
    dismissError: () => set({ error: null }),
  }
})

// Avoid a leaked listener on HMR in dev.
if (import.meta.hot) {
  import.meta.hot.dispose(() => progressUnlisten?.())
}
