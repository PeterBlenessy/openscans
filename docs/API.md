# API Reference

This document provides a comprehensive reference for the OpenScans's public APIs, including Zustand stores, export functions, DICOM parsing, and utility functions.

## Table of Contents

- [Stores](#stores)
  - [studyStore](#studystore)
  - [viewportStore](#viewportstore)
  - [favoritesStore](#favoritesstore)
  - [settingsStore](#settingsstore)
- [DICOM Parsing](#dicom-parsing)
- [Export Functions](#export-functions)
- [Utility Functions](#utility-functions)
- [Type Definitions](#type-definitions)

---

## Stores

All stores use [Zustand](https://github.com/pmndrs/zustand) for state management.

### studyStore

Manages DICOM studies, series, instances, and navigation state.

**Import:**
```typescript
import { useStudyStore } from '@/stores/studyStore'
```

#### State

```typescript
interface StudyStore {
  // Current state
  studies: DicomStudy[]
  currentStudy: DicomStudy | null
  currentSeries: DicomSeries | null
  currentInstance: DicomInstance | null
  currentInstanceIndex: number

  // Actions
  setStudies: (studies: DicomStudy[]) => void
  setCurrentStudy: (studyInstanceUID: string) => void
  setCurrentSeries: (studyInstanceUID: string, seriesInstanceUID: string) => void
  setCurrentInstance: (index: number) => void
  nextInstance: () => void
  previousInstance: () => void
  clearStudies: () => void
}
```

#### Actions

##### `setStudies(studies: DicomStudy[])`

Set all loaded DICOM studies. Automatically selects the first study, series, and instance.

```typescript
const studies = await parseDicomFiles(files)
useStudyStore.getState().setStudies(studies)
```

##### `setCurrentStudy(studyInstanceUID: string)`

Switch to a different study by UID.

```typescript
useStudyStore.getState().setCurrentStudy('1.2.840.113619.2.55.3...')
```

##### `setCurrentSeries(studyInstanceUID: string, seriesInstanceUID: string)`

Switch to a different series within a study.

```typescript
useStudyStore.getState().setCurrentSeries(
  '1.2.840.113619.2.55.3...',
  '1.3.12.2.1107.5.2...'
)
```

##### `setCurrentInstance(index: number)`

Navigate to a specific instance by index (0-based).

```typescript
// Jump to first instance
useStudyStore.getState().setCurrentInstance(0)

// Jump to last instance
const lastIndex = currentSeries.instances.length - 1
useStudyStore.getState().setCurrentInstance(lastIndex)
```

##### `nextInstance()`

Navigate to the next instance in the current series. Clamps at the last instance.

```typescript
// Keyboard shortcut: ArrowDown or ArrowRight
useStudyStore.getState().nextInstance()
```

##### `previousInstance()`

Navigate to the previous instance in the current series. Clamps at the first instance.

```typescript
// Keyboard shortcut: ArrowUp or ArrowLeft
useStudyStore.getState().previousInstance()
```

##### `clearStudies()`

Remove all studies and reset state. Used when loading new files.

```typescript
useStudyStore.getState().clearStudies()
```

#### Usage Example

```typescript
function InstanceNavigator() {
  // Subscribe to specific state (efficient - only re-renders when this changes)
  const currentInstance = useStudyStore((state) => state.currentInstance)
  const currentInstanceIndex = useStudyStore((state) => state.currentInstanceIndex)
  const currentSeries = useStudyStore((state) => state.currentSeries)

  // Get actions
  const { nextInstance, previousInstance } = useStudyStore()

  if (!currentSeries) return null

  return (
    <div>
      <p>
        Image {currentInstanceIndex + 1} of {currentSeries.instances.length}
      </p>
      <button onClick={previousInstance}>Previous</button>
      <button onClick={nextInstance}>Next</button>
    </div>
  )
}
```

---

### viewportStore

Manages viewport settings (window/level, zoom, rotation, etc.).

**Import:**
```typescript
import { useViewportStore } from '@/stores/viewportStore'
```

#### State

```typescript
interface ViewportStore {
  settings: ViewportSettings

  // Window/Level
  setWindowLevel: (width: number, center: number) => void
  setWindowLevelFromModality: (modality: string, metadata?: DicomMetadata) => void

  // Zoom and Pan
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void

  // Rotation and Flip
  setRotation: (rotation: number) => void
  setFlipHorizontal: (flip: boolean) => void
  setFlipVertical: (flip: boolean) => void

  // Invert
  setInvert: (invert: boolean) => void

  // Reset
  resetSettings: () => void
}

interface ViewportSettings {
  windowLevel: {
    width: number
    center: number
  }
  zoom: number
  pan: { x: number; y: number }
  rotation: number
  flipHorizontal: boolean
  flipVertical: boolean
  invert: boolean
}
```

#### Actions

##### `setWindowLevel(width: number, center: number)`

Set window/level (brightness/contrast) manually.

```typescript
// Set for soft tissue viewing
useViewportStore.getState().setWindowLevel(400, 40)

// Set for bone viewing
useViewportStore.getState().setWindowLevel(2000, 400)
```

##### `setWindowLevelFromModality(modality: string, metadata?: DicomMetadata)`

Automatically set window/level based on DICOM modality and metadata.

```typescript
// Uses DICOM tags if available, otherwise uses modality defaults
useViewportStore.getState().setWindowLevelFromModality('CT', instance.metadata)
```

**Modality Defaults:**
- **CT**: W=400, C=40 (soft tissue)
- **MR**: W=500, C=250
- **CR/DX**: W=4096, C=2048
- **PT**: W=5000, C=2500

##### `setZoom(zoom: number)`

Set zoom level. Valid range: 0.1 to 20.

```typescript
// Zoom in
useViewportStore.getState().setZoom(2.0)

// Zoom out
useViewportStore.getState().setZoom(0.5)

// Fit to screen
useViewportStore.getState().setZoom(1.0)
```

##### `setPan(x: number, y: number)`

Set pan offset in pixels.

```typescript
useViewportStore.getState().setPan(50, -30)
```

##### `setRotation(rotation: number)`

Set rotation in degrees (0, 90, 180, 270).

```typescript
// Rotate 90 degrees clockwise
const current = useViewportStore.getState().settings.rotation
useViewportStore.getState().setRotation((current + 90) % 360)
```

##### `setFlipHorizontal(flip: boolean)`

Toggle horizontal flip.

```typescript
const current = useViewportStore.getState().settings.flipHorizontal
useViewportStore.getState().setFlipHorizontal(!current)
```

##### `setFlipVertical(flip: boolean)`

Toggle vertical flip.

```typescript
const current = useViewportStore.getState().settings.flipVertical
useViewportStore.getState().setFlipVertical(!current)
```

##### `setInvert(invert: boolean)`

Toggle color inversion.

```typescript
const current = useViewportStore.getState().settings.invert
useViewportStore.getState().setInvert(!current)
```

##### `resetSettings()`

Reset all viewport settings to defaults.

```typescript
// Keyboard shortcut: R
useViewportStore.getState().resetSettings()
```

#### Usage Example

```typescript
function ViewportControls() {
  const settings = useViewportStore((state) => state.settings)
  const { setZoom, resetSettings } = useViewportStore()

  return (
    <div>
      <button onClick={() => setZoom(settings.zoom * 1.25)}>Zoom In</button>
      <button onClick={() => setZoom(settings.zoom / 1.25)}>Zoom Out</button>
      <button onClick={resetSettings}>Reset</button>
      <p>Current Zoom: {settings.zoom.toFixed(1)}x</p>
    </div>
  )
}
```

---

### favoritesStore

Manages favorite (starred) images.

**Import:**
```typescript
import { useFavoritesStore } from '@/stores/favoritesStore'
```

#### State

```typescript
interface FavoritesStore {
  favorites: FavoriteImage[]

  addFavorite: (image: FavoriteImage) => void
  removeFavorite: (sopInstanceUID: string) => void
  toggleFavorite: (image: FavoriteImage) => void
  clearFavorites: () => void
  isFavorite: (sopInstanceUID: string) => boolean
}

interface FavoriteImage {
  sopInstanceUID: string
  studyInstanceUID: string
  seriesInstanceUID: string
  instanceNumber: number
  imageId: string
  patientName?: string
  studyDate?: string
  seriesNumber?: number
  seriesDescription?: string
  modality?: string
  favoritedAt: number
}
```

#### Actions

##### `addFavorite(image: FavoriteImage)`

Add an image to favorites. Prevents duplicates.

```typescript
const favoriteImage: FavoriteImage = {
  sopInstanceUID: currentInstance.sopInstanceUID,
  studyInstanceUID: currentStudy.studyInstanceUID,
  seriesInstanceUID: currentSeries.seriesInstanceUID,
  instanceNumber: currentInstance.instanceNumber,
  imageId: currentInstance.imageId,
  modality: currentInstance.metadata?.modality,
  seriesNumber: currentInstance.metadata?.seriesNumber,
  seriesDescription: currentInstance.metadata?.seriesDescription,
  favoritedAt: Date.now(),
}

useFavoritesStore.getState().addFavorite(favoriteImage)
```

##### `removeFavorite(sopInstanceUID: string)`

Remove an image from favorites.

```typescript
useFavoritesStore.getState().removeFavorite('1.2.840.113619...')
```

##### `toggleFavorite(image: FavoriteImage)`

Add if not favorited, remove if already favorited.

```typescript
// Keyboard shortcut: S (star)
useFavoritesStore.getState().toggleFavorite(favoriteImage)
```

##### `clearFavorites()`

Remove all favorites.

```typescript
useFavoritesStore.getState().clearFavorites()
```

##### `isFavorite(sopInstanceUID: string)`

Check if an image is favorited.

```typescript
const isStarred = useFavoritesStore.getState().isFavorite(instance.sopInstanceUID)
```

#### Persistence

Favorites are automatically saved to localStorage and restored on app load.

---

### settingsStore

Manages application settings (theme, privacy, scroll direction).

**Import:**
```typescript
import { useSettingsStore } from '@/stores/settingsStore'
```

#### State

```typescript
interface SettingsStore {
  theme: 'dark' | 'light'
  hidePersonalInfo: boolean
  instanceScrollDirection: 'natural' | 'reverse'
  sensitivity: number

  setTheme: (theme: 'dark' | 'light') => void
  setHidePersonalInfo: (hide: boolean) => void
  setInstanceScrollDirection: (direction: 'natural' | 'reverse') => void
  setSensitivity: (sensitivity: number) => void
  resetToDefaults: () => void
}
```

#### Actions

##### `setTheme(theme: 'dark' | 'light')`

Switch between dark and light theme. Applies `.dark` class to `<html>` element.

```typescript
useSettingsStore.getState().setTheme('light')
```

##### `setHidePersonalInfo(hide: boolean)`

Toggle patient information visibility in the UI.

```typescript
// Hide patient names and IDs
useSettingsStore.getState().setHidePersonalInfo(true)
```

##### `setInstanceScrollDirection(direction: 'natural' | 'reverse')`

Set scroll direction for instance navigation.

- `'natural'`: Scroll down = next instance
- `'reverse'`: Scroll down = previous instance

```typescript
useSettingsStore.getState().setInstanceScrollDirection('reverse')
```

##### `setSensitivity(sensitivity: number)`

Set mouse sensitivity for window/level adjustment. Range: 0.1 to 5.0.

```typescript
// Higher = more sensitive
useSettingsStore.getState().setSensitivity(2.0)
```

##### `resetToDefaults()`

Reset all settings to defaults.

```typescript
useSettingsStore.getState().resetToDefaults()
```

#### Persistence

Settings are automatically saved to localStorage and restored on app load.

---

## DICOM Parsing

### parseDicomFiles

Parse DICOM files and organize into studies/series/instances.

**Import:**
```typescript
import { parseDicomFiles } from '@/lib/dicom/parser'
```

**Signature:**
```typescript
async function parseDicomFiles(files: File[]): Promise<DicomStudy[]>
```

**Parameters:**
- `files: File[]` - Array of DICOM files to parse

**Returns:**
- `Promise<DicomStudy[]>` - Array of parsed studies, organized hierarchically

**Example:**
```typescript
const files = await fileInput.files
const studies = await parseDicomFiles(Array.from(files))

// studies[0].series[0].instances[0] = first image
console.log(`Loaded ${studies.length} studies`)
```

**Behavior:**
- Filters out DICOMDIR files (no pixel data)
- Groups instances by StudyInstanceUID → SeriesInstanceUID
- Sorts instances by InstanceNumber
- Extracts metadata (patient name, study date, modality, etc.)
- Handles missing or malformed DICOM tags gracefully

**Error Handling:**
```typescript
try {
  const studies = await parseDicomFiles(files)
  if (studies.length === 0) {
    console.warn('No valid DICOM studies found')
  }
} catch (error) {
  console.error('Failed to parse DICOM files:', error)
}
```

---

## Export Functions

### exportPDF

Export viewport as PDF with metadata cover page.

**Import:**
```typescript
import { exportPDF } from '@/lib/export/pdfExport'
```

**Signature:**
```typescript
async function exportPDF(
  element: HTMLDivElement,
  currentInstance: DicomInstance,
  viewportSettings: ViewportSettings,
  options: ExportOptions
): Promise<ExportResult>
```

**Parameters:**
- `element: HTMLDivElement` - Viewport DOM element to capture
- `currentInstance: DicomInstance` - DICOM instance being displayed
- `viewportSettings: ViewportSettings` - Current viewport state (zoom, W/L, etc.)
- `options: ExportOptions` - Export options (privacy, scale, format)

**Returns:**
```typescript
interface ExportResult {
  success: boolean
  filename?: string
  error?: string
}
```

**Example:**
```typescript
const result = await exportPDF(
  viewportElement,
  currentInstance,
  viewportSettings,
  {
    format: 'pdf',
    scale: 2,
    includePatientName: false,  // Privacy: false by default
    includePatientID: false,
    includeStudyDescription: true,
    includeSeriesDescription: true,
  }
)

if (result.success) {
  console.log(`Exported: ${result.filename}`)
} else {
  console.error(`Export failed: ${result.error}`)
}
```

**Privacy:** Patient data excluded by default. Only included when explicitly enabled via options.

---

### exportImage

Export viewport as PNG or JPEG.

**Import:**
```typescript
import { exportImage } from '@/lib/export/imageExport'
```

**Signature:**
```typescript
async function exportImage(
  element: HTMLDivElement,
  currentInstance: DicomInstance,
  options: ExportOptions
): Promise<ExportResult>
```

**Parameters:**
- `element: HTMLDivElement` - Viewport DOM element
- `currentInstance: DicomInstance` - Current DICOM instance
- `options: ExportOptions` - Export options

**Example:**
```typescript
// Export as PNG (lossless)
const result = await exportImage(viewportElement, currentInstance, {
  format: 'png',
  scale: 4,  // 4x resolution for print
  includePatientID: false,
})

// Export as JPEG (compressed)
const result = await exportImage(viewportElement, currentInstance, {
  format: 'jpeg',
  scale: 1,
  jpegQuality: 95,  // 0-100
  includePatientID: false,
})
```

---

### exportBatchPDF

Export multiple images to a single PDF with grid layout.

**Import:**
```typescript
import { exportBatchPDF } from '@/lib/export/batchPdfExport'
```

**Signature:**
```typescript
async function exportBatchPDF(
  favorites: FavoriteImage[],
  layout: GridLayout,
  includePatientData: boolean,
  onProgress?: (current: number, total: number) => void
): Promise<ExportResult>
```

**Parameters:**
- `favorites: FavoriteImage[]` - Images to export
- `layout: GridLayout` - Grid layout (`'1x1'`, `'2x2'`, `'2x3'`, `'3x3'`, `'4x4'`)
- `includePatientData: boolean` - Include patient info in metadata
- `onProgress?: (current, total) => void` - Progress callback

**Example:**
```typescript
const favorites = useFavoritesStore.getState().favorites

const result = await exportBatchPDF(
  favorites,
  '2x2',  // 4 images per page
  false,  // Privacy: exclude patient data
  (current, total) => {
    console.log(`Processing ${current}/${total}`)
  }
)
```

**Grid Layouts:**
- `'1x1'`: 1 image per page
- `'2x2'`: 4 images per page
- `'2x3'`: 6 images per page
- `'3x3'`: 9 images per page
- `'4x4'`: 16 images per page

---

### generateFilename

Generate export filename with privacy controls.

**Import:**
```typescript
import { generateFilename } from '@/lib/export/fileNaming'
```

**Signature:**
```typescript
function generateFilename(
  instance: DicomInstance | null,
  format: ExportFormat,
  includePatientID: boolean = false
): string
```

**Parameters:**
- `instance: DicomInstance | null` - DICOM instance
- `format: ExportFormat` - File format (`'png'`, `'jpeg'`, `'pdf'`)
- `includePatientID: boolean` - Include patient ID (default: false)

**Returns:**
- `string` - Sanitized filename

**Example:**
```typescript
// Privacy by default (no patient data)
const filename = generateFilename(instance, 'png', false)
// → "MR - T1 Sagittal - 1.png"

// With patient ID (opt-in)
const filename = generateFilename(instance, 'png', true)
// → "123456 - T1 Sagittal - 1.png"
```

**Filename Format:**
- **Without patient ID**: `{Modality} - {Series Description} - {Instance Number}.{ext}`
- **With patient ID**: `{Patient ID} - {Series Description} - {Instance Number}.{ext}`
- **Special characters** replaced with underscores
- **Fallback** to timestamp if metadata missing

---

## Utility Functions

### formatSeriesDescription

Format DICOM series description for display.

**Import:**
```typescript
import { formatSeriesDescription } from '@/lib/utils/formatSeriesDescription'
```

**Signature:**
```typescript
function formatSeriesDescription(description: string): string
```

**Example:**
```typescript
formatSeriesDescription('t1_sag_mpr')
// → "T1 Sagittal MPR"

formatSeriesDescription('flair_ax')
// → "FLAIR Axial"
```

**Transformations:**
- Replaces underscores with spaces
- Capitalizes sequence abbreviations (T1, T2, FLAIR, etc.)
- Capitalizes orientation terms (Sagittal, Axial, Coronal)
- Preserves case for other terms

---

### formatDate

Format DICOM date strings.

**Import:**
```typescript
import { formatDate } from '@/lib/utils/formatDate'
```

**Signature:**
```typescript
function formatDate(dicomDate: string | undefined): string
```

**Example:**
```typescript
formatDate('20230615')
// → "2023-06-15"

formatDate(undefined)
// → ""
```

---

## Type Definitions

### DicomStudy

```typescript
interface DicomStudy {
  studyInstanceUID: string
  patientID?: string
  patientName?: string
  studyDate?: string
  studyTime?: string
  studyDescription?: string
  accessionNumber?: string
  series: DicomSeries[]
  directoryHandleId?: string  // For File System Access API
}
```

### DicomSeries

```typescript
interface DicomSeries {
  seriesInstanceUID: string
  seriesNumber?: number
  seriesDescription?: string
  modality?: string
  instances: DicomInstance[]
}
```

### DicomInstance

```typescript
interface DicomInstance {
  sopInstanceUID: string
  instanceNumber: number
  imageId: string  // Cornerstone imageId
  metadata?: DicomMetadata
}
```

### DicomMetadata

```typescript
interface DicomMetadata {
  patientName?: string
  patientID?: string
  studyDate?: string
  studyTime?: string
  studyDescription?: string
  seriesNumber?: number
  seriesDescription?: string
  modality?: string
  instanceNumber?: number
  columns?: number
  rows?: number
  windowCenter?: number
  windowWidth?: number
  sliceThickness?: string
  sliceLocation?: string
  imagePosition?: string
  imageOrientation?: string
}
```

### ExportOptions

```typescript
interface ExportOptions {
  format: ExportFormat
  scale: ExportScale
  jpegQuality?: number  // 0-100, JPEG only
  includePatientName?: boolean
  includePatientID?: boolean
  includeStudyDescription?: boolean
  includeSeriesDescription?: boolean
}

type ExportFormat = 'png' | 'jpeg' | 'pdf'
type ExportScale = 1 | 2 | 4
type GridLayout = '1x1' | '2x2' | '2x3' | '3x3' | '4x4'
```

### ViewportSettings

```typescript
interface ViewportSettings {
  windowLevel: {
    width: number
    center: number
  }
  zoom: number
  pan: {
    x: number
    y: number
  }
  rotation: number  // 0, 90, 180, 270
  flipHorizontal: boolean
  flipVertical: boolean
  invert: boolean
}
```

---

## Usage Patterns

### Loading and Displaying DICOM Files

```typescript
import { useStudyStore } from '@/stores/studyStore'
import { parseDicomFiles } from '@/lib/dicom/parser'

async function handleFileUpload(files: File[]) {
  try {
    // Parse DICOM files
    const studies = await parseDicomFiles(files)

    if (studies.length === 0) {
      alert('No valid DICOM studies found')
      return
    }

    // Load into store (auto-selects first study/series/instance)
    useStudyStore.getState().setStudies(studies)

    console.log(`Loaded ${studies.length} studies`)
  } catch (error) {
    console.error('Failed to load DICOM files:', error)
    alert('Error loading DICOM files. Please try again.')
  }
}
```

### Exporting with Privacy

```typescript
import { exportPDF } from '@/lib/export/pdfExport'
import { useStudyStore } from '@/stores/studyStore'
import { useViewportStore } from '@/stores/viewportStore'

async function handleExport(viewportElement: HTMLDivElement) {
  const currentInstance = useStudyStore.getState().currentInstance
  const viewportSettings = useViewportStore.getState().settings

  if (!currentInstance) {
    alert('No image loaded')
    return
  }

  // Export with privacy by default
  const result = await exportPDF(
    viewportElement,
    currentInstance,
    viewportSettings,
    {
      format: 'pdf',
      scale: 2,
      includePatientName: false,  // Privacy
      includePatientID: false,    // Privacy
      includeStudyDescription: true,
      includeSeriesDescription: true,
    }
  )

  if (result.success) {
    console.log(`Exported: ${result.filename}`)
  } else {
    alert(`Export failed: ${result.error}`)
  }
}
```

### Batch Export Favorites

```typescript
import { useFavoritesStore } from '@/stores/favoritesStore'
import { exportBatchPDF } from '@/lib/export/batchPdfExport'

async function handleBatchExport() {
  const favorites = useFavoritesStore.getState().favorites

  if (favorites.length === 0) {
    alert('No favorites to export')
    return
  }

  const result = await exportBatchPDF(
    favorites,
    '2x2',  // 4 images per page
    false,  // Exclude patient data
    (current, total) => {
      console.log(`Processing ${current}/${total}`)
    }
  )

  if (result.success) {
    console.log(`Exported ${favorites.length} images to ${result.filename}`)
  }
}
```

---

## Additional Resources

- **Testing Guide**: See `TESTING.md` for unit test examples
- **Contributing**: See `CONTRIBUTING.md` for development workflow
- **Architecture**: See `CLAUDE.md` for design patterns and principles

---

**Questions or issues?** Open an issue at https://github.com/yourusername/MRI-viewer/issues
