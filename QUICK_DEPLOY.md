# Quick Deployment Guide - UI-3 Branch

## 🚀 Fast Track Deployment

### 1. Backend (Railway) - 5 minutes

1. Go to https://railway.app → Sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repo → Choose `ui-3` branch
4. Click on the service → Settings → Set Root Directory: `server`
5. Go to Variables tab, add:
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=generate_with_openssl_rand_base64_32
   OPENROUTER_API_KEY=your_key
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```
6. Copy the Railway URL (e.g., `https://xxx.railway.app`)

### 2. Frontend (Vercel) - 3 minutes

1. Go to https://vercel.com → Sign in with GitHub
2. Click "Add New Project"
3. Import repo → Select `ui-3` branch
4. Configure:
   - Root Directory: `client`
   - Framework: Next.js (auto-detected)
5. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app
   ```
6. Click Deploy
7. Copy Vercel URL

### 3. Update CORS - 1 minute

1. Go back to Railway
2. Update `CORS_ORIGINS` variable:
   ```
   CORS_ORIGINS=https://your-vercel-url.vercel.app
   ```
3. Service will auto-redeploy

### 4. Test - 2 minutes

1. Visit your Vercel URL
2. Try to register/login
3. Check browser console for errors

**Total time: ~11 minutes** ⚡

---

## 📋 Required Services

- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas (Free tier)
- **Railway**: https://railway.app (Free tier)
- **Vercel**: https://vercel.com (Free tier)
- **OpenRouter**: https://openrouter.ai (Free tier available)

---

## 🔑 Generate JWT Secret

```bash
openssl rand -base64 32
```

Copy the output to your `JWT_SECRET` environment variable.

---

## ✅ Checklist

- [ ] MongoDB Atlas cluster created
- [ ] MongoDB connection string copied
- [ ] Railway backend deployed
- [ ] Railway URL copied
- [ ] Vercel frontend deployed
- [ ] Vercel URL copied
- [ ] CORS_ORIGINS updated with Vercel URL
- [ ] All environment variables set
- [ ] Test registration/login works

---

## 🆘 Common Issues

**Backend won't start:**
- Check MongoDB URI is correct
- Verify all env vars are set
- Check Railway logs

**Frontend can't connect:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS_ORIGINS includes Vercel URL
- No trailing slashes in URLs

**MongoDB connection fails:**
- Whitelist all IPs (0.0.0.0/0) in MongoDB Atlas
- Check connection string format
- Verify username/password are correct

---

For detailed instructions, see `DEPLOY_UI3.md`

