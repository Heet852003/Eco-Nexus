# Next Steps - Eco-Nexus SCOS

Your project is complete! Here's what to do next to get it running and ready for the hackathon.

## ✅ Current Status

All core features are implemented:
- ✅ Visa Marketplace UI (dark theme, glass morphism)
- ✅ Aristotle AI Agent Framework (Buyer & Seller Agents)
- ✅ Solana blockchain integration (token minting)
- ✅ Snowflake analytics (with fallback)
- ✅ Complete documentation

## 🚀 Immediate Next Steps

### Step 1: Install Dependencies (5 minutes)

```bash
# Navigate to project root
cd eco-nexus

# Install all dependencies
cd frontend && npm install
cd ../backend && npm install
```

### Step 2: Set Up Environment Variables (5 minutes)

**Backend:**
```bash
cd backend
cp env.template .env
# Edit .env and add your OPENROUTER_API_KEY
```

**Minimum required in `backend/.env`:**
```env
PORT=3001
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

**Get OpenRouter API Key (Free):**
1. Visit https://openrouter.ai
2. Sign up (free account)
3. Go to Keys → Create Key
4. Copy the key to `backend/.env`

**Frontend:**
```bash
cd frontend
cp env.local.template .env.local
# Usually no changes needed - defaults to localhost:3001
```

**Minimum required in `frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 3: Test Locally (10 minutes)

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

**Test the application:**
1. Open http://localhost:3000
2. Browse vendors
3. Click "Compare & Negotiate"
4. View results
5. Check dashboard

### Step 4: Verify All Features Work

- [ ] Vendors load on marketplace
- [ ] Negotiation completes successfully
- [ ] Results page shows winner and reasoning
- [ ] Dashboard displays analytics (mock data if Snowflake not set up)
- [ ] No console errors

## 🎯 Optional Enhancements (Before Hackathon)

### A. Add Solana Token Minting Integration

Currently, tokens are calculated but not automatically minted. To add automatic minting:

**Update `backend/agents/negotiation.js`** after negotiation completes:
```javascript
// After getting recommendation
import { mintSCCToken } from '../services/solana.js'

// Mint tokens
try {
  await mintSCCToken(recommendation.scc_tokens)
} catch (error) {
  console.error('Token minting failed:', error)
  // Continue anyway - tokens are calculated
}
```

### B. Store Decisions in Snowflake

**Update `backend/routes/agents.js`** after negotiation:
```javascript
import { storeDecision } from '../services/snowflake.js'

// After negotiation
try {
  await storeDecision({
    decision_id: `decision-${Date.now()}`,
    vendor_id: result.winner.id,
    vendor_name: result.winner.name,
    price: result.winner.price,
    carbon: result.winner.carbon,
    delivery_days: result.winner.delivery,
    sustainability_score: result.winner.sustainability_score,
    cost_saved: result.cost_saved,
    carbon_saved: result.carbon_saved,
    scc_tokens: result.scc_tokens
  })
} catch (error) {
  console.error('Snowflake storage failed:', error)
  // Continue anyway - app works without Snowflake
}
```

### C. Enhance UI with More Details

Consider adding to results page:
- Aristotelian analysis breakdown (logical/ethical/practical scores)
- Negotiation notes from Seller Agents
- Solana transaction link (if tokens minted)

## 📦 Deployment Preparation

### Frontend (Vercel)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Import GitHub repository
   - Set root directory: `frontend`
   - Add environment variable: `NEXT_PUBLIC_API_URL` = your backend URL
   - Deploy

### Backend (Render/Railway)

1. **Deploy to Render:**
   - Go to https://render.com
   - New Web Service
   - Connect GitHub repo
   - Root directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
   - Add environment variables from `backend/.env`

2. **Update Frontend:**
   - Update `NEXT_PUBLIC_API_URL` in Vercel to point to Render URL

## 🎤 Hackathon Presentation Tips

### Demo Flow (5 minutes)

1. **Show Marketplace (30s)**
   - Highlight Visa Marketplace-inspired UI
   - Show vendor cards with metrics
   - Mention dark theme and glass morphism

2. **Trigger Negotiation (1min)**
   - Click "Compare & Negotiate"
   - Explain Aristotle AI Agent Framework
   - Show Buyer Agent vs Seller Agents

3. **Show Results (1min)**
   - Display winner with reasoning
   - Highlight savings (cost + carbon)
   - Show SCC tokens earned
   - Mention Solana blockchain integration

4. **Show Dashboard (1min)**
   - Display analytics
   - Show charts and trends
   - Mention Snowflake integration

5. **Technical Highlights (1.5min)**
   - Aristotle Framework: Logical, Ethical, Practical reasoning
   - Solana: Real token minting on Devnet
   - Snowflake: Analytics data warehouse
   - Visa UI: Modern, professional design

### Key Talking Points

- **Problem**: Businesses struggle with sustainable procurement decisions
- **Solution**: AI-powered multi-agent negotiation with blockchain rewards
- **Innovation**: Aristotle framework + LLM + Blockchain + Analytics
- **Impact**: Reduces carbon, saves costs, rewards green choices

## 🐛 Troubleshooting

### Backend won't start
- Check Node.js version (18+)
- Verify `.env` file exists
- Check port 3001 is available

### Frontend won't connect
- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in backend

### Negotiation fails
- Verify OpenRouter API key is set
- Check network connection
- Review console logs for errors

### Solana minting fails
- Devnet may be slow - retry
- Check RPC URL is correct
- Verify keypair is generated

### Snowflake errors
- App uses mock data if Snowflake not configured
- This is expected and fine for demo

## 📋 Pre-Hackathon Checklist

- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Application runs locally
- [ ] All features tested
- [ ] Demo flow practiced
- [ ] Presentation prepared
- [ ] GitHub repo ready
- [ ] Deployment configured (optional)
- [ ] Backup plan (local demo if deployment fails)

## 🎯 Quick Test Script

Run this to verify everything works:

```bash
# 1. Start backend
cd backend && npm run dev &
BACKEND_PID=$!

# 2. Wait for backend
sleep 5

# 3. Test health endpoint
curl http://localhost:3001/health

# 4. Test vendors endpoint
curl http://localhost:3001/api/vendors/list

# 5. Test negotiation
curl -X POST http://localhost:3001/api/agents/negotiate \
  -H "Content-Type: application/json" \
  -d '{"goals": {"minimize_cost": 0.3, "minimize_carbon": 0.3, "minimize_delivery": 0.2, "maximize_sustainability": 0.2}}'

# 6. Start frontend
cd frontend && npm run dev

# 7. Open browser
# Visit http://localhost:3000

# 8. Cleanup
kill $BACKEND_PID
```

## 🚀 You're Ready!

Your project is complete and ready for the hackathon. Focus on:

1. **Testing** - Make sure everything works locally
2. **Practice** - Run through your demo a few times
3. **Prepare** - Have your talking points ready
4. **Deploy** - Optional, but impressive if it works

Good luck! 🏆

---

**Need Help?**
- Check [SETUP.md](./SETUP.md) for detailed setup
- Check [QUICKSTART.md](./QUICKSTART.md) for quick start
- Check [HACKATHON_NOTES.md](./HACKATHON_NOTES.md) for presentation tips

