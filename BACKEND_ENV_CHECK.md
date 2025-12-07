# 🔧 Backend Environment Variables Check

## ❌ Current Issue: 401 Unauthorized

The `/auth/check-profile` endpoint is returning 401, which means authentication is failing.

## ✅ What I Fixed

1. **CORS Configuration** - Updated to explicitly allow credentials and authorization headers
2. **Pushed to GitHub** - Changes are live

## 🔍 Required Environment Variables on Railway

Make sure these are set in your Railway backend service:

### Required Variables:

```env
SUPABASE_URL=https://wekemzpplaowqdxyjgmt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla2VtenBwbGFvd3FkeHlqZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTc3MDYsImV4cCI6MjA3NzI5MzcwNn0.3LBnE7J7eUJFAKZYwjMAKteQCnTd8k19C8W1YiSUFu0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla2VtenBwbGFvd3FkeHlqZ210Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcxNzcwNiwiZXhwIjoyMDc3MjkzNzA2fQ.O7zW2XF6jwv3gYFLsrPyQyRyzo98AYKSg8zQiq3QswA
DATABASE_URL=postgresql://postgres.wekemzpplaowqdxyjgmt:WZLsZW6nwM2N3ylv@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
GROQ_API_KEY=your_groq_api_key_here
ML_SERVICE_URL=https://your-ml-service-url.railway.app
PORT=3001
NODE_ENV=production
```

## 📝 Steps to Fix on Railway

1. Go to Railway → Your Backend Service → **Variables**
2. Check if `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set correctly
3. If missing or incorrect, add/update them
4. **Redeploy** the service (Railway should auto-redeploy, but you can manually trigger it)

## 🔍 How to Verify

After updating environment variables and redeploying:

1. Try logging in again
2. Check Railway logs for any errors
3. The `/auth/check-profile` endpoint should now work

## 🐛 Debugging

If still getting 401:

1. **Check Railway Logs**: Look for "Missing Authorization header" or "Invalid or expired token"
2. **Check Frontend Console**: Verify the token is being sent in the request
3. **Verify Supabase**: Make sure the Supabase project is active and the keys are correct

---

**The CORS fix is deployed. Now make sure the environment variables are set correctly on Railway!**

