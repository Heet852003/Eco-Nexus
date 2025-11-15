# Deployment Guide

## Frontend Deployment (Vercel)

### Step 1: Prepare Repository
```bash
# Ensure all code is committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Sign up/login (free tier available)
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = Your backend URL
7. Click "Deploy"

### Step 3: Update Backend CORS

Update `backend/server.js` to allow your Vercel domain:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-app.vercel.app']
}))
```

---

## Backend Deployment (Render)

### Step 1: Prepare for Render

1. Ensure `backend/package.json` has:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

2. Create `backend/render.yaml` (optional):
```yaml
services:
  - type: web
    name: eco-nexus-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: PORT
        value: 10000
      - key: OPENROUTER_API_KEY
        sync: false
```

### Step 2: Deploy to Render

1. Go to https://render.com
2. Sign up/login (free tier available)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: eco-nexus-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: `backend`
6. Add Environment Variables:
   - `PORT` = 10000 (Render default)
   - `OPENROUTER_API_KEY` = Your key
   - `SOLANA_RPC_URL` = https://api.devnet.solana.com
   - (Optional) Snowflake credentials
7. Click "Create Web Service"

### Step 3: Update Frontend

Update `frontend/.env.local` or Vercel environment variables:
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## Alternative: Railway Deployment

### Backend on Railway

1. Go to https://railway.app
2. Sign up/login
3. Click "New Project" → "Deploy from GitHub"
4. Select your repository
5. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
6. Add environment variables
7. Deploy

---

## Environment Variables Checklist

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` - Backend URL

### Backend (Render/Railway)
- [ ] `PORT` - Server port (usually auto-set)
- [ ] `OPENROUTER_API_KEY` - LLM API key
- [ ] `SOLANA_RPC_URL` - Solana RPC (default: devnet)
- [ ] `SNOWFLAKE_ACCOUNT` - (Optional)
- [ ] `SNOWFLAKE_USER` - (Optional)
- [ ] `SNOWFLAKE_PASSWORD` - (Optional)
- [ ] `SNOWFLAKE_WAREHOUSE` - (Optional)
- [ ] `SNOWFLAKE_DATABASE` - (Optional)
- [ ] `SNOWFLAKE_SCHEMA` - (Optional)

---

## Post-Deployment Checklist

- [ ] Frontend accessible at Vercel URL
- [ ] Backend health check works: `https://your-backend.onrender.com/health`
- [ ] Frontend can connect to backend
- [ ] Vendors list loads
- [ ] Negotiation works
- [ ] Analytics dashboard loads (with or without Snowflake)
- [ ] CORS configured correctly

---

## Troubleshooting

### Frontend Can't Connect to Backend
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running
- Check CORS settings in backend

### Backend Build Fails
- Ensure all dependencies in `package.json`
- Check Node.js version (18+)
- Review build logs

### Environment Variables Not Working
- Restart service after adding variables
- Check variable names match exactly
- Verify no typos

### Solana Token Minting Fails
- Devnet may be slow, retry
- Check RPC URL is correct
- Verify keypair is generated

---

## Free Tier Limits

### Vercel
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS

### Render
- 750 hours/month (free tier)
- Sleeps after 15 min inactivity
- Can upgrade for always-on

### Railway
- $5 free credit/month
- Pay-as-you-go after

---

## Production Considerations

For production deployment:

1. **Use Production Solana Network**: Switch from Devnet to Mainnet
2. **Add Authentication**: Implement JWT or OAuth
3. **Enable Rate Limiting**: Protect API endpoints
4. **Add Monitoring**: Set up error tracking (Sentry, etc.)
5. **Database**: Use production Snowflake or PostgreSQL
6. **CDN**: Enable Vercel CDN for static assets
7. **SSL**: Automatic with Vercel/Render
8. **Backup**: Set up database backups

---

## Quick Deploy Commands

```bash
# Frontend (Vercel CLI)
npm i -g vercel
cd frontend
vercel

# Backend (Render CLI)
npm i -g render-cli
cd backend
render deploy
```

---

Good luck with your deployment! 🚀

