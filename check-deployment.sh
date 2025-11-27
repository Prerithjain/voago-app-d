#!/bin/bash

# Deployment Verification Script
# Run this before deploying to catch common issues

echo "🔍 Voyago Lite - Pre-Deployment Checklist"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Check frontend dependencies
echo ""
echo "📦 Checking frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "⚠️  Warning: node_modules not found. Run 'npm install' in frontend/"
else
    echo "✅ Frontend dependencies installed"
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: .env.production not found. Create it from .env.example"
else
    echo "✅ Production environment file exists"
    
    # Check if API URL is configured
    if grep -q "your-backend-url" .env.production; then
        echo "⚠️  Warning: Update VITE_API_URL in .env.production with your actual backend URL"
    else
        echo "✅ Production API URL configured"
    fi
fi

# Try to build frontend
echo ""
echo "🏗️  Testing frontend build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend builds successfully"
else
    echo "❌ Frontend build failed. Run 'npm run build' to see errors"
fi

cd ..

# Check backend dependencies
echo ""
echo "📦 Checking backend dependencies..."
cd backend

if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found"
else
    echo "✅ requirements.txt exists"
fi

if [ ! -f "Procfile" ]; then
    echo "❌ Error: Procfile not found (needed for Railway/Render)"
else
    echo "✅ Procfile exists"
fi

if [ ! -f "runtime.txt" ]; then
    echo "⚠️  Warning: runtime.txt not found (recommended for deployment)"
else
    echo "✅ runtime.txt exists"
fi

# Check for .env file
if [ -f ".env" ]; then
    echo "✅ Backend .env file exists"
    
    # Check if Google OAuth is configured
    if grep -q "GOOGLE_CLIENT_ID=" .env; then
        echo "✅ Google OAuth configured in .env"
    else
        echo "⚠️  Warning: Google OAuth not configured in .env"
    fi
else
    echo "⚠️  Warning: Backend .env file not found"
fi

cd ..

# Check Git status
echo ""
echo "📝 Checking Git status..."
if [ -d ".git" ]; then
    echo "✅ Git repository initialized"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  Warning: You have uncommitted changes. Commit before deploying."
    else
        echo "✅ No uncommitted changes"
    fi
    
    # Check if remote is set
    if git remote -v | grep -q "origin"; then
        echo "✅ Git remote 'origin' configured"
    else
        echo "⚠️  Warning: No Git remote configured. Add your GitHub repository."
    fi
else
    echo "❌ Git repository not initialized. Run 'git init'"
fi

# Final summary
echo ""
echo "=========================================="
echo "📋 Deployment Checklist Summary"
echo "=========================================="
echo ""
echo "Before deploying, make sure:"
echo "1. ✓ All dependencies are installed"
echo "2. ✓ Frontend builds successfully"
echo "3. ✓ .env.production is configured with backend URL"
echo "4. ✓ Code is committed to Git"
echo "5. ✓ Repository is pushed to GitHub"
echo "6. ✓ Environment variables are ready for Railway/Vercel"
echo ""
echo "Ready to deploy? Follow QUICK_DEPLOY.md for step-by-step instructions!"
echo ""
