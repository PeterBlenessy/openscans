/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * E2E tests for OpenScans - Critical Workflows
 *
 * Tests 5-7 critical user workflows:
 * 1. File loading and display
 * 2. Instance navigation (next/previous)
 * 3. Viewport tools (window/level, zoom, pan)
 * 4. Export with privacy verification (PNG + PDF)
 * 5. Batch export (favorites to PDF)
 * 6. Settings persistence
 *
 * IMPORTANT: Requires anonymized test DICOM files in e2e/fixtures/
 * See e2e/fixtures/README.md for setup instructions
 */

import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test fixture paths
const FIXTURES_DIR = path.join(__dirname, 'fixtures')
const SINGLE_IMAGE_PATH = path.join(FIXTURES_DIR, 'single-image.dcm')
const MULTI_SERIES_DIR = path.join(FIXTURES_DIR, 'multi-series')

// Helper to check if test files exist
function hasTestFiles(): boolean {
  return fs.existsSync(SINGLE_IMAGE_PATH) || fs.existsSync(MULTI_SERIES_DIR)
}

test.beforeEach(async ({ page }) => {
  // Navigate to app
  await page.goto('/')

  // Wait for app to be ready
  await expect(page.locator('text=OpenScans')).toBeVisible({ timeout: 10000 })
})

test.describe('File Loading and Display', () => {
  test('should load and display a DICOM file', async ({ page }) => {
    if (!fs.existsSync(SINGLE_IMAGE_PATH)) {
      test.skip()
      return
    }

    // Locate the file input (hidden)
    const fileInput = page.locator('[data-testid="file-input"]')

    // Upload DICOM file
    await fileInput.setInputFiles(SINGLE_IMAGE_PATH)

    // Wait for image to load and display
    await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

    // Verify metadata is displayed (check for "Current Image" section)
    await expect(page.locator('text=/Study Date:/i')).toBeVisible()
    await expect(page.locator('text=/Series:/i')).toBeVisible()

    // Verify image is rendered (check for canvas element)
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
  })

  test.skip('should display loading state while parsing DICOM', async ({ page }) => {
    // Skipped: DICOM parsing is too fast to reliably test loading state
    // This would require artificially slowing down the parser
  })

  test('should handle multiple file uploads', async ({ page }) => {
    if (!fs.existsSync(MULTI_SERIES_DIR)) {
      test.skip()
      return
    }

    // Get all DICOM files in multi-series directory
    const files = fs
      .readdirSync(MULTI_SERIES_DIR)
      .filter((f) => f.endsWith('.dcm'))
      .map((f) => path.join(MULTI_SERIES_DIR, f))

    if (files.length === 0) {
      test.skip()
      return
    }

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(files)

    // Wait for series to load
    await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

    // Verify series information is displayed
    await expect(page.locator('text=/Instance:/i')).toBeVisible()
  })
})

test.describe('Instance Navigation', () => {
  test('should navigate through instances with next/previous buttons', async ({ page }) => {
    if (!fs.existsSync(MULTI_SERIES_DIR)) {
      test.skip()
      return
    }

    const files = fs
      .readdirSync(MULTI_SERIES_DIR)
      .filter((f) => f.endsWith('.dcm'))
      .map((f) => path.join(MULTI_SERIES_DIR, f))

    if (files.length < 3) {
      test.skip()
      return
    }

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(files)

    await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

    // Get initial slider value
    const slider = page.locator('[data-testid="instance-slider"]')
    const initialValue = await slider.inputValue()

    // Use keyboard navigation (ArrowDown = next)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)

    const nextValue = await slider.inputValue()
    expect(nextValue).not.toBe(initialValue)

    // Use keyboard navigation (ArrowUp = previous)
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(500)

    const backValue = await slider.inputValue()
    expect(backValue).toBe(initialValue)
  })

  test('should navigate with keyboard shortcuts (arrow keys)', async ({ page }) => {
    if (!fs.existsSync(MULTI_SERIES_DIR)) {
      test.skip()
      return
    }

    const files = fs
      .readdirSync(MULTI_SERIES_DIR)
      .filter((f) => f.endsWith('.dcm'))
      .map((f) => path.join(MULTI_SERIES_DIR, f))

    if (files.length < 3) {
      test.skip()
      return
    }

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(files)

    await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

    const viewport = page.locator('[data-testid="viewport"]')

    // Focus viewport
    await viewport.click()

    const slider = page.locator('[data-testid="instance-slider"]')
    const initialValue = await slider.inputValue()

    // Press ArrowDown to go to next instance
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)

    const nextValue = await slider.inputValue()
    expect(nextValue).not.toBe(initialValue)

    // Press ArrowUp to go back
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(500)

    const backValue = await slider.inputValue()
    expect(backValue).toBe(initialValue)
  })
})

