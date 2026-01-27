# OpenScans Python Backend

FastAPI server for AI-powered medical image analysis using TotalSegmentator.

## Requirements

- **Python 3.13** (Python 3.14 not yet supported by dependencies)
- 4GB+ RAM
- 2GB+ disk space for ML models
- Optional: CUDA GPU for faster inference

## Setup

### 1. Create Virtual Environment

**macOS/Linux:**
```bash
cd python-backend
./setup.sh
```

**Windows:**
```cmd
cd python-backend
setup.bat
```

**Manual setup:**
```bash
cd python-backend
python3.13 -m venv venv  # Use Python 3.13 specifically
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Development Server

```bash
python main.py
```

Server will start at `http://localhost:8000`

## API Endpoints

### Health Check
```bash
GET http://localhost:8000/api/health
```

### Check Model Status
```bash
GET http://localhost:8000/api/models/status
```

Response:
```json
{
  "vertebrae": {
    "downloaded": true,
    "size_mb": 2048,
    "path": "~/.openscans/models/totalsegmentator"
  }
}
```

### Download Model
```bash
POST http://localhost:8000/api/models/download/vertebrae
```

Returns Server-Sent Events with progress:
```
data: {"status": "downloading", "progress": 0.45, "downloaded_mb": 900, "total_mb": 2000}
data: {"status": "complete", "progress": 1.0}
```

### Detect Vertebrae
```bash
POST http://localhost:8000/api/detect-vertebrae
Content-Type: application/json

{
  "file_path": "/path/to/dicom/file.dcm"
}
```

Response:
```json
{
  "success": true,
  "vertebrae": [
    {
      "label": "L1",
      "center": {"x": 256, "y": 512, "z": 128},
      "confidence": 0.95,
      "bounds": {
        "min": {"x": 200, "y": 450, "z": 100},
        "max": {"x": 312, "y": 574, "z": 156}
      }
    }
  ],
  "processing_time_ms": 2345
}
```

## Directory Structure

```
python-backend/
├── main.py              # FastAPI app entry point
├── model_manager.py     # Model download and caching
├── inference.py         # TotalSegmentator inference
├── config.py           # Configuration
├── requirements.txt    # Python dependencies
└── README.md           # This file
```

## Development

### Test Endpoints

```bash
# Health check
curl http://localhost:8000/api/health

# Model status
curl http://localhost:8000/api/models/status

# Download model (use SSE client)
curl -N http://localhost:8000/api/models/download/vertebrae

# Detect vertebrae (requires DICOM file)
curl -X POST http://localhost:8000/api/detect-vertebrae \
  -H "Content-Type: application/json" \
  -d '{"file_path": "/path/to/dicom.dcm"}'
```

### Debug Mode

Set environment variable for verbose logging:
```bash
DEBUG=1 python main.py
```

## Model Cache

Models are downloaded to: `~/.openscans/models/`

Structure:
```
~/.openscans/
└── models/
    └── totalsegmentator/
        ├── vertebrae/
        │   ├── Task251_TotalSegmentator_vertebrae_body.pkl
        │   └── ...
        └── total_body/
            └── ...
```

## Notes

- **First run**: TotalSegmentator will download models (~2GB)
- **CPU mode**: Uses PyTorch CPU by default (~5-10 seconds per image)
- **GPU mode**: If CUDA available, automatically uses GPU (~1-2 seconds per image)
- **Memory**: Requires ~4GB RAM for inference

## Troubleshooting

### "Module not found" errors
```bash
pip install -r requirements.txt --force-reinstall
```

### "CUDA not available" (optional)
TotalSegmentator works fine on CPU. For GPU:
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### Model download fails
Check internet connection and disk space (~2GB required).

## Production

See `build.spec` for PyInstaller configuration to create standalone executable.
