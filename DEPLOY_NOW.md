# 🚀 Deploy Now - Step by Step

Your code is committed and ready! Follow these steps to deploy:

## ⚡ Quick Deployment (15 minutes)

### Step 1: MongoDB Atlas Setup (2 min)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free account
3. Create a free cluster (M0)
4. Click "Connect" → "Connect your application"
5. Copy connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/...`)
6. Click "Network Access" → "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)

### Step 2: Deploy Backend to Railway (5 min)

1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository: `Heet852003/Eco-Nexus`
5. Select branch: `ui-3`
6. Railway will create a service automatically

**Configure the service:**
1. Click on the service
2. Go to "Settings" tab
3. Set "Root Directory" to: `server`
4. Go to "Variables" tab
5. Click "New Variable" and add these one by one:

```
NODE_ENV = production
PORT = 3001
MONGODB_URI = [paste your MongoDB Atlas connection string]
JWT_SECRET = [run: openssl rand -base64 32 in terminal, copy result]
OPENROUTER_API_KEY = [your OpenRouter API key from https://openrouter.ai/keys]
OPENROUTER_API_URL = https://openrouter.ai/api/v1/chat/completions
LLM_MODEL = meta-llama/llama-3.2-3b-instruct:free
SOLANA_RPC_URL = https://api.devnet.solana.com
CORS_ORIGINS = https://your-app.vercel.app
```

**Get your backend URL:**
1. Go to "Settings" → "Domains"
2. Railway will show a URL like: `https://xxx.railway.app`
3. Copy this URL - you'll need it for frontend

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```
Copy the output to `JWT_SECRET` variable.

### Step 3: Deploy Frontend to Vercel (5 min)

1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Click "Add New..." → "Project"
4. Import your repository: `Heet852003/Eco-Nexus`
5. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (auto)
   - **Output Directory**: `.next` (auto)
6. Click "Environment Variables"
7. Add:
   ```
   NEXT_PUBLIC_API_URL = https://your-railway-url.railway.app
   ```
   (Use the Railway URL from Step 2)
8. Click "Deploy"
9. Wait for build (2-3 minutes)
10. Copy your Vercel URL (e.g., `https://eco-nexus.vercel.app`)

### Step 4: Update CORS (2 min)

1. Go back to Railway dashboard
2. Click on your service → "Variables"
3. Find `CORS_ORIGINS` variable
4. Click "Edit"
5. Update value to your Vercel URL:
   ```
   https://your-vercel-url.vercel.app
   ```
6. Railway will auto-redeploy

### Step 5: Test (1 min)

1. Visit your Vercel URL
2. Try to register a new account
3. Try to login
4. Check browser console (F12) for any errors

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created and connection string copied
- [ ] Railway backend deployed with all environment variables
- [ ] Railway URL copied
- [ ] Vercel frontend deployed with `NEXT_PUBLIC_API_URL`
- [ ] Vercel URL copied
- [ ] CORS_ORIGINS updated in Railway with Vercel URL
- [ ] Test registration works
- [ ] Test login works

---

## 🔗 Your Deployment URLs

After deployment, you'll have:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`

---

## 🆘 Need Help?

**Backend won't start:**
- Check Railway logs (click service → "Deployments" → latest deployment → "View Logs")
- Verify all environment variables are set
- Check MongoDB connection string is correct

**Frontend can't connect:**
- Verify `NEXT_PUBLIC_API_URL` matches your Railway URL exactly
- Check CORS_ORIGINS includes your Vercel URL
- No trailing slashes in URLs

**MongoDB connection fails:**
- Make sure you whitelisted all IPs (0.0.0.0/0)
- Check connection string format
- Verify username/password in connection string

---

## 🎉 You're Done!

Once deployed, share your Vercel URL and the website will be live!

