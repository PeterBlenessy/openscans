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

First run downloads the `vertebrae_mr` model weights into `TOTALSEG_HOME_DIR`
(the app points this at its data dir); later runs are offline.

## Packaging — the app owns the install (no bundling)

This engine is **not** frozen into a binary and **not** published as a release
artifact. The desktop app provisions it at runtime (see
`src-tauri/src/mr_seg.rs`): it downloads `uv`, runs `uv python install` +
`uv venv` + `uv pip install -r requirements.txt` into its data dir, then runs
`run.py` with the managed Python. `run.py` + `requirements.txt` ship as Tauri
**resources** (they are the app's own code, not third-party libs). See
plans/MR_SEGMENTATION_ENGINE.md.

## Voxel → DICOM mapping

`run.py` maps each vertebra's voxel centroid to a DICOM (instance, x, y) using
the segmentation **affine** (voxel→patient, RAS→LPS) and each slice's DICOM
geometry (`ImagePositionPatient` / `ImageOrientationPatient` / `PixelSpacing`).
It does NOT assume the NIfTI axes match the DICOM slice/row/col order —
dicom2nifti reorients to a canonical frame, which previously caused a row-axis
flip. **Validated on a real sagittal lumbar-spine MR** (`t2_space_sag_iso`):
T8→L5 segmented in correct anatomical order, markers on the mid-sagittal slices,
row increasing superior→inferior, X tracking the lordosis curve.

## Known limitations

- **Marker sits at the whole-vertebra centroid** (`vertebrae_mr` segments body +
  posterior arch), so it can fall slightly posterior to the vertebral-body
  centre. Switching to the `vertebrae_body` task would centre it on the body.
- **Confidence** is a fixed placeholder (TotalSegmentator does not expose a
  per-structure probability through this path).
