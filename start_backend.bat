@echo off
echo Starting Backend Server...
echo.

cd backend
echo Current directory: %CD%
echo.

echo Activating virtual environment...
call ..\venv\Scripts\activate
echo Virtual environment activated.
echo.

echo Starting FastAPI server on 0.0.0.0:8000
echo Your local IP is: 10.7.42.159
echo Frontend can connect to: http://10.7.42.159:8000
echo.

python main.py
pause
