# 🚀 DEPLOY BACKEND NOW - 2 Minutes

## Quick Deploy to Railway

Since Railway API requires web interface for first-time setup, follow these steps:

### Step 1: Deploy to Railway (2 minutes)

1. **Open**: https://railway.app/new
2. **Click**: "Deploy from GitHub repo"
3. **Select**: 
   - Repository: `Heet852003/Eco-Nexus`
   - Branch: `ui-3`
4. **After project loads**:
   - Click on the service
   - **Settings** → **Root Directory**: `server`
5. **Go to Variables tab** → Add these (copy-paste):

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority
JWT_SECRET=mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=
OPENROUTER_API_KEY=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
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
LLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
SOLANA_RPC_URL=https://api.devnet.solana.com
CORS_ORIGINS=https://client-693wg8yxg-heet-mehtas-projects.vercel.app
```

6. **Wait 1-2 minutes** for deployment
7. **Copy Railway URL**: Settings → Domains → Copy the URL

### Step 2: Connect Frontend to Backend

1. **Go to**: https://vercel.com/heet-mehtas-projects/client/settings/environment-variables
2. **Add**:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-railway-url.railway.app` (paste Railway URL)
3. **Save** - Vercel auto-redeploys

### Step 3: Update CORS

1. **Go back to Railway**
2. **Variables** → Update `CORS_ORIGINS` with your Vercel production URL
3. Railway auto-redeploys

---

## ✅ Your Live URLs

- **Frontend**: https://client-693wg8yxg-heet-mehtas-projects.vercel.app ✅
- **Backend**: https://your-railway-url.railway.app (after Step 1)

---

**That's it! Your website will be fully live in 2 minutes!** 🎉
