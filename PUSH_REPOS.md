# 🚀 Push Separate Repositories

I've created separate git repositories for each service. Now you need to:

1. **Create 3 new repositories on GitHub** (or use existing ones)
2. **Add remotes and push** each service

## Step 1: Create GitHub Repositories

Create these 3 repositories on GitHub:
- `insightly-frontend` (or your preferred name)
- `insightly-backend` (or your preferred name)
- `insightly-ml-service` (or your preferred name)

**Important**: Create them as **empty** repositories (don't initialize with README, .gitignore, or license).

## Step 2: Push Each Service

### Frontend

```bash
cd frontend
git remote add origin https://github.com/YOUR_USERNAME/insightly-frontend.git
git branch -M main
git push -u origin main
```

### Backend

```bash
cd backend
git remote add origin https://github.com/YOUR_USERNAME/insightly-backend.git
git branch -M main
git push -u origin main
```

### ML Service

```bash
cd ml_service
git remote add origin https://github.com/YOUR_USERNAME/insightly-ml-service.git
git branch -M main
git push -u origin main
```

## Quick Script

Replace `YOUR_USERNAME` with your GitHub username and run:

```bash
# Frontend
cd frontend
git remote add origin https://github.com/YOUR_USERNAME/insightly-frontend.git
git branch -M main
git push -u origin main

# Backend
cd ../backend
git remote add origin https://github.com/YOUR_USERNAME/insightly-backend.git
git branch -M main
git push -u origin main

# ML Service
cd ../ml_service
git remote add origin https://github.com/YOUR_USERNAME/insightly-ml-service.git
git branch -M main
git push -u origin main
```

## Alternative: If you already have repos

If the repositories already exist, use:

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main --force  # Use --force only if needed
```

---

**Note**: Make sure to replace `YOUR_USERNAME` with your actual GitHub username and adjust repository names as needed.

