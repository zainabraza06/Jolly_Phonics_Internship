@echo off
echo ======================================================
echo     PhonicNest Next.js Web Frontend
echo ======================================================
echo.
echo IMPORTANT: Make sure your backend is running first!
echo Backend should be running on: http://localhost:8000
echo.
cd nextjs_frontend
echo Installing dependencies if needed...
call npm.cmd install
echo.
echo Starting Next.js development server on http://localhost:3000
echo.
npm.cmd run dev
pause
