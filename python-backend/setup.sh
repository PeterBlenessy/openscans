#!/bin/bash
# Setup script for OpenScans Python Backend

set -e  # Exit on error

echo "================================"
echo "OpenScans Python Backend Setup"
echo "================================"
echo

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Found Python $python_version"

# Minimum required version is 3.8
required_version="3.8"
if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)"; then
    echo "Error: Python 3.8 or higher is required"
    exit 1
fi

echo "✓ Python version OK"
echo

# Create virtual environment
echo "Creating virtual environment..."
if [ -d "venv" ]; then
    echo "Virtual environment already exists, skipping..."
else
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi
echo

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip setuptools wheel
echo "✓ pip upgraded"
echo

# Install dependencies
echo "Installing dependencies..."
echo "This may take 5-10 minutes (downloading PyTorch, etc.)"
echo

pip install -r requirements.txt

echo
echo "✓ Dependencies installed"
echo

# Verify installation
echo "Verifying installation..."
python -c "import fastapi; print('  ✓ FastAPI:', fastapi.__version__)"
python -c "import torch; print('  ✓ PyTorch:', torch.__version__)"
python -c "import totalsegmentator; print('  ✓ TotalSegmentator: OK')"
python -c "import pydicom; print('  ✓ pydicom: OK')"

echo
echo "================================"
echo "Setup Complete!"
echo "================================"
echo
echo "Next steps:"
echo "1. Activate virtual environment:"
echo "   source venv/bin/activate"
echo
echo "2. Start the server:"
echo "   python main.py"
echo
echo "3. Test the API:"
echo "   python test_api.py"
echo
echo "Server will be available at: http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo
