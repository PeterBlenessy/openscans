# OpenScans

A modern, privacy-first web-based DICOM viewer for medical imaging with advanced viewport tools, export capabilities, and comprehensive testing. Built with React, TypeScript, and Cornerstone.js.

## ✨ Features

### Core Functionality

- **📂 DICOM File Loading**: Drag-and-drop or file picker for single files and entire folders
- **🖼️ Advanced Image Display**: High-quality rendering using Cornerstone.js
- **🎯 Navigation**: Browse multi-instance series with keyboard shortcuts and slider
- **🎨 Viewport Tools**: Window/Level, Zoom, Pan, Rotation, Flip, Invert
- **📊 Metadata Display**: Comprehensive study, series, and instance information
- **⭐ Favorites**: Star images and export to batch PDF
- **📤 Export**: PNG, JPEG, and PDF with privacy-first defaults
- **🎛️ Image Presets**: Quick W/L presets for different tissue types
- **⚡ Keyboard Shortcuts**: Full keyboard navigation and tool control
- **🌙 Dark Theme**: Eye-friendly dark mode (default)

### Privacy & Compliance

- **🔒 Client-Side Only**: All processing in browser, zero data transmission
- **🛡️ Privacy-First Export**: Patient data excluded from filenames by default
- **📋 HIPAA Considerations**: Designed for medical privacy compliance
- **🚫 No Analytics**: No tracking, cookies, or third-party scripts

## 🛠️ Tech Stack

- **React 18** + **TypeScript** - Type-safe UI framework
- **Vite** - Lightning-fast build tool and dev server
- **Cornerstone.js** - Industry-standard medical image rendering
- **dicom-parser** - DICOM parsing library
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling
- **jsPDF** - PDF generation for exports
- **Vitest** - Unit testing framework
- **Playwright** - E2E testing framework

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will open at `http://localhost:3000`

### Usage

1. **Load DICOM Files**:
   - Drag and drop `.dcm` files onto the dropzone, OR
   - Click "Select Files" to browse for files

2. **View Images**:
   - Use Previous/Next buttons to navigate through slices
   - Scroll with mouse wheel to navigate
   - View metadata in the right sidebar

3. **Load New Files**:
   - Click "Load New Files" button in the sidebar

## Project Structure

```
src/
├── components/
│   ├── viewer/          # DicomViewport, FileDropzone
│   ├── controls/        # (Future: WindowLevel, Zoom controls)
│   ├── series/          # (Future: SeriesBrowser, thumbnails)
│   ├── annotations/     # (Future: FindingsList, markers)
│   └── export/          # (Future: ExportDialog)
├── lib/
│   ├── cornerstone/     # Cornerstone initialization
│   ├── dicom/          # DICOM parsing and metadata extraction
│   ├── annotations/    # (Future: Annotation management)
│   └── export/         # (Future: Export implementations)
├── stores/              # Zustand state stores
│   ├── studyStore.ts   # Study/series/image state
│   ├── viewportStore.ts # Viewport settings
│   └── annotationStore.ts # (Future: Annotation data)
├── hooks/               # Custom React hooks
│   └── useDicomLoader.ts
└── types/               # TypeScript definitions
    ├── index.ts         # Core DICOM types
    └── annotation.ts    # Annotation types
```

## Key Files

- **`src/lib/cornerstone/initCornerstone.ts`** - Cornerstone3D initialization and configuration
- **`src/components/viewer/DicomViewport.tsx`** - Main viewport component for rendering DICOM images
- **`src/lib/dicom/parser.ts`** - DICOM file parsing and organization into studies/series
- **`src/stores/studyStore.ts`** - State management for loaded DICOM data
- **`src/App.tsx`** - Main application component

## Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start dev server (localhost:3000)
pnpm build                  # Build for production
pnpm preview                # Preview production build

# Code Quality
pnpm lint                   # Run ESLint
pnpm format                 # Format with Prettier
pnpm tsc --noEmit          # Type check

