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

test('measure tools: activate cleanly, toggle off, and gate Clear', async ({ page }) => {
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

  // Clear-measurements button is disabled until something is drawn.
  await expect(page.locator('[data-testid="clear-measurements-button"]')).toBeDisabled()

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

test('draw a length measurement, then delete it per-item via its × badge', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('text=OpenScans').first()).toBeVisible({ timeout: 10000 })
  const files = fs.readdirSync(MULTI).filter((f) => f.endsWith('.dcm')).map((f) => path.join(MULTI, f))
  if (files.length === 0) {
    test.skip()
    return
  }
  await page.locator('[data-testid="file-input"]').setInputFiles(files)
  const viewport = page.locator('[data-testid="viewport"]')
  await expect(viewport).toBeVisible({ timeout: 30000 })
  await page.waitForTimeout(1200)

  // Activate the Length tool and draw a horizontal segment across the viewport.
  await page.locator('[data-testid="length-tool-button"]').click()
  const box = await viewport.boundingBox()
  if (!box) throw new Error('no viewport box')
  const cy = box.y + box.height / 2
  await page.mouse.move(box.x + box.width * 0.35, cy)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.65, cy, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(400)

  // Measurement registered → Clear button enabled + a delete badge is present.
  await expect(page.locator('[data-testid="clear-measurements-button"]')).toBeEnabled()
  const badge = page.locator('[aria-label="Delete measurement"]')
  await expect(badge).toHaveCount(1)

  // Per-item delete via the × badge.
  await badge.click()
  await page.waitForTimeout(300)
  await expect(page.locator('[aria-label="Delete measurement"]')).toHaveCount(0)
  await expect(page.locator('[data-testid="clear-measurements-button"]')).toBeDisabled()
})
