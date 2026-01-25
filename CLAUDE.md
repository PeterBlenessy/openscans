# Claude Development Guidelines for OpenScans

This document outlines the common rules, conventions, and best practices for Claude when working on this project.

## Project Context

**Project**: OpenScans - A web-based medical imaging viewer for DICOM files
**Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS, Cornerstone.js
**Purpose**: Client-side DICOM viewing with annotations and export capabilities

## Core Principles

### 1. Privacy First
- **NEVER** implement features that send patient data to external servers
- All DICOM processing must remain client-side
- No analytics, tracking, or telemetry without explicit user consent
- Consider HIPAA compliance in all architectural decisions

### 2. Type Safety
- Use TypeScript for all new code
- Avoid `any` types - use proper type definitions
- Create type definitions for external libraries if missing
- Export types from `src/types/index.ts` for reusability

### 3. Component Design
- Follow the existing component structure in `src/components/`
- Keep components focused on a single responsibility
- Use functional components with hooks
- Extract reusable logic into custom hooks

### 4. State Management
- Use Zustand stores for global state
- Follow the existing store pattern (`studyStore`, `viewportStore`, `annotationStore`)
- Keep store actions simple and focused
- Avoid duplicating state - single source of truth

## Code Style and Conventions

### File Organization
```
src/
├── components/         # React components (PascalCase)
├── stores/            # Zustand stores (camelCase + Store)
├── lib/               # Utilities and libraries
├── hooks/             # Custom hooks (use + PascalCase)
├── types/             # TypeScript definitions
└── App.tsx            # Main component
```

### Naming Conventions
- **Components**: PascalCase (`DicomViewport.tsx`)
- **Stores**: camelCase + "Store" (`studyStore.ts`)
- **Hooks**: "use" + PascalCase (`useDicomLoader.ts`)
- **Utilities**: camelCase (`parser.ts`)
- **Types**: PascalCase interfaces/types (`DicomInstance`)

### Import Order
1. External libraries (React, third-party)
2. Internal components
3. Stores and hooks
4. Types
5. Utilities and helpers

Example:
```typescript
import { useEffect, useState } from 'react'
import { DicomViewport } from './components/viewer/DicomViewport'
import { useStudyStore } from './stores/studyStore'
import { DicomInstance } from './types'
import { formatDate } from './lib/utils'
```

### Styling
- Use Tailwind CSS utility classes
- Follow the existing dark theme color scheme
- Use responsive classes for tablet/mobile
- Avoid inline styles except for dynamic values (e.g., slider progress)

## Medical Imaging Specific Rules

### 1. Cornerstone.js Integration
- Always enable/disable Cornerstone elements in useEffect
- Clean up on component unmount
- Handle errors gracefully - DICOM files can be malformed
- Log errors to console for debugging

Example:
```typescript
useEffect(() => {
  if (!element) return

  try {
    cornerstone.enable(element)
  } catch (err) {
    console.error('Failed to enable element:', err)
  }

  return () => {
    try {
      cornerstone.disable(element)
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}, [])
```

### 2. DICOM File Handling
- Always check for pixel data tag (0x7FE0,0x0010) before treating as image
- Filter out DICOMDIR and non-image DICOM files
- Extract metadata safely with try-catch
- Provide default values for missing tags

### 3. Memory Management
- Be mindful of memory usage with large image series
- Use refs to prevent duplicate image loads
- Clean up blob URLs when done
- Disable Cornerstone elements on unmount

## Testing and Debugging

### Development Testing
- Test with actual DICOM files from `MR-data/` folder
- Verify both single files and folder uploads
- Check console for errors/warnings
- Test on Chrome (primary) and Firefox

### Error Handling
- Log errors to console with context
- Show user-friendly error messages
- Don't crash on malformed data
- Provide fallback UI states

### Performance
- Avoid unnecessary re-renders
- Use Zustand selectors properly
- Lazy load thumbnails
- Monitor memory usage with large studies

## Documentation Standards

### Code Comments
- Add JSDoc comments for public functions
- Explain "why" not "what" in comments
- Document complex algorithms
- Note any workarounds or known issues

Example:
```typescript
/**
 * Filters out DICOMDIR and non-image DICOM files by checking for pixel data.
 * The pixel data tag (0x7FE0,0x0010) indicates the file contains image data.
 */
function hasPixelData(dataset: DataSet): boolean {
  return dataset.elements.x7fe00010 !== undefined
}
```

