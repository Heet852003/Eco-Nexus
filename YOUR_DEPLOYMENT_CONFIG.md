# 🚀 Your Deployment Configuration

## ✅ MongoDB Connection String
Your MongoDB Atlas is ready:
```
mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority
```

## 🔑 Generate JWT Secret

Since you're on Windows, use one of these methods:

### Method 1: Node.js (Recommended)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Method 2: Online Generator
Go to https://generate-secret.vercel.app/32 and copy the result

### Method 3: PowerShell
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Copy the output** - you'll need it for Railway!

---

## 📋 Railway Environment Variables

Copy these to Railway → Your Service → Variables:

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority
JWT_SECRET=[PASTE YOUR GENERATED JWT SECRET HERE]
OPENROUTER_API_KEY=[YOUR_OPENROUTER_API_KEY]
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
LLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
SOLANA_RPC_URL=https://api.devnet.solana.com
CORS_ORIGINS=https://your-app.vercel.app
```

**Important:**
- Replace `[PASTE YOUR GENERATED JWT SECRET HERE]` with the output from the JWT secret generation
- Replace `[YOUR_OPENROUTER_API_KEY]` with your OpenRouter API key (get from https://openrouter.ai/keys)
- Replace `https://your-app.vercel.app` with your actual Vercel URL after frontend deployment

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend (Railway)

1. **Go to Railway**: https://railway.app
2. **Login** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Select: `Heet852003/Eco-Nexus`
5. Select branch: `ui-3`
6. **Configure Service:**
   - Click on the service
   - Settings → Root Directory: `server`
7. **Add Variables:**
   - Go to Variables tab
   - Add all variables from the list above
8. **Get URL:**
   - Settings → Domains
   - Copy the Railway URL (e.g., `https://xxx.railway.app`)

### Step 2: Deploy Frontend (Vercel)

1. **Go to Vercel**: https://vercel.com
2. **Login** with GitHub
3. **Add New Project**
4. Import: `Heet852003/Eco-Nexus`
5. Select branch: `ui-3`
6. **Configure:**
   - Root Directory: `client`
   - Framework: Next.js (auto)
7. **Add Environment Variable:**
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app
   ```
   (Use your Railway URL from Step 1)
8. **Deploy** and wait
9. **Copy Vercel URL**

### Step 3: Update CORS

1. Go back to Railway
2. Update `CORS_ORIGINS` variable:
   ```
   https://your-vercel-url.vercel.app
   ```
3. Railway will auto-redeploy

### Step 4: Test

1. Visit your Vercel URL
2. Register a new account
3. Login
4. Test the application

---

## ✅ Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster is running
- [ ] JWT secret generated (use Node.js command above)
- [ ] OpenRouter API key ready (get from https://openrouter.ai/keys)
- [ ] Railway account created
- [ ] Vercel account created
- [ ] All environment variables ready to copy

---

## 🎯 After Deployment

You'll have:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`

Your website will be live and accessible to everyone! 🌐

---

## 🆘 Need Help?

**Backend issues:**
- Check Railway logs (Service → Deployments → View Logs)
- Verify all environment variables are set
- Check MongoDB connection string format

**Frontend issues:**
- Verify `NEXT_PUBLIC_API_URL` matches Railway URL exactly
- Check browser console (F12) for errors
- Ensure CORS_ORIGINS includes Vercel URL

---

Ready to deploy! Follow the steps above and your website will be live in ~15 minutes! 🚀

