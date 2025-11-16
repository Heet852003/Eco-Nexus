
# Railway Deployment Commands
# Run these in PowerShell (as Administrator if needed)

# Install Railway CLI
iwr https://railway.app/install.sh -useb | iex

# Or use npm
npm install -g @railway/cli

# Then deploy
cd server
railway login --token f2023a5f-23f4-4ce2-8ba3-1527c5be3fb9
railway init
railway up

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set MONGODB_URI="mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority"
railway variables set JWT_SECRET="mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0="
railway variables set OPENROUTER_API_KEY="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"
railway variables set OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
railway variables set LLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
railway variables set SOLANA_RPC_URL=https://api.devnet.solana.com
railway variables set CORS_ORIGINS=https://your-vercel-url.vercel.app

# Get Railway URL
railway domain
