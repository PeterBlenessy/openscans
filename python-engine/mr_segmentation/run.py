#!/usr/bin/env python3
"""MR segmentation engine for OpenScans (Phase 3).

Runs TotalSegmentator-MRI over a DICOM **series** and emits the landmark JSON
contract consumed by the app (`src/lib/ai/mrSegmentation.ts`). It resolves each
target structure's 3D centroid back to a specific DICOM instance + pixel
coordinate so the frontend only has to drop markers.

Usage:
    run.py --series <dicom_dir> --out <result.json> [--task total_mr]

Contract (stdout is logs; the JSON is written to --out):
    {
      "engine": "totalsegmentator-mri",
      "version": "<totalsegmentator version>",
      "structures": [
        {"label": "L1", "sopInstanceUID": "...", "instanceNumber": 12,
         "position": {"x": 120, "y": 240}, "confidence": 0.9}
      ]
    }

This runs fully locally (no network at inference time once weights are present),
consistent with the privacy-first design. It is packaged as a standalone binary
via PyInstaller (see mr_segmentation.spec) and downloaded on demand by the app;
nothing here is bundled in the installer.

NOTE: the voxel -> DICOM (instance, x, y) mapping assumes the segmentation is
produced in the input series' geometry. Validate the axis conventions and any
resampling against real data before clinical-style use — flagged in
plans/LOCAL_AI_PROVIDER.md.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pydicom


# Labels we surface as markers. TotalSegmentator-MRI names vertebrae like
# "vertebrae_L1"; we expose the short anatomical label.
VERTEBRA_LABELS = (
    [f"vertebrae_C{i}" for i in range(1, 8)]
    + [f"vertebrae_T{i}" for i in range(1, 13)]
    + [f"vertebrae_L{i}" for i in range(1, 6)]
    + ["vertebrae_S1"]
)


def short_label(seg_label: str) -> str:
    """'vertebrae_L1' -> 'L1' (fall back to the raw label)."""
    return seg_label.split("_", 1)[1] if seg_label.startswith("vertebrae_") else seg_label


def load_series(series_dir: Path, series_uid: str | None):
    """Load + sort a DICOM series, returning (datasets, file_paths) ordered
    along the volume axis.

    `series_dir` may be a study folder containing multiple series; when
    `series_uid` is given, only instances of that series are kept. The k (slice)
    index used to map segmentation voxels back to slices is defined by this sort.
    """
    items = []  # (dataset, path)
    for path in series_dir.iterdir():
        if not path.is_file():
            continue
        try:
            ds = pydicom.dcmread(str(path))
        except Exception:
            continue  # skip non-DICOM / unreadable files
        if "PixelData" not in ds:
            continue
        if series_uid and str(getattr(ds, "SeriesInstanceUID", "")) != series_uid:
            continue
        items.append((ds, path))

    if not items:
        where = f"series {series_uid} in " if series_uid else ""
        raise SystemExit(f"No DICOM image instances found for {where}{series_dir}")

    def sort_key(item):
        ds = item[0]
        # Prefer ImagePositionPatient projected on the slice normal; fall back to
        # InstanceNumber. Most MR series sort cleanly by InstanceNumber.
        ipp = getattr(ds, "ImagePositionPatient", None)
        if ipp is not None:
            return float(ipp[2])
        return float(getattr(ds, "InstanceNumber", 0))

    items.sort(key=sort_key)
    datasets = [ds for ds, _ in items]
    paths = [p for _, p in items]
    return datasets, paths


def stage_series(paths, work_dir: Path) -> Path:
    """Copy the selected series' files into an isolated input dir so
    TotalSegmentator reads exactly one series (not the whole study folder)."""
    import shutil

    input_dir = work_dir / "input"
    input_dir.mkdir(parents=True, exist_ok=True)
    for i, p in enumerate(paths):
        shutil.copy2(str(p), str(input_dir / f"{i:05d}.dcm"))
    return input_dir


def run_totalsegmentator(series_dir: Path, work_dir: Path, task: str, out_name: str = "seg"):
    """Run TotalSegmentator-MRI; return (seg_img, label_names, version).

    `seg_img` is the nibabel image (multi-label volume) with its affine, so
    voxel centroids can be mapped to patient space — we deliberately do NOT
    assume the NIfTI axes match the DICOM slice/row/col order (dicom2nifti
    reorients to a canonical frame). `label_names` maps integer id -> name.
    """
    from totalsegmentator.python_api import totalsegmentator
    import totalsegmentator as ts_pkg
    import nibabel as nib

    out_dir = work_dir / out_name
    out_dir.mkdir(parents=True, exist_ok=True)

    # With ml=True TotalSegmentator writes a SINGLE multi-label volume and treats
    # the output path as a FILE (it appends .nii), not a directory. Pass a file
    # path and keep input geometry so voxel indices line up with the sorted DICOM
    # slices.
    seg_path = out_dir / "segmentation.nii"
    totalsegmentator(
        str(series_dir),
        str(seg_path),
        task=task,
        ml=True,
    )

    # Be defensive about the exact name/extension TS chooses (.nii vs .nii.gz).
    candidates = [seg_path, *out_dir.glob("*.nii*"), *work_dir.glob(f"{out_name}*.nii*")]
    seg_file = next((p for p in candidates if p.exists()), None)
    if seg_file is None:
        raise SystemExit("TotalSegmentator produced no segmentation output")
    seg = nib.load(str(seg_file))

    # Map label ids -> names via the bundled class map for the task.
    try:
        from totalsegmentator.map_to_binary import class_map

        label_names = class_map[task]
    except Exception:
        label_names = {}

    version = getattr(ts_pkg, "__version__", "unknown")
    return seg, label_names, version


# nibabel affines are RAS+; DICOM patient space is LPS. Negate the first two axes.
_RAS_TO_LPS = np.array([-1.0, -1.0, 1.0])


def _slice_geometry(ds):
    """Per-slice DICOM geometry in patient space (LPS, mm), or None if the slice
    lacks the spatial tags. Returns (ipp, e_col, e_row, normal, col_sp, row_sp)
    where e_col/e_row are the directions of increasing column/row index."""
    iop = getattr(ds, "ImageOrientationPatient", None)
    ipp = getattr(ds, "ImagePositionPatient", None)
    ps = getattr(ds, "PixelSpacing", None)
    if iop is None or ipp is None or ps is None:
        return None
    iop = np.asarray(iop, dtype=float)
    e_col = iop[0:3]  # direction of increasing column index (along a row)
    e_row = iop[3:6]  # direction of increasing row index (down columns)
    normal = np.cross(e_col, e_row)
    return (
        np.asarray(ipp, dtype=float),
        e_col,
        e_row,
        normal,
        float(ps[1]),  # column spacing (along e_col)
        float(ps[0]),  # row spacing (along e_row)
    )


def _world_to_pixel(world_lps, geoms):
    """Map a patient-space point (LPS, mm) to the nearest slice + pixel.

    `geoms` is a list of (slice_index, geometry). Returns (slice_index, col, row)
    or None. Slices are parallel, so the nearest one is found by projecting onto
    the shared slice normal.
    """
    if not geoms:
        return None
    normal = geoms[0][1][3]
    t_p = float(np.dot(world_lps, normal))
    idx, (ipp, e_col, e_row, _n, col_sp, row_sp) = min(
        geoms, key=lambda g: abs(float(np.dot(g[1][0], normal)) - t_p)
    )
    d = world_lps - ipp
    col = float(np.dot(d, e_col)) / col_sp if col_sp else 0.0
    row = float(np.dot(d, e_row)) / row_sp if row_sp else 0.0
    return idx, int(round(col)), int(round(row))


def landmark_from_mask(mask, affine, slices, geoms, anterior_bias=False):
    """Resolve a boolean voxel mask's centroid to a DICOM (instance, x, y).

    Uses the segmentation's affine to map the centroid to patient space, then
    each slice's DICOM geometry to find the slice + pixel — orientation-agnostic,
    so it does NOT assume the NIfTI axes match the DICOM slice/row/col order
    (they don't; dicom2nifti reorients). Returns a landmark dict or None.

    With `anterior_bias`, the centroid is computed over the anterior ~half of the
    mask so a whole-vertebra label (body + posterior arch) lands on the body.
    "Anterior" is derived from the affine (RAS +Y), so it's orientation-correct.
    """
    if not mask.any():
        return None
    ii, jj, kk = np.nonzero(mask)
    if anterior_bias and ii.size:
        coords = np.vstack([ii, jj, kk, np.ones(ii.size)]).astype(float)
        ras_y = (affine @ coords)[1]  # RAS +Y = anterior; larger = more anterior
        sel = ras_y >= np.median(ras_y)  # keep the anterior half (the body)
        if sel.any():
            ii, jj, kk = ii[sel], jj[sel], kk[sel]
    centroid = np.array([ii.mean(), jj.mean(), kk.mean(), 1.0])
    world_lps = (affine @ centroid)[:3] * _RAS_TO_LPS
    hit = _world_to_pixel(world_lps, geoms)
    if hit is None:
        return None
    idx, col, row = hit
    ds = slices[idx]
    return {
        "sopInstanceUID": str(getattr(ds, "SOPInstanceUID", "")),
        "instanceNumber": int(getattr(ds, "InstanceNumber", idx + 1)),
        "position": {"x": col, "y": row},
    }


def segment(series_dir: Path, work_dir: Path, task: str, series_uid: str | None) -> dict:
    slices, paths = load_series(series_dir, series_uid)
    input_dir = stage_series(paths, work_dir)
    seg, label_names, version = run_totalsegmentator(input_dir, work_dir, task, out_name="seg")
    vol = np.asanyarray(seg.dataobj)

    # Per-slice geometry for mapping voxel centroids back to DICOM space.
    geoms = [
        (i, g)
        for i, ds in enumerate(slices)
        if (g := _slice_geometry(ds)) is not None
    ]

    # Invert name->id, restricted to the vertebra labels we surface.
    name_to_id = {name: lid for lid, name in label_names.items()}

    structures = []
    for seg_label in VERTEBRA_LABELS:
        label_id = name_to_id.get(seg_label)
        if label_id is None:
            continue
        mask = vol == label_id
        # `vertebrae_mr` labels the WHOLE vertebra (body + posterior arch), so its
        # raw centroid sits behind the body. Bias toward the vertebral body, which
        # is the ANTERIOR portion (the dedicated `vertebrae_body` task would be
        # cleaner but requires a TotalSegmentator license).
        landmark = landmark_from_mask(mask, seg.affine, slices, geoms, anterior_bias=True)
        if landmark is None or not landmark["sopInstanceUID"]:
            continue
        landmark["label"] = short_label(seg_label)
        # TotalSegmentator does not expose a per-structure probability here;
        # report a fixed high confidence for a present, well-formed centroid.
        landmark["confidence"] = 0.95
        structures.append(landmark)

    return {
        "engine": "totalsegmentator-mri",
        "version": version,
        "structures": structures,
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="OpenScans MR segmentation engine")
    parser.add_argument("--series", required=True, help="DICOM series or study directory")
    parser.add_argument("--out", required=True, help="output JSON path")
    # `vertebrae_mr` segments INDIVIDUAL vertebrae (vertebrae_L1, …); the broader
    # `total_mr` task only emits a single merged `vertebrae` label, so it can't
    # produce per-vertebra markers. Validated locally on example_mr_sm. It's also
    # a single model (~1 min CPU) vs total_mr's 4 (which OOM'd on CPU here).
    parser.add_argument("--task", default="vertebrae_mr", help="TotalSegmentator task")
    parser.add_argument(
        "--series-uid",
        default=None,
        help="restrict to this SeriesInstanceUID when --series is a study folder",
    )
    parser.add_argument("--work-dir", default=None, help="scratch dir (default: temp)")
    args = parser.parse_args(argv)

    series_dir = Path(args.series)
    if not series_dir.is_dir():
        print(f"error: series dir not found: {series_dir}", file=sys.stderr)
        return 2

    import tempfile

    work_dir = Path(args.work_dir) if args.work_dir else Path(tempfile.mkdtemp(prefix="mrseg-"))
    try:
        result = segment(series_dir, work_dir, args.task, args.series_uid)
    except SystemExit as e:
        print(f"error: {e}", file=sys.stderr)
        return 1

    Path(args.out).write_text(json.dumps(result, indent=2))
    print(f"Wrote {len(result['structures'])} structures to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
