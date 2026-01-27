# Python ML Integration Plan

**Status**: Exploration Phase
**Branch**: `feature/python-ml-integration`
**Created**: 2026-01-26
**Approach**: Tauri Desktop App + Python Sidecar + On-Demand Model Downloads

---

## Executive Summary

Replace mock vertebrae detector with **real medical imaging AI** using:
- **TotalSegmentator** (104 anatomical structures, 59 bones including all vertebrae)
- **NVIDIA MONAI** (medical imaging framework with pre-trained models)

**Key Decision**: On-demand model downloads (not bundled)
- Initial bundle: ~300-400MB (Python + PyTorch CPU)
- Models: 2-5GB downloaded when user first uses AI detection
- 90% smaller initial download vs bundling everything

---

## Architecture Overview - Hybrid Approach

### Two Deployment Options, One Codebase

**Web App** (existing, mock AI only):
```
┌─────────────────────────────────┐
│   Browser                       │
│  ┌──────────────────────────┐   │
│  │  React/Vite Frontend     │   │
│  │  • DICOM viewer          │   │
│  │  • Annotations           │   │
│  │  • Mock AI detector      │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

**Desktop App** (new, real AI):
```
┌─────────────────────────────────────┐
│   Tauri Desktop App                 │
│  ┌──────────────┐  ┌──────────────┐ │
│  │  React/Vite  │◄─┤ Tauri Bridge │ │
│  │   Frontend   │  │     (IPC)    │ │
│  │ (same code!) │  └──────┬───────┘ │
│  └──────────────┘         │         │
└────────────────────────────┼────────┘
                             │
                ┌────────────▼────────────┐
                │  Python Sidecar (exe)   │
                │  ┌──────────────────┐   │
                │  │ FastAPI Server   │   │
                │  │ TotalSegmentator │   │
                │  │ PyTorch (CPU)    │   │
                │  └──────────────────┘   │
                └─────────────────────────┘
                             │
                ┌────────────▼────────────┐
                │   Model Cache           │
                │  ~/.openscans/models/   │
                │  • vertebrae (2GB)      │
                │  • total_body (5GB)     │
                └─────────────────────────┘
```

### Code Sharing
- **95% shared**: React components, stores, DICOM parsing, UI
- **5% different**: AI detector implementation
  - Web: `mockVertebralDetector.ts` (existing)
  - Desktop: `tauriVertebralDetector.ts` (new)

---

## Hybrid Deployment Strategy

### Feature Matrix

| Feature | Web App | Desktop App |
|---------|---------|-------------|
| DICOM Viewer | ✅ | ✅ |
| Annotations | ✅ | ✅ |
| Export (PNG/PDF) | ✅ | ✅ |
| AI Detection | ⚠️ Mock only | ✅ Real (TotalSegmentator) |
| File System Access | ❌ Limited | ✅ Full |
| Offline Mode | ⚠️ Limited | ✅ Full |
| Installation | ✅ None (URL) | Desktop installer |
| Update Method | ✅ Automatic | Auto-update |
| Use Case | Education, demos | Clinical, research |

### Environment Detection

```typescript
// src/lib/utils/platform.ts
export const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

export const getPlatform = () => {
  if (isTauri()) return 'desktop'
  return 'web'
}

// Usage in detector factory
import { isTauri } from '@/lib/utils/platform'

