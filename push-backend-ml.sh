#!/bin/bash

# Push Backend Repository
echo "🚀 Pushing Backend..."
cd backend
git remote add origin https://github.com/Babblu9/insightly-backend.git 2>/dev/null || echo "Remote already exists"
git branch -M main
git push -u origin main

# Push ML Service Repository
echo "🚀 Pushing ML Service..."
cd ../ml_service
git remote add origin https://github.com/Babblu9/insightly-ml-service.git 2>/dev/null || echo "Remote already exists"
git branch -M main
git push -u origin main

echo "✅ Done! Both repositories pushed."
echo ""
echo "📝 Next steps:"
echo "1. Deploy backend and ML service to get their URLs"
echo "2. Update frontend environment variables with those URLs"
echo "3. Then push frontend"

