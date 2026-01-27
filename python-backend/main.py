"""
OpenScans Python Backend - FastAPI Server

Provides AI-powered vertebrae detection using TotalSegmentator
"""
import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Optional

import torch
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from config import HOST, PORT, DEBUG, CORS_ORIGINS, MAX_FILE_SIZE_MB
from model_manager import ModelManager
from inference import detect_vertebrae, VertebraeDetector


# Initialize FastAPI app
app = FastAPI(
    title="OpenScans AI Backend",
    description="Medical image analysis using TotalSegmentator",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model manager
model_manager = ModelManager()


# Request/Response models
class DetectVertebraeRequest(BaseModel):
    """Request body for vertebrae detection"""
    file_path: str = Field(..., description="Absolute path to DICOM file")
    fast_mode: bool = Field(True, description="Use fast mode (recommended)")
    device: Optional[str] = Field(None, description="'cpu' or 'cuda' (auto-detect if not specified)")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    message: str
    version: str
    device: str
    cuda_available: bool
    python_version: str


# API Endpoints

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint

    Returns server status and system information
    """
    cuda_available = torch.cuda.is_available()

    return HealthResponse(
        status="healthy",
        message="OpenScans AI Backend is running",
        version="1.0.0",
        device="cuda" if cuda_available else "cpu",
        cuda_available=cuda_available,
        python_version=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    )


@app.get("/api/models/status")
async def get_model_status(task: str = "vertebrae"):
    """
    Check if a specific model is downloaded

    Args:
        task: Model task ('vertebrae' or 'total_body')

    Returns:
        Model status information
    """
    try:
        status = model_manager.get_model_status(task)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/models/all")
async def get_all_models_status():
    """
    Get status of all available models

    Returns:
        Dictionary of all model statuses
    """
    try:
        statuses = model_manager.get_all_models_status()
        return statuses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/models/cache-stats")
async def get_cache_stats():
    """
    Get cache statistics

    Returns:
        Cache size, file count, and model information
    """
    try:
        stats = model_manager.get_cache_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/models/download/{task}")
async def download_model(task: str):
    """
    Trigger model download

    Note: TotalSegmentator downloads models automatically on first use.
    This endpoint prepares the environment.

    Args:
        task: Model task to download ('vertebrae' or 'total_body')

    Returns:
        Server-Sent Events stream with download progress
    """
    async def progress_generator():
        """Generate Server-Sent Events for download progress"""
        progress_queue = []

        def callback(progress_data):
            """Callback for progress updates"""
            progress_queue.append(progress_data)

        try:
            # Start download in background
            yield f"data: {json.dumps({'status': 'starting', 'progress': 0.0})}\n\n"

            # Run download (this is actually just checking/preparing)
            result = model_manager.download_model(task, progress_callback=callback)

            # Send any queued progress updates
            for progress in progress_queue:
                yield f"data: {json.dumps(progress)}\n\n"
                await asyncio.sleep(0.1)

            # Send completion
            yield f"data: {json.dumps({'status': 'complete', 'progress': 1.0, 'result': result})}\n\n"

        except Exception as e:
            error_data = {'status': 'error', 'message': str(e), 'progress': 0.0}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        progress_generator(),
        media_type="text/event-stream"
    )


@app.delete("/api/models/{task}")
async def delete_model(task: str):
    """
    Delete a downloaded model to free up disk space

    Args:
        task: Model task to delete

    Returns:
        Deletion result with freed space information
    """
    try:
        result = model_manager.delete_model(task)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/detect-vertebrae")
async def detect_vertebrae_endpoint(request: DetectVertebraeRequest):
    """
    Detect vertebrae in a DICOM file

    Args:
        request: Detection request with file path and options

    Returns:
        Detected vertebrae with coordinates and confidence scores
    """
    start_time = time.time()

    # Validate file path
    file_path = Path(request.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {request.file_path}")

    if not file_path.is_file():
        raise HTTPException(status_code=400, detail=f"Not a file: {request.file_path}")

    # Check file size
    file_size_mb = file_path.stat().st_size / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {file_size_mb:.1f}MB (max: {MAX_FILE_SIZE_MB}MB)"
        )

    # Auto-detect device if not specified
    device = request.device
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    try:
        # Run inference
        result = detect_vertebrae(
            dicom_path=str(file_path),
            device=device,
            fast_mode=request.fast_mode,
            vertebrae_only=True
        )

        # Add total processing time (including validation)
        total_time = (time.time() - start_time) * 1000
        result["total_time_ms"] = round(total_time, 2)

        return result

    except Exception as e:
        # Log error for debugging
        print(f"Error during inference: {e}", file=sys.stderr)

        raise HTTPException(
            status_code=500,
            detail=f"Inference failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "OpenScans AI Backend",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/api/health",
            "models_status": "/api/models/status?task=vertebrae",
            "all_models": "/api/models/all",
            "cache_stats": "/api/models/cache-stats",
            "download_model": "/api/models/download/{task}",
            "delete_model": "/api/models/{task}",
            "detect_vertebrae": "/api/detect-vertebrae"
        },
        "docs": "/docs"
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    print("=" * 60)
    print("OpenScans AI Backend")
    print("=" * 60)
    print(f"Version: 1.0.0")
    print(f"Host: {HOST}:{PORT}")
    print(f"Debug: {DEBUG}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA Device: {torch.cuda.get_device_name(0)}")
    print(f"Model Cache: {model_manager.cache_dir}")
    print("=" * 60)
    print("\nAPI Documentation: http://{}:{}/docs\n".format(HOST, PORT))


# Main entry point
if __name__ == "__main__":
    # Run server
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,  # Auto-reload in debug mode
        log_level="debug" if DEBUG else "info"
    )
