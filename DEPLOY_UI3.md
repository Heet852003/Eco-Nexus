# Deploy UI-3 Branch to Production

This guide will help you deploy the ui-3 branch to production using Vercel (frontend) and Railway (backend).

## Prerequisites

1. GitHub account with the repository
2. Vercel account (free tier available)
3. Railway account (free tier available) or Render account
4. MongoDB Atlas account (free tier available)

---

## Step 1: Prepare MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string (mongodb+srv://...)
4. Whitelist all IPs (0.0.0.0/0) for now, or add Railway's IPs later

---

## Step 2: Deploy Backend to Railway

### Option A: Railway (Recommended)

1. **Sign up at https://railway.app**
   - Use GitHub to sign in

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Choose the `ui-3` branch

3. **Add Service**
   - Click "+ New" → "GitHub Repo"
   - Select your repository and `ui-3` branch
   - Railway will auto-detect it's a Node.js project

4. **Configure Service**
   - **Root Directory**: `server`
   - **Start Command**: `npm start` (or `node server.js`)
   - Railway will auto-detect the build

5. **Add Environment Variables**
   Click on the service → "Variables" tab, add:
   ```
   PORT=3001
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_random_secret_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
   LLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
   SOLANA_RPC_URL=https://api.devnet.solana.com
   CORS_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:3000
   ```

6. **Get Backend URL**
   - After deployment, Railway will provide a URL like: `https://your-app.railway.app`
   - Copy this URL - you'll need it for the frontend

### Option B: Render (Alternative)

1. Go to https://render.com
2. Sign up/login
3. Click "New +" → "Web Service"
4. Connect GitHub repo, select `ui-3` branch
5. Configure:
   - **Name**: eco-nexus-backend
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add the same environment variables as above
7. Get your Render URL: `https://your-app.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

1. **Sign up at https://vercel.com**
   - Use GitHub to sign in

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the `ui-3` branch

3. **Configure Project**
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```
   (Use your Railway or Render backend URL from Step 2)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Vercel will provide a URL like: `https://your-app.vercel.app`

---

## Step 4: Update CORS Settings

After getting your Vercel frontend URL, update the backend CORS:

1. Go back to Railway/Render
2. Update the `CORS_ORIGINS` environment variable:
   ```
   CORS_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:3000
   ```
3. Redeploy the backend service

---

## Step 5: Verify Deployment

1. **Test Backend Health**
   - Visit: `https://your-backend-url.railway.app/health`
   - Should return: `{"status":"ok","message":"Carbon Marketplace API is running"}`

2. **Test Frontend**
   - Visit your Vercel URL
   - Try to register/login
   - Check browser console for any errors

3. **Test API Connection**
   - Open browser DevTools → Network tab
   - Try to login
   - Check if API calls are going to your backend URL

---

## Environment Variables Checklist

### Backend (Railway/Render)
- [ ] `PORT` - Usually auto-set, but can be `3001`
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI` - Your MongoDB Atlas connection string
- [ ] `JWT_SECRET` - Random secret key (generate with: `openssl rand -base64 32`)
- [ ] `OPENROUTER_API_KEY` - Your OpenRouter API key
- [ ] `OPENROUTER_API_URL` - https://openrouter.ai/api/v1/chat/completions
- [ ] `LLM_MODEL` - meta-llama/llama-3.2-3b-instruct:free
- [ ] `SOLANA_RPC_URL` - https://api.devnet.solana.com
- [ ] `CORS_ORIGINS` - Your Vercel frontend URL + localhost

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` - Your Railway/Render backend URL

---

## Troubleshooting

### Backend Issues

**Build fails:**
- Check Node.js version (should be 18+)
- Ensure all dependencies are in `server/package.json`
- Check build logs in Railway/Render dashboard

**MongoDB connection fails:**
- Verify MongoDB Atlas connection string
- Check IP whitelist in MongoDB Atlas
- Ensure username/password are URL-encoded in connection string

**CORS errors:**
- Verify `CORS_ORIGINS` includes your Vercel URL
- Check for trailing slashes
- Restart backend after updating CORS

### Frontend Issues

**Can't connect to backend:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check browser console for errors
- Ensure backend is running and accessible

**Build fails:**
- Check Node.js version (should be 18+)
- Ensure all dependencies are in `client/package.json`
- Check build logs in Vercel dashboard

---

## Production URLs

After deployment, you'll have:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app` or `https://your-app.onrender.com`

---

## Next Steps

1. **Custom Domain** (Optional)
   - Add custom domain in Vercel settings
   - Update `CORS_ORIGINS` with new domain

2. **Monitoring**
   - Set up error tracking (Sentry, etc.)
   - Monitor Railway/Render logs

3. **Database Backups**
   - Set up MongoDB Atlas backups
   - Export data regularly

4. **SSL Certificates**
   - Automatically handled by Vercel and Railway/Render

---

## Quick Commands

```bash
# Generate JWT secret
openssl rand -base64 32

# Test backend locally with production env
cd server
NODE_ENV=production npm start

# Test frontend build locally
cd client
npm run build
npm start
```

---

## Support

If you encounter issues:
1. Check deployment logs in Railway/Render/Vercel
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure MongoDB Atlas is accessible

Good luck with your deployment! 🚀

