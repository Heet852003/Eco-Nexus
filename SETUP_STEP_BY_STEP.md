# Step-by-Step Setup Guide

Follow these steps in order to get your application running.

## ✅ Step 1: Environment Files (DONE - You've added the API key!)

Your OpenRouter API key is in the template. Now let's create the actual .env files.

### Backend .env File

1. Navigate to `eco-nexus/backend/` folder
2. Copy `env.template` and rename it to `.env`
3. The file should already have your OpenRouter API key

**OR** create `backend/.env` manually with this content:
```
PORT=3001
OPENROUTER_API_KEY=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
SOLANA_RPC_URL=https://api.devnet.solana.com
ENABLE_SOLANA=true
ENABLE_LLM=true
```

### Frontend .env.local File

1. Navigate to `eco-nexus/frontend/` folder
2. Copy `env.local.template` and rename it to `.env.local`

**OR** create `frontend/.env.local` manually with this content:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📦 Step 2: Install Dependencies

### Backend Dependencies

Open a terminal/command prompt and run:

```bash
cd eco-nexus/backend
npm install
```

This will install:
- express
- cors
- dotenv
- axios
- @solana/web3.js
- @solana/spl-token
- snowflake-sdk

**Expected output**: Should see packages being installed, ending with something like:
```
added 150 packages in 30s
```

### Frontend Dependencies

Open a **new** terminal/command prompt and run:

```bash
cd eco-nexus/frontend
npm install
```

This will install:
- next
- react
- tailwindcss
- framer-motion
- recharts
- lucide-react
- and more...

**Expected output**: Should see packages being installed.

---

## 🚀 Step 3: Start the Backend Server

In the backend terminal, run:

```bash
cd eco-nexus/backend
npm run dev
```

**Expected output**:
```
🚀 Eco-Nexus SCOS Backend running on http://localhost:3001
📊 Health check: http://localhost:3001/health
```

**Keep this terminal open!** The server needs to keep running.

---

## 🌐 Step 4: Start the Frontend

Open a **new** terminal/command prompt and run:

```bash
cd eco-nexus/frontend
npm run dev
```

**Expected output**:
```
  ▲ Next.js 14.2.5
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000
```

---

## ✅ Step 5: Test the Application

1. **Open your browser** and go to: http://localhost:3000

2. **You should see**:
   - Dark-themed marketplace page
   - Header with "Eco-Nexus SCOS"
   - 5 vendor cards displayed
   - "Compare & Negotiate" button

3. **Test the negotiation**:
   - Click "Compare & Negotiate" button
   - Wait a few seconds (it's calling the LLM)
   - You should be redirected to results page
   - See the winner, savings, and reasoning

4. **Check the dashboard**:
   - Click "Dashboard" in the header
   - See analytics with charts

---

## 🧪 Step 6: Verify Backend is Working

Open a new terminal and test the API:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test vendors endpoint
curl http://localhost:3001/api/vendors/list

# Test negotiation (this will use your OpenRouter API key)
curl -X POST http://localhost:3001/api/agents/negotiate -H "Content-Type: application/json" -d "{\"goals\": {\"minimize_cost\": 0.3, \"minimize_carbon\": 0.3, \"minimize_delivery\": 0.2, \"maximize_sustainability\": 0.2}}"
```

---

## 🐛 Troubleshooting

### "Cannot find module" errors
- Make sure you ran `npm install` in both frontend and backend
- Check that `node_modules` folders exist

### "Port 3001 already in use"
- Another process is using port 3001
- Close other applications or change PORT in backend/.env

### "Cannot connect to backend"
- Make sure backend is running (Step 3)
- Check `NEXT_PUBLIC_API_URL` in frontend/.env.local
- Verify backend shows "running on http://localhost:3001"

### "Negotiation fails"
- Check your OpenRouter API key is correct in backend/.env
- Verify you have credits on OpenRouter (free tier has limits)
- Check backend console for error messages

### Frontend shows blank page
- Check browser console (F12) for errors
- Verify frontend dependencies are installed
- Make sure backend is running

---

## 🎉 Success!

If everything works:
- ✅ Marketplace page loads
- ✅ Vendors display correctly
- ✅ Negotiation completes
- ✅ Results page shows winner
- ✅ Dashboard displays analytics

**You're ready for the hackathon!** 🚀

---

## Next: Test Everything

Once both servers are running, test the full flow:
1. Browse vendors
2. Click "Compare & Negotiate"
3. View results
4. Check dashboard

Good luck! 🏆

