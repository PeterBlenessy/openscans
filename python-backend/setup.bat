@echo off
REM Setup script for OpenScans Python Backend (Windows)

echo ================================
echo OpenScans Python Backend Setup
echo ================================
echo.

REM Check Python version
echo Checking Python version...
python --version
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    exit /b 1
)
echo.

REM Create virtual environment
echo Creating virtual environment...
if exist venv (
    echo Virtual environment already exists, skipping...
) else (
    python -m venv venv
    echo Virtual environment created
)
echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo Virtual environment activated
echo.

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip setuptools wheel
echo pip upgraded
echo.

REM Install dependencies
echo Installing dependencies...
echo This may take 5-10 minutes (downloading PyTorch, etc.)
echo.

pip install -r requirements.txt

echo.
echo Dependencies installed
echo.

REM Verify installation
echo Verifying installation...
python -c "import fastapi; print('  FastAPI: OK')"
python -c "import torch; print('  PyTorch: OK')"
python -c "import totalsegmentator; print('  TotalSegmentator: OK')"
python -c "import pydicom; print('  pydicom: OK')"

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Activate virtual environment:
echo    venv\Scripts\activate.bat
echo.
echo 2. Start the server:
echo    python main.py
echo.
echo 3. Test the API:
echo    python test_api.py
echo.
echo Server will be available at: http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.

pause
