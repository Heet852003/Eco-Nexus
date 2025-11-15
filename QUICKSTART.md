# Eco-Nexus SCOS - Quick Start Guide

Get up and running in 5 minutes!

## 1. Install Dependencies

```bash
# Install all dependencies
npm run install:all
```

## 2. Set Up OpenRouter (Required for LLM)

1. Go to https://openrouter.ai and sign up (free)
2. Get your API key
3. Create `backend/.env`:
```bash
cd backend
echo "OPENROUTER_API_KEY=your_key_here" > .env
echo "PORT=3001" >> .env
```

## 3. Run the App

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

## 4. Open Browser

Visit http://localhost:3000

## That's It! 🎉

- Browse vendors on the marketplace
- Click "Compare & Negotiate" to see AI negotiation
- View results and SCC tokens earned
- Check analytics dashboard

## Optional: Full Setup

For Snowflake analytics and Solana token minting, see [SETUP.md](./SETUP.md)

