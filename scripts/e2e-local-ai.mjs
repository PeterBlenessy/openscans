/**
 * Drives the REAL running OpenScans desktop window (via tauri-plugin-webdriver
 * + tauri-webdriver bridge on :4444) to run a local-AI radiology analysis on a
 * fixture DICOM, and prints the result. Proves local AI works end to end in the
 * actual app webview (spawn + loopback inference + viewport capture).
 *
 * Prereqs: app running with `--features e2e-testing`, `tauri-webdriver` bridge up.
 */
import { remote } from 'webdriverio'
import fs from 'fs'

const b64 = fs.readFileSync('/tmp/fixture-dcm-b64.txt', 'utf8').trim()

const browser = await remote({
  hostname: 'localhost',
  port: 4444,
  path: '/',
  capabilities: { browserName: 'webview', 'webdriver:newSessionParameters': { alwaysMatch: {} } },
  logLevel: 'error',
})

let exitCode = 1
try {
  await browser.setTimeout({ script: 180000 })

  await browser.waitUntil(
    async () => browser.execute(() => !!document.getElementById('root') && !!window.__E2E__),
    { timeout: 30000, timeoutMsg: 'app root / window.__E2E__ not ready in 30s' }
  )
  console.log('[driver] app ready — running local AI analysis...')

  const result = await browser.executeAsync(async (dcm, done) => {
    try {
      done(await window.__E2E__.runLocalAi(dcm))
    } catch (e) {
      done({ ok: false, error: String(e && e.stack ? e.stack : e), stage: 'execute' })
    }
  }, b64)

  console.log('[driver] RESULT:', JSON.stringify(result, null, 2))
  if (result && result.ok) {
    console.log('\n✅ LOCAL AI WORKS — findings (first 400 chars):\n')
    console.log(String(result.findings).slice(0, 400))
    exitCode = 0
  } else {
    console.log('\n❌ LOCAL AI FAILED at stage:', result && result.stage)
  }
} catch (e) {
  console.error('[driver] error:', e?.message || e)
} finally {
  await browser.deleteSession().catch(() => {})
}
process.exit(exitCode)
