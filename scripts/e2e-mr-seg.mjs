/**
 * Drives the real OpenScans window to run MR-precision segmentation end to end
 * via the app's own Rust path: provision the engine (uv → Python → venv →
 * pip install) in the app data dir, download weights, segment the fixture DICOM
 * folder, and return the vertebra markers. Proves the app-owned install works
 * in-app. SLOW on first run (env + weights).
 *
 * Prereqs: app running with --features e2e-testing + tauri-webdriver bridge.
 * Arg: the DICOM series folder (default /tmp/mr-test/dicom).
 */
import { remote } from 'webdriverio'

const seriesDir = process.argv[2] || '/tmp/mr-test/dicom'

const browser = await remote({
  hostname: 'localhost',
  port: 4444,
  path: '/',
  capabilities: { browserName: 'webview', 'webdriver:newSessionParameters': { alwaysMatch: {} } },
  logLevel: 'error',
})

let exitCode = 1
try {
  await browser.setTimeout({ script: 900000 }) // 15 min: env install + weights + inference
  await browser.waitUntil(
    async () => browser.execute(() => !!window.__E2E__ && !!window.__E2E__.runMrSeg),
    { timeout: 30000, timeoutMsg: '__E2E__.runMrSeg not ready' }
  )
  console.log('[driver] running MR segmentation (provision + weights + infer — be patient)...')
  const result = await browser.executeAsync(async (dir, done) => {
    try {
      done(await window.__E2E__.runMrSeg(dir))
    } catch (e) {
      done({ ok: false, error: String(e && e.stack ? e.stack : e) })
    }
  }, seriesDir)

  console.log('[driver] RESULT:', JSON.stringify(result, null, 2))
  if (result && result.ok && result.count > 0) {
    console.log(`\n✅ MR SEG WORKS IN-APP — ${result.count} markers: ${result.labels.join(', ')}`)
    exitCode = 0
  } else {
    console.log('\n❌ MR seg failed:', result && result.error)
  }
} catch (e) {
  console.error('[driver] error:', e?.message || e)
} finally {
  await browser.deleteSession().catch(() => {})
}
process.exit(exitCode)