### Commit Messages
- Use conventional commits format
- Be descriptive but concise
- Reference issues when applicable

Examples:
- `feat: add image slider for navigation`
- `fix: prevent thumbnail width overflow`
- `refactor: extract DICOM parsing to utility`
- `docs: update architecture documentation`

## Architectural Guidelines

### When to Create New Components
- Component logic exceeds 200 lines
- Component is reused in multiple places
- Component has distinct responsibility
- Component needs isolated state

### When to Create New Stores
- State is used by multiple unrelated components
- State needs to persist across route changes (future)
- State has complex update logic
- State represents a distinct domain (studies, viewport, annotations)

### When to Create New Utilities
- Logic is pure (no side effects)
- Logic is reused in multiple places
- Logic is complex and testable
- Logic doesn't fit in a component or hook

## Common Patterns

### 1. Zustand Store Pattern
```typescript
interface StoreState {
  data: SomeType[]
  currentItem: SomeType | null
  setCurrentItem: (item: SomeType) => void
  addItem: (item: SomeType) => void
}

export const useStore = create<StoreState>()((set) => ({
  data: [],
  currentItem: null,
  setCurrentItem: (item) => set({ currentItem: item }),
  addItem: (item) => set((state) => ({
    data: [...state.data, item]
  }))
}))
```

### 2. Component with Cornerstone
```typescript
export function ImageComponent() {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    cornerstone.enable(element)
    setIsEnabled(true)

    return () => {
      cornerstone.disable(element)
    }
  }, [])

  return <div ref={elementRef} className="w-full h-full" />
}
```

### 3. File Processing Pattern
```typescript
async function processFiles(files: File[]) {
  const results = []

  for (const file of files) {
    try {
      const result = await processFile(file)
      results.push(result)
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error)
      // Continue processing other files
    }
  }

  return results
}
```

## Security Best Practices

### 1. Input Validation
- Validate file types before processing
- Check file sizes to prevent memory issues
- Sanitize any user input
- Handle malformed DICOM gracefully

### 2. Dependencies
- Keep dependencies updated
- Review security advisories
- Avoid dependencies with known vulnerabilities
- Use `pnpm audit` regularly

### 3. Code Security
- No eval() or Function() constructors
- No innerHTML without sanitization
- Use strict TypeScript settings
- Enable all ESLint security rules

## Performance Guidelines

### 1. React Optimization
- Use Zustand selectors to avoid re-renders
- Memoize expensive calculations with useMemo
- Use useCallback for event handlers in lists
- Consider React.memo for expensive components

### 2. Image Loading
- Load images on-demand
- Cache loaded images
- Unload off-screen images (future)
- Show loading states

### 3. Memory Management
- Monitor memory usage in DevTools
- Clean up resources in useEffect cleanup
- Avoid memory leaks with event listeners
- Use refs to prevent duplicate operations

## Future Considerations

### Features in Progress
- Annotation overlay system
- Export functionality
- Advanced viewport tools (MPR, 3D rendering)

### Known Limitations
- No persistence (studies lost on reload)
- No backend integration yet
- Desktop/tablet optimized only
- Memory constraints with very large studies

### Planned Improvements
- Web workers for DICOM parsing
- IndexedDB caching
- Progressive image loading
- Performance profiling and optimization

## Resources

### Project Documentation
- `docs/PRD.md` - Product requirements
- `docs/architecture.md` - Architecture overview
- `plans/STATUS.md` - Current status and roadmap
- `README.md` - Setup and quick start

### External References
- [Cornerstone.js Docs](https://github.com/cornerstonejs/cornerstone)
- [DICOM Standard](https://www.dicomstandard.org/)
- [React Docs](https://react.dev/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/)

## Questions and Clarifications

When in doubt:
1. Check existing code patterns first
2. Review architecture documentation
3. Ask clarifying questions before implementing
4. Propose alternatives if current approach seems problematic
5. Document decisions and rationale

## Updates to This Document

This document should be updated when:
- New architectural patterns are established
- Technology stack changes
- New conventions are adopted
- Common issues are identified and resolved

---

**Version**: 1.0
**Last Updated**: 2026-01-18
**Maintained By**: Development Team
