# Phase 4A Verification Checklist

## 🎯 Tauri Sidecar Integration (Bundled - Testing Phase)

**Goal**: Bundle Python executable with Tauri app for testing architecture
**Note**: Phase 4B will convert to on-demand downloads for production

---

## ✅ Prerequisites

- [x] Phase 1: Tauri desktop support
- [x] Phase 2: Python backend with FastAPI
- [x] Phase 3: PyInstaller executable (864MB)

---

## 📋 Phase 4A Tasks

### 4A.1 Sidecar Setup ✅ COMPLETE
- [x] Copy Python executable to `src-tauri/binaries/`
- [x] Configure `tauri.conf.json` sidecar settings
- [x] Set up binary paths and permissions
- [x] Test executable detection
- [x] Fix `_internal` directory structure for PyInstaller

### 4A.2 Rust IPC Commands ✅ COMPLETE
- [x] `start_ai_server()` - Launch Python sidecar
- [x] `stop_ai_server()` - Graceful shutdown
- [x] `get_server_status()` - Check if running
- [x] `detect_vertebrae()` - Forward API call
- [x] Error handling for all commands
- [x] Updated to use Tauri v2 API (std::process::Command)

### 4A.3 Frontend Integration
- [ ] Update `tauriVertebralDetector.ts`
- [ ] Handle server startup delays
- [ ] Show loading states
- [ ] Error messages for failures

### 4A.4 Testing ✅ PARTIAL
- [x] Sidecar starts on app launch
- [x] Health check endpoint responds
- [ ] Full vertebrae detection test (requires real DICOM)
- [ ] Server stops on app quit (not yet tested)
- [ ] Handle server crashes gracefully (not yet tested)

---

## 🧪 Manual Verification Steps

### Step 1: Prepare Sidecar Binary

**Copy Python executable:**
```bash
mkdir -p src-tauri/binaries
cp python-backend/dist/openscans-inference/openscans-inference \
   src-tauri/binaries/openscans-inference-aarch64-apple-darwin
```

**Note**: Tauri requires platform-specific naming:
- macOS arm64: `*-aarch64-apple-darwin`
- macOS x64: `*-x86_64-apple-darwin`
- Windows: `*.exe`
- Linux: `*-x86_64-unknown-linux-gnu`

### Step 2: Configure Tauri

**Update `src-tauri/tauri.conf.json`:**
```json
{
  "bundle": {
    "externalBin": [
      "binaries/openscans-inference"
    ]
  }
}
```

### Step 3: Implement Rust Commands

**Test compilation:**
```bash
cd src-tauri
cargo build
```

**Expected**: No errors, sidecar detected

### Step 4: Test Sidecar Lifecycle

**Run in dev mode:**
```bash
pnpm tauri dev
```

**Expected console output:**
```
[INFO] Starting sidecar: openscans-inference
[INFO] Sidecar listening on 127.0.0.1:8000
[INFO] OpenScans AI Backend ready
```

### Step 5: Test API Communication

**From frontend DevTools console:**
```javascript
// Test server status
await window.__TAURI__.invoke('get_server_status')
// Expected: { running: true, port: 8000 }

// Test vertebrae detection
await window.__TAURI__.invoke('detect_vertebrae', {
  filePath: '/path/to/test.dcm'
})
// Expected: { success: true, vertebrae: [...] }
```

### Step 6: Build Final App

**Build desktop app:**
```bash
pnpm tauri build
```

**Expected bundle size:**
- macOS: ~900MB (Tauri + Frontend + Python backend)
- DMG location: `src-tauri/target/release/bundle/dmg/`

### Step 7: Test Installed App

**Install and run:**
```bash
open src-tauri/target/release/bundle/dmg/OpenScans_*.dmg
# Install app
# Open OpenScans.app
# Load DICOM file
# Test AI detection
```

**Expected:**
- ✅ App opens
- ✅ Python server starts automatically
- ✅ AI detection works
- ✅ Server stops when app quits

---

## 📊 Phase 4A Status

- [x] **4A.1** Sidecar configuration ✅
- [x] **4A.2** Rust IPC commands ✅
- [ ] **4A.3** Frontend integration
- [x] **4A.4** Testing (partial - backend working) ✅

### Deliverable
✅ Working Rust backend with Python sidecar
⏳ Frontend integration pending

### Key Implementation Details

**Critical Fix**: PyInstaller directory structure
- PyInstaller expects `_internal/` to be a sibling of the executable
- Initial config had `binaries/_internal/` which failed
- Solution: Place `_internal/` at `src-tauri/_internal/` and reference in `tauri.conf.json`

**API Changes**: Tauri v2 compatibility
- Tauri v2 removed `tauri::api::process` module
- Updated to use standard `std::process::Command`
- Increased startup wait time from 3s to 10s (Python+FastAPI initialization)

---

## ⚠️ Common Issues

### Issue: Sidecar permission denied
**Solution:**
```bash
chmod +x src-tauri/binaries/openscans-inference-*
```

### Issue: Sidecar not found
**Solution:** Check naming matches platform:
- macOS arm64: `openscans-inference-aarch64-apple-darwin`
- No `.exe` extension on Unix

### Issue: Port already in use
**Solution:** Check if server is already running:
```bash
lsof -i :8000
kill <PID>
```

### Issue: Sidecar fails to start
**Solution:** Check logs:
```bash
# macOS logs
tail -f ~/Library/Logs/com.openscans.app/openscans-inference.log
```

---

## 🔜 Next: Phase 4B

After 4A testing complete:
- Refactor to download AI engine on-demand
- Reduce installer from 900MB → 50MB
- 95% of users save 850MB bandwidth

---

## 🎉 Success Criteria

Phase 4A is complete when:
- ✅ Sidecar starts automatically on app launch
- ✅ All Tauri commands work
- ✅ AI detection works in desktop app
- ✅ Server stops gracefully on app quit
- ✅ Built app bundle is ~900MB
- ✅ Ready to refactor for Phase 4B

---

**Last Updated**: 2026-01-27
**Status**: Ready to Start
