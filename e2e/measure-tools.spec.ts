/**
 * Regression: the measurement / ROI toolbar buttons must register their
 * cornerstone-tools tool on the viewport element. Global addTool only reaches
 * elements enabled after tools-init, and our element is enabled before that, so
 * activating a tool used to log "Unable to find tool <name> for enabledElement"
 * and the button did nothing. addMeasurementToolsForElement fixes it.
 */
import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MULTI = path.join(__dirname, 'fixtures', 'multi-series')

test('measurement tools activate without "Unable to find tool" warnings', async ({ page }) => {
  const toolWarnings: string[] = []
  const colorLutWarnings: string[] = []
  page.on('console', (msg) => {
    const t = msg.text()
    if (t.includes('Unable to find tool')) toolWarnings.push(t)
    if (t.includes('colorLUT only provides') || t.includes('segmentsPerLabelmap')) colorLutWarnings.push(t)
  })

  await page.goto('/')
  await expect(page.locator('text=OpenScans').first()).toBeVisible({ timeout: 10000 })
  const files = fs.readdirSync(MULTI).filter((f) => f.endsWith('.dcm')).map((f) => path.join(MULTI, f))
  if (files.length === 0) {
    test.skip()
    return
  }
  await page.locator('[data-testid="file-input"]').setInputFiles(files)
  await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })
  await page.waitForTimeout(1200)

  for (const id of ['length-tool-button', 'angle-tool-button', 'ellipse-roi-button', 'rectangle-roi-button']) {
    const btn = page.locator(`[data-testid="${id}"]`)
    await expect(btn).toBeEnabled()
    await btn.click()
    await page.waitForTimeout(250)
  }

  expect(
    toolWarnings,
    `cornerstone "Unable to find tool" warnings: ${toolWarnings.join(' | ')}`
  ).toHaveLength(0)
  expect(
    colorLutWarnings,
    `cornerstone colorLUT/segmentsPerLabelmap warnings: ${colorLutWarnings.join(' | ')}`
  ).toHaveLength(0)
})
