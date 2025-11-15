# Eco-Nexus SCOS Setup Guide

Complete setup instructions for the hackathon project.

## Prerequisites

- **Node.js 18+** and npm
- **Git** (for cloning)
- **Free accounts** for:
  - OpenRouter (LLM API)
  - Snowflake (optional, for analytics)
  - Solana wallet (optional, for receiving tokens)

## Step 1: Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or install separately:
cd frontend && npm install
cd ../backend && npm install
```

## Step 2: Configure Environment Variables

### Backend Configuration

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` and add your credentials:

**Required:**
- `OPENROUTER_API_KEY` - Get from https://openrouter.ai (free tier available)

**Optional (for full functionality):**
- Snowflake credentials (for analytics)
- Solana RPC URL (defaults to devnet)

### Frontend Configuration

1. Copy the example environment file:
```bash
cd frontend
cp .env.local.example .env.local
```

2. Edit `.env.local`:
- Set `NEXT_PUBLIC_API_URL` to your backend URL
- For local: `http://localhost:3001`
- For production: your deployed backend URL

## Step 3: Set Up OpenRouter (Free LLM)

1. Go to https://openrouter.ai
2. Sign up for a free account
3. Navigate to Keys section
4. Create a new API key
5. Copy the key to `backend/.env` as `OPENROUTER_API_KEY`

**Note:** The app uses free models like `meta-llama/llama-3.2-3b-instruct:free`

## Step 4: Set Up Snowflake (Optional - for Analytics)

1. Sign up for Snowflake trial: https://snowflake.com
2. Create a new database and warehouse
3. Run the SQL script:
```bash
# Connect to Snowflake and run:
backend/snowflake/schema.sql
```

4. Update `backend/.env` with your Snowflake credentials

**Note:** If Snowflake is not configured, the app will use mock analytics data.

## Step 5: Run the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the App

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

## Step 6: Test the Application

1. **Browse Vendors:** Visit http://localhost:3000
2. **Compare & Negotiate:** Click the button to trigger multi-agent negotiation
3. **View Results:** See the winning vendor, savings, and SCC tokens
4. **Dashboard:** Check analytics at http://localhost:3000/dashboard

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

### Backend (Render/Railway)

1. Push code to GitHub
2. Create new web service
3. Set environment variables from `.env`
4. Deploy

**Note:** For Render free tier, use the startup command:
```bash
cd backend && npm start
```

## Troubleshooting

### OpenRouter API Errors
- Verify API key is correct
- Check you're using a free model
- Ensure you have credits (free tier has limits)

### Solana Token Minting Fails
- Devnet may be slow, retry
- Check RPC URL is correct
- Verify keypair is generated (check `.solana/` folder)

### Snowflake Connection Issues
- Verify credentials are correct
- Check warehouse is running
- Ensure database and schema exist
- App will use mock data if connection fails

### Frontend Can't Connect to Backend
- Verify backend is running on correct port
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure CORS is enabled in backend

## Project Structure

```
eco-nexus/
├── frontend/          # Next.js app
│   ├── app/           # Pages and layouts
│   ├── components/    # React components
│   └── lib/           # API client
├── backend/           # Express API
│   ├── routes/        # API endpoints
│   ├── agents/        # Negotiation logic
│   ├── services/      # LLM, Solana, Snowflake
│   └── data/          # Mock vendor data
├── data/              # Shared data files
└── README.md          # Project overview
```

## Free Services Summary

- ✅ **OpenRouter:** Free tier with limited requests
- ✅ **Solana Devnet:** Completely free
- ✅ **Snowflake:** 30-day free trial
- ✅ **Vercel:** Free tier for frontend
- ✅ **Render:** Free tier for backend (with limitations)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs in console
3. Verify all environment variables are set
4. Ensure all dependencies are installed

Good luck with your hackathon! 🚀

