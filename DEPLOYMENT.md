# Deployment Guide for Voyago Lite

This guide covers deploying your application with a **React frontend** and **FastAPI backend** to production.

## 🎯 Recommended Deployment Strategy

Since your backend uses **SQLite** (which requires persistent file storage), we recommend:

- **Frontend**: Vercel
- **Backend**: Railway, Render, or Fly.io (they support persistent storage)

---

## 📦 Option 1: Frontend on Vercel + Backend on Railway (Recommended)

### Step 1: Deploy Backend to Railway

1. **Create a Railway account**: Go to [railway.app](https://railway.app) and sign up

2. **Install Railway CLI** (optional):
   ```bash
   npm install -g @railway/cli
   ```

3. **Deploy via GitHub** (Easiest method):
   - Push your code to GitHub
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the backend

4. **Configure Railway**:
   - Set the **Root Directory** to `backend`
   - Add environment variables in Railway dashboard:
     ```
     GOOGLE_CLIENT_ID=your_google_client_id
     GOOGLE_CLIENT_SECRET=your_google_client_secret
     ```
   - Railway will automatically use `Procfile` to start the server

5. **Get your backend URL**: Railway will provide a URL like `https://your-app.railway.app`

### Step 2: Deploy Frontend to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Update Frontend API URL**:
   - Find where you define your API base URL in the frontend
   - Update it to your Railway backend URL
   - Example: `const API_URL = 'https://your-app.railway.app'`

3. **Deploy to Vercel**:
   ```bash
   cd frontend
   vercel
   ```
   
   Or deploy via Vercel Dashboard:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Set **Root Directory** to `frontend`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-app.railway.app
     ```
   - Deploy!

4. **Update CORS in Backend**:
   - After deployment, update `main.py` CORS settings:
   ```python
   allow_origins=[
       "http://localhost:5173",
       "https://your-vercel-app.vercel.app"  # Add your Vercel URL
   ]
   ```

---

## 📦 Option 2: Both Frontend + Backend on Vercel (Serverless)

⚠️ **Warning**: SQLite won't persist between serverless function calls. You'll need to switch to a cloud database (PostgreSQL, MongoDB, etc.)

### Deploy Backend as Vercel Serverless Function

1. **Create `api/index.py`** in backend folder:
   ```python
   from main import app
   
   # Vercel serverless handler
   handler = app
   ```

2. **Update `vercel.json`** in backend:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "api/index.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "api/index.py"
       }
     ]
   }
   ```

3. **Deploy**:
   ```bash
   cd backend
   vercel
   ```

### Deploy Frontend

Same as Option 1, Step 2.

---

## 📦 Option 3: Backend on Render

### Deploy to Render

1. Go to [render.com](https://render.com) and sign up

2. Click "New +" → "Web Service"

3. Connect your GitHub repository

4. Configure:
   - **Name**: voyago-backend
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. Add environment variables (same as Railway)

6. Deploy! Render will give you a URL like `https://voyago-backend.onrender.com`

---

## 🔧 Pre-Deployment Checklist

### Backend Updates Needed

1. **Update CORS origins** in `main.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "http://localhost:5173",
           "https://your-frontend-url.vercel.app",  # Add production URL
           "https://your-custom-domain.com"  # If you have one
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Database**: Consider migrating from SQLite to PostgreSQL for production:
   - Railway/Render offer free PostgreSQL databases
   - Update connection string in environment variables

3. **Environment Variables**: Ensure all secrets are in `.env` and not committed to Git

### Frontend Updates Needed

1. **Create environment variable file** `.env.production`:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```

2. **Update API calls** to use environment variable:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
   ```

3. **Build test**:
   ```bash
   npm run build
   npm run preview
   ```

---

## 🚀 Quick Deploy Commands

### Deploy Frontend to Vercel
```bash
cd frontend
vercel --prod
```

### Deploy Backend to Railway (via CLI)
```bash
cd backend
railway login
railway init
railway up
```

---

## 🔍 Troubleshooting

### CORS Errors
- Ensure backend CORS includes your frontend URL
- Check browser console for exact error

### API Not Found (404)
- Verify backend is running: visit `https://your-backend-url/docs`
- Check frontend is using correct API URL

### Database Issues
- SQLite won't work on Vercel serverless
- Use Railway/Render for SQLite support
- Or migrate to PostgreSQL/MongoDB

### Build Failures
- Check build logs in Vercel/Railway dashboard
- Ensure all dependencies are in `package.json` / `requirements.txt`

---

## 📝 Post-Deployment

1. **Test all features**: Login, trip creation, expenses, etc.
2. **Set up custom domain** (optional) in Vercel settings
3. **Monitor logs**: Check Vercel/Railway dashboards for errors
4. **Set up analytics** (optional): Vercel Analytics, Google Analytics

---

## 🎉 Success!

Your app should now be live! Share the Vercel URL with others to test.

**Need help?** Check the platform documentation:
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
