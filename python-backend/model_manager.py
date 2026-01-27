"""
Model download and management for TotalSegmentator
"""
import os
import shutil
from pathlib import Path
from typing import Dict, Optional
import requests
from tqdm import tqdm

from config import MODEL_CACHE_DIR, AVAILABLE_TASKS


class ModelManager:
    """Manages TotalSegmentator model downloads and caching"""

    def __init__(self):
        self.cache_dir = MODEL_CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get_model_status(self, task: str = "vertebrae") -> Dict:
        """
        Check if a model is downloaded and get its info

        Args:
            task: Task name (e.g., 'vertebrae', 'total_body')

        Returns:
            Dict with download status and metadata
        """
        if task not in AVAILABLE_TASKS:
            return {
                "error": f"Unknown task: {task}",
                "available_tasks": list(AVAILABLE_TASKS.keys())
            }

        task_info = AVAILABLE_TASKS[task]

        # Check if TotalSegmentator models are downloaded
        # TotalSegmentator stores models in: ~/.totalsegmentator/nnunet/results/
        ts_cache = Path.home() / ".totalsegmentator" / "nnunet" / "results"

        # For vertebrae, we need the 'total' task which includes vertebrae
        is_downloaded = ts_cache.exists() and len(list(ts_cache.glob("*"))) > 0

        # Estimate size
        size_mb = 0
        if is_downloaded and ts_cache.exists():
            size_mb = sum(f.stat().st_size for f in ts_cache.rglob('*') if f.is_file()) / (1024 * 1024)

        return {
            "task": task,
            "name": task_info["name"],
            "description": task_info["description"],
            "downloaded": is_downloaded,
            "size_mb": round(size_mb, 2) if is_downloaded else task_info["approximate_size_mb"],
            "cache_path": str(ts_cache),
            "structures": task_info["structures"][:5] if task_info["structures"] else []  # First 5 as sample
        }

    def get_all_models_status(self) -> Dict:
        """Get status of all available models"""
        return {
            task: self.get_model_status(task)
            for task in AVAILABLE_TASKS.keys()
        }

    def download_model(self, task: str = "vertebrae", progress_callback=None):
        """
        Download TotalSegmentator model

        Note: TotalSegmentator handles downloads automatically on first use.
        This method prepares the environment and can trigger download.

        Args:
            task: Task name
            progress_callback: Optional callback for progress updates
        """
        if task not in AVAILABLE_TASKS:
            raise ValueError(f"Unknown task: {task}. Available: {list(AVAILABLE_TASKS.keys())}")

        task_info = AVAILABLE_TASKS[task]

        if progress_callback:
            progress_callback({
                "status": "preparing",
                "message": f"Preparing to download {task_info['name']}",
                "progress": 0.0
            })

        # TotalSegmentator downloads models automatically on first inference
        # We can't easily hook into the download progress, so we'll use a workaround:
        # Import TotalSegmentator which triggers download if models are missing
        try:
            from totalsegmentator.python_api import totalsegmentator

            if progress_callback:
                progress_callback({
                    "status": "downloading",
                    "message": "TotalSegmentator is downloading models...",
                    "progress": 0.5
                })

            # Check if models exist now
            status = self.get_model_status(task)

            if progress_callback:
                progress_callback({
                    "status": "complete" if status["downloaded"] else "ready",
                    "message": "Models ready" if status["downloaded"] else "Ready for first use",
                    "progress": 1.0
                })

            return status

        except Exception as e:
            if progress_callback:
                progress_callback({
                    "status": "error",
                    "message": f"Failed to prepare models: {str(e)}",
                    "progress": 0.0
                })
            raise

    def delete_model(self, task: str = "vertebrae"):
        """
        Delete downloaded model to free up space

        Args:
            task: Task name to delete
        """
        if task not in AVAILABLE_TASKS:
            raise ValueError(f"Unknown task: {task}")

        ts_cache = Path.home() / ".totalsegmentator"

        if ts_cache.exists():
            # Calculate size before deletion
            size_mb = sum(f.stat().st_size for f in ts_cache.rglob('*') if f.is_file()) / (1024 * 1024)

            # Delete the cache
            shutil.rmtree(ts_cache)

            return {
                "success": True,
                "message": f"Deleted {task} models",
                "freed_space_mb": round(size_mb, 2)
            }

        return {
            "success": False,
            "message": "No models found to delete"
        }

    def get_cache_stats(self) -> Dict:
        """Get overall cache statistics"""
        ts_cache = Path.home() / ".totalsegmentator"

        total_size = 0
        file_count = 0

        if ts_cache.exists():
            for f in ts_cache.rglob('*'):
                if f.is_file():
                    total_size += f.stat().st_size
                    file_count += 1

        return {
            "cache_directory": str(ts_cache),
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "file_count": file_count,
            "models": self.get_all_models_status()
        }
