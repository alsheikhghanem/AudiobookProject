@echo off
echo ==========================================
echo Cleaning Project Cache...
echo ==========================================

:: Clean the audio cache folder
if exist backend\cache (
    echo Cleaning backend\cache...
    del /q /f /s backend\cache\*
) else (
    echo backend\cache does not exist. Skipping...
)

:: Search for and remove __pycache__ directories from the entire project
echo Removing __pycache__ directories...
FOR /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"

echo ==========================================
echo Cleanup Complete!
echo ==========================================
pause