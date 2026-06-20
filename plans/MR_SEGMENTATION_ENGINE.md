# MR-Precision Segmentation Engine — Status & Plan (Phase 3)

Local MR-precision vertebra segmentation (TotalSegmentator-MRI). **Architecture
decision: the app OWNS THE INSTALLATION at runtime (provisions Python + the
engine via `uv`) — it does NOT bundle/package the Python libs.** No PyInstaller,
no per-platform binary release.

Status: **ENABLED** (`MR_SEGMENTATION_AVAILABLE = true`). Engine, app-owned uv
install (fully isolated to the app dir), and install UX (consent + minimizable
progress + Settings) are validated end-to-end in the real desktop app (produces
T11/T12/L1 markers on the fixture). Voxel→DICOM mapping is affine-based (fixed a
row-axis flip) and **validated on a real sagittal lumbar-spine MR** (T8→L5 in
correct anatomical order). Markers are centred on the vertebral **body** via an
affine-derived anterior bias (the licensed `vertebrae_body` task is avoided).

## ✅ Validated locally (macOS arm64, Python 3.13)

- Engine deps install (torch 2.12, totalsegmentator 2.14, nnU-Net, pydicom). TS
  uses **`dicom2nifti` (pure Python)** for DICOM input — no native `dcm2niix`
  needed.
- `run.py` runs **end to end** on a real MR volume (TS `example_mr_sm`) and emits
  the landmark JSON contract (T11/T12/L1 → DICOM instance + pixel position).
- **`uv`** provisions everything: `uv python install` pulls a standalone CPython
  in ~3s (covers a host with NO Python), `uv venv` + `uv pip install` build the
  env. This is the app's install mechanism.

### Bugs fixed during validation (commit on feat/local-ai)
- Task `total_mr` → **`vertebrae_mr`**: `total_mr` emits one merged `vertebrae`
  label (no per-vertebra split); `vertebrae_mr` segments individual vertebrae and
  is a single ~1-min CPU model (total_mr's 4 models OOM'd on CPU).
- `ml=True` writes ONE multi-label **file** at `<output>.nii`, not a directory —
  `run.py` was globbing an empty dir.

## The install flow (app-owned, no bundling)

On first MR use, the app (Rust, `src-tauri/src/mr_seg.rs`) does, all under the
app data dir (`<app_data>/mr-engine/`):
1. **Ensure `uv`** — download the single static `uv` binary for the platform if
   absent (small; this is "installation", not "bundling python libs").
2. **Ensure Python** — `uv python install <pinned>` (standalone build; works when
   the host has none).
3. **Ensure env** — `uv venv .venv` + `uv pip install -r requirements.txt`
   (cached after first time). `run.py` + `requirements.txt` ship as Tauri
   **resources** (tiny text files — the app's own code, not third-party libs).
4. **Run** — `.venv/bin/python run.py --series <dir> --out <json>` with
   `TOTALSEG_HOME_DIR=<app_data>/mr-engine/weights`.

### Weights
First-run download (TotalSegmentator fetches `vertebrae_mr` weights ~230 MB into
`TOTALSEG_HOME_DIR`). One-time network use on first MR run; surface it in the UI.
(No need to ship weights.)

## Remaining work
1. **`mr_seg.rs` rewrite** — replace the binary download/run with the uv
   provisioning above (ensure uv → python → venv → pip install → run). Progress
   events for the (one-time) env + weights setup. **TASK #5.**
2. **Ship `run.py` + `requirements.txt` as resources** (tauri.conf `resources`),
   resolved at runtime.
3. **Flip `MR_SEGMENTATION_AVAILABLE = true`** + verify in-app via the e2e
   harness. **TASK #6.**
4. **Accuracy validation** — the voxel→DICOM axis mapping is still unvalidated on
   real clinical MR DICOM (the synthetic NIfTI→DICOM converter can't verify
   orientation; T11/T12/L1 instance ordering looked inverted, which may be the
   converter, not run.py). Validate on a real spine MR series before clinical use.
   Confidence is a fixed placeholder.

## Not doing (superseded)
- ~~PyInstaller per-platform binaries + `mr-engine` GitHub release~~ — replaced by
  app-owned uv install. Remove `mr_segmentation.spec`; the engine_url/download
  path in `mr_seg.rs` goes away.
