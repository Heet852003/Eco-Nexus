# 🚀 Your Deployment is Ready!

## ✅ MongoDB Connection String
Your MongoDB Atlas connection string is configured:
```
mongodb+srv://mehtaheet5_db_user:****@cluster0.ohekgyn.mongodb.net/
```

## 📋 Quick Deployment Steps

### 1. Generate JWT Secret
Run this command and copy the output:
```bash
openssl rand -base64 32
```

### 2. Deploy Backend to Railway

1. Go to https://railway.app → Login with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select repository: `Heet852003/Eco-Nexus`
4. Select branch: `ui-3`
5. Click on the service → Settings → Set Root Directory: `server`
6. Go to Variables tab and add these:

```
NODE_ENV = production
PORT = 3001
MONGODB_URI = mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority
JWT_SECRET = [paste the output from openssl rand -base64 32]
OPENROUTER_API_KEY = [your OpenRouter API key]
OPENROUTER_API_URL = https://openrouter.ai/api/v1/chat/completions
LLM_MODEL = meta-llama/llama-3.2-3b-instruct:free
SOLANA_RPC_URL = https://api.devnet.solana.com
CORS_ORIGINS = https://your-app.vercel.app
```

7. Wait for deployment to complete
8. Copy your Railway URL (e.g., `https://xxx.railway.app`)

### 3. Deploy Frontend to Vercel

1. Go to https://vercel.com → Login with GitHub
2. Click "Add New..." → "Project"
3. Import repository: `Heet852003/Eco-Nexus`
4. Select branch: `ui-3`
5. Configure:
   - Root Directory: `client`
   - Framework: Next.js (auto-detected)
6. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-railway-url.railway.app
   ```
   (Use the Railway URL from step 2)
7. Click "Deploy"
8. Wait for build (2-3 minutes)
9. Copy your Vercel URL

### 4. Update CORS

1. Go back to Railway
2. Update `CORS_ORIGINS` variable with your Vercel URL:
   ```
   https://your-vercel-url.vercel.app
   ```
3. Railway will auto-redeploy

### 5. Test Your Website

1. Visit your Vercel URL
2. Try to register a new account
3. Try to login
4. Test the full application

---

## 🔑 Important Notes

1. **JWT Secret**: Generate with `openssl rand -base64 32` - keep this secret!
2. **OpenRouter API Key**: Get from https://openrouter.ai/keys (free tier available)
3. **MongoDB Database Name**: The connection string uses `/eco-nexus` as the database name
4. **CORS**: Must be updated after getting Vercel URL

---

## 🎯 Your URLs After Deployment

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`

---

## ✅ Checklist

- [ ] MongoDB Atlas cluster is running
- [ ] JWT secret generated
- [ ] OpenRouter API key ready
- [ ] Railway backend deployed with all variables
- [ ] Railway URL copied
- [ ] Vercel frontend deployed
- [ ] Vercel URL copied
- [ ] CORS_ORIGINS updated in Railway
- [ ] Test registration works
- [ ] Test login works
- [ ] Website is live! 🎉

---

## 🆘 Troubleshooting

**Backend won't start:**
- Check Railway logs
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

**Frontend can't connect:**
- Verify `NEXT_PUBLIC_API_URL` matches Railway URL exactly
- Check CORS_ORIGINS includes Vercel URL
- No trailing slashes in URLs

**MongoDB connection fails:**
- Make sure IP whitelist allows all (0.0.0.0/0) in MongoDB Atlas
- Check connection string format
- Verify database name is correct

---

Good luck with your deployment! 🚀

