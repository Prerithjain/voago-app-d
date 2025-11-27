# 🚀 Vercel Frontend Deployment Guide

## Prerequisites
- ✅ Backend deployed to Railway and running
- ✅ Railway backend URL (e.g., `https://voago-app-d-production.up.railway.app`)
- ✅ Mapbox access token (from your `.env` file)
- ✅ Code pushed to GitHub

---

## 📋 Step-by-Step Deployment

### **Step 1: Go to Vercel**
1. Visit [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"** with GitHub
3. Authorize Vercel to access your GitHub repositories

### **Step 2: Create New Project**
1. Click **"Add New..."** → **"Project"**
2. Find and select your repository: **`voago-app-d`**
3. Click **"Import"**

### **Step 3: Configure Project Settings**

#### **Framework Settings:**
- **Framework Preset**: Vite (should auto-detect)
- **Root Directory**: `frontend` ⚠️ **IMPORTANT!**
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

#### **Environment Variables:** ⚠️ **CRITICAL!**

Click **"Environment Variables"** and add these **TWO** variables:

**Variable 1: Backend API URL**
```
Name:  VITE_API_URL
Value: https://voago-app-d-production.up.railway.app
```
☑️ Check: Production, Preview, Development (all three)

**Variable 2: Mapbox Token**
```
Name:  VITE_MAPBOX_TOKEN
Value: [paste your actual Mapbox token from your .env file]
```
☑️ Check: Production, Preview, Development (all three)

### **Step 4: Deploy!**
1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-3 minutes)
3. You'll see a success screen with your deployment URL

### **Step 5: Get Your Frontend URL**
After deployment, Vercel will show you a URL like:
```
https://voago-app-d.vercel.app
```
or
```
https://voago-app-d-[username].vercel.app
```

**Copy this URL!** You'll need it for the next step.

---

## 🔧 Step 6: Update Backend CORS

Now that your frontend is deployed, you need to allow it to access your backend.

### **Edit `backend/main.py`**

Find the CORS configuration (around line 40):

**BEFORE:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**AFTER:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://voago-app-d.vercel.app",  # ⬅️ Add your Vercel URL here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **Commit and Push**
```bash
git add backend/main.py
git commit -m "Add Vercel URL to CORS"
git push origin main
```

Railway will automatically redeploy your backend with the updated CORS settings.

---

## ✅ Testing Your Deployment

### **1. Test Backend**
Visit: `https://voago-app-d-production.up.railway.app/docs`
- You should see the FastAPI documentation

### **2. Test Frontend**
Visit: `https://voago-app-d.vercel.app`
- You should see your application homepage

### **3. Test Full Integration**
1. Try to **Sign Up** for a new account
2. **Log In** with your credentials
3. **Create a Trip**
4. **Add Expenses**
5. Check if the **map displays** correctly (Mapbox)

---

## 🐛 Troubleshooting

### **Build Fails on Vercel**

**Check Build Logs:**
1. Go to Vercel dashboard
2. Click on your project
3. Go to "Deployments"
4. Click on the failed deployment
5. Check the build logs for errors

**Common Issues:**
- Missing dependencies in `package.json`
- Build command errors
- Environment variables not set

**Solution:**
- Make sure all dependencies are in `package.json`
- Verify environment variables are set correctly
- Try building locally: `cd frontend && npm run build`

### **CORS Errors in Browser Console**

**Error:** `Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy`

**Solution:**
1. Check that your Vercel URL is added to `backend/main.py` CORS settings
2. Make sure there are no typos in the URL
3. Verify the backend redeployed after the CORS update
4. Check Railway logs to confirm the new deployment

### **Map Not Displaying**

**Error:** Blank map or "Invalid token" error

**Solution:**
1. Verify `VITE_MAPBOX_TOKEN` is set in Vercel environment variables
2. Check the token is valid at [mapbox.com](https://account.mapbox.com/)
3. Redeploy on Vercel after adding the token

### **API Calls Failing**

**Error:** Network errors or 404s when calling API

**Solution:**
1. Verify `VITE_API_URL` is set correctly in Vercel
2. Check the Railway backend is running
3. Test the backend directly: `https://your-railway-url.up.railway.app/docs`
4. Check browser console for the actual API URL being called

---

## 🎨 Custom Domain (Optional)

### **Add Your Own Domain:**
1. Go to Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow Vercel's DNS configuration instructions
5. Update CORS in backend with your custom domain

---

## 📊 Environment Variables Reference

### **Required Variables:**
| Variable | Value | Where to Get |
|----------|-------|--------------|
| `VITE_API_URL` | `https://voago-app-d-production.up.railway.app` | Railway dashboard → Settings → Networking |
| `VITE_MAPBOX_TOKEN` | `pk.ey...` | Your local `.env` file or [mapbox.com](https://account.mapbox.com/) |

### **How to Update Environment Variables:**
1. Go to Vercel dashboard
2. Click on your project
3. Go to "Settings" → "Environment Variables"
4. Click "Add" or edit existing variables
5. After changing variables, **redeploy** from the "Deployments" tab

---

## 🎉 Success Checklist

- [ ] Vercel project created and configured
- [ ] Root directory set to `frontend`
- [ ] `VITE_API_URL` environment variable added
- [ ] `VITE_MAPBOX_TOKEN` environment variable added
- [ ] Deployment successful
- [ ] Frontend URL obtained
- [ ] Backend CORS updated with Vercel URL
- [ ] Backend redeployed on Railway
- [ ] Signup/Login works
- [ ] Trip creation works
- [ ] Map displays correctly
- [ ] All features tested

---

## 🚀 You're Live!

Once everything is working:
- **Frontend**: `https://voago-app-d.vercel.app`
- **Backend**: `https://voago-app-d-production.up.railway.app`

Share your app with the world! 🌍

---

## 📞 Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Check Railway deployment logs
3. Check browser console for errors
4. Verify all environment variables are set correctly
5. Test backend API directly at `/docs` endpoint

Happy deploying! 🎊
