# Contributing to OpenScans

Thank you for your interest in contributing! This document provides guidelines and workflows for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Git Conventions](#git-conventions)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Architecture Guidelines](#architecture-guidelines)
- [Common Tasks](#common-tasks)

---

## Getting Started

### Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **pnpm**: 8+ (package manager)
- **Git**: 2.30+
- **VS Code**: Recommended IDE (with extensions below)

### First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/MRI-viewer.git
cd MRI-viewer

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev

# 4. Open browser to http://localhost:3000

# 5. Verify tests pass
pnpm test
pnpm test:e2e
```

### Recommended VS Code Extensions

Install these for the best development experience:

- **ESLint** (`dbaeumer.vscode-eslint`) - Linting
- **Prettier** (`esbenp.prettier-vscode`) - Code formatting
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - Tailwind autocomplete
- **TypeScript Vue Plugin (Volar)** - TypeScript support
- **Vitest** (`ZixuanChen.vitest-explorer`) - Test runner integration

### Project Structure

```
MRI-viewer/
├── src/
│   ├── components/          # React components
│   │   ├── viewer/          # Viewport, toolbar, file dropzone
│   │   ├── favorites/       # Favorites panel, batch export
│   │   ├── export/          # Export dialog
│   │   └── settings/        # Settings panel
│   ├── stores/              # Zustand state management
│   │   ├── studyStore.ts    # DICOM studies and navigation
│   │   ├── viewportStore.ts # Viewport settings (W/L, zoom, etc.)
│   │   ├── favoritesStore.ts
│   │   └── settingsStore.ts
│   ├── lib/                 # Utilities and libraries
│   │   ├── dicom/           # DICOM parsing
│   │   ├── export/          # PDF/PNG export
│   │   ├── cornerstone/     # Cornerstone.js integration
│   │   └── utils/           # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   └── App.tsx              # Main application component
├── e2e/                     # Playwright E2E tests
├── docs/                    # Additional documentation
├── CLAUDE.md                # AI development guidelines
├── TESTING.md               # Testing guide
└── CONTRIBUTING.md          # This file
```

---

## Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create a feature branch
git checkout -b feature/add-dicom-export

# 3. Start dev server with hot reload
pnpm dev

# 4. Make changes, tests auto-run in watch mode
pnpm test -- --watch

# 5. Verify E2E tests still pass
pnpm test:e2e

# 6. Commit changes (see Git Conventions below)
git add .
git commit -m "feat: add DICOM export functionality"

# 7. Push and create PR
git push origin feature/add-dicom-export
```

### Hot Reload

The dev server supports hot module replacement (HMR):
- React components: Updates instantly without page reload
- CSS/Tailwind: Instant style updates
- Stores (Zustand): Preserves state on reload
- DICOM files: Reload page to re-parse

### Running Tests During Development

```bash
# Unit tests in watch mode (auto-rerun on file save)
pnpm test -- --watch

# Run specific test file
pnpm test studyStore.test.ts

# E2E tests (slower, run before committing)
pnpm test:e2e

# Coverage report
pnpm test -- --coverage
open coverage/index.html
```

### Debugging

#### Debugging React in Browser

1. Install React DevTools extension
2. Open DevTools → Components tab
3. Inspect component props and state
4. Use "Profiler" to find performance issues

#### Debugging Tests in VS Code

1. Set breakpoint in test or source file
2. Press F5 or Run → "Debug Current Test File"
3. Inspect variables, step through code

See `TESTING.md` for detailed debugging guides.

---

## Code Style

### TypeScript

**Use strict mode** - Already configured in `tsconfig.json`

```typescript
// ✅ Good: Explicit types
interface ViewportSettings {
  zoom: number
  rotation: number
  flipHorizontal: boolean
}

function setZoom(zoom: number): void {
  // Implementation
}

// ❌ Avoid: any types
function processData(data: any) { // Don't use 'any'
  // ...
}

// ✅ Good: Use proper types or unknown
function processData(data: unknown) {
  if (typeof data === 'object') {
    // Type narrowing
  }
}
```

### React Components

**Use functional components with hooks**

```typescript
// ✅ Good: Functional component with TypeScript
interface DicomViewportProps {
  className?: string
  onError?: (error: Error) => void
}

export function DicomViewport({ className, onError }: DicomViewportProps) {
  const [isLoading, setIsLoading] = useState(false)
  const currentInstance = useStudyStore((state) => state.currentInstance)

  useEffect(() => {
    // Setup/cleanup
  }, [])

  return <div className={className}>...</div>
}

// ❌ Avoid: Class components (unless absolutely necessary)
class DicomViewport extends React.Component { ... }
```

### Tailwind CSS

**Use Tailwind utility classes** - Avoid custom CSS

```tsx
// ✅ Good: Tailwind utilities
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
  Export
</button>

// ❌ Avoid: Inline styles
<button style={{ padding: '8px 16px', backgroundColor: '#2563eb' }}>
  Export
</button>

// ✅ Good: Conditional classes with template literals
<div className={`flex items-center ${isActive ? 'bg-blue-600' : 'bg-gray-600'}`}>

// ✅ Good: Use cn() helper for complex conditionals
import { cn } from '@/lib/utils'

<div className={cn(
  'flex items-center',
  isActive && 'bg-blue-600',
  !isActive && 'bg-gray-600',
  disabled && 'opacity-50 cursor-not-allowed'
)}>
```

### Naming Conventions

Follow the established patterns:

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `DicomViewport.tsx` |
| **Stores** | camelCase + "Store" | `studyStore.ts` |
| **Hooks** | "use" + PascalCase | `useDicomLoader.ts` |
| **Utilities** | camelCase | `formatSeriesDescription.ts` |
| **Types/Interfaces** | PascalCase | `DicomInstance`, `ExportOptions` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_INSTANCES`, `DEFAULT_ZOOM` |

### Import Order

Organize imports consistently:

```typescript
// 1. External libraries
import { useState, useEffect } from 'react'
import { create } from 'zustand'

// 2. Internal components
import { DicomViewport } from './components/viewer/DicomViewport'

// 3. Stores and hooks
import { useStudyStore } from './stores/studyStore'
import { useDicomLoader } from './hooks/useDicomLoader'

// 4. Types
import type { DicomInstance, DicomSeries } from './types'

// 5. Utilities and helpers
import { formatDate } from './lib/utils/formatDate'
```

### Comments and Documentation

**When to comment:**

```typescript
// ✅ Good: Explain complex logic or "why"
// Filter out DICOMDIR files - they don't contain pixel data
// and would crash Cornerstone if we tried to render them
const images = instances.filter(hasPixelData)

// ✅ Good: Document public APIs with JSDoc
/**
 * Exports viewport as PDF with metadata cover page.
 * Privacy: Patient data excluded by default.
 *
 * @param element - Viewport DOM element to capture
 * @param instance - DICOM instance being displayed
 * @param options - Export options (patient data, scale)
 * @returns Promise<ExportResult> with filename and blob
 */
export async function exportPDF(
  element: HTMLDivElement,
  instance: DicomInstance,
  settings: ViewportSettings,
  options: ExportOptions
): Promise<ExportResult>

// ❌ Avoid: Comments that repeat the code
// Set zoom to 2
setZoom(2)

// ❌ Avoid: Commented-out code (use git history instead)
// const oldZoom = zoom * 1.5
const newZoom = zoom * 2
```

### Error Handling

```typescript
// ✅ Good: Graceful error handling
try {
  const studies = await parseDicomFiles(files)
  setStudies(studies)
} catch (error) {
  console.error('Failed to parse DICOM files:', error)
  setError('Could not load DICOM files. Please try again.')
  // Don't crash - show user-friendly error
}

// ✅ Good: Validate inputs
function setZoom(zoom: number) {
  if (zoom < 0.1 || zoom > 20) {
    console.warn(`Invalid zoom value: ${zoom}. Clamping to valid range.`)
    zoom = Math.max(0.1, Math.min(20, zoom))
  }
  // ...
}

// ❌ Avoid: Silent failures
try {
  await saveSettings()
} catch (error) {
  // Don't ignore errors silently
}
```

---

## Git Conventions

### Branch Naming

Use descriptive branch names with prefixes:

```bash
# Features
feature/add-batch-export
feature/implement-mpr-view

# Bug fixes
fix/viewport-zoom-reset
fix/dicom-parsing-error

# Refactoring
refactor/extract-export-logic
refactor/simplify-navigation

# Documentation
docs/update-testing-guide
docs/add-api-reference

# Chores (dependencies, config)
chore/update-dependencies
chore/configure-eslint
```

### Commit Messages

**Use Conventional Commits format**

Format: `<type>(<scope>): <subject>`

```bash
# ✅ Good examples
feat: add PDF export with metadata cover page
fix: prevent navigation past last instance
refactor: extract DICOM parsing to utility function
docs: update TESTING.md with E2E examples
test: add unit tests for viewportStore navigation
style: apply consistent formatting to export dialog
chore: update cornerstone-wado-image-loader to v4.1.0

# With scope (optional)
feat(export): add patient data privacy toggle
fix(viewport): clamp zoom to valid range
test(parser): add tests for malformed DICOM handling

# Breaking changes
feat!: change export API to async/await
BREAKING CHANGE: exportPDF now returns Promise<ExportResult>

# ❌ Avoid: Vague messages
git commit -m "fix bug"
git commit -m "update code"
git commit -m "WIP"
```

**Commit types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (no behavior change)
- `test`: Add or update tests
- `docs`: Documentation changes
- `style`: Formatting, whitespace (no code change)
- `chore`: Dependencies, config, build tools
- `perf`: Performance improvements

### Commit Message Body

For complex changes, add a body:

```bash
git commit -m "feat: add privacy-first DICOM export

Implements PDF and PNG export with:
- Patient data excluded by default
- Optional patient ID inclusion
- Metadata cover page for PDFs
- File naming without PHI

Closes #42"
```

### Commit Frequency

- Commit often with small, logical changes
- Each commit should be a working state
- Don't commit broken code (tests should pass)

```bash
# ✅ Good: Small, focused commits
git commit -m "feat: add exportPDF function"
git commit -m "feat: add PDF metadata cover page"
git commit -m "test: add privacy tests for PDF export"

# ❌ Avoid: One giant commit
git commit -m "add entire export feature with tests"
```

---

## Testing Requirements

All code must meet testing requirements before merging.

### Unit Test Requirements

**New features MUST have unit tests**

```bash
# Run tests before committing
pnpm test -- --run

# Check coverage
pnpm test -- --coverage

# Coverage requirements:
# - Stores: 95%+
# - DICOM parser: 90%+
# - Export functions: 95%+
# - Utilities: 90%+
```

**What to test:**
- ✅ All store actions and state transitions
- ✅ DICOM parsing logic
- ✅ Export functions (especially privacy)
- ✅ Edge cases (empty arrays, null, boundaries)

**Example: Adding a new store action**

```typescript
// 1. Add action to store
export const useStudyStore = create<StudyStore>()((set) => ({
  // ... existing state

  jumpToInstance: (instanceNumber: number) =>
    set((state) => {
      // Implementation
    }),
}))

// 2. Add test
test('should jump to specific instance number', () => {
  const study = createMockStudy([
    createMockInstance({ instanceNumber: 1 }),
    createMockInstance({ instanceNumber: 5 }),
    createMockInstance({ instanceNumber: 10 }),
  ])

  useStudyStore.getState().setStudies([study])
  useStudyStore.getState().jumpToInstance(5)

  expect(useStudyStore.getState().currentInstanceIndex).toBe(1)
  expect(useStudyStore.getState().currentInstance?.instanceNumber).toBe(5)
})
```

### E2E Test Requirements

**Critical user flows MUST have E2E tests**

```bash
# Run E2E tests
pnpm test:e2e

# Debug in UI mode
pnpm exec playwright test --ui
```

**When to add E2E tests:**
- New user-facing features (export, navigation)
- Multi-step workflows (upload → view → export)
- Privacy-critical operations

**Example: Adding export feature**

If you add a new export format:
1. Add unit tests for the export function
2. Add E2E test for the full workflow:
   - Open export dialog
   - Select format
   - Verify download
   - Check filename privacy

See `TESTING.md` for detailed testing guidelines.

---

## Pull Request Process

### Before Creating a PR

**Checklist:**

```bash
# 1. Tests pass
pnpm test -- --run
pnpm test:e2e

# 2. No linting errors
pnpm lint

# 3. Code formatted
pnpm format

# 4. TypeScript compiles
pnpm build

# 5. Commits follow conventions
git log --oneline -5
```

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/add-dicom-export
   ```

2. **Create PR on GitHub**
   - Use descriptive title (like commit message)
   - Fill out PR template (if exists)
   - Add labels (feature, bug, documentation)

3. **PR Description Template**

   ```markdown
   ## Summary
   Adds PDF export functionality with privacy-first defaults.

   ## Changes
   - ✅ Implemented `exportPDF()` function
   - ✅ Added metadata cover page
   - ✅ Patient data excluded by default
   - ✅ Unit tests (95% coverage)
   - ✅ E2E test for full workflow

   ## Testing
   - [x] Unit tests pass
   - [x] E2E tests pass
   - [x] Manual testing on 50+ DICOM files
   - [x] Verified privacy: no PHI in filenames

   ## Screenshots
   [Attach screenshots of new UI]

   ## Checklist
   - [x] Code follows style guidelines
   - [x] Tests added/updated
   - [x] Documentation updated
   - [x] No breaking changes

   ## Related Issues
   Closes #42
   ```

### PR Review Checklist

**Reviewers should verify:**

- [ ] Code quality and style
- [ ] Tests cover new functionality
- [ ] No TypeScript errors
- [ ] Privacy/security considerations addressed
- [ ] Performance impact minimal
- [ ] Documentation updated if needed

### Addressing Review Feedback

```bash
# 1. Make requested changes
# ... edit files ...

# 2. Commit changes
git add .
git commit -m "fix: address PR feedback - improve error handling"

# 3. Push to same branch (updates PR automatically)
git push origin feature/add-dicom-export
```

### Merging

- **Squash and merge**: Preferred for feature branches (cleaner history)
- **Rebase and merge**: For small fixes (preserves individual commits)
- **Merge commit**: For long-running feature branches with multiple contributors

---

## Architecture Guidelines

### When to Create New Components

Create a new component when:
- Component logic exceeds 200 lines
- Component is reused in multiple places
- Component has distinct responsibility
- Component needs isolated state

```typescript
// ✅ Good: Separate component for export dialog
export function ExportDialog({ show, onClose }: ExportDialogProps) {
  // 100+ lines of export logic
}

// ❌ Avoid: Everything in one giant component
export function App() {
  // 1000+ lines of mixed logic
}
```

### When to Create New Stores

Create a new Zustand store when:
- State is used by multiple unrelated components
- State needs to persist (localStorage)
- State has complex update logic
- State represents a distinct domain

```typescript
// ✅ Good: Separate stores for distinct domains
useStudyStore     // DICOM studies and navigation
useViewportStore  // Viewport settings (zoom, W/L)
useFavoritesStore // Favorite images
useSettingsStore  // App settings

// ❌ Avoid: One giant store for everything
useAppStore // Everything mixed together
```

### When to Create New Utilities

Create a utility function when:
- Logic is pure (no side effects)
- Logic is reused in multiple places
- Logic is complex and testable
- Logic doesn't fit in a component or hook

```typescript
// ✅ Good: Pure utility function
export function formatSeriesDescription(desc: string): string {
  return desc
    .replace(/_/g, ' ')
    .replace(/\b(t1|t2|flair)\b/gi, (match) => match.toUpperCase())
}

// ✅ Good: Reusable validation
export function isValidDicomFile(file: File): boolean {
  return file.size > 0 && file.size < 500 * 1024 * 1024 // 500 MB max
}
```

### Privacy and Security Principles

**CRITICAL: Always consider patient privacy**

```typescript
// ✅ Good: Privacy by default
export function generateFilename(
  instance: DicomInstance,
  format: ExportFormat,
  includePatientID: boolean = false // Default: false
): string {
  // Never include patient name in filename
  // Only include patient ID if explicitly enabled
}

// ❌ Avoid: Including PHI without user consent
export function generateFilename(instance: DicomInstance): string {
  return `${instance.patientName}_${instance.studyDate}.png` // NO!
}

// ✅ Good: Clear privacy warnings in UI
<Checkbox
  label="Include Patient ID (not recommended)"
  checked={includePatientID}
  onChange={setIncludePatientID}
/>
<p className="text-amber-200 text-xs">
  Privacy Notice: Patient identifiable information is excluded by default.
</p>
```

### Performance Considerations

```typescript
// ✅ Good: Zustand selector (only re-renders when currentInstance changes)
const currentInstance = useStudyStore((state) => state.currentInstance)

// ❌ Avoid: Subscribing to entire store (re-renders on any change)
const store = useStudyStore()
const currentInstance = store.currentInstance

// ✅ Good: Memoize expensive calculations
const imageStats = useMemo(() => {
  return calculateHistogram(currentInstance)
}, [currentInstance])

// ✅ Good: Debounce rapid updates
const debouncedSetZoom = useMemo(
  () => debounce((zoom: number) => setZoom(zoom), 100),
  []
)
```

For detailed architectural patterns, see `CLAUDE.md`.

---

## Common Tasks

### Adding a New Export Format

**Example: Adding JPEG export**

1. **Add type definition**
   ```typescript
   // src/lib/export/types.ts
   export type ExportFormat = 'png' | 'jpeg' | 'pdf'
   ```

2. **Implement export function**
   ```typescript
   // src/lib/export/jpegExport.ts
   export async function exportJPEG(
     element: HTMLDivElement,
     instance: DicomInstance,
     options: ExportOptions
   ): Promise<ExportResult> {
     // Implementation
   }
   ```

3. **Add unit tests**
   ```typescript
   // src/lib/export/jpegExport.test.ts
   describe('exportJPEG', () => {
     it('should export with correct quality', async () => {
       // Test implementation
     })
   })
   ```

4. **Update UI**
   ```typescript
   // src/components/export/ExportDialog.tsx
   <FormatButton
     format="jpeg"
     label="JPEG"
     description="Compressed"
     selected={format === 'jpeg'}
     onClick={() => setFormat('jpeg')}
   />
   ```

5. **Add E2E test**
   ```typescript
   // e2e/dicom-viewer.spec.ts
   test('should export JPEG with quality setting', async ({ page }) => {
     // E2E test implementation
   })
   ```

### Adding a New Viewport Tool

**Example: Adding brightness adjustment**

1. **Add state to viewportStore**
   ```typescript
   // src/stores/viewportStore.ts
   interface ViewportSettings {
     // ... existing
     brightness: number
   }

   export const useViewportStore = create<ViewportStore>()((set) => ({
     settings: {
       brightness: 0, // Default
       // ...
     },
     setBrightness: (brightness: number) =>
       set((state) => ({
         settings: { ...state.settings, brightness }
       })),
   }))
   ```

2. **Add toolbar button**
   ```typescript
   // src/components/viewer/ViewportToolbar.tsx
   <ToolbarButton
     onClick={() => setBrightness(brightness + 10)}
     title="Increase brightness"
     data-testid="brightness-up-button"
     icon={<BrightnessIcon />}
   />
   ```

3. **Apply in viewport**
   ```typescript
   // src/components/viewer/DicomViewport.tsx
   useEffect(() => {
     if (!viewport) return

     viewport.brightness = settings.brightness
     cornerstone.updateImage(element)
   }, [settings.brightness])
   ```

4. **Add tests**
   ```typescript
   // src/stores/viewportStore.test.ts
   test('should adjust brightness', () => {
     useViewportStore.getState().setBrightness(20)
     expect(useViewportStore.getState().settings.brightness).toBe(20)
   })
   ```

### Adding a New Keyboard Shortcut

1. **Add to useKeyboardShortcuts hook**
   ```typescript
   // src/hooks/useKeyboardShortcuts.ts
   useEffect(() => {
     const handleKeyPress = (e: KeyboardEvent) => {
       // ... existing shortcuts

       if (e.key === 'b' || e.key === 'B') {
         e.preventDefault()
         // Increase brightness
         useViewportStore.getState().setBrightness(
           useViewportStore.getState().settings.brightness + 10
         )
       }
     }

     window.addEventListener('keydown', handleKeyPress)
     return () => window.removeEventListener('keydown', handleKeyPress)
   }, [])
   ```

2. **Document in help dialog**
   ```typescript
   // src/components/viewer/KeyboardShortcutsHelp.tsx
   <ShortcutRow shortcut="B" description="Increase brightness" />
   ```

---

## Questions?

- **Technical questions**: Review `CLAUDE.md` for architecture patterns
- **Testing questions**: See `TESTING.md` for detailed testing guide
- **API reference**: Check `docs/API.md` (when available)
- **Bugs/Issues**: Open an issue on GitHub

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

Thank you for contributing to OpenScans! 🏥
