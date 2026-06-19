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


def run_totalsegmentator(series_dir: Path, work_dir: Path, task: str):
    """Run TotalSegmentator-MRI; return (label_volume, label_names, version).

    `label_volume` is an int array shaped (slices, rows, cols) aligned to the
    sorted input slices; `label_names` maps integer id -> structure name.
    """
    from totalsegmentator.python_api import totalsegmentator
    import totalsegmentator as ts_pkg
    import nibabel as nib

    out_dir = work_dir / "seg"
    out_dir.mkdir(parents=True, exist_ok=True)

    # --ml writes a single multi-label volume; keep input geometry so voxel
    # indices line up with the sorted DICOM slices.
    totalsegmentator(
        str(series_dir),
        str(out_dir),
        task=task,
        ml=True,
    )

    seg_files = list(out_dir.glob("*.nii*"))
    if not seg_files:
        raise SystemExit("TotalSegmentator produced no segmentation output")
    seg = nib.load(str(seg_files[0]))
    # nibabel is (x, y, z); transpose to (z=slice, y=row, x=col).
    volume = np.asanyarray(seg.dataobj).transpose(2, 1, 0)

    # Map label ids -> names via the bundled class map for the task.
    try:
        from totalsegmentator.map_to_binary import class_map

        label_names = class_map[task]
    except Exception:
        label_names = {}

    version = getattr(ts_pkg, "__version__", "unknown")
    return volume, label_names, version


def centroid_to_landmark(volume, label_id, slices):
    """Compute a structure centroid and resolve it to (slice, x, y).

    Returns a dict with sopInstanceUID / instanceNumber / position, or None if
    the label is absent.
    """
    mask = volume == label_id
    if not mask.any():
        return None
    zs, ys, xs = np.nonzero(mask)
    k = int(round(zs.mean()))
    k = max(0, min(k, len(slices) - 1))
    cx = int(round(xs.mean()))
    cy = int(round(ys.mean()))
    ds = slices[k]
    return {
        "sopInstanceUID": str(getattr(ds, "SOPInstanceUID", "")),
        "instanceNumber": int(getattr(ds, "InstanceNumber", k + 1)),
        "position": {"x": cx, "y": cy},
    }


def segment(series_dir: Path, work_dir: Path, task: str, series_uid: str | None) -> dict:
    slices, paths = load_series(series_dir, series_uid)
    input_dir = stage_series(paths, work_dir)
    volume, label_names, version = run_totalsegmentator(input_dir, work_dir, task)

    # Invert name->id, restricted to the vertebra labels we surface.
    name_to_id = {name: lid for lid, name in label_names.items()}

    structures = []
    for seg_label in VERTEBRA_LABELS:
        label_id = name_to_id.get(seg_label)
        if label_id is None:
            continue
        landmark = centroid_to_landmark(volume, label_id, slices)
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
    parser.add_argument("--task", default="total_mr", help="TotalSegmentator task")
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
