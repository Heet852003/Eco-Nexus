# 🤖 Automated Deployment Setup

This guide will help you set up **fully automated deployment** so you never have to manually deploy again!

## 🎯 What This Does

Once set up, every time you push to the `ui-3` branch, your website will automatically:
1. Deploy backend to Railway
2. Deploy frontend to Vercel
3. Update everything automatically

## ⚡ Quick Setup (5 minutes)

### Step 1: Install CLI Tools

**Windows (PowerShell as Administrator):**
```powershell
# Install Railway CLI
iwr https://railway.app/install.sh -useb | iex

# Install Vercel CLI
npm install -g vercel
```

**Mac/Linux:**
```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Install Vercel CLI
npm install -g vercel
```

### Step 2: Get Your Tokens

#### Railway Token:
1. Run: `railway login`
2. Open browser and login
3. Get token from: `~/.railway/config.json` (or Railway dashboard → Account → Tokens)

#### Vercel Token:
1. Run: `vercel login`
2. Open browser and login
3. Go to: https://vercel.com/account/tokens
4. Create new token → Copy it

#### Vercel Project IDs:
1. Go to https://vercel.com
2. Create a new project (or use existing)
3. Go to Project Settings
4. Copy:
   - **Organization ID** (from URL or settings)
   - **Project ID** (from settings)

### Step 3: Add GitHub Secrets

1. Go to your GitHub repo: `https://github.com/Heet852003/Eco-Nexus`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

```
RAILWAY_TOKEN = [your railway token]
VERCEL_TOKEN = [your vercel token]
VERCEL_ORG_ID = [your vercel org id]
VERCEL_PROJECT_ID = [your vercel project id]
MONGODB_URI = mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority
JWT_SECRET = mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=
OPENROUTER_API_KEY = [your openrouter key]
```

### Step 4: Create Railway Project (One-time)

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your repo and `ui-3` branch
4. Add service → Set root directory: `server`
5. Add all environment variables (same as above)
6. Copy your Railway project ID

### Step 5: Create Vercel Project (One-time)

1. Go to https://vercel.com
2. Add New Project → Import repo
3. Select `ui-3` branch
4. Root Directory: `client`
5. Add environment variable: `NEXT_PUBLIC_API_URL` (you'll update this after Railway deploys)
6. Deploy once manually
7. Copy your Vercel project details

### Step 6: Push to Trigger Deployment

```bash
git add .
git commit -m "Trigger automated deployment"
git push origin ui-3
```

**That's it!** GitHub Actions will automatically deploy everything!

---

## 🔄 How It Works

1. You push code to `ui-3` branch
2. GitHub Actions workflow triggers
3. Backend deploys to Railway automatically
4. Frontend deploys to Vercel automatically
5. Your website is live!

---

## 📋 Environment Variables Checklist

Make sure these are set in:
- ✅ Railway (backend service)
- ✅ Vercel (frontend project)
- ✅ GitHub Secrets (for automation)

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority
JWT_SECRET=mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=
OPENROUTER_API_KEY=[your key]
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
LLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
SOLANA_RPC_URL=https://api.devnet.solana.com
CORS_ORIGINS=https://your-vercel-url.vercel.app
```

---

## 🆘 Troubleshooting

**GitHub Actions failing:**
- Check Actions tab in GitHub for error logs
- Verify all secrets are set correctly
- Ensure tokens are valid

**Railway deployment fails:**
- Check Railway dashboard for logs
- Verify environment variables are set
- Ensure project is linked correctly

**Vercel deployment fails:**
- Check Vercel dashboard for build logs
- Verify project ID and org ID are correct
- Check environment variables

---

## 🎉 After Setup

Once everything is configured:
- Just push to `ui-3` branch
- Deployment happens automatically
- No manual steps needed!

---

## 📝 Manual Deployment (If Needed)

If automation isn't working, you can still deploy manually:

```bash
# Backend
cd server
railway up

# Frontend
cd client
vercel --prod
```

---

**That's it! Your deployment is now fully automated!** 🚀

