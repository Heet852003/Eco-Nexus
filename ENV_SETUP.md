# Environment Variables Setup Guide

This guide explains all environment variables needed for Eco-Nexus SCOS.

## Quick Setup

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env and add your API keys
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local and set your backend URL
```

## Required Variables

### Backend - Minimum Required

| Variable | Description | How to Get |
|----------|-------------|------------|
| `OPENROUTER_API_KEY` | LLM API key for AI reasoning | Sign up at https://openrouter.ai (free) |

**Note:** The app will work without this, but AI reasoning will use fallback text.

### Frontend - Required

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |

## Optional Variables

### Backend - Solana (For Token Rewards)

| Variable | Description | Default |
|----------|-------------|---------|
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `SOLANA_NETWORK` | Network to use | `devnet` |
| `ENABLE_SOLANA` | Enable token minting | `true` |

**Note:** Devnet is free. No account needed.

### Backend - Snowflake (For Analytics)

| Variable | Description | Default |
|----------|-------------|---------|
| `SNOWFLAKE_ACCOUNT` | Snowflake account identifier | - |
| `SNOWFLAKE_USER` | Snowflake username | - |
| `SNOWFLAKE_PASSWORD` | Snowflake password | - |
| `SNOWFLAKE_WAREHOUSE` | Warehouse name | `COMPUTE_WH` |
| `SNOWFLAKE_DATABASE` | Database name | `ECO_NEXUS` |
| `SNOWFLAKE_SCHEMA` | Schema name | `PUBLIC` |
| `ENABLE_SNOWFLAKE` | Enable Snowflake | `false` |

**Note:** App uses mock data if Snowflake is not configured.

### Backend - Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |
| `DEBUG` | Enable debug mode | `false` |

### Backend - LLM Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_MODEL` | Model to use | `meta-llama/llama-3.2-3b-instruct:free` |
| `ENABLE_LLM` | Enable LLM reasoning | `true` |

### Frontend - Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_NAME` | App name | `Eco-Nexus SCOS` |
| `NEXT_PUBLIC_SOLANA_EXPLORER` | Solana explorer URL | `https://solscan.io/?cluster=devnet` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | `true` |

## Getting API Keys

### OpenRouter (Required for AI Reasoning)

1. Go to https://openrouter.ai
2. Sign up (free account)
3. Navigate to "Keys" section
4. Click "Create Key"
5. Copy the key to `OPENROUTER_API_KEY` in `backend/.env`

**Free Tier:** Limited requests, but enough for hackathon demo

### Snowflake (Optional)

1. Go to https://snowflake.com
2. Sign up for 30-day free trial
3. Create a warehouse (e.g., `COMPUTE_WH`)
4. Create database `ECO_NEXUS`
5. Run `backend/snowflake/schema.sql`
6. Get your account identifier from URL
7. Fill in credentials in `backend/.env`

**Free Trial:** 30 days, enough for hackathon

### Solana (No Account Needed)

- Devnet is completely free
- No API key required
- Just use: `SOLANA_RPC_URL=https://api.devnet.solana.com`

## Environment File Locations

```
eco-nexus/
├── backend/
│   ├── .env              # Backend environment (create from .env.example)
│   └── .env.example      # Template
├── frontend/
│   ├── .env.local        # Frontend environment (create from .env.local.example)
│   └── .env.local.example # Template
└── .env.example          # Root reference file
```

## Security Notes

### ⚠️ Never Commit .env Files

Add to `.gitignore`:
```
.env
.env.local
.env*.local
```

### ✅ Safe to Commit

- `.env.example` files (templates without real keys)
- `.env.local.example` files

### 🔒 Sensitive Data

Never put these in `NEXT_PUBLIC_*` variables (they're exposed to browser):
- API keys
- Passwords
- Secrets
- Private keys

## Testing Your Configuration

### Backend
```bash
cd backend
node -e "require('dotenv').config(); console.log('OpenRouter:', process.env.OPENROUTER_API_KEY ? 'Set' : 'Missing')"
```

### Frontend
```bash
cd frontend
npm run dev
# Check browser console for NEXT_PUBLIC_API_URL
```

## Troubleshooting

### "OPENROUTER_API_KEY is not set"
- Check `backend/.env` exists
- Verify key is correct (no extra spaces)
- Restart backend server

### "Cannot connect to backend"
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Verify backend is running on correct port
- Check CORS settings in backend

### "Snowflake connection failed"
- App will use mock data automatically
- Check credentials are correct
- Verify warehouse is running
- Check network connectivity

## Production Deployment

### Vercel (Frontend)
- Set environment variables in Vercel dashboard
- Use `NEXT_PUBLIC_*` prefix for client-side variables

### Render/Railway (Backend)
- Set environment variables in service dashboard
- Don't use `NEXT_PUBLIC_*` prefix (server-side only)

## Quick Reference

**Minimum Setup (Works with Mock Data):**
```bash
# Backend/.env
PORT=3001

# Frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Full Setup (All Features):**
```bash
# Backend/.env
PORT=3001
OPENROUTER_API_KEY=sk-or-v1-...
SOLANA_RPC_URL=https://api.devnet.solana.com
SNOWFLAKE_ACCOUNT=xy12345.us-east-1
SNOWFLAKE_USER=your_user
SNOWFLAKE_PASSWORD=your_password

# Frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

For more details, see [SETUP.md](./SETUP.md)