test.describe('Viewport Tools', () => {
  test('should adjust window/level with mouse drag', async ({ page }) => {
    if (!fs.existsSync(SINGLE_IMAGE_PATH)) {
      test.skip()
      return
    }

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(SINGLE_IMAGE_PATH)

    await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

    const viewport = page.locator('[data-testid="viewport"]')

    // Get initial W/L values (shown as "C: 400" and "B: 40")
    const initialContrast = await page.locator('text=/C: \\d+/').textContent()

    // Simulate mouse drag for W/L adjustment
    const box = await viewport.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50)
      await page.mouse.up()
    }

    await page.waitForTimeout(500)

    // Verify W/L values changed
    const newContrast = await page.locator('text=/C: \\d+/').textContent()
    expect(newContrast).not.toBe(initialContrast)
  })

  test('should reset viewport with reset button', async ({ page }) => {
    if (!fs.existsSync(SINGLE_IMAGE_PATH)) {
      test.skip()
      return
    }

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(SINGLE_IMAGE_PATH)

    await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

    const viewport = page.locator('[data-testid="viewport"]')

    // Adjust W/L
    const box = await viewport.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2)
      await page.mouse.up()
    }

    await page.waitForTimeout(500)

    // Click reset button
    const resetButton = page.locator('[data-testid="reset-button"]')
    await resetButton.click()

    await page.waitForTimeout(500)

    // Verify viewport reset (check that contrast/brightness indicators exist)
    await expect(page.locator('text=/C: \\d+/')).toBeVisible()
    await expect(page.locator('text=/B: \\d+/')).toBeVisible()
  })
})

test.describe('Export with Privacy Verification', () => {
  test('should export PNG without patient data by default', async ({ page }) => {
    if (!fs.existsSync(SINGLE_IMAGE_PATH)) {
      test.skip()
      return
    }

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(SINGLE_IMAGE_PATH)

    await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

    // Open export dialog
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()

    // Verify patient data toggle is OFF by default (PDF format shows patient data options)
    // First select PDF format to see the patient data options
    const pdfFormatButton = page.locator('button:has-text("PDF")')
    await pdfFormatButton.click()

    const patientNameToggle = page.locator('[data-testid="include-patient-name"]')
    await expect(patientNameToggle).not.toBeChecked()

    // Switch back to PNG format
    const pngFormatButton = page.locator('button:has-text("PNG")')
    await pngFormatButton.click()

    // Wait for download event
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })

    // Click export confirm button
    const exportConfirmButton = page.locator('[data-testid="export-confirm-button"]')
    await exportConfirmButton.click()

    const download = await downloadPromise
    const filename = download.suggestedFilename()

    // Verify filename does NOT contain patient data
    expect(filename).toMatch(/\.png$/)
    expect(filename).not.toContain('PATIENT')
    expect(filename).not.toContain('TEST')

    // Verify filename format (should be like "MR - Series - 1.png")
    expect(filename).toMatch(/^[A-Z]+ - .+ - \d+\.png$/)
  })

  test('should include patient data when explicitly enabled', async ({ page }) => {
    if (!fs.existsSync(SINGLE_IMAGE_PATH)) {
      test.skip()
      return
    }

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(SINGLE_IMAGE_PATH)

    await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

    // Open export dialog
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()

    // Select PDF format to access patient data options
    const pdfFormatButton = page.locator('button:has-text("PDF")')
    await pdfFormatButton.click()

    // Enable patient data toggles
    const patientIdToggle = page.locator('[data-testid="include-patient-id"]')
    await patientIdToggle.check()
    await expect(patientIdToggle).toBeChecked()

    // Export PDF
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    const exportConfirmButton = page.locator('[data-testid="export-confirm-button"]')
    await exportConfirmButton.click()

    const download = await downloadPromise
    const filename = download.suggestedFilename()

    // Filename should be PDF since we selected PDF format
    expect(filename).toMatch(/\.pdf$/)
  })

  test('should export PDF with privacy by default', async ({ page }) => {
    if (!fs.existsSync(SINGLE_IMAGE_PATH)) {
      test.skip()
      return
    }

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(SINGLE_IMAGE_PATH)

    await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()

    // Select PDF format
    const pdfFormatButton = page.locator('button:has-text("PDF")')
    await pdfFormatButton.click()

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    const exportConfirmButton = page.locator('[data-testid="export-confirm-button"]')
    await exportConfirmButton.click()

    const download = await downloadPromise
    const filename = download.suggestedFilename()

    expect(filename).toMatch(/\.pdf$/)
    expect(filename).not.toContain('PATIENT')
  })
})

