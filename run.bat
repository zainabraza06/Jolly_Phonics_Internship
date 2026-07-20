@echo off
title PhonicNest Launcher
color 0b

echo =======================================================
echo     PhonicNest Starter: Backend and Frontend Setup
echo =======================================================
echo.

:: 1. Check Python
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your system path.
    echo Please download and install Python from: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 2. Check Virtual Environment
echo [2/5] Checking Python virtual environment...
if exist venv goto :venv_exists
echo Virtual environment not found. Creating a new one...
python -m venv venv
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create virtual environment.
    pause
    exit /b 1
)
:venv_exists
echo Virtual environment ready.
goto :venv_done
:venv_done

:: 3. Install Python Dependencies
echo.
echo [3/5] Installing/updating backend libraries...
call venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)
echo Backend dependencies ready.

:: 4. Install Frontend Dependencies
echo.
echo [4/5] Checking frontend dependencies...
if not exist nextjs_frontend (
    echo [ERROR] nextjs_frontend directory not found.
    pause
    exit /b 1
)
cd nextjs_frontend
echo Installing Node modules (this might take a minute)...
call npm.cmd install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend Node modules.
    pause
    exit /b 1
)
cd ..
echo Frontend dependencies ready.

:: 5. Launch Backend and Frontend
echo.
echo [5/5] Launching servers...
echo.
echo Launching FastAPI Backend on http://localhost:8000 ...
start "PhonicNest Backend API" cmd /k "call venv\Scripts\activate && cd backend && python main.py"

echo Launching Next.js Frontend on http://localhost:3000 ...
start "PhonicNest Next.js Frontend" cmd /k "cd nextjs_frontend && npm run dev"

echo.
echo =======================================================
echo     Both servers launched successfully!
echo     Frontend: http://localhost:3000
echo     Backend:  http://localhost:8000
echo =======================================================
echo.
pause
