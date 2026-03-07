@echo off
echo ==========================================
echo Starting AI Text Studio...
echo ==========================================

:: Activate the virtual environment
call .venv\Scripts\activate.bat

:: Run the Python server
python run_project.py

pause