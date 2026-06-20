# MR-Precision Segmentation Engine — Build & Publish Scope (Phase 3)

Scoping for shipping the local MR-precision vertebra segmentation engine. The
**app code is done**; what's missing is building the engine binaries, solving
weights + signing, publishing the release, and validating accuracy.

Status: **gated off** in the UI via `MR_SEGMENTATION_AVAILABLE = false`
(`src/lib/ai/segmentationServer.ts`). Flip to `true` once the `mr-engine`
release exists.

## What already exists

| Piece | Location | State |
|---|---|---|
| Engine (TotalSegmentator-MRI wrapper, landmark JSON contract) | `python-engine/mr_segmentation/run.py` | written, not validated on real MR |
| PyInstaller spec | `python-engine/mr_segmentation/mr_segmentation.spec` | first cut; hiddenimports/datas need extending |
| Deps | `python-engine/mr_segmentation/requirements.txt` | totalsegmentator, pydicom, nibabel, numpy |
| Download (per-triple) + run wiring | `src-tauri/src/mr_seg.rs` | done; URLs point at the (missing) `mr-engine` release |
| Frontend bridge + marker mapping | `src/lib/ai/segmentationServer.ts`, `mrSegmentation.ts` | done, gated |

Download URL shape (already coded): `…/releases/download/mr-engine/mr-segmentation-<target-triple>`.

## The work to ship it

### 1. Per-platform binaries (PyInstaller — no cross-compile)
Build on each target OS in CI: macOS arm64, macOS x64, Linux x64, Windows x64.
- Install Python + `requirements.txt` (totalsegmentator pulls **torch + nnU-Net** — multi-GB).
- Extend the spec's `hiddenimports` / `datas` for torch + nnUNetv2 (flagged in the spec; expect iteration until the frozen binary actually runs).
- Output `mr-segmentation` → rename to `mr-segmentation-<triple>` (`.exe` on Windows).
- **Artifact size**: torch + nnU-Net frozen ≈ 0.5–1.5 GB per platform. Confirm GitHub release asset limits / download UX (progress already wired).

### 2. Model weights (decision required)
TotalSegmentator-MRI downloads weights (~GBs) on first run into `TOTALSEG_HOME_DIR`
(`mr_seg.rs` already points this at the engine dir). Choose:
- **(a) First-run download** — smaller release, but needs network on first MR use (a one-time exception to "no egress"; surface it to the user). Simplest.
- **(b) Ship weights** as a separate `mr-engine` asset the app fetches alongside the binary — fully offline, but multi-GB release + a second download step in `mr_seg_download`.

### 3. macOS signing / quarantine (don't skip)
A **downloaded** binary is quarantined; a signed+hardened app spawning an
unsigned/quarantined child gets Gatekeeper-killed (and arm64 needs ≥ ad-hoc
signing to exec at all). Required:
- Ad-hoc (or Developer ID) sign the binary in CI, and
- have `mr_seg_download` strip the quarantine xattr after download (it wrote the file, so it may).
- Ideally notarize for distribution. (Same class of problem we solved for llama-server, but harder because it's fetched post-install.)

### 4. Publish + CI
- New workflow: matrix build (4 platforms) → sign → upload to a **`mr-engine`** GitHub release (create the tag).
- PyInstaller builds are slow; cache pip + weights where possible.
- Keep `LLAMA_CPP_VERSION`-style version pinning for reproducibility.

### 5. Validation (correctness — clinically important)
From `run.py` / README known gaps:
- **Voxel → DICOM (instance, x, y) mapping**: assumes input-series geometry, axes z→slice/y→row/x→col, no resampling. **Validate on real MR** before trusting marker positions.
- **Confidence** is a fixed placeholder (TotalSegmentator doesn't expose per-structure probability here).

## Rough effort
Large, and mostly **packaging + CI + validation**, not app code: PyInstaller-freezing a torch/nnU-Net app per platform is finicky (hidden imports, 0.5–1.5 GB artifacts), plus the weights decision, plus signing/quarantine, plus accuracy validation. Estimate multi-day, with macOS signing and the axis-mapping validation as the highest-risk items.

## Flip-on checklist
1. `mr-engine` release exists with all four `mr-segmentation-<triple>` assets (signed).
2. Weights strategy implemented (2a or 2b).
3. Validated marker positions on ≥1 real MR series.
4. Set `MR_SEGMENTATION_AVAILABLE = true`.
