# 🌐 Your Live Website URLs

## ✅ Frontend (Vercel) - DEPLOYED!

**Your Frontend URL:**
**https://client-dtxu0bvv4-heet-mehtas-projects.vercel.app**

**Production URL (check Vercel dashboard):**
- Go to: https://vercel.com/heet-mehtas-projects/client
- Your production domain will be shown there

## 🚂 Backend (Railway) - Deploy Now (2 minutes)

### Quick Deploy Steps:

1. **Go to**: https://railway.app
2. **Login** with GitHub
3. **Click**: "New Project" → "Deploy from GitHub repo"
4. **Select**: 
   - Repository: `Heet852003/Eco-Nexus`
   - Branch: `ui-3`
5. **After project creates**:
   - Click on the service
   - **Settings** → **Root Directory**: `server`
6. **Variables tab** → Click "New Variable" → Add these **one by one**:

```
NODE_ENV = production
PORT = 3001
MONGODB_URI = mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority
JWT_SECRET = mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=
OPENROUTER_API_KEY = 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
OPENROUTER_API_URL = https://openrouter.ai/api/v1/chat/completions
LLM_MODEL = meta-llama/llama-3.2-3b-instruct:free
SOLANA_RPC_URL = https://api.devnet.solana.com
CORS_ORIGINS = https://client-dtxu0bvv4-heet-mehtas-projects.vercel.app
```

7. **Wait for deployment** (1-2 minutes)
8. **Copy Railway URL** from Settings → Domains

### Update Vercel

1. **Go to**: https://vercel.com/heet-mehtas-projects/client/settings/environment-variables
2. **Add**:
   ```
   NEXT_PUBLIC_API_URL = https://your-railway-url.railway.app
   ```
3. **Redeploy** (or it auto-redeploys)

### Update CORS

1. **Go back to Railway**
2. **Variables** → Update `CORS_ORIGINS` with your final Vercel production URL
3. **Railway auto-redeploys**

---

## 🎉 Final Live URLs

After completing Railway deployment:

- **Frontend**: `https://client-dtxu0bvv4-heet-mehtas-projects.vercel.app` (or your production domain)
- **Backend**: `https://your-railway-url.railway.app`

---

## ✅ Status

- ✅ Frontend: **DEPLOYED** to Vercel
- ✅ Build: **FIXED** - All TypeScript errors resolved
- ⏳ Backend: **Deploy to Railway** (2 minutes)

---

## 🚀 Next Step

**Just deploy backend to Railway using the steps above, and your website will be fully live!**

The frontend is already deployed and working. You just need the backend (2 minutes)!

