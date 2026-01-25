# OpenScans - Architecture Documentation

## Overview

The OpenScans is a modern web-based application built with React and TypeScript for viewing medical imaging DICOM files. The architecture emphasizes client-side processing, performance, and maintainability.

**Version**: 1.1
**Last Updated**: 2026-01-24
**Status**: Active Development

## Architecture Principles

1. **Client-Side First**: All DICOM processing happens in the browser to ensure privacy and reduce server dependencies
2. **Component-Based**: Modular React components for reusability and maintainability
3. **Type Safety**: TypeScript throughout for compile-time error detection
4. **State Management**: Centralized state using Zustand for predictable data flow
5. **Performance**: Optimized rendering with lazy loading and efficient memory management

## Technology Stack

### Core Framework
- **React 18**: UI framework with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling

### DICOM Processing
- **cornerstone-core 2.x**: Medical image rendering engine
- **cornerstone-wado-image-loader**: DICOM file loading
- **dicom-parser**: DICOM tag parsing

### State Management
- **Zustand**: Lightweight state management (studies, viewport settings, annotations)

### Build & Development
- **Vite**: Development server and build tool
- **ESLint**: Code quality and consistency
- **PostCSS**: CSS processing with Tailwind

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Application Layer                    │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   App.tsx    │  │  Components  │  │    Stores    │ │ │
│  │  │              │  │              │  │              │ │ │
│  │  │  - Layout    │  │  - Viewport  │  │  - Study     │ │ │
│  │  │  - Routing   │  │  - Browser   │  │  - Viewport  │ │ │
│  │  │              │  │  - Dropzone  │  │  - Annotation│ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Medical Imaging Layer (Cornerstone)         │ │
│  │                                                          │ │
│  │  - Image rendering (WebGL/Canvas)                       │ │
│  │  - Viewport management                                  │ │
│  │  - Window/Level adjustments                             │ │
│  │  - Image transformations                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              DICOM Processing Layer                     │ │
│  │                                                          │ │
│  │  - File parsing (dicom-parser)                          │ │
│  │  - Metadata extraction                                  │ │
│  │  - Image loading (WADO loader)                          │ │
│  │  - Study/Series organization                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Browser APIs                            │ │
│  │                                                          │ │
│  │  - File API (local file access)                         │ │
│  │  - Canvas/WebGL (rendering)                             │ │
│  │  - IndexedDB (future: caching)                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
MR-viewer/
├── src/
│   ├── components/           # React components
│   │   └── viewer/          # DICOM viewing components
│   │       ├── DicomViewport.tsx       # Main image display
│   │       ├── ThumbnailStrip.tsx      # Image thumbnails
│   │       ├── FileDropzone.tsx        # File upload
│   │       └── StudySeriesBrowser.tsx  # Study/series navigation
│   ├── stores/              # Zustand state stores
│   │   ├── studyStore.ts              # Study/series/instance state
│   │   ├── viewportStore.ts           # Viewport settings
│   │   └── annotationStore.ts         # Annotations (future)
│   ├── lib/                 # Core libraries
│   │   ├── cornerstone/               # Cornerstone initialization
│   │   └── dicom/                     # DICOM parsing
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── docs/                    # Documentation
├── plans/                   # Planning documents
└── public/                  # Static assets
```

## Key Architectural Decisions

### 1. Client-Side DICOM Processing

**Decision**: Process all DICOM files in the browser
**Rationale**:
- Privacy: Patient data never leaves the user's device
- Performance: No network latency for file uploads
- Simplicity: No backend server required
- Security: Reduced attack surface

**Trade-offs**:
- Browser memory constraints for large studies
- Limited to browser-supported formats
- No persistent storage without explicit user action

### 2. Cornerstone.js for Rendering

**Decision**: Use Cornerstone 2.x as the rendering engine
**Rationale**:
- Industry standard for medical imaging
- Hardware-accelerated rendering
- Built-in DICOM support
- Active community and maintenance

**Trade-offs**:
- Learning curve for medical imaging concepts
- Version 2.x has some compatibility issues (tools disabled)
- Specific initialization requirements

### 3. Zustand for State Management

**Decision**: Use Zustand instead of Redux or Context API
**Rationale**:
- Minimal boilerplate compared to Redux
- Better performance than Context API
- TypeScript support out of the box
- Small bundle size (1KB)

**Implementation**:
- `studyStore`: Manages loaded studies, series, and current instance
- `viewportStore`: Manages viewport settings (zoom, pan, window/level)
- `annotationStore`: Future store for annotations

### 4. Component Architecture

**Decision**: Separate concerns into focused components
**Components**:

- **DicomViewport**:
  - Renders the main DICOM image
  - Manages Cornerstone element lifecycle
  - Applies viewport settings

- **ThumbnailStrip**:
  - Displays scrollable thumbnails
  - Renders miniature versions using Cornerstone
  - Highlights current selection

- **StudySeriesBrowser**:
  - Hierarchical tree view of studies and series
  - Auto-expands on load
  - Allows series switching

- **FileDropzone**:
  - Drag-and-drop file upload
  - Recursive folder scanning
  - Progress indication

### 5. Web Workers for Image Decoding

**Decision**: Enabled web workers in WADO image loader (as of January 24, 2026)
**Rationale**:
- Improved performance with background thread decoding
- Non-blocking UI during DICOM processing
- Automatic CPU core detection for optimal worker count

**Implementation**:
- Workers = (CPU cores - 1) to reserve main thread
- Example: 7 workers on 8-core CPU
- Decoding happens in parallel without blocking UI

### 6. Maximum Image Quality Configuration

**Decision**: Configure for maximum lossless quality (as of January 24, 2026)
**Rationale**:
- Medical imaging requires pixel-perfect accuracy
- Preserve full diagnostic quality
- Support high-DPI displays (Retina, 4K)

**Implementation Details**:

1. **Pixel-Perfect Rendering**:
   ```css
   imageRendering: 'crisp-edges'  /* No interpolation/anti-aliasing */
   ```

2. **Strict Lossless Decoding**:
   ```typescript
   strict: true,  // Reject lossy formats
   convertFloatPixelDataToInt: false,  // Preserve full precision
   initializeCodecsOnStartup: true  // Faster first load
   ```

3. **High-DPI Display Support**:
   - Automatic `devicePixelRatio` detection
   - Canvas scaling for Retina/4K displays
   - Responsive resize handling

4. **Transfer Syntax Verification**:
   - Logs compression type for each DICOM file
   - Warns if lossy compression detected
   - Supports: Uncompressed, JPEG Lossless, JPEG 2000 Lossless, RLE Lossless

**Quality Guarantees**:
- ✓ 100% lossless pixel data preservation
- ✓ Full bit-depth support (8-bit, 12-bit, 16-bit)
- ✓ No quality-degrading interpolation
- ✓ High-DPI display optimization

### 7. File Organization Strategy

**Decision**: Use WADO file manager for image ID management
**Rationale**:
- Efficient file reference tracking
- Blob URL management
- Memory cleanup on component unmount

**Implementation**:
```typescript
const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file)
```

## Data Flow

### 1. File Loading Flow

```
User selects files/folder
    ↓
