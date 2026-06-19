# MR Segmentation Engine (Phase 3)

On-demand, fully-local MR-precision segmentation for OpenScans, wrapping
**TotalSegmentator-MRI** (MR, sequence-independent). It is **not bundled** in the
installer — the app downloads the prebuilt engine + weights on first MR use
(see `src-tauri/src/mr_seg.rs`). All inference runs locally; no data leaves the
device.

## Contract

```
run.py --series <dicom_dir> --out <result.json> [--task total_mr]
```

Writes the landmark JSON consumed by `src/lib/ai/mrSegmentation.ts`:

```json
{
  "engine": "totalsegmentator-mri",
  "version": "2.x",
  "structures": [
    { "label": "L1", "sopInstanceUID": "1.2.…", "instanceNumber": 12,
      "position": { "x": 120, "y": 240 }, "confidence": 0.95 }
  ]
}
```

The engine runs segmentation over the whole series and resolves each vertebra
centroid back to a specific DICOM instance + pixel coordinate, so the frontend
only drops markers.

## Develop

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py --series /path/to/series --out /tmp/result.json
```

First run downloads the TotalSegmentator weights to its cache; for a fully
offline engine, pre-fetch the weights and ship them alongside the binary.

## Package (per platform)

```bash
pip install pyinstaller
pyinstaller mr_segmentation.spec     # -> dist/mr-segmentation
```

PyInstaller does not cross-compile — build on each target OS (macOS arm64/x64,
Windows x64, Linux x64) in CI and publish to GitHub releases; the app's
`mr_seg_download` command fetches the matching artifact.

## Known validation gaps (see plans/LOCAL_AI_PROVIDER.md)

- **Voxel → DICOM mapping**: `run.py` assumes the segmentation is produced in the
  input series' geometry (`--ml`, no resampling) and that axes map as
  z→slice, y→row, x→col. Validate axis conventions / any resampling on real MR
  before relying on marker positions.
- **PyInstaller hidden imports / data files** for torch + nnU-Net will likely
  need extending on first build.
- **Confidence** is a fixed placeholder (TotalSegmentator does not expose a
  per-structure probability through this path).
