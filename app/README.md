# Carbon Marketplace MVP - Full Implementation

A complete Carbon Credit Buy-Sell Marketplace with AI negotiation, blockchain settlement, and analytics.

## 🏗️ Project Structure

```
app/
├── client/              # Next.js Frontend
│   ├── src/
│   │   ├── app/         # Next.js App Router pages
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and API client
│   └── package.json
│
├── server/              # Express Backend
│   ├── controllers/     # Route controllers
│   ├── routes/         # API routes
│   ├── models/         # Data models
│   ├── services/       # Business logic services
│   ├── middleware/     # Express middleware
│   └── server.js       # Main server file
│
└── shared/              # Shared code
    ├── types/          # TypeScript types
    └── constants/      # Shared constants
```

## 🚀 Quick Start

### Backend Setup

```bash
cd app/server
npm install
cp ../../backend/env.template .env
# Edit .env with your credentials
npm run dev
```

### Frontend Setup

```bash
cd app/client
npm install
cp ../../frontend/env.local.template .env.local
# Edit .env.local with API URL
npm run dev
```

## 📋 Features Implemented

### ✅ Backend
- [x] JWT Authentication (register/login)
- [x] Buyer request creation and management
- [x] Seller quote submission
- [x] AI price recommendation (OpenRouter + Aristotle Framework)
- [x] AI seller ranking
- [x] Real-time chat with Socket.io
- [x] Solana blockchain transaction commitment
- [x] SCC token minting
- [x] Snowflake analytics integration
- [x] Scoring systems (reliability, match score)

### ✅ Frontend
- [x] Login/Register pages
- [x] Dashboard
- [x] Authentication hooks
- [x] Socket.io integration
- [x] API client with interceptors
- [x] Navbar component
- [x] Responsive design with TailwindCSS

### 🔄 To Complete
- [ ] Buyer new request page
- [ ] Buyer requests list page
- [ ] Seller requests page
- [ ] Transaction detail page with chat
- [ ] Analytics page with charts
- [ ] Product selector component
- [ ] Quote cards and tables
- [ ] Blockchain receipt UI

## 🔑 Environment Variables

### Backend (.env)
```
PORT=3001
JWT_SECRET=your-secret-key
OPENROUTER_API_KEY=your-key
SOLANA_RPC_URL=https://api.devnet.solana.com
SNOWFLAKE_ACCOUNT=your-account
SNOWFLAKE_USER=your-user
SNOWFLAKE_PASSWORD=your-password
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Buyer
- `POST /api/buyer/request` - Create buyer request
- `GET /api/buyer/requests` - Get buyer's requests
- `GET /api/buyer/request/:id` - Get request details
- `POST /api/buyer/accept-quote` - Accept a quote

### Seller
- `GET /api/seller/requests` - Get available requests
- `POST /api/seller/quote` - Submit quote

### Chat
- `POST /api/chat/send` - Send message
- `GET /api/chat/:id` - Get messages

### AI
- `POST /api/ai/recommend-price` - Get price recommendation
- `POST /api/ai/rank-sellers` - Rank sellers
- `POST /api/ai/negotiation-hints` - Get negotiation hints

### Blockchain
- `POST /api/blockchain/commit` - Commit transaction

### Analytics
- `POST /api/analytics/carbon` - Get carbon analytics
- `GET /api/analytics/dashboard` - Get dashboard data

## 🧠 AI Services

Uses OpenRouter API with Meta Llama 3.2 3B Instruct model and custom Aristotle Framework:
- **Logos**: Logical price analysis
- **Ethos**: Credibility assessment
- **Phronesis**: Practical wisdom for recommendations

## 🔗 Blockchain

- Solana Devnet integration
- Transaction commitment
- SCC (Sustainable Choice Coin) token minting
- Transaction signatures stored

## 📊 Analytics

- Snowflake integration for:
  - Carbon savings tracking
  - Transaction history
  - Seller ratings
  - Daily summaries

## 🎯 Next Steps

1. Complete remaining frontend pages
2. Add error boundaries
3. Implement loading states
4. Add toast notifications
5. Create Snowflake schema SQL
6. Add unit tests
7. Deploy to production

## 📝 License

MIT License

