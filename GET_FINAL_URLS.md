# 🎯 Get Your Final Live Website URLs

## ✅ Current Status

- ✅ **Frontend**: Deployed to Vercel
- ⏳ **Backend**: Need to deploy to Railway

## 🔗 Your Vercel Frontend URL

Based on the deployment, your frontend is at:
**https://client-68kqfphyb-heet-mehtas-projects.vercel.app**

To get your production URL:
1. Go to: https://vercel.com/heet-mehtas-projects/client
2. Check the latest deployment
3. Your production URL will be shown there

## 🚂 Deploy Backend to Railway (2 minutes)

### Option 1: Web Interface (Easiest)

1. **Go to**: https://railway.app
2. **Login** with GitHub
3. **Click**: "New Project" → "Deploy from GitHub repo"
4. **Select**: 
   - Repository: `Heet852003/Eco-Nexus`
   - Branch: `ui-3`
5. **After project creates**:
   - Click on the service
   - **Settings** → **Root Directory**: `server`
6. **Variables tab** → Add these:

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority
JWT_SECRET=mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=
OPENROUTER_API_KEY=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
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
LLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
SOLANA_RPC_URL=https://api.devnet.solana.com
CORS_ORIGINS=https://client-68kqfphyb-heet-mehtas-projects.vercel.app
```

7. **Wait for deployment** (1-2 minutes)
8. **Copy Railway URL** from Settings → Domains

### Option 2: Railway CLI

Run the script I created:
```powershell
.\\railway-deploy.ps1
```

## 🔄 Final Configuration

### 1. Update Vercel Environment Variable

1. Go to: https://vercel.com/heet-mehtas-projects/client/settings/environment-variables
2. Add/Update:
   ```
   NEXT_PUBLIC_API_URL = https://your-railway-url.railway.app
   ```
3. Redeploy (or wait for auto-redeploy)

### 2. Update Railway CORS

1. Go to Railway dashboard
2. Variables → Update `CORS_ORIGINS`:
   ```
   https://your-final-vercel-url.vercel.app
   ```
3. Railway will auto-redeploy

## 🎉 Your Final Live URLs

After completing the steps above:

- **Frontend**: `https://your-vercel-url.vercel.app`
- **Backend**: `https://your-railway-url.railway.app`

## ✅ Quick Checklist

- [ ] Railway backend deployed
- [ ] Railway URL copied
- [ ] Vercel `NEXT_PUBLIC_API_URL` updated
- [ ] Railway `CORS_ORIGINS` updated
- [ ] Test website works
- [ ] **Website is LIVE!** 🎉

---

**Follow the steps above and you'll have your live website in 2 minutes!** 🚀

