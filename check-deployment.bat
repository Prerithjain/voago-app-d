@echo off
REM Deployment Verification Script for Windows
REM Run this before deploying to catch common issues

echo.
echo 🔍 Voyago Lite - Pre-Deployment Checklist
echo ==========================================
echo.

REM Check if we're in the right directory
if not exist "frontend" (
    echo ❌ Error: frontend directory not found
    exit /b 1
)
if not exist "backend" (
    echo ❌ Error: backend directory not found
    exit /b 1
)

echo ✅ Project structure verified

REM Check frontend dependencies
echo.
echo 📦 Checking frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo ⚠️  Warning: node_modules not found. Run 'npm install' in frontend/
) else (
    echo ✅ Frontend dependencies installed
)

REM Check if .env.production exists
if not exist ".env.production" (
    echo ⚠️  Warning: .env.production not found. Create it from .env.example
) else (
    echo ✅ Production environment file exists
)

REM Try to build frontend
echo.
echo 🏗️  Testing frontend build...
call npm run build >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend builds successfully
) else (
    echo ❌ Frontend build failed. Run 'npm run build' to see errors
)

cd ..

REM Check backend files
echo.
echo 📦 Checking backend files...
cd backend

if not exist "requirements.txt" (
    echo ❌ Error: requirements.txt not found
) else (
    echo ✅ requirements.txt exists
)

if not exist "Procfile" (
    echo ❌ Error: Procfile not found (needed for Railway/Render)
) else (
    echo ✅ Procfile exists
)

if not exist "runtime.txt" (
    echo ⚠️  Warning: runtime.txt not found (recommended for deployment)
) else (
    echo ✅ runtime.txt exists
)

if exist ".env" (
    echo ✅ Backend .env file exists
) else (
    echo ⚠️  Warning: Backend .env file not found
)

cd ..

REM Check Git
echo.
echo 📝 Checking Git status...
if exist ".git" (
    echo ✅ Git repository initialized
) else (
    echo ❌ Git repository not initialized. Run 'git init'
)

REM Final summary
echo.
echo ==========================================
echo 📋 Deployment Checklist Summary
echo ==========================================
echo.
echo Before deploying, make sure:
echo 1. ✓ All dependencies are installed
echo 2. ✓ Frontend builds successfully
echo 3. ✓ .env.production is configured with backend URL
echo 4. ✓ Code is committed to Git
echo 5. ✓ Repository is pushed to GitHub
echo 6. ✓ Environment variables are ready for Railway/Vercel
echo.
echo Ready to deploy? Follow QUICK_DEPLOY.md for step-by-step instructions!
echo.

pause
