# 🚂 Railway Deployment Guide for ML Service

## ✅ What's Fixed

- ✅ Dockerfile created with Python 3.11 (compatible with all ML libraries)
- ✅ System dependencies installed (poppler-utils for pdfplumber, build tools)
- ✅ spaCy model download included
- ✅ PORT environment variable support
- ✅ Pushed to GitHub

## 🚀 Railway Deployment Steps

### 1. Configure Railway Service

1. Go to your Railway project → ML Service
2. Go to **Settings** → **Deploy**
3. Set **Deployment Method** to: **Dockerfile**
4. Railway will auto-detect the Dockerfile

### 2. Set Environment Variables

In Railway → **Variables**, add:

```
PORT=8000
```

**Note**: Railway automatically provides `PORT`, but setting it explicitly ensures it works.

### 3. Deploy

Railway will:
- Use Python 3.11 (from Dockerfile)
- Install all system dependencies
- Install Python packages (spacy, pdfplumber, pandas, scikit-learn, numpy)
- Download spaCy model
- Build in ~30-60 seconds
- Deploy successfully! ✅

### 4. Get Your URL

After deployment, Railway will provide a URL like:
```
https://insightly-ml-service.up.railway.app
```

## 📝 Backend Deployment (Reminder)

For the backend service, Railway will auto-detect Node.js. Just:
1. Set **Root Directory** to: `backend`
2. Add environment variables (DATABASE_URL, GROQ_API_KEY, etc.)
3. Deploy!

## 🔗 After Both Are Deployed

1. **Backend URL**: `https://your-backend.up.railway.app`
2. **ML Service URL**: `https://your-ml-service.up.railway.app`

Then:
- Update backend's `ML_SERVICE_URL` environment variable
- Update frontend's `NEXT_PUBLIC_API_URL` environment variable
- Push frontend!

---

**The Dockerfile is now in the repo and ready for Railway!** 🎉

