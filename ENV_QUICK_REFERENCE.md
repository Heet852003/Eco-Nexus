# Environment Variables Quick Reference

## 🚀 Quick Start

```bash
# Backend
cd backend && cp env.template .env
# Edit .env - add OPENROUTER_API_KEY

# Frontend  
cd frontend && cp env.local.template .env.local
# Edit .env.local - set NEXT_PUBLIC_API_URL
```

## 📋 All Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `OPENROUTER_API_KEY` | **Yes** | - | LLM API key (get at openrouter.ai) |
| `SOLANA_RPC_URL` | No | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `SNOWFLAKE_ACCOUNT` | No | - | Snowflake account (optional) |
| `SNOWFLAKE_USER` | No | - | Snowflake username (optional) |
| `SNOWFLAKE_PASSWORD` | No | - | Snowflake password (optional) |
| `SNOWFLAKE_WAREHOUSE` | No | `COMPUTE_WH` | Snowflake warehouse |
| `SNOWFLAKE_DATABASE` | No | `ECO_NEXUS` | Snowflake database |
| `SNOWFLAKE_SCHEMA` | No | `PUBLIC` | Snowflake schema |
| `LLM_MODEL` | No | `meta-llama/llama-3.2-3b-instruct:free` | LLM model to use |
| `ENABLE_SOLANA` | No | `true` | Enable Solana features |
| `ENABLE_SNOWFLAKE` | No | `false` | Enable Snowflake analytics |
| `ENABLE_LLM` | No | `true` | Enable LLM reasoning |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:3001` | Backend API URL |
| `NEXT_PUBLIC_APP_NAME` | No | `Eco-Nexus SCOS` | App name |
| `NEXT_PUBLIC_SOLANA_EXPLORER` | No | `https://solscan.io/?cluster=devnet` | Solana explorer URL |

## 🔑 Getting API Keys

### OpenRouter (Required)
1. Visit https://openrouter.ai
2. Sign up (free)
3. Go to Keys → Create Key
4. Copy to `OPENROUTER_API_KEY`

### Snowflake (Optional)
1. Visit https://snowflake.com
2. Sign up for 30-day trial
3. Create warehouse and database
4. Fill in credentials

### Solana (No Key Needed)
- Devnet is free, no account required
- Just use: `SOLANA_RPC_URL=https://api.devnet.solana.com`

## 📝 Example Files

### Minimal Backend `.env`
```env
PORT=3001
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Minimal Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Full Backend `.env`
```env
PORT=3001
OPENROUTER_API_KEY=sk-or-v1-your-key-here
SOLANA_RPC_URL=https://api.devnet.solana.com
SNOWFLAKE_ACCOUNT=xy12345.us-east-1
SNOWFLAKE_USER=your_user
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=ECO_NEXUS
SNOWFLAKE_SCHEMA=PUBLIC
ENABLE_SOLANA=true
ENABLE_SNOWFLAKE=true
ENABLE_LLM=true
```

## ⚠️ Security Notes

- ✅ `.env` files are git-ignored
- ✅ Template files are safe to commit
- ❌ Never commit actual `.env` files
- ❌ Never share API keys publicly
- ❌ Don't use `NEXT_PUBLIC_*` for secrets

## 📚 More Information

- [CREATE_ENV_FILES.md](./CREATE_ENV_FILES.md) - How to create .env files
- [ENV_SETUP.md](./ENV_SETUP.md) - Detailed setup guide
- [SETUP.md](./SETUP.md) - Complete project setup

