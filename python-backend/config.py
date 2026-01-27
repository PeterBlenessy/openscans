"""
Configuration for OpenScans Python Backend
"""
import os
from pathlib import Path
from typing import Dict

# Server configuration
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "").lower() in ("1", "true", "yes")

# Model cache directory
MODEL_CACHE_DIR = Path.home() / ".openscans" / "models"
MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# TotalSegmentator tasks
AVAILABLE_TASKS = {
    "vertebrae": {
        "name": "Vertebrae Segmentation",
        "description": "Segments all vertebrae (C1-C7, T1-T12, L1-L5, S1)",
        "task_id": "total",  # TotalSegmentator uses 'total' task for vertebrae
        "approximate_size_mb": 2048,
        "structures": ["vertebrae_C1", "vertebrae_C2", "vertebrae_C3", "vertebrae_C4",
                      "vertebrae_C5", "vertebrae_C6", "vertebrae_C7",
                      "vertebrae_T1", "vertebrae_T2", "vertebrae_T3", "vertebrae_T4",
                      "vertebrae_T5", "vertebrae_T6", "vertebrae_T7", "vertebrae_T8",
                      "vertebrae_T9", "vertebrae_T10", "vertebrae_T11", "vertebrae_T12",
                      "vertebrae_L1", "vertebrae_L2", "vertebrae_L3", "vertebrae_L4", "vertebrae_L5",
                      "vertebrae_S1"]
    },
    "total_body": {
        "name": "Total Body Segmentation",
        "description": "Segments 104 anatomical structures",
        "task_id": "total",
        "approximate_size_mb": 5120,
        "structures": []  # 104 structures total
    }
}

# Inference settings
MAX_IMAGE_SIZE = 512  # Max dimension for processing
DEVICE = "cpu"  # Will auto-detect CUDA if available

# CORS settings
CORS_ORIGINS = [
    "http://localhost:3001",  # Web dev
    "http://localhost:5173",  # Tauri dev
    "tauri://localhost",      # Tauri production
    "https://tauri.localhost" # Tauri production alternative
]

# File upload limits
MAX_FILE_SIZE_MB = 500  # 500MB max DICOM file
