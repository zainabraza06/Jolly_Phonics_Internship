@echo off
echo Starting Frontend (React Native with Expo)...
echo.
echo IMPORTANT: Make sure your backend is running first!
echo Backend should be running on: http://10.7.42.159:8000
echo.
cd frontend\phonicnest
echo Current directory: %CD%
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting Expo development server...
echo Scan the QR code with Expo Go app on your phone
echo Make sure your phone is on the same WiFi network as this computer
echo.
npx expo start
pause