# Testing
pnpm test                   # Run unit tests
pnpm test -- --watch        # Unit tests in watch mode
pnpm test -- --coverage     # Generate coverage report
pnpm test:e2e              # Run E2E tests
```

### Known Issues

- Production build has WASM loading issues with `@icr/polyseg-wasm` (Cornerstone Tools dependency)
- Development mode works perfectly
- Solution in progress: Configuring Vite to properly handle WASM modules

## Privacy & Logging

This application is designed with **privacy-first principles** to comply with HIPAA and protect patient data:

### Client-Side Processing
- All DICOM files are processed entirely in your browser
- No patient data is ever transmitted to external servers
- Studies are held in memory only and cleared when the browser closes

### Privacy-Compliant Logging
- **No patient information is logged** - Patient names, IDs, and identifiable data are never written to console logs
- **Minimal verbosity** - Console output shows only critical errors and warnings
- **What is logged:**
  - ⚠️ Lossy compression warnings (important for medical image quality)
  - ❌ Critical errors (parsing failures, load failures, viewport errors)
- **What is NOT logged:**
  - Patient names, IDs, or dates of birth
  - DICOM metadata values
  - File names or paths
  - Detailed debugging information

This ensures compliance with medical privacy regulations while maintaining debuggability for critical issues.

### Export Privacy
- Exported file names exclude patient identifiable information by default
- Patient data must be explicitly enabled in export settings
- All exports happen locally - no cloud uploads

## Architecture Decisions

1. **Client-side Only**: All DICOM processing happens in the browser for privacy and performance
2. **Cornerstone3D**: Industry standard for medical imaging on the web (powers OHIF Viewer)
3. **Zustand**: Lightweight state management, simpler than Redux for this use case
4. **TypeScript**: Type safety is critical when working with DICOM data
5. **Modular Structure**: Each phase builds on the previous, can pause/resume between phases
6. **Privacy-First Logging**: Zero patient data in logs, HIPAA-compliant console output

## 📊 Testing & Quality

### Test Coverage

- **Unit Tests**: 199 passing (stores, parsers, export functions)
- **E2E Tests**: 11 passing (critical user workflows)
- **Coverage**: 70%+ overall, 95%+ on business logic

### Test Commands

```bash
# Run all tests
pnpm test                   # Unit tests
pnpm test:e2e              # E2E tests (requires fixtures)

# Coverage
pnpm test -- --coverage     # Generate coverage report
open coverage/index.html    # View coverage

# Debugging
pnpm exec playwright test --ui  # E2E tests in UI mode
```

See [TESTING.md](TESTING.md) for detailed testing guide.

## 📚 Documentation

- **[TESTING.md](TESTING.md)** - Comprehensive testing guide with examples
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Developer workflow and code style
- **[docs/API.md](docs/API.md)** - API reference for stores and functions
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment and HIPAA compliance
- **[CLAUDE.md](CLAUDE.md)** - AI development guidelines and patterns
- **[plans/STATUS.md](plans/STATUS.md)** - Implementation progress tracker

## 🚀 Implementation Status

- ✅ **Phase 1**: MVP DICOM Viewer - Complete
  - File loading, parsing, and display
  - Navigation controls and instance browsing
  - Viewport tools (W/L, zoom, pan, rotation)

- ✅ **Phase 2**: Advanced UX - Complete
  - Thumbnails, keyboard shortcuts, help overlay
  - Image slider, collapsible sidebar, dark theme
  - Recent studies with File System Access API

- ✅ **Phase 3**: Export & Privacy - Complete
  - PNG, JPEG, PDF export with metadata
  - Privacy-first file naming
  - Batch PDF export from favorites
  - HIPAA-compliant logging

- ✅ **Phase 4**: Testing & Production Polish - Complete
  - 199 unit tests (Vitest)
  - 11 E2E tests (Playwright)
  - Comprehensive documentation
  - 70%+ test coverage

**Overall Progress**: Production-ready v1.0

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup and workflow
- Code style guidelines
- Git conventions (Conventional Commits)
- Testing requirements
- Pull request process

### Quick Start for Contributors

```bash
# Clone and setup
git clone https://github.com/yourusername/MRI-viewer.git
cd MRI-viewer
pnpm install

# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
pnpm test
pnpm test:e2e

# Commit and push
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📖 Resources

### Project Documentation
- [Testing Guide](TESTING.md)
- [Contributing Guide](CONTRIBUTING.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

### External Resources
- [Cornerstone.js Documentation](https://github.com/cornerstonejs/cornerstone)
- [DICOM Standard](https://www.dicomstandard.org/)
- [OHIF Viewer](https://ohif.org/) - Reference implementation
- [dicom-parser](https://github.com/cornerstonejs/dicomParser)

## 🙏 Acknowledgments

- **Cornerstone Contributors** - Test DICOM files from [cornerstoneWADOImageLoader](https://github.com/cornerstonejs/cornerstoneWADOImageLoader)
- **OHIF Team** - Inspiration and best practices
- **Open Health Imaging Foundation** - Medical imaging standards
