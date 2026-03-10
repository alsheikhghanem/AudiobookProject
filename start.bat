@echo off
title LexiCast Starter
echo ==========================================
echo           Starting LexiCast...
echo ==========================================

:: Check if .venv exists, if not, create it
if not exist .venv (
    echo [INFO] Virtual environment not found. Creating one...
    python -m venv .venv
)

:: Activate the virtual environment
call .venv\Scripts\activate.bat

:: Check if uvicorn is installed, if not, install requirements
python -c "import uvicorn" 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Dependencies missing. Installing now...
    pip install -r requirements.txt
)

:: Run the project
echo [SUCCESS] Environment ready. Launching LexiCast...
python runner.py

pause