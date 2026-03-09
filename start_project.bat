@echo off
echo ==========================================
echo Starting LexiCast...
echo ==========================================

:: Activate the virtual environment
call .venv\Scripts\activate.bat

:: Run the Python server
python run_project.py

pause