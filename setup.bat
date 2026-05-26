@echo off
REM Dango App - Full Setup Script for Windows

echo.
echo 🚀 Setting up Dango App with Backend...
echo.

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
call npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd server
call npm install
cd ..

echo.
echo ✅ Setup complete!
echo.
echo 🎯 To start developing:
echo.
echo Terminal 1 - Start Backend:
echo   cd server
echo   npm run dev
echo.
echo Terminal 2 - Start Frontend:
echo   npx expo start
echo.
echo 📚 Documentation:
echo   Frontend: README.md
echo   Backend:  server/README.md
echo.
pause
