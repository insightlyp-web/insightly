# 🚀 Push Backend & ML Service First

## Step 1: Create GitHub Repositories

Create these 2 repositories on GitHub (as **empty** repos):
- `insightly-backend`
- `insightly-ml-service`

## Step 2: Push Backend

```bash
cd backend
git remote add origin https://github.com/YOUR_USERNAME/insightly-backend.git
git branch -M main
git push -u origin main
```

## Step 3: Push ML Service

```bash
cd ../ml_service
git remote add origin https://github.com/YOUR_USERNAME/insightly-ml-service.git
git branch -M main
git push -u origin main
```

## Step 4: After Deployment

Once you deploy backend and ML service and get their URLs:
- Backend URL: `https://your-backend-url.railway.app` (or similar)
- ML Service URL: `https://your-ml-service-url.railway.app` (or similar)

Then update frontend environment variables:
- `NEXT_PUBLIC_API_URL` = Backend URL
- Backend's `ML_SERVICE_URL` = ML Service URL

---

**Replace `YOUR_USERNAME` with your GitHub username!**

