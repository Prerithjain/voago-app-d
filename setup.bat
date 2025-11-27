@echo off
echo 🚀 Setting up Voyago Lite Enhanced Features...
echo.

REM Navigate to frontend
cd frontend

echo 📦 Installing frontend dependencies...
call npm install

echo.
echo ✅ Frontend dependencies installed!
echo.

REM Navigate to backend
cd ..\backend

echo 📦 Installing backend dependencies...
pip install -r requirements.txt

echo.
echo ✅ Backend dependencies installed!
echo.

echo 🎉 Setup complete!
echo.
echo To run the application:
echo 1. Backend: cd backend ^&^& python main.py
echo 2. Frontend: cd frontend ^&^& npm run dev
echo.
echo 📖 Check ENHANCED_FEATURES.md for detailed documentation
pause
