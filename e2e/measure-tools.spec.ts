/**
 * Measurement tools live in a reveal-able sub-toolbar (the "Measure" button in
 * the main toolbar toggles it). Tools must register on the element without
 * "Unable to find tool" / colorLUT warnings, toggle on/off, and gate the Clear
 * button. (Per-item delete via cornerstone's EraserTool lands in a follow-up.)
 */
import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MULTI = path.join(__dirname, 'fixtures', 'multi-series')

async function loadStudyAndOpenMeasureTools(page: import('@playwright/test').Page) {
  await page.goto('/')
  await expect(page.locator('text=OpenScans').first()).toBeVisible({ timeout: 10000 })
  const files = fs.readdirSync(MULTI).filter((f) => f.endsWith('.dcm')).map((f) => path.join(MULTI, f))
  if (files.length === 0) return false
  await page.locator('[data-testid="file-input"]').setInputFiles(files)
  await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })
  await page.waitForTimeout(1200)
  // Open the measurement sub-toolbar.
  await page.locator('[data-testid="measure-tools-toggle"]').click()
  await expect(page.locator('[data-testid="measure-sub-toolbar"]')).toBeVisible()
  return true
}

test('measure sub-toolbar: reveal, Pointer/Eraser present, activate + toggle cleanly', async ({ page }) => {
  const toolWarnings: string[] = []
  const colorLutWarnings: string[] = []
  page.on('console', (msg) => {
    const t = msg.text()
    if (t.includes('Unable to find tool')) toolWarnings.push(t)
    if (t.includes('colorLUT only provides') || t.includes('segmentsPerLabelmap')) colorLutWarnings.push(t)
  })

  if (!(await loadStudyAndOpenMeasureTools(page))) {
    test.skip()
    return
  }

  // The Pointer (select/move) and Eraser (delete) modes are in the sub-toolbar.
  await expect(page.locator('[data-testid="pointer-tool-button"]')).toBeVisible()
  await expect(page.locator('[data-testid="eraser-tool-button"]')).toBeVisible()

  // A tool can be selected AND unselected (toggle) — reflected in aria-pressed.
  const length = page.locator('[data-testid="length-tool-button"]')
  await expect(length).toBeEnabled()
  await length.click()
  await expect(length).toHaveAttribute('aria-pressed', 'true')
  await length.click()
  await expect(length).toHaveAttribute('aria-pressed', 'false')

  for (const id of ['length-tool-button', 'angle-tool-button', 'ellipse-roi-button', 'rectangle-roi-button']) {
    const btn = page.locator(`[data-testid="${id}"]`)
    await expect(btn).toBeEnabled()
    await btn.click()
    await page.waitForTimeout(200)
  }

  expect(toolWarnings, `"Unable to find tool" warnings: ${toolWarnings.join(' | ')}`).toHaveLength(0)
  expect(colorLutWarnings, `colorLUT warnings: ${colorLutWarnings.join(' | ')}`).toHaveLength(0)
})

test('draw a length measurement (persists), then delete it with the Eraser', async ({ page }) => {
  if (!(await loadStudyAndOpenMeasureTools(page))) {
    test.skip()
    return
  }
  const viewport = page.locator('[data-testid="viewport"]')
  const box = await viewport.boundingBox()
  if (!box) throw new Error('no viewport box')
  const cy = box.y + box.height / 2
  const x1 = box.x + box.width * 0.35
  const x2 = box.x + box.width * 0.65

  // Draw a length with the Length tool.
  await page.locator('[data-testid="length-tool-button"]').click()
  await page.mouse.move(x1, cy)
  await page.mouse.down()
  await page.mouse.move(x2, cy, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(400) // persist debounce

  const stored = async () =>
    page.evaluate(() => localStorage.getItem('openscans-measurements') || '')
  expect(await stored(), 'measurement should be persisted after drawing').toContain('Length')

  // Erase it: activate the Eraser and click the middle of the line.
  await page.locator('[data-testid="eraser-tool-button"]').click()
  await page.mouse.click((x1 + x2) / 2, cy)
  await page.waitForTimeout(400)

  expect(await stored(), 'measurement should be gone after erasing').not.toContain('Length')
})
