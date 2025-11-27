# 🚀 Quick Deployment Guide - Voyago Lite

## Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com)
- Railway account (sign up at railway.app) OR Render account (render.com)

---

## 📋 Step-by-Step Deployment

### Part 1: Prepare Your Code

#### 1.1 Update Frontend API Configuration
The configuration files have been created. You just need to update the production URL later.

#### 1.2 Initialize Git Repository (if not already done)
```bash
cd "c:\Users\preri\Downloads\prj\zip pp\zip-deploy"
git init
git add .
git commit -m "Initial commit - ready for deployment"
```

#### 1.3 Push to GitHub
```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

### Part 2: Deploy Backend to Railway

#### 2.1 Sign Up for Railway
1. Go to https://railway.app
2. Click "Login" and sign in with GitHub
3. Authorize Railway to access your repositories

#### 2.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Railway will detect it's a Python app

#### 2.3 Configure Backend
1. Click on your service
2. Go to "Settings"
3. Set **Root Directory** to `backend`
4. Go to "Variables" tab
5. Add these environment variables:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```
6. Click "Deploy"

#### 2.4 Get Your Backend URL
1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Copy the URL (e.g., `https://your-app-production.up.railway.app`)
4. **Save this URL** - you'll need it for the frontend!

#### 2.5 Update Backend CORS
1. Edit `backend/main.py` on GitHub or locally
2. Find the CORS configuration (around line 40)
3. Update it to include your frontend URL:
   ```python
   allow_origins=[
       "http://localhost:5173",
       "https://your-app.vercel.app",  # Add this after frontend deployment
       "*"  # Temporarily allow all for testing, remove later
   ],
   ```
4. Commit and push changes

---

### Part 3: Deploy Frontend to Vercel

#### 3.1 Update Production Environment Variable
1. Edit `frontend/.env.production`
2. Replace the URL with your Railway backend URL:
   ```
   VITE_API_URL=https://your-app-production.up.railway.app
   ```
3. Commit and push this change

#### 3.2 Deploy to Vercel via Dashboard
1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - Key: `VITE_API_URL`
   - Value: `https://your-app-production.up.railway.app`
6. Click "Deploy"

#### 3.3 Get Your Frontend URL
After deployment completes, Vercel will show your URL (e.g., `https://your-app.vercel.app`)

---

### Part 4: Final Configuration

#### 4.1 Update Backend CORS (Again)
1. Edit `backend/main.py`
2. Update CORS to use your actual Vercel URL:
   ```python
   allow_origins=[
       "http://localhost:5173",
       "https://your-app.vercel.app",  # Your actual Vercel URL
   ],
   ```
3. Remove the `"*"` wildcard
4. Commit and push - Railway will auto-deploy

#### 4.2 Test Your Application
1. Visit your Vercel URL
2. Try to sign up / log in
3. Create a trip
4. Add expenses
5. Check all features work

---

## 🎯 Alternative: Deploy Backend to Render

If you prefer Render over Railway:

### Deploy to Render
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: voyago-backend
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Railway)
6. Click "Create Web Service"

Render will give you a URL like `https://voyago-backend.onrender.com`

---

## ⚠️ Important Notes

### Database Persistence
- Railway and Render support SQLite with persistent storage
- Your database will persist between deployments
- Consider backing up your database regularly

### Free Tier Limitations
- **Railway**: $5 free credit per month
- **Render**: Free tier sleeps after 15 minutes of inactivity (first request may be slow)
- **Vercel**: Generous free tier for frontend

### Environment Variables
Never commit `.env` files to Git! They're already in `.gitignore`.

---

## 🐛 Troubleshooting

### "CORS Error" in Browser Console
- Check backend CORS includes your frontend URL
- Verify environment variable is set correctly in Vercel

### "Network Error" or "Failed to Fetch"
- Check backend is running: visit `https://your-backend-url.railway.app/docs`
- Verify `VITE_API_URL` is set correctly in Vercel

### Backend Not Starting
- Check Railway/Render logs for errors
- Ensure `requirements.txt` includes all dependencies
- Verify `Procfile` is correct

### Frontend Build Fails
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Try building locally: `npm run build`

---

## 📞 Need Help?

Check the logs:
- **Vercel**: Dashboard → Your Project → Deployments → Click deployment → View Logs
- **Railway**: Dashboard → Your Service → Deployments → Click deployment → View Logs
- **Render**: Dashboard → Your Service → Logs

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed to Railway/Render
- [ ] Backend URL copied
- [ ] Frontend `.env.production` updated with backend URL
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Backend CORS updated with frontend URL
- [ ] All features tested on production
- [ ] Custom domain configured (optional)

---

## 🎉 You're Live!

Share your app: `https://your-app.vercel.app`

Happy deploying! 🚀
