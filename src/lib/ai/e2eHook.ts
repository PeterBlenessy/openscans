/**
 * Dev/e2e-only window hook to exercise the REAL local-AI analysis path end to
 * end from a WebDriver session (see plans + tauri-plugin-webdriver). Never
 * imported in production builds — main.tsx gates this behind import.meta.env.DEV.
 *
 * `window.__E2E__.runLocalAi(base64Dicom)`:
 *   1. enables AI + selects the `local` provider
 *   2. loads the DICOM so the viewport actually renders it (analysis captures
 *      the live canvas via `dicomToBase64Png`)
 *   3. ensures the bundled llama-server is running
 *   4. runs the real radiology analysis and returns the findings text
 */
import { initCornerstone } from '@/lib/cornerstone/initCornerstone'
import { dicomStudyService } from '@/lib/dicom/DicomStudyService'
import { useStudyStore } from '@/stores/studyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { ensureLocalServer } from '@/lib/ai/localServer'
import { localDetector } from '@/lib/ai/localVisionDetector'

type E2EResult =
  | { ok: true; findings: string; ms: number }
  | { ok: false; error: string; stage: string }

async function waitFor(pred: () => boolean, timeoutMs: number, label: string): Promise<void> {
  const start = performance.now()
  while (!pred()) {
    if (performance.now() - start > timeoutMs) throw new Error(`timeout waiting for ${label}`)
    await new Promise((r) => setTimeout(r, 100))
  }
}

async function runLocalAi(base64Dicom: string): Promise<E2EResult> {
  let stage = 'init'
  try {
    const settings = useSettingsStore.getState()
    settings.setAiEnabled(true)
    settings.setAiProvider('local')

    stage = 'cornerstone-init'
    await initCornerstone()

    stage = 'load-dicom'
    const bytes = Uint8Array.from(atob(base64Dicom), (c) => c.charCodeAt(0))
    const file = new File([bytes], 'e2e.dcm', { type: 'application/dicom' })
    const studies = await dicomStudyService.loadStudiesFromFiles([file])
    if (!studies.length) throw new Error('no studies parsed from fixture')
    const study = useStudyStore.getState()
    study.addStudy(studies[0])
    study.setCurrentStudy(studies[0].studyInstanceUID)

    stage = 'render-viewport'
    await waitFor(
      () => {
        const vp = document.querySelector('[data-testid="viewport"]')
        const canvas = vp?.querySelector('canvas') as HTMLCanvasElement | null
        return !!canvas && canvas.width > 0 && canvas.height > 0
      },
      15000,
      'viewport canvas'
    )

    stage = 'ensure-server'
    const s = useSettingsStore.getState()
    await ensureLocalServer(s.localModel, s.localPort)

    stage = 'analyze'
    const instance = useStudyStore.getState().currentInstance
    if (!instance) throw new Error('no current instance after load')
    const res = await localDetector.analyzeImage(instance)
    return { ok: true, findings: res.analysis.findings, ms: Math.round(res.processingTimeMs) }
  } catch (e) {
    const err = e as Error
    return { ok: false, error: String(err?.stack || err?.message || e), stage }
  }
}

export function installE2EHook(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  w.__E2E__ = {
    runLocalAi,
    settingsStore: useSettingsStore,
    studyStore: useStudyStore,
  }
  console.log('[E2E] window.__E2E__ installed')
}