FileDropzone receives files
    ↓
parseDicomFiles() processes each file
    ↓
Filter non-image DICOM files (check pixel data tag)
    ↓
Extract metadata from each instance
    ↓
Organize into Study → Series → Instance hierarchy
    ↓
Store in studyStore
    ↓
Auto-select first study/series
    ↓
DicomViewport renders first instance
```

### 2. Image Navigation Flow

```
User interacts (slider/thumbnail/series)
    ↓
studyStore.setCurrentInstance(index)
    ↓
Store updates currentInstanceIndex
    ↓
React re-renders DicomViewport
    ↓
useEffect triggers on currentInstance change
    ↓
cornerstone.loadImage(imageId)
    ↓
cornerstone.displayImage(element, image)
    ↓
Apply viewport settings (zoom, pan, etc.)
```

### 3. Viewport Settings Flow

```
User adjusts settings (window/level, zoom, etc.)
    ↓
viewportStore updates settings
    ↓
DicomViewport useEffect detects change
    ↓
cornerstone.getViewport(element)
    ↓
Apply new settings to viewport
    ↓
cornerstone.setViewport(element, viewport)
```

## Performance Optimizations

### 1. Lazy Thumbnail Loading
- Thumbnails render on-demand using refs
- `loadedRef` prevents duplicate loads
- Cleanup on component unmount

### 2. Efficient Re-rendering
- Zustand selector pattern prevents unnecessary re-renders
- React.memo for expensive components (future)
- useCallback for event handlers (future)

### 3. Memory Management
- Cornerstone element cleanup in useEffect cleanup
- File manager tracks blob URLs
- Explicit disable() calls on unmount

### 4. Image Caching
- Browser caches loaded images automatically
- Cornerstone internal cache for decoded images
- Future: IndexedDB for persistent caching

## Error Handling Strategy

### 1. DICOM Parsing Errors
- Graceful handling of malformed files
- Skip non-image DICOM files (DICOMDIR)
- Console logging for debugging
- User-friendly error messages

### 2. Rendering Errors
- Error boundaries for component crashes (future)
- Fallback UI for failed images
- Detailed error logging

### 3. User Input Validation
- File type checking
- Folder structure validation
- Empty state handling

## Security Considerations

### 1. Client-Side Only
- No data transmission to servers
- All processing in browser sandbox
- Files accessed via File API

### 2. Content Security
- No eval() or unsafe code execution
- Trusted libraries only
- Regular dependency updates

### 3. Privacy
- No analytics or tracking
- No persistent storage without consent
- No network requests (except for app resources)

## Future Architecture Enhancements

### Phase 2
1. **Annotation System**
   - Overlay rendering layer
   - Annotation store implementation
   - Interactive drawing tools

2. **Performance**
   - Web Workers for DICOM parsing
   - Virtual scrolling for large thumbnail lists
   - Progressive image loading

3. **Advanced Features**
   - Multi-planar reconstruction (MPR)
   - 3D volume rendering
   - Advanced measurements

### Phase 3
1. **Backend Integration**
   - Optional PACS server connection
   - DICOMweb support
   - Cloud storage integration

2. **Collaboration**
   - Real-time annotation sharing
   - Multi-user viewing sessions

## Testing Strategy

### Current
- Manual testing during development
- Browser console monitoring

### Planned
- Unit tests for utilities and stores
- Component tests with React Testing Library
- E2E tests with Playwright
- Performance benchmarking

## Deployment Considerations

### Development
- Vite dev server with HMR
- Source maps for debugging
- Development-only logging

### Production
- Static build output
- CDN deployment
- Gzip/Brotli compression
- Cache headers for assets

## Dependencies

### Critical Dependencies
- `react` (18.x): UI framework
- `cornerstone-core` (2.x): Medical imaging engine
- `cornerstone-wado-image-loader`: DICOM loading
- `dicom-parser`: DICOM parsing
- `zustand`: State management

### Development Dependencies
- `vite`: Build tool
- `typescript`: Type checking
- `tailwindcss`: Styling
- `eslint`: Code quality

## Known Limitations

1. **Browser Memory**: Large studies (1000+ images) may cause performance issues
2. **Format Support**: Limited to formats supported by cornerstone-wado-image-loader
3. **No Persistence**: Studies are lost on page reload
4. **Single User**: No multi-user support currently
5. **No Mobile**: Optimized for desktop/tablet only

## References

- [Cornerstone.js Documentation](https://github.com/cornerstonejs/cornerstone)
- [DICOM Standard](https://www.dicomstandard.org/)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

**Maintainers**: Development Team
**Review Cycle**: Quarterly or on major changes
**Next Review**: 2026-04-18
