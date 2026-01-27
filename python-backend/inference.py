"""
TotalSegmentator inference pipeline for vertebrae detection
"""
import time
import tempfile
from pathlib import Path
from typing import Dict, List, Optional
import numpy as np
import pydicom
import SimpleITK as sitk
from totalsegmentator.python_api import totalsegmentator


class VertebraeDetector:
    """Detects and segments vertebrae in DICOM images using TotalSegmentator"""

    # Vertebrae labels from TotalSegmentator
    VERTEBRAE_LABELS = [
        "vertebrae_C1", "vertebrae_C2", "vertebrae_C3", "vertebrae_C4",
        "vertebrae_C5", "vertebrae_C6", "vertebrae_C7",
        "vertebrae_T1", "vertebrae_T2", "vertebrae_T3", "vertebrae_T4",
        "vertebrae_T5", "vertebrae_T6", "vertebrae_T7", "vertebrae_T8",
        "vertebrae_T9", "vertebrae_T10", "vertebrae_T11", "vertebrae_T12",
        "vertebrae_L1", "vertebrae_L2", "vertebrae_L3", "vertebrae_L4", "vertebrae_L5",
        "vertebrae_S1"
    ]

    def __init__(self, device: str = "cpu", fast_mode: bool = True):
        """
        Initialize detector

        Args:
            device: 'cpu' or 'cuda'
            fast_mode: Use fast mode (lower quality but faster)
        """
        self.device = device
        self.fast_mode = fast_mode

    def load_dicom(self, file_path: str) -> sitk.Image:
        """
        Load DICOM file and convert to SimpleITK image

        Args:
            file_path: Path to DICOM file

        Returns:
            SimpleITK image
        """
        try:
            # Read DICOM using pydicom first to validate
            dcm = pydicom.dcmread(file_path)

            # Convert to SimpleITK image
            image = sitk.ReadImage(file_path)

            return image

        except Exception as e:
            raise ValueError(f"Failed to load DICOM file: {str(e)}")

    def run_inference(self, input_path: str, roi_subset: Optional[List[str]] = None) -> Dict:
        """
        Run TotalSegmentator inference

        Args:
            input_path: Path to DICOM file
            roi_subset: Optional list of specific structures to segment

        Returns:
            Dict with segmentation results
        """
        start_time = time.time()

        try:
            # Load DICOM
            image = self.load_dicom(input_path)

            # Create temporary output directory
            with tempfile.TemporaryDirectory() as output_dir:
                output_path = Path(output_dir)

                # Run TotalSegmentator
                # This automatically downloads models on first use
                segmentation = totalsegmentator(
                    input=input_path,
                    output=output_path,
                    roi_subset=roi_subset or self.VERTEBRAE_LABELS,
                    ml=True,  # Multilabel output
                    nr_thr_resamp=1,
                    nr_thr_saving=1,
                    fast=self.fast_mode,
                    device=self.device,
                    quiet=False
                )

                # Load segmentation results
                results = self._parse_segmentation_results(output_path, image)

                processing_time = (time.time() - start_time) * 1000  # Convert to ms

                return {
                    "success": True,
                    "vertebrae": results,
                    "processing_time_ms": round(processing_time, 2),
                    "device": self.device,
                    "fast_mode": self.fast_mode
                }

        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": round(processing_time, 2)
            }

    def _parse_segmentation_results(self, output_dir: Path, original_image: sitk.Image) -> List[Dict]:
        """
        Parse TotalSegmentator segmentation results and extract vertebrae info

        Args:
            output_dir: Directory containing segmentation masks
            original_image: Original DICOM image for coordinate mapping

        Returns:
            List of detected vertebrae with coordinates
        """
        vertebrae = []

        # Get original image properties
        spacing = original_image.GetSpacing()
        origin = original_image.GetOrigin()

        # Process each vertebrae label
        for label_file in output_dir.glob("*.nii.gz"):
            label_name = label_file.stem.replace(".nii", "")

            # Only process vertebrae
            if not label_name.startswith("vertebrae_"):
                continue

            # Extract vertebra identifier (e.g., "L1", "T12")
            vertebra_id = label_name.replace("vertebrae_", "")

            try:
                # Load segmentation mask
                mask = sitk.ReadImage(str(label_file))
                mask_array = sitk.GetArrayFromImage(mask)

                # Skip if mask is empty
                if not np.any(mask_array):
                    continue

                # Find the center of mass (centroid)
                coords = np.argwhere(mask_array > 0)
                if len(coords) == 0:
                    continue

                centroid = coords.mean(axis=0)

                # Find bounding box
                min_coords = coords.min(axis=0)
                max_coords = coords.max(axis=0)

                # Calculate confidence (percentage of voxels that are labeled)
                total_voxels = mask_array.size
                labeled_voxels = np.sum(mask_array > 0)
                confidence = min(labeled_voxels / 1000, 1.0)  # Normalize

                # Convert from voxel to physical coordinates
                # Note: SimpleITK uses (x, y, z) but numpy uses (z, y, x)
                z, y, x = centroid
                center_physical = (
                    x * spacing[0] + origin[0],
                    y * spacing[1] + origin[1],
                    z * spacing[2] + origin[2]
                )

                # For 2D display, we mainly care about x, y
                # Convert to pixel coordinates for display
                vertebrae.append({
                    "label": vertebra_id,
                    "center": {
                        "x": round(float(x)),
                        "y": round(float(y)),
                        "z": round(float(z))
                    },
                    "center_physical": {
                        "x": round(float(center_physical[0]), 2),
                        "y": round(float(center_physical[1]), 2),
                        "z": round(float(center_physical[2]), 2)
                    },
                    "bounds": {
                        "min": {
                            "x": int(min_coords[2]),
                            "y": int(min_coords[1]),
                            "z": int(min_coords[0])
                        },
                        "max": {
                            "x": int(max_coords[2]),
                            "y": int(max_coords[1]),
                            "z": int(max_coords[0])
                        }
                    },
                    "confidence": round(float(confidence), 3),
                    "voxel_count": int(labeled_voxels)
                })

            except Exception as e:
                print(f"Warning: Failed to process {label_name}: {e}")
                continue

        # Sort vertebrae by label (C1-C7, T1-T12, L1-L5, S1)
        vertebrae.sort(key=lambda v: self._vertebra_sort_key(v["label"]))

        return vertebrae

    @staticmethod
    def _vertebra_sort_key(label: str) -> tuple:
        """
        Create sort key for vertebrae labels

        Args:
            label: Vertebra label (e.g., "L1", "T12")

        Returns:
            Tuple for sorting (section_order, number)
        """
        section_order = {"C": 0, "T": 1, "L": 2, "S": 3}

        section = label[0]  # First character (C, T, L, or S)
        number = int(label[1:])  # Remaining characters as number

        return (section_order.get(section, 999), number)


# Convenience function for quick inference
def detect_vertebrae(
    dicom_path: str,
    device: str = "cpu",
    fast_mode: bool = True,
    vertebrae_only: bool = True
) -> Dict:
    """
    Convenience function to detect vertebrae in a DICOM file

    Args:
        dicom_path: Path to DICOM file
        device: 'cpu' or 'cuda'
        fast_mode: Use fast mode (recommended)
        vertebrae_only: Only detect vertebrae (vs full body segmentation)

    Returns:
        Detection results dict
    """
    detector = VertebraeDetector(device=device, fast_mode=fast_mode)

    roi_subset = detector.VERTEBRAE_LABELS if vertebrae_only else None

    return detector.run_inference(dicom_path, roi_subset=roi_subset)