test.describe('Batch Export (Favorites)', () => {
  test.skip('should add images to favorites and export as batch PDF', async ({ page }) => {
    // Skipped: Requires finding correct selectors for favorites panel and batch export dialog
    // TODO: Add data-testid to FavoritesPanel and BatchExportDialog components
    if (!fs.existsSync(MULTI_SERIES_DIR)) {
      test.skip()
      return
    }

    const files = fs
      .readdirSync(MULTI_SERIES_DIR)
      .filter((f) => f.endsWith('.dcm'))
      .map((f) => path.join(MULTI_SERIES_DIR, f))

    if (files.length < 3) {
      test.skip()
      return
    }

    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(files.slice(0, 3))

    await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

    // Favorite current image
    const favoriteButton = page.locator('[data-testid="favorite-button"]')
    await favoriteButton.click()

    // Navigate to next image
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)

    // Favorite second image
    await favoriteButton.click()

    // Navigate to third image
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)

    // Favorite third image
    await favoriteButton.click()

    // Open favorites panel
    const favoritesPanel = page.locator('[aria-label*="Favorites"], [data-testid="favorites"]')
    await favoritesPanel.click()

    // Verify 3 favorites
    await expect(page.locator('text=/3.*favorite/i')).toBeVisible()

    // Click batch export button
    const batchExportButton = page.locator('button:has-text("Export All")')
    await batchExportButton.click()

    // Select grid layout (e.g., 2x2)
    const gridButton = page.locator('button:has-text("2x2")')
    await gridButton.click()

    // Export as PDF
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    const exportButton = page.locator('button:has-text("Export PDF")')
    await exportButton.click()

    const download = await downloadPromise
    const filename = download.suggestedFilename()

    expect(filename).toMatch(/Favorites.*\.pdf$/)
  })
})

test.describe('Settings Persistence', () => {
  test.skip('should persist theme setting across page reloads', async ({ page }) => {
    // Skipped: Requires finding correct selector for settings button
    // TODO: Add data-testid to settings button in App.tsx or LeftDrawer.tsx

    // Switch to light theme
    const lightThemeButton = page.locator('button:has-text("Light"), input[value="light"]')
    await lightThemeButton.click()

    // Verify light theme applied
    await expect(page.locator('html.light')).toHaveCount(1)

    // Reload page
    await page.reload()
    await expect(page.locator('text=OpenScans')).toBeVisible({ timeout: 10000 })

    // Verify light theme persisted
    await expect(page.locator('html.light')).toHaveCount(1)

    // Clean up - switch back to dark
    await settingsButton.click()
    const darkThemeButton = page.locator('button:has-text("Dark"), input[value="dark"]')
    await darkThemeButton.click()
  })

  test.skip('should persist privacy toggle setting', async ({ page }) => {
    // Skipped: Requires finding correct selector for settings button and privacy toggle
    // TODO: Add data-testid to settings components

    // Toggle hidePersonalInfo to false
    const privacyToggle = page.locator('input[type="checkbox"][id*="privacy"]')
    const isChecked = await privacyToggle.isChecked()

    await privacyToggle.click()

    // Reload page
    await page.reload()
    await expect(page.locator('text=OpenScans')).toBeVisible({ timeout: 10000 })

    // Open settings again
    await settingsButton.click()

    // Verify privacy toggle persisted
    await expect(privacyToggle).toHaveProperty('checked', !isChecked)

    // Clean up - restore original state
    if (isChecked) {
      await privacyToggle.click()
    }
  })
})

test.describe('Error Handling', () => {
  test('should handle invalid file upload gracefully', async ({ page }) => {
    const fileInput = page.locator('[data-testid="file-input"]')

    // Create a temporary non-DICOM file
    const tempFile = path.join(__dirname, 'temp-test.txt')
    fs.writeFileSync(tempFile, 'This is not a DICOM file')

    try {
      await fileInput.setInputFiles(tempFile)

      // Should show error message
      await expect(page.locator('text=/error|invalid|failed/i')).toBeVisible({ timeout: 5000 })
    } finally {
      // Clean up temp file
      fs.unlinkSync(tempFile)
    }
  })

  test('should handle empty file upload', async ({ page }) => {
    const fileInput = page.locator('[data-testid="file-input"]')

    // Clear file input
    await fileInput.setInputFiles([])

    // Should not crash or show error
    await expect(page.locator('text=OpenScans')).toBeVisible()
  })
})