export const getDetector = () => {
  if (isTauri()) {
    return tauriDetector  // Real AI
  }
  return mockDetector  // Simulation
}
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  # Web deployment (existing)
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Build web app
        run: pnpm build
      - name: Deploy to Vercel/Netlify
        run: pnpm deploy

  # Desktop builds (new)
  build-desktop-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Python sidecar
        run: python -m PyInstaller build.spec
      - name: Build Tauri app
        run: pnpm tauri build
      - name: Upload installer
        uses: actions/upload-artifact@v3
        with:
          name: OpenScans-Windows.msi
          path: src-tauri/target/release/bundle/msi/*.msi

  build-desktop-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Python sidecar
        run: python -m PyInstaller build.spec
      - name: Build Tauri app
        run: pnpm tauri build
      - name: Upload installer
        uses: actions/upload-artifact@v3
        with:
          name: OpenScans-macOS.dmg
          path: src-tauri/target/release/bundle/dmg/*.dmg

  build-desktop-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Python sidecar
        run: python -m PyInstaller build.spec
      - name: Build Tauri app
        run: pnpm tauri build
      - name: Upload installer
        uses: actions/upload-artifact@v3
        with:
          name: OpenScans-Linux.AppImage
          path: src-tauri/target/release/bundle/appimage/*.AppImage
```

---

## Why This Approach?

### ✅ Advantages
1. **Hybrid deployment** - Both web AND desktop from same codebase
2. **90% smaller initial download** for desktop (300MB vs 5GB)
3. **Native performance** - Full GPU access via CUDA/Metal (desktop only)
4. **State-of-the-art models** - TotalSegmentator Dice score 0.943 (desktop)
5. **Privacy-first** - All processing local, HIPAA compliant
6. **Offline capable** - After model download (desktop)
7. **Industry standard** - Same approach as 3D Slicer, Hugging Face
8. **Web version unchanged** - No breaking changes to existing deployment
9. **User choice** - Pick web (convenience) or desktop (power)

### ⚠️ Trade-offs
1. **Desktop**: Separate builds per platform (Windows/Mac/Linux)
2. **Desktop**: First-use requires model download (5-10 minutes)
3. **Desktop**: Larger total disk space (~3-5GB after models)
4. **Web**: Limited to mock AI (educational/demo only)

### 🔄 Alternatives Explored

| Approach | Verdict | Reason |
|----------|---------|--------|
| TensorFlow.js | ❌ Rejected | MoveNet not trained on X-rays, poor accuracy |
| Pyodide (WASM) | ❌ Rejected | No PyTorch/GPU support |
| ONNX Runtime Web | ⚠️ Limited | 10min for 512³ CT volumes (too slow) |
| **Tauri + Python** | ✅ **Selected** | Native speed, full Python ecosystem |

---

## Technical Stack

### Python Libraries
- **TotalSegmentator** v2.x - Vertebrae segmentation
  - 104 anatomical structures
  - C1-C7, T1-T12, L1-L5, S1 vertebrae
  - Trained on thousands of CT scans
  - Dice score: 0.943

- **NVIDIA MONAI** - Alternative/supplementary
  - 3-stage vertebrae pipeline
  - Pre-trained on VerSe dataset
  - 24 vertebrae structures

- **PyTorch CPU** (~200MB optimized)
  - No CUDA bundled (download if user has GPU)

### Desktop Framework
- **Tauri v2** - Rust + Web frontend
  - Smaller than Electron (~10MB vs 100MB)
  - Better performance
  - Native OS integration

### Model Distribution
- **On-Demand Downloads** via HTTP
- **Cache Location**: `~/.openscans/models/`
- **Progress Tracking**: Server-Sent Events (SSE)

---

## Implementation Phases

### Phase 1: Add Tauri Desktop Support (Week 1)
**Goal**: Add Tauri desktop build WITHOUT breaking web app

- [ ] Install Tauri CLI and dependencies
- [ ] Create `src-tauri/` directory structure (new folder, doesn't affect web)
- [ ] Configure `tauri.conf.json`
- [ ] Add platform detection utility (`isTauri()`)
- [ ] Test Vite + Tauri integration
- [ ] Verify web build still works: `pnpm build`
- [ ] Verify desktop build works: `pnpm tauri build`
- [ ] Update package.json scripts:
  - `dev` - Web dev server (existing)
  - `dev:desktop` - Tauri dev (new)
  - `build` - Web build (existing)
  - `build:desktop` - Tauri build (new)

**Deliverable**: Desktop app opens, web app still deploys normally

**Key Principle**: Web app remains untouched and fully functional

---

### Phase 2: Python Backend (Week 2)
**Goal**: Create Python FastAPI server with TotalSegmentator

#### 2.1 Python Server Setup
- [ ] Create `python-backend/` directory
- [ ] Install dependencies: FastAPI, uvicorn, TotalSegmentator
- [ ] Create FastAPI app with endpoints:
  - `GET /api/health` - Health check
  - `GET /api/models/status` - Check downloaded models
  - `POST /api/models/download/{task}` - Download model with progress
  - `POST /api/detect-vertebrae` - Run inference

#### 2.2 Model Manager
- [ ] Implement `ModelManager` class
- [ ] Check model download status
- [ ] Download models with progress tracking
- [ ] Cache models in `~/.openscans/models/`
- [ ] Handle errors (network failures, disk space)

#### 2.3 Inference Pipeline
- [ ] Load DICOM files
- [ ] Run TotalSegmentator inference
- [ ] Parse segmentation results
- [ ] Convert to OpenScans annotation format
- [ ] Return vertebrae coordinates + confidence

**Deliverable**: Python server that can run locally, detect vertebrae

---

### Phase 3: PyInstaller Packaging ✅ COMPLETE
**Goal**: Package Python server as standalone executable

- [x] Create `build.spec` for PyInstaller
- [x] Build scripts for Mac/Linux/Windows
- [x] Test executable startup time
- [x] Final bundle: 864MB (includes full PyTorch + CUDA)

**Actual Bundle:**
```
openscans-inference (864MB)
├── Python runtime (50MB)
├── PyTorch + CUDA (600MB)
├── TotalSegmentator + nnU-Net (100MB)
├── Scientific libraries (100MB)
└── FastAPI + dependencies (14MB)
```

**Deliverable**: ✅ Single executable that runs server

**Note**: Cannot exclude torch.cuda/distributed - PyTorch requires them internally

---

### Phase 4A: Tauri Sidecar Integration (Bundled - Testing) ✅ MOSTLY COMPLETE
**Goal**: Bundle Python executable with Tauri for testing

**Architecture Decision**:
- Phase 4A: Bundle for testing (900MB installer)
- Phase 4B: On-demand download for production (50MB installer)

#### 4A.1 Sidecar Configuration ✅ COMPLETE
- [x] Copy `openscans-inference` to `src-tauri/binaries/`
- [x] Copy `_internal/` dependencies to `src-tauri/_internal/`
- [x] Add to `tauri.conf.json` as sidecar
- [x] Configure resource paths (fixed PyInstaller structure)
- [x] Test sidecar lifecycle

#### 4A.2 Rust Commands ✅ COMPLETE
- [x] `start_ai_server()` - Spawn Python sidecar
- [x] `stop_ai_server()` - Gracefully shutdown
- [x] `get_server_status()` - Health check
- [x] `detect_vertebrae(file_path)` - Forward to Python API
- [x] Updated for Tauri v2 API compatibility

#### 4A.3 TypeScript Integration ⏳ PENDING
- [ ] Create `tauriVertebralDetector.ts` to use Tauri commands
- [ ] Handle server startup delays
- [ ] Error handling and retries
- [ ] Update detector factory to use Tauri detector in desktop mode

**Deliverable**: ✅ Working Rust backend with Python sidecar (verified)
⏳ Frontend integration pending

---

### Phase 4B: On-Demand Download (Production)
**Goal**: Download AI engine only when needed (95% smaller installer)

**Why**: Most users only view DICOM files, don't need 864MB AI engine

#### 4B.1 GitHub Releases Setup
- [ ] Create release artifacts:
  - `OpenScans-macOS-arm64.dmg` (50MB) - Main installer
  - `ai-engine-macos-arm64.tar.gz` (864MB) - AI engine (optional)
  - Repeat for Windows/Linux
- [ ] Automate via CI/CD

#### 4B.2 Download Manager (Rust)
- [ ] `check_ai_engine()` - Check if installed
- [ ] `download_ai_engine()` - Download from GitHub with progress
- [ ] Extract to `~/.openscans/inference/`
- [ ] Verify integrity (checksum)

#### 4B.3 UI Integration
- [ ] `AIDownloadDialog.tsx` - Download prompt
- [ ] Progress bar with MB/s speed
- [ ] Pause/resume support
- [ ] Error handling (network failures, disk space)

#### 4B.4 Graceful Degradation
- [ ] Show "AI not available" if not downloaded
- [ ] One-click download from AI button
- [ ] Cache forever after download

**Deliverable**: 50MB installer, AI downloads on first use

**User Experience:**
```
Viewer users:    50MB download (seconds)
AI users:        50MB + 864MB = 914MB (one-time)
Bandwidth save:  850MB for 95% of users
```

---

### Phase 5: Frontend Integration (Week 3-4)
**Goal**: Update OpenScans UI to use real AI detection

#### 5.1 Model Management UI
- [ ] Create `ModelDownloadDialog.tsx`
- [ ] Show available models (vertebrae, total_body, etc.)
- [ ] Display download status (downloaded/not downloaded)
- [ ] Show model sizes and descriptions
- [ ] Download button with progress bar
- [ ] Handle download cancellation

#### 5.2 Detection Integration
- [ ] Update `ViewportToolbar` AI button
- [ ] Check model availability before detection
- [ ] Prompt user to download if missing
- [ ] Show detection progress
- [ ] Display results (annotations)
- [ ] Handle errors gracefully

#### 5.3 Settings Panel
- [ ] Add "AI Models" section
- [ ] List downloaded models with sizes
- [ ] Delete model option
- [ ] Change cache directory option
- [ ] GPU toggle (if CUDA available)

**Deliverable**: Full UI integration with real AI

---

### Phase 6: Testing & Optimization (Week 4)
**Goal**: Performance tuning and bug fixes

#### 6.1 Performance Testing
- [ ] Measure inference time on real X-rays
- [ ] Profile memory usage
- [ ] Test with large CT volumes
- [ ] Optimize model loading
- [ ] Test GPU acceleration (if available)

#### 6.2 Cross-Platform Testing
- [ ] Test on Windows 10/11
- [ ] Test on macOS (Intel + Apple Silicon)
- [ ] Test on Linux (Ubuntu)
- [ ] Fix platform-specific issues

#### 6.3 Error Scenarios
- [ ] No internet during model download
- [ ] Insufficient disk space
- [ ] Corrupted model files
- [ ] Incompatible DICOM files
- [ ] Server crashes

**Deliverable**: Stable, performant desktop app

---

### Phase 7: Production Polish (Week 5)
**Goal**: Installers and documentation

- [ ] Create installers (Windows MSI, macOS DMG, Linux AppImage)
- [ ] Code signing (Windows, macOS)
- [ ] Auto-update mechanism
- [ ] User documentation
- [ ] Developer documentation
- [ ] Release notes

**Deliverable**: Production-ready installers

---

## Bundle Size Breakdown

### Initial Bundle (~350MB)
```
OpenScans.app/
├── Tauri app (50MB)
├── Frontend assets (10MB)
└── Python sidecar (290MB)
    ├── Python runtime (50MB)
    ├── PyTorch CPU (200MB)
    ├── TotalSegmentator (10MB)
    └── Dependencies (30MB)
```

### After Model Download (~3-5GB total)
```
~/.openscans/models/
├── totalsegmentator/
│   ├── vertebrae.pkl (2GB)
│   ├── total_body.pkl (5GB)
│   └── vertebrae_mr.pkl (1.5GB)
└── cache/
```

---

## User Experience Flow

### First-Time User

1. **Download OpenScans** (~350MB)
2. **Install and Open**
3. **Load DICOM file**
4. **Click AI Detection (M key)**
   ```
   ┌─────────────────────────────────┐
   │  AI Model Required              │
   │                                 │
   │  Download vertebrae model?      │
   │  Size: 2GB                      │
   │  Time: ~10 minutes              │
   │                                 │
   │  [Download]  [Cancel]           │
   └─────────────────────────────────┘
   ```
5. **Download Progress**
   ```
   ┌─────────────────────────────────┐
   │  Downloading Model...           │
   │  ████████░░░░░░░░░░░░ 45%       │
   │  900 MB / 2000 MB               │
   │  3 minutes remaining            │
   └─────────────────────────────────┘
   ```
6. **Detection Complete**
   - Green circles appear on vertebrae
   - Labels: L1, L2, L3, L4, L5
   - Confidence scores shown

### Returning User

1. **Open OpenScans**
2. **Load DICOM**
3. **Click AI Detection**
4. **Results in 2-5 seconds** (models cached)

---

## Code Structure (Hybrid)

```
OpenScans/
├── src/                          # React frontend (SHARED)
│   ├── components/               # 100% shared between web & desktop
│   │   ├── viewer/               # DICOM viewer (existing)
│   │   ├── annotations/          # Annotations (existing)
│   │   └── ai/                   # AI components
│   │       ├── ModelDownloadDialog.tsx    # NEW (desktop only, hidden on web)
│   │       └── ModelManager.tsx           # NEW (desktop only, hidden on web)
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── mockVertebralDetector.ts      # Used by WEB
│   │   │   ├── tauriVertebralDetector.ts     # NEW - Used by DESKTOP
│   │   │   └── detectorFactory.ts            # NEW - Picks detector based on platform
│   │   └── utils/
│   │       └── platform.ts                   # NEW - Detect web vs desktop
│   │
│   └── stores/                   # 100% shared
│       └── modelStore.ts         # NEW (only active in desktop)
│
├── src-tauri/                    # Tauri backend (DESKTOP ONLY)
│   ├── Cargo.toml
│   ├── tauri.conf.json           # Desktop build config
│   └── src/
│       └── main.rs               # IPC commands (start server, etc.)
│
├── python-backend/               # Python server (DESKTOP ONLY)
│   ├── main.py                   # FastAPI app
│   ├── model_manager.py          # Model downloads
│   ├── inference.py              # TotalSegmentator wrapper
│   ├── requirements.txt
│   └── build.spec                # PyInstaller config
│
├── public/                       # Static assets (SHARED)
├── index.html                    # Entry point (SHARED)
├── vite.config.ts                # Build config (SHARED, minor additions)
├── package.json                  # Scripts for both web & desktop
│
└── .github/
    └── workflows/
        ├── deploy-web.yml        # Deploy to Vercel/Netlify
        └── build-desktop.yml     # Build Windows/Mac/Linux installers
```

### Platform Detection Pattern

```typescript
// src/lib/utils/platform.ts
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

// src/lib/ai/detectorFactory.ts
import { isTauri } from '@/lib/utils/platform'
import { mockDetector } from './mockVertebralDetector'
import { tauriDetector } from './tauriVertebralDetector'

export const getDetector = () => {
  if (isTauri()) {
    return tauriDetector  // Real AI (desktop)
  }
  return mockDetector  // Simulation (web)
}

// src/components/viewer/ViewportToolbar.tsx
import { getDetector } from '@/lib/ai/detectorFactory'

const handleAiDetection = async () => {
  const detector = await getDetector()  // Auto-selects based on platform
  const result = await detector.detectVertebrae(currentInstance)
  // ... rest is identical
}
```

### Conditional UI Components

```typescript
// src/components/ai/ModelDownloadDialog.tsx
import { isTauri } from '@/lib/utils/platform'

export function ModelDownloadDialog() {
  // Only render in desktop app
  if (!isTauri()) return null

  return (
    <div>
      {/* Model management UI */}
    </div>
  )
}
```

---

## Key Technologies

### Desktop
- **Tauri v2** - Desktop framework
- **Rust** - Backend IPC layer
- **React 18 + Vite** - Frontend (existing)

### Python
- **FastAPI** - REST API server
- **TotalSegmentator v2** - AI model
- **PyTorch 2.x (CPU)** - Inference engine
- **PyInstaller** - Executable packaging

### Communication
- **HTTP/REST** - Tauri ↔ Python
- **Server-Sent Events** - Download progress
- **JSON** - Data serialization

---

## Risk Mitigation

### Risk 1: Large Bundle Size
**Mitigation**: On-demand model downloads (implemented)

### Risk 2: Slow Inference
**Mitigation**:
- Use CPU-optimized PyTorch
- Offer GPU option for users with NVIDIA cards
- Show progress indicator during inference

### Risk 3: PyInstaller Startup Delay
**Mitigation**:
- Optimize bundle (exclude unnecessary modules)
- Pre-warm server during app startup
- Show loading indicator

### Risk 4: Model Download Failures
**Mitigation**:
- Retry logic with exponential backoff
- Resume interrupted downloads
- Fallback to mock detector if download fails

### Risk 5: Platform Compatibility
**Mitigation**:
- Test on all platforms early
- Use cross-platform Python libraries
- Provide platform-specific installers

---

## Success Metrics

### Performance
- [ ] Inference time: <5 seconds for X-rays
- [ ] Startup time: <3 seconds
- [ ] Memory usage: <2GB during inference
- [ ] Bundle size: <500MB

### Accuracy
- [ ] Vertebrae detection accuracy: >85%
- [ ] False positive rate: <10%
- [ ] L1-L5 labeling accuracy: >90%

### User Experience
- [ ] Model download success rate: >95%
- [ ] App crash rate: <1%
- [ ] Positive user feedback: >80%

---

## Alternative Pivot Options

If Tauri + Python doesn't work out:

### Option A: ONNX Runtime Web (Smaller Models)
- Convert TotalSegmentator to ONNX
- Use for 2D X-rays only (not 3D CT)
- Bundle with app (~50MB)
- Limited to smaller models

### Option B: Cloud API
- Upload DICOM to cloud service
- Run inference on GPU server
- Privacy concerns, requires internet
- Not HIPAA compliant for OpenScans use case

### Option C: WebGPU + Custom Model
- Train lightweight model for web
- Use WebGPU for acceleration
- Limited accuracy vs TotalSegmentator
- Web-compatible

---

## Resources & References

### Documentation
- [Tauri Documentation](https://v2.tauri.app/)
- [TotalSegmentator GitHub](https://github.com/wasserth/TotalSegmentator)
- [MONAI Documentation](https://docs.nvidia.com/clara/monai/)
- [PyInstaller Manual](https://pyinstaller.org/)

### Example Projects
- [SlicerTotalSegmentator](https://github.com/lassoan/SlicerTotalSegmentator) - 3D Slicer integration
- [Tauri Python Sidecar Example](https://github.com/dieharders/example-tauri-v2-python-server-sidecar)
- [MONAI Auto3DSeg](https://github.com/lassoan/SlicerMONAIAuto3DSeg)

### Research Papers
- [TotalSegmentator Paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC10546353/)
- [Browser Medical Imaging Performance](https://pmc.ncbi.nlm.nih.gov/articles/PMC10099365/)

---

## Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Tauri Migration | Desktop app opens |
| 2 | Python Backend | Inference works locally |
| 3 | Integration | Tauri + Python connected |
| 4 | UI & Testing | Full feature complete |
| 5 | Polish | Production-ready installers |

**Total**: 5 weeks for MVP

---

## Next Steps

1. ✅ Research complete
2. ✅ Plan documented
3. ⏭️ Create feature branch
4. ⏭️ Start Phase 1: Tauri migration

---

**Last Updated**: 2026-01-26
**Status**: Ready to Begin Implementation
