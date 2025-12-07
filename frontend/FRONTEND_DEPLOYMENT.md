# 🚀 Frontend Deployment Guide

## ✅ Backend URL Updated

The frontend is now configured to use the production backend:
- **Backend URL**: `https://insightly-backend-production.up.railway.app`

## 📝 Environment Variables

The frontend uses these environment variables (set in `.env.local` for local dev, or in your deployment platform):

```env
NEXT_PUBLIC_API_URL=https://insightly-backend-production.up.railway.app
NEXT_PUBLIC_BACKEND_URL=https://insightly-backend-production.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://wekemzpplaowqdxyjgmt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🌐 Deploying to Vercel

### Step 1: Push Frontend to GitHub

```bash
cd frontend
git add .
git commit -m "Update backend URL to production"
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your `insightly-frontend` repository
3. Configure:
   - **Root Directory**: `frontend` (or leave blank if repo is just frontend)
   - **Framework**: Next.js (auto-detected)
4. **Set Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://insightly-backend-production.up.railway.app`
   - `NEXT_PUBLIC_BACKEND_URL` = `https://insightly-backend-production.up.railway.app`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://wekemzpplaowqdxyjgmt.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your Supabase anon key)
5. Deploy!

## 🔄 After Deployment

Once deployed, your frontend will:
- ✅ Connect to production backend at `https://insightly-backend-production.up.railway.app`
- ✅ Use Supabase for authentication
- ✅ Be ready for production use!

## 📝 Local Development

For local development, create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://wekemzpplaowqdxyjgmt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

**Note**: `.env.local` is gitignored, so it won't be committed. The production URL is now in `start.sh` for reference.

