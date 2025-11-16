# 🚀 Final Deployment Steps - With Your Tokens

I have all your tokens! Here's exactly what to do:

## ⚡ Deploy in 5 Minutes

### Step 1: Railway Backend (2 minutes)

1. **Go to**: https://railway.app
2. **Login** with GitHub
3. **Click**: "New Project" → "Deploy from GitHub repo"
4. **Select**: Repository `Heet852003/Eco-Nexus`, Branch `ui-3`
5. **Click** on the service → **Settings** → Set **Root Directory**: `server`
6. **Go to Variables tab** → Click "New Variable" → Add these one by one:

```
NODE_ENV = production
PORT = 3001
MONGODB_URI = mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority
JWT_SECRET = mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=
OPENROUTER_API_KEY = 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
OPENROUTER_API_URL = https://openrouter.ai/api/v1/chat/completions
LLM_MODEL = meta-llama/llama-3.2-3b-instruct:free
SOLANA_RPC_URL = https://api.devnet.solana.com
CORS_ORIGINS = https://your-app.vercel.app
```

7. **Wait for deployment** (1-2 minutes)
8. **Copy your Railway URL** (Settings → Domains, or from the service overview)

### Step 2: Vercel Frontend (2 minutes)

1. **Go to**: https://vercel.com
2. **Login** with GitHub
3. **Click**: "Add New..." → "Project"
4. **Import**: Repository `Heet852003/Eco-Nexus`, Branch `ui-3`
5. **Configure**:
   - Root Directory: `client`
   - Framework: Next.js (auto-detected)
6. **Environment Variables** → Add:
   ```
   NEXT_PUBLIC_API_URL = https://your-railway-url.railway.app
   ```
   (Use the Railway URL from Step 1)
7. **Click**: "Deploy"
8. **Wait for build** (2-3 minutes)
9. **Copy your Vercel URL** (from the deployment overview)

### Step 3: Update CORS (1 minute)

1. **Go back to Railway**
2. **Variables tab** → Find `CORS_ORIGINS`
3. **Edit** → Update with your Vercel URL:
   ```
   https://your-vercel-url.vercel.app
   ```
4. **Railway will auto-redeploy**

### Step 4: Test (1 minute)

1. **Visit your Vercel URL**
2. **Try to register** a new account
3. **Try to login**
4. **Test the application**

---

## ✅ That's It!

Your website is now live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`

---

## 🎯 What I've Done For You

✅ All tokens saved and configured
✅ Environment variables prepared
✅ Deployment guides created
✅ GitHub Actions workflow ready
✅ All code committed to ui-3 branch

**You just need to:**
1. Create projects in Railway/Vercel (5 minutes, one-time)
2. Add environment variables (copy-paste from above)
3. Your website is live!

---

## 🆘 Troubleshooting

**Railway deployment fails:**
- Check logs in Railway dashboard
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

**Vercel deployment fails:**
- Check build logs in Vercel dashboard
- Verify `NEXT_PUBLIC_API_URL` is correct
- Ensure no trailing slashes in URLs

**Can't connect frontend to backend:**
- Verify CORS_ORIGINS includes your Vercel URL
- Check Railway URL is correct in Vercel env vars
- Restart both services

---

**Follow the steps above and your website will be live in 5 minutes!** 🚀

