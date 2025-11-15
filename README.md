# Eco-Nexus: Sustainable Choice Operating System (SCOS)

A hackathon project that helps businesses make automated sustainable decisions by comparing vendors for cost, carbon footprint, delivery time, and sustainability score using multi-agent negotiation.

## 🚀 Features

- **Multi-Agent Negotiation**: Buyer Agent negotiates with multiple Seller Agents
- **Vendor Comparison**: Compare vendors on cost, carbon footprint, delivery time, and sustainability
- **Blockchain Rewards**: Earn SCC tokens on Solana Devnet for green choices
- **Analytics Dashboard**: Track carbon saved, cost saved, and tokens earned via Snowflake
- **Modern UI**: Visa Marketplace-inspired dark-themed interface

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + React + TailwindCSS
- **Backend**: Node.js + Express
- **LLM**: OpenRouter (free tier)
- **Blockchain**: Solana Devnet + SPL Tokens
- **Analytics**: Snowflake (trial account)
- **Hosting**: Vercel (frontend), Render/localhost (backend)

## 📁 Project Structure

```
eco-nexus/
├── frontend/          # Next.js application
├── backend/           # Express API server
├── agents/            # Multi-agent negotiation logic
├── data/              # Mock vendor data
└── README.md          # This file
```

## 🚦 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Solana CLI (for token operations)
- Snowflake trial account (optional for full functionality)

### Installation

1. **Clone and install dependencies:**

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

2. **Set up environment variables:**

See [CREATE_ENV_FILES.md](./CREATE_ENV_FILES.md) for detailed instructions.

**Quick setup:**
```bash
# Backend
cd backend
cp env.template .env
# Edit .env and add your OPENROUTER_API_KEY

# Frontend
cd frontend
cp env.local.template .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL
```

**Minimum required:**
- `backend/.env`: `OPENROUTER_API_KEY` (get free at https://openrouter.ai)
- `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3001`

For complete environment variable documentation, see [ENV_SETUP.md](./ENV_SETUP.md).

3. **Run the application:**

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

4. **Access the application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🎯 Usage

1. **Browse Vendors**: View available vendors on the marketplace page
2. **Compare & Negotiate**: Click "Compare & Negotiate" to trigger multi-agent negotiation
3. **View Results**: See the winning vendor, savings, and SCC tokens earned
4. **Analytics Dashboard**: Track your sustainability impact over time

## 🔑 Free Services Setup

### OpenRouter (LLM)
1. Sign up at https://openrouter.ai
2. Get your free API key
3. Add to backend `.env` as `OPENROUTER_API_KEY`

### Solana Devnet
- Free to use, no account needed
- Use RPC: `https://api.devnet.solana.com`

### Snowflake Trial
1. Sign up for free trial at https://snowflake.com
2. Create database `ECO_NEXUS` and schema `PUBLIC`
3. Run SQL scripts in `backend/snowflake/schema.sql`

## 📊 API Endpoints

- `GET /api/vendors/list` - List all vendors
- `POST /api/agents/negotiate` - Trigger negotiation
- `GET /api/recommendation` - Get final recommendation
- `POST /api/solana/reward` - Mint SCC tokens
- `GET /api/analytics/report` - Get analytics from Snowflake

## 🏆 Hackathon Notes

- All services use free tiers/devnets
- Mock vendor data included for demo
- Fully functional in <48 hours
- Modern, dark-themed UI optimized for presentation

## 📝 License

MIT License - Hackathon Project

## 🎯 Next Steps

Ready to get started? Check out:
- **[NEXT_STEPS.md](./NEXT_STEPS.md)** - Complete guide to get running
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - How to test all features
- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute quick start
- **[HACKATHON_NOTES.md](./HACKATHON_NOTES.md)** - Presentation tips

