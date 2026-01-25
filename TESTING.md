# Testing Guide

This document explains how to run, write, and debug tests for the OpenScans.

## Table of Contents

- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Unit Testing](#unit-testing)
- [E2E Testing](#e2e-testing)
- [Coverage Requirements](#coverage-requirements)
- [Debugging Tests](#debugging-tests)
- [Common Patterns](#common-patterns)
- [CI/CD Integration](#cicd-integration)

---

## Quick Start

### Run All Tests

```bash
# Run all unit tests (fast)
pnpm test

# Run with coverage report
pnpm test -- --coverage

# Run in watch mode (during development)
pnpm test -- --watch

# Run E2E tests (slower, requires fixtures)
pnpm test:e2e

# Run E2E in UI mode (visual debugging)
pnpm exec playwright test --ui
```

### Test Status

- **Unit Tests**: 199 passing (stores, parsers, export functions)
- **E2E Tests**: 11 passing (critical user workflows)
- **Overall Coverage**: 70%+ (95%+ on business logic)

---

## Test Structure

```
├── src/
│   ├── stores/
│   │   ├── studyStore.ts
│   │   └── studyStore.test.ts          # Unit tests next to source
│   ├── lib/
│   │   ├── dicom/
│   │   │   ├── parser.ts
│   │   │   └── parser.test.ts
│   │   └── export/
│   │       ├── fileNaming.ts
│   │       └── fileNaming.test.ts
│   └── test/
│       ├── setup.ts                     # Global test setup
│       └── mocks/
│           ├── cornerstone.ts           # Cornerstone.js mock
│           └── dicom.ts                 # DICOM fixtures
├── e2e/
│   ├── dicom-viewer.spec.ts            # E2E test suite
│   └── fixtures/
│       ├── single-image.dcm            # Test DICOM files
│       ├── multi-series/
│       └── README.md                    # Fixture documentation
├── vitest.config.ts                     # Vitest configuration
└── playwright.config.ts                 # Playwright configuration
```

---

## Unit Testing

### Framework: Vitest + React Testing Library

**Why Vitest?**
- Fast, modern alternative to Jest
- Native ES modules support
- Built-in TypeScript support
- Excellent VS Code integration

### Running Unit Tests

```bash
# Run all unit tests
pnpm test

# Run specific test file
pnpm test studyStore.test.ts

# Run tests matching pattern
pnpm test -- --grep "navigation"

# Watch mode (auto-rerun on file changes)
pnpm test -- --watch

# Coverage report
pnpm test -- --coverage

# Open coverage in browser
open coverage/index.html
```

### Writing Unit Tests

#### Pattern 1: Testing Zustand Stores

Zustand stores are pure logic and easy to test. Reset state before each test.

```typescript
// src/stores/studyStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useStudyStore } from './studyStore'

describe('studyStore', () => {
  // Reset state before each test
  beforeEach(() => {
    useStudyStore.setState({
      studies: [],
      currentStudy: null,
      currentSeries: null,
      currentInstance: null,
      currentInstanceIndex: 0,
    })
  })

  it('should navigate to next instance', () => {
    // Setup: Create a series with 3 instances
    const study = createMockStudy([
      createMockInstance('1'),
      createMockInstance('2'),
      createMockInstance('3'),
    ])

    useStudyStore.getState().setStudies([study])
    useStudyStore.getState().setCurrentStudy(study.studyInstanceUID)

    // Initial state
    expect(useStudyStore.getState().currentInstanceIndex).toBe(0)

    // Navigate to next
    useStudyStore.getState().nextInstance()

    // Verify navigation
    expect(useStudyStore.getState().currentInstanceIndex).toBe(1)
    expect(useStudyStore.getState().currentInstance?.sopInstanceUID).toBe('2')
  })

  it('should clamp navigation at series boundaries', () => {
    const study = createMockStudy([createMockInstance('1')])
    useStudyStore.getState().setStudies([study])
    useStudyStore.getState().setCurrentStudy(study.studyInstanceUID)

    // Try to navigate past last instance
    useStudyStore.getState().nextInstance()

    // Should stay at last instance (index 0)
    expect(useStudyStore.getState().currentInstanceIndex).toBe(0)
  })
})
```

**Key Points:**
- Use `beforeEach` to reset state (prevents test pollution)
- Test actions by calling `useStudyStore.getState().someAction()`
- Read state with `useStudyStore.getState().someValue`
- Test edge cases (empty arrays, boundaries, null values)

#### Pattern 2: Testing Pure Functions

Functions without side effects are straightforward to test.

```typescript
// src/lib/utils/formatSeriesDescription.test.ts
import { describe, it, expect } from 'vitest'
import { formatSeriesDescription } from './formatSeriesDescription'

describe('formatSeriesDescription', () => {
  it('should capitalize sequence abbreviations', () => {
    expect(formatSeriesDescription('t1')).toBe('T1')
    expect(formatSeriesDescription('t2')).toBe('T2')
    expect(formatSeriesDescription('flair')).toBe('FLAIR')
  })

  it('should replace underscores with spaces', () => {
    expect(formatSeriesDescription('t1_sag_mpr')).toBe('T1 Sagittal MPR')
  })

  it('should handle mixed case input', () => {
    expect(formatSeriesDescription('T1_SAG')).toBe('T1 Sagittal')
  })

  it('should handle empty strings', () => {
    expect(formatSeriesDescription('')).toBe('')
  })
})
```

#### Pattern 3: Testing with Mocks (DICOM Parser)

The DICOM parser uses external libraries. Mock them for unit tests.

```typescript
// src/lib/dicom/parser.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseDicomFiles } from './parser'

// Mock dicom-parser
vi.mock('dicom-parser', () => ({
  parseDicom: vi.fn((data: Uint8Array) => ({
    elements: {
      x00100010: { dataOffset: 0, length: 10 }, // Patient Name
      x00080060: { dataOffset: 0, length: 2 },  // Modality
      x7fe00010: { dataOffset: 0, length: 100 } // Pixel Data
    },
    string: vi.fn((tag) => {
      const tags = {
        'x00100010': 'TEST^PATIENT',
        'x00080060': 'MR',
      }
      return tags[tag] || ''
    }),
  })),
}))

describe('DICOM parser', () => {
  it('should extract patient name from DICOM', async () => {
    const mockFile = new File([new Uint8Array(100)], 'test.dcm', {
      type: 'application/dicom'
    })

    const studies = await parseDicomFiles([mockFile])

    expect(studies).toHaveLength(1)
    expect(studies[0].patientName).toBe('TEST^PATIENT')
  })

  it('should filter out files without pixel data (DICOMDIR)', async () => {
    // This test ensures we don't treat DICOMDIR as an image
    const mockFile = new File([new Uint8Array(100)], 'DICOMDIR', {
      type: 'application/dicom'
    })

    // Mock parseDicom to return dataset WITHOUT pixel data tag
    vi.mocked(parseDicom).mockReturnValueOnce({
      elements: {
        x00100010: { dataOffset: 0, length: 10 },
        // No x7fe00010 (pixel data) - this is a DICOMDIR
      },
      string: vi.fn(() => 'TEST'),
    } as any)

    const studies = await parseDicomFiles([mockFile])

    // Should be filtered out
    expect(studies).toHaveLength(0)
  })
})
```

**Mock Strategy:**
- **Always Mock**: Cornerstone.js, file-saver, jsPDF, localStorage
- **Never Mock**: DICOM parsing logic, Zustand stores

#### Pattern 4: Privacy-Critical Testing (Export Functions)

Privacy tests verify patient data is excluded by default.

```typescript
// src/lib/export/fileNaming.test.ts
import { describe, it, expect } from 'vitest'
import { generateFilename } from './fileNaming'
import { createMockInstance } from '@/test/mocks/dicom'

describe('generateFilename - PRIVACY CRITICAL', () => {
  it('should NOT include patient name by default', () => {
    const instance = createMockInstance({
      patientName: 'SENSITIVE^PATIENT^NAME',
      modality: 'MR',
      seriesDescription: 'T1 Sagittal',
      instanceNumber: 1,
    })

    const filename = generateFilename(instance, 'png', false)

    // Patient name must NOT appear in filename
    expect(filename).not.toContain('SENSITIVE')
    expect(filename).not.toContain('PATIENT')

    // Format should be: Modality - Series - Instance.ext
    expect(filename).toMatch(/^MR - .+ - 1\.png$/)
  })

  it('should include patient ID only when explicitly enabled', () => {
    const instance = createMockInstance({
      patientID: '123456',
      patientName: 'SENSITIVE^NAME',
      modality: 'MR',
      instanceNumber: 1,
    })

    const filenameWithoutPatient = generateFilename(instance, 'png', false)
    expect(filenameWithoutPatient).not.toContain('123456')

    const filenameWithPatient = generateFilename(instance, 'png', true)
    expect(filenameWithPatient).toContain('123456')
  })

  it('should sanitize special characters in filename', () => {
    const instance = createMockInstance({
      seriesDescription: 'T1/T2 Weighted: Sagittal | Axial',
      instanceNumber: 1,
    })

    const filename = generateFilename(instance, 'png', false)

    // Special characters should be replaced with underscores
    expect(filename).not.toMatch(/[\/\:\|]/)
    expect(filename).toMatch(/_/)
  })
})
```

**Privacy Testing Checklist:**
- ✅ Patient data excluded by default
- ✅ Patient data only included when explicitly enabled
- ✅ Filenames don't leak sensitive information
- ✅ Export metadata respects privacy settings

---

## E2E Testing

### Framework: Playwright

**Why Playwright?**
- Chromium-only (standard for medical imaging)
- Fast and reliable
- Built-in video/screenshot capture on failure
- Excellent debugging tools

### Running E2E Tests

```bash
# Run all E2E tests (headless)
pnpm test:e2e

# Run in UI mode (visual debugging)
pnpm exec playwright test --ui

# Run with visible browser
pnpm exec playwright test --headed

# Run specific test
pnpm exec playwright test -g "should load and display"

# Generate test code (record interactions)
pnpm exec playwright codegen http://localhost:3000
```

### Prerequisites: Test Fixtures

E2E tests require anonymized DICOM files. See `e2e/fixtures/README.md` for setup.

```bash
cd e2e/fixtures
chmod +x download-test-files.sh
./download-test-files.sh
```

**Required files:**
- `single-image.dcm` - Single CT image (518KB)
- `multi-series/image1.dcm, image2.dcm, image3.dcm` - Multi-instance series

### Writing E2E Tests

#### Pattern 1: File Upload and Display

```typescript
// e2e/dicom-viewer.spec.ts
import { test, expect } from '@playwright/test'
import path from 'path'

test('should load and display a DICOM file', async ({ page }) => {
  // Navigate to app
  await page.goto('/')
  await expect(page.locator('text=OpenScans')).toBeVisible()

  // Upload DICOM file using data-testid
  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(path.join(__dirname, 'fixtures/single-image.dcm'))

  // Wait for viewport to render
  await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

  // Verify metadata displayed
  await expect(page.locator('text=/Study Date:/i')).toBeVisible()
  await expect(page.locator('text=/Series:/i')).toBeVisible()

  // Verify canvas rendered
  const canvas = page.locator('canvas').first()
  await expect(canvas).toBeVisible()
})
```

#### Pattern 2: Navigation Testing

```typescript
test('should navigate with keyboard shortcuts', async ({ page }) => {
  await page.goto('/')

  // Upload multi-instance series
  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles([
    'fixtures/multi-series/image1.dcm',
    'fixtures/multi-series/image2.dcm',
    'fixtures/multi-series/image3.dcm',
  ])

  await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

  // Get initial slider value
  const slider = page.locator('[data-testid="instance-slider"]')
  const initialValue = await slider.inputValue()

  // Navigate with ArrowDown
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(500)

  const nextValue = await slider.inputValue()
  expect(nextValue).not.toBe(initialValue)

  // Navigate back with ArrowUp
  await page.keyboard.press('ArrowUp')
  await page.waitForTimeout(500)

  const backValue = await slider.inputValue()
  expect(backValue).toBe(initialValue)
})
```

#### Pattern 3: Export with Privacy Verification

**CRITICAL**: Verify patient data excluded by default.

```typescript
test('should export PNG without patient data by default', async ({ page }) => {
  await page.goto('/')

  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles('fixtures/single-image.dcm')
  await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

  // Open export dialog
  const exportButton = page.locator('[data-testid="export-button"]')
  await exportButton.click()

  // Verify privacy: Check PDF format to see patient data options
  const pdfFormatButton = page.locator('button:has-text("PDF")')
  await pdfFormatButton.click()

  const patientNameToggle = page.locator('[data-testid="include-patient-name"]')
  await expect(patientNameToggle).not.toBeChecked()

  // Switch to PNG and export
  const pngFormatButton = page.locator('button:has-text("PNG")')
  await pngFormatButton.click()

  // Wait for download
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
  const exportConfirmButton = page.locator('[data-testid="export-confirm-button"]')
  await exportConfirmButton.click()

  const download = await downloadPromise
  const filename = download.suggestedFilename()

  // Verify filename does NOT contain patient data
  expect(filename).toMatch(/\.png$/)
  expect(filename).not.toContain('PATIENT')
  expect(filename).toMatch(/^[A-Z]+ - .+ - \d+\.png$/)
})
```

#### Pattern 4: Download Verification

```typescript
test('should export PDF with privacy by default', async ({ page }) => {
  await page.goto('/')

  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles('fixtures/single-image.dcm')
  await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

  const exportButton = page.locator('[data-testid="export-button"]')
  await exportButton.click()

  // Select PDF format
  const pdfFormatButton = page.locator('button:has-text("PDF")')
  await pdfFormatButton.click()

  // Wait for download
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
  const exportConfirmButton = page.locator('[data-testid="export-confirm-button"]')
  await exportConfirmButton.click()

  const download = await downloadPromise
  const filename = download.suggestedFilename()

  expect(filename).toMatch(/\.pdf$/)
  expect(filename).not.toContain('PATIENT')
})
```

### E2E Test Best Practices

1. **Use data-testid for reliability**
   ```typescript
   // Good: Stable, semantic selector
   page.locator('[data-testid="export-button"]')

   // Avoid: Fragile, breaks with text changes
   page.locator('button:has-text("Export")')
   ```

2. **Wait for elements properly**
   ```typescript
   // Good: Explicit wait with timeout
   await expect(page.locator('[data-testid="viewport"]')).toBeVisible({ timeout: 30000 })

   // Avoid: Arbitrary sleep
   await page.waitForTimeout(5000)
   ```

3. **Clean up after tests**
   ```typescript
   test.afterEach(async ({ page }) => {
     // Clear localStorage to prevent state pollution
     await page.evaluate(() => localStorage.clear())
   })
   ```

4. **Use fixtures for test data**
   ```typescript
   // Good: Real DICOM files
   const FIXTURES_DIR = path.join(__dirname, 'fixtures')
   const files = fs.readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.dcm'))

   // Avoid: Mock files that don't test real parsing
   ```

---

## Coverage Requirements

### Overall Coverage Target: 70%+

We use tiered coverage targets based on component criticality:

| Component Type | Target | Rationale |
|---------------|--------|-----------|
| **Stores** | 95%+ | Pure logic, critical, easy to test |
| **DICOM Parser** | 90%+ | Medical safety critical |
| **Export Functions** | 95%+ | Privacy compliance critical |
| **Utilities** | 90%+ | Pure functions, straightforward |
| **Cornerstone Integration** | 40%+ | Hard to test, E2E covers it |
| **React Components** | 50-60% | UI-heavy, lower value |

### Checking Coverage

```bash
# Generate coverage report
pnpm test -- --coverage

# Open in browser
open coverage/index.html

# Check coverage thresholds (CI)
pnpm test -- --coverage --run
```

### Coverage Configuration

See `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],

      // Overall thresholds
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },

      // Per-file thresholds (stricter for critical code)
      perFile: true,

      exclude: [
        'src/test/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        'e2e/**',
      ],
    },
  },
})
```

### What to Test vs. Skip

**High Priority (Must Test):**
- ✅ Store actions and state transitions
- ✅ DICOM parsing and metadata extraction
- ✅ Export functions (especially privacy logic)
- ✅ Navigation bounds and edge cases
- ✅ Window/Level calculations
- ✅ File naming and sanitization

**Medium Priority (Should Test):**
- Settings persistence
- Favorites management
- Utility functions
- Format conversions

**Low Priority (Can Skip):**
- UI component rendering (unless complex logic)
- Cornerstone.js internal behavior (trust the library)
- Third-party library integration
- Simple getters/setters

---

## Debugging Tests

### VS Code Integration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest Tests",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test", "--run", "--no-coverage"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test File",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test", "${file}", "--run"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

**Usage:**
1. Set breakpoints in test or source files
2. Select "Debug Current Test File" in VS Code
3. Press F5 to start debugging

### Playwright Debugging

#### UI Mode (Recommended)

```bash
pnpm exec playwright test --ui
```

Features:
- Visual test runner
- Step-by-step execution
- Time-travel debugging
- Network inspection
- Console logs

#### Debug Mode

```bash
# Debug with visible browser
pnpm exec playwright test --headed --debug

# Debug specific test
pnpm exec playwright test --headed --debug -g "export PNG"
```

#### Screenshots and Videos

Playwright automatically captures on failure:
- Screenshots: `test-results/*/test-failed-1.png`
- Videos: `test-results/*/video.webm`
- Error context: `test-results/*/error-context.md`

### Common Debugging Scenarios

#### 1. Test Timeout (E2E)

```typescript
// Problem: Test times out waiting for element
await expect(page.locator('[data-testid="viewport"]')).toBeVisible()

// Solution: Increase timeout, check selector
await expect(page.locator('[data-testid="viewport"]')).toBeVisible({
  timeout: 30000 // DICOM loading can be slow
})

// Debug: Check error-context.md for page snapshot
```

#### 2. Flaky Test (Intermittent Failures)

```typescript
// Problem: Test passes sometimes, fails other times
await page.click('[data-testid="export-button"]')
await page.click('[data-testid="export-confirm"]') // Fails sometimes

// Solution: Wait for dialog to open
await page.click('[data-testid="export-button"]')
await expect(page.locator('[data-testid="export-confirm"]')).toBeVisible()
await page.click('[data-testid="export-confirm"]')
```

#### 3. State Pollution (Unit Tests)

```typescript
// Problem: Tests fail when run together but pass individually
test('first test', () => {
  useStudyStore.getState().setStudies([...])
  // Test passes
})

test('second test', () => {
  // Fails because store still has data from first test
})

// Solution: Reset state in beforeEach
beforeEach(() => {
  useStudyStore.setState({ studies: [], currentStudy: null, ... })
})
```

#### 4. Mock Not Working

```typescript
// Problem: Mock not being used
vi.mock('./someModule', () => ({ ... }))

// Solution: Mock BEFORE imports
vi.mock('./someModule', () => ({ ... }))
import { useModule } from './someModule' // Import after mock
```

---

## Common Patterns

### Pattern: Testing Async Operations

```typescript
import { waitFor } from '@testing-library/react'

test('should load DICOM file asynchronously', async () => {
  const mockFile = new File([...], 'test.dcm')

  // Trigger async operation
  const promise = parseDicomFiles([mockFile])

  // Wait for completion
  const studies = await promise

  expect(studies).toHaveLength(1)
})
```

### Pattern: Testing Error Handling

```typescript
test('should handle malformed DICOM gracefully', async () => {
  const invalidFile = new File([new Uint8Array(10)], 'invalid.dcm')

  // Should not throw
  await expect(parseDicomFiles([invalidFile])).resolves.toEqual([])
})

test('should display error message on export failure', async () => {
  // Mock export to fail
  vi.mocked(exportPDF).mockRejectedValueOnce(new Error('Export failed'))

  const result = await exportPDF(element, instance, settings, options)

  expect(result.success).toBe(false)
  expect(result.error).toBe('Export failed')
})
```

### Pattern: Testing Canvas/WebGL (Cornerstone)

```typescript
// Mock canvas for tests (jsdom doesn't support canvas)
const createMockCanvas = () => {
  const mockContext = {
    createImageData: vi.fn((w, h) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    })),
    putImageData: vi.fn(),
  } as any

  return {
    width: 512,
    height: 512,
    getContext: vi.fn(() => mockContext),
    toDataURL: vi.fn(() => 'data:image/jpeg;base64,mock'),
  } as any
}

test('should export image from canvas', async () => {
  const canvas = createMockCanvas()
  // Test export logic...
})
```

### Pattern: Testing localStorage Persistence

```typescript
import { useSettingsStore } from './settingsStore'

test('should persist theme to localStorage', () => {
  const { setTheme } = useSettingsStore.getState()

  setTheme('light')

  // Verify localStorage updated
  const saved = JSON.parse(localStorage.getItem('settings') || '{}')
  expect(saved.theme).toBe('light')
})

test('should load settings from localStorage on init', () => {
  // Setup: Pre-populate localStorage
  localStorage.setItem('settings', JSON.stringify({ theme: 'dark' }))

  // Reload store (simulate app restart)
  const store = useSettingsStore.getState()

  expect(store.theme).toBe('dark')
})
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests with coverage
        run: pnpm test -- --coverage --run

      - name: Check coverage thresholds
        run: |
          if [ $(jq '.total.lines.pct' coverage/coverage-summary.json | cut -d. -f1) -lt 70 ]; then
            echo "Coverage below 70%"
            exit 1
          fi

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-results
          path: test-results/
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests before commit
pnpm test -- --run --reporter=dot

# Check if tests passed
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

---

## Troubleshooting

### Common Issues

#### "Module not found" in tests

```bash
# Problem: Path aliases not working
Error: Cannot find module '@/stores/studyStore'

# Solution: Ensure vitest.config.ts inherits from vite.config.ts
import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig({
  ...viteConfig,
  test: { ... }
})
```

#### E2E tests fail with "element not found"

```bash
# Problem: data-testid not in DOM
TimeoutError: locator.click: Timeout 30000ms exceeded

# Solution: Check error-context.md for page snapshot
cat test-results/*/error-context.md

# Verify selector matches actual DOM
pnpm exec playwright codegen http://localhost:3000
```

#### Coverage drops unexpectedly

```bash
# Problem: New code added without tests
Coverage for statements (68.5%) does not meet threshold (70%)

# Solution: Find uncovered lines
pnpm test -- --coverage
open coverage/index.html

# Red lines = uncovered, add tests
```

#### Tests pass locally but fail in CI

```bash
# Common causes:
# 1. Missing test fixtures (e2e/fixtures/*.dcm not in git)
# 2. Different timezone/locale
# 3. Missing Playwright browsers

# Solution: Ensure CI setup matches local:
pnpm exec playwright install --with-deps chromium
```

---

## Summary

### Test Commands Reference

```bash
# Unit Tests
pnpm test                      # Run all unit tests
pnpm test -- --watch           # Watch mode
pnpm test -- --coverage        # With coverage
pnpm test studyStore           # Specific file

# E2E Tests
pnpm test:e2e                  # Run all E2E tests
pnpm exec playwright test --ui # Visual debugging
pnpm exec playwright test --headed --debug  # Debug mode

# Coverage
open coverage/index.html       # View coverage report
```

### Key Testing Principles

1. **Reset state between tests** - Avoid pollution
2. **Test behavior, not implementation** - Focus on outcomes
3. **Use real data when possible** - Especially for E2E
4. **Mock external dependencies** - Cornerstone, file-saver, etc.
5. **Verify privacy by default** - Critical for medical imaging
6. **Test edge cases** - Boundaries, empty arrays, null values

### Next Steps

- Read `CONTRIBUTING.md` for development workflow
- Review `docs/API.md` for store and function documentation
- Check `e2e/fixtures/README.md` for test file setup
- See `CLAUDE.md` for architectural patterns

---

**Questions or issues?** Open an issue at https://github.com/anthropics/claude-code/issues
