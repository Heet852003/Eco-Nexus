# 🚀 Complete Deployment Guide with Your Tokens

## Your Credentials (Already Configured)
- Railway Token: f2023a5f-23f4-4ce2-8ba3-1527c5be3fb9
- Vercel Token: fAgL0slFangI7CmWcMA80kLt
- OpenRouter Key: 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
- MongoDB URI: mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus
- JWT Secret: mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=

## Quick Deploy (5 minutes)

### Step 1: Railway Backend (2 min)
1. Go to https://railway.app
2. Login (your token is already set)
3. Click "New Project" → "Deploy from GitHub"
4. Select: Heet852003/Eco-Nexus → ui-3 branch
5. Add service → Root: server
6. Variables tab → Add these:

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority
JWT_SECRET=mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=
OPENROUTER_API_KEY=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
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
LLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
SOLANA_RPC_URL=https://api.devnet.solana.com
CORS_ORIGINS=https://your-app.vercel.app
```

7. Copy Railway URL

### Step 2: Vercel Frontend (2 min)
1. Go to https://vercel.com
2. Login (your token is already set)
3. Click "Add New Project"
4. Import: Heet852003/Eco-Nexus → ui-3 branch
5. Root Directory: client
6. Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app
   ```
7. Deploy → Copy Vercel URL

### Step 3: Update CORS (1 min)
1. Go back to Railway
2. Update CORS_ORIGINS with your Vercel URL
3. Done!

## Alternative: Use GitHub Actions

I've created scripts to add secrets to GitHub. Run:

```powershell
# Install GitHub CLI first: winget install --id GitHub.cli
# Then login: gh auth login
# Then run:
.\add-github-secrets.ps1
```

Then push to ui-3 and GitHub Actions will deploy automatically!

## Your Website Will Be Live At:
- Frontend: https://your-app.vercel.app
- Backend: https://your-app.railway.app

🎉 That's it! Your website will be live!
