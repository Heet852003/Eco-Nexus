# 🤖 Fully Automated Deployment

I've set up automated deployment! Here's how to use it:

## ⚡ Option 1: GitHub Actions (Recommended - Fully Automatic)

Once set up, **every push to ui-3 branch automatically deploys!**

### One-Time Setup (5 minutes):

1. **Get Railway Token:**
   - Go to https://railway.app → Login
   - Go to Account → Tokens
   - Create new token → Copy it

2. **Get Vercel Token:**
   - Go to https://vercel.com → Login
   - Go to Account → Tokens
   - Create new token → Copy it

3. **Get Vercel Project IDs:**
   - Create a project in Vercel (one-time)
   - Go to Project Settings
   - Copy Organization ID and Project ID

4. **Add GitHub Secrets:**
   - Go to: https://github.com/Heet852003/Eco-Nexus/settings/secrets/actions
   - Click "New repository secret"
   - Add these secrets:
     ```
     RAILWAY_TOKEN = [your railway token]
     VERCEL_TOKEN = [your vercel token]
     VERCEL_ORG_ID = [your vercel org id]
     VERCEL_PROJECT_ID = [your vercel project id]
     MONGODB_URI = mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority
     JWT_SECRET = mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=
     OPENROUTER_API_KEY = [your openrouter key]
     ```

5. **Create Railway Project (One-time):**
   - Go to https://railway.app
   - New Project → Deploy from GitHub
   - Select repo and ui-3 branch
   - Add service → Root directory: `server`
   - Add all environment variables

6. **Done!** Now every push to ui-3 automatically deploys!

---

## ⚡ Option 2: Run Deployment Script

Run this command to deploy right now:

```bash
node scripts/deploy-now.js
```

The script will:
- Check prerequisites
- Install CLI tools if needed
- Ask for tokens (or use environment variables)
- Deploy backend to Railway
- Deploy frontend to Vercel

**Or set environment variables and run:**
```bash
# Windows PowerShell
$env:RAILWAY_TOKEN="your_token"
$env:VERCEL_TOKEN="your_token"
node scripts/deploy-now.js

# Mac/Linux
RAILWAY_TOKEN="your_token" VERCEL_TOKEN="your_token" node scripts/deploy-now.js
```

---

## ⚡ Option 3: Use NPM Scripts

```bash
# Deploy backend
npm run deploy:railway

# Deploy frontend
npm run deploy:vercel
```

---

## 🎯 What's Already Done

✅ GitHub Actions workflow created (`.github/workflows/deploy.yml`)
✅ Deployment scripts created
✅ All configuration files ready
✅ MongoDB connection string configured
✅ JWT secret generated

---

## 📋 Quick Start

**Fastest way to deploy:**

1. **Get tokens** (2 min):
   - Railway: https://railway.app/account/tokens
   - Vercel: https://vercel.com/account/tokens

2. **Add to GitHub Secrets** (2 min):
   - https://github.com/Heet852003/Eco-Nexus/settings/secrets/actions
   - Add RAILWAY_TOKEN and VERCEL_TOKEN

3. **Push to trigger deployment:**
   ```bash
   git push origin ui-3
   ```

4. **Done!** Check GitHub Actions tab to see deployment progress.

---

## 🔄 After Setup

Once configured:
- ✅ Push code → Automatic deployment
- ✅ No manual steps needed
- ✅ Backend and frontend deploy together
- ✅ Website updates automatically

---

## 🆘 Need Help?

**GitHub Actions not running:**
- Check Actions tab in GitHub
- Verify secrets are set
- Check workflow file exists

**Deployment fails:**
- Check logs in GitHub Actions
- Verify tokens are valid
- Check Railway/Vercel dashboards

---

**Your deployment is ready! Just add the tokens and push!** 🚀

