# Complete Setup Guide - Carbon Marketplace

## ✅ Code is 100% Complete!

All code has been updated to use MongoDB. You just need to configure your MongoDB connection.

## Quick Start

### 1. MongoDB Setup

**Option A: Local MongoDB (Docker)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to `.env`

### 2. Update .env File

Your `.env` file should have:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017
# OR for Atlas: mongodb+srv://username:password@cluster.mongodb.net/carbon_marketplace

# If using separate credentials:
# MONGODB_USER=admin
# MONGODB_PASSWORD=your-password
# MONGODB_HOST=localhost:27017

MONGODB_DB_NAME=carbon_marketplace

# Other required
JWT_SECRET=your-secret-key-change-in-production
OPENROUTER_API_KEY=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
```

### 3. Start Servers

```bash
# Terminal 1 - Backend
cd app/server
npm install
npm run dev

# Terminal 2 - Frontend  
cd app/client
npm install
npm run dev
```

### 4. Verify Connection

Check backend logs for:
```
✅ Connected to MongoDB
✅ MongoDB indexes created
```

## What's Stored in MongoDB?

- ✅ **Users** - All user accounts, passwords (hashed), roles
- ✅ **Buyer Requests** - All carbon credit requests
- ✅ **Seller Quotes** - All quotes on requests
- ✅ **Transactions** - All completed transactions
- ✅ **Negotiation Threads** - All negotiation conversations
- ✅ **Chat Messages** - All chat messages in negotiations

**Everything persists now!** No data loss on server restart.

## Snowflake Setup (Optional)

See `SNOWFLAKE_SETUP_GUIDE.md` for complete instructions.

**TL;DR:**
1. Sign up for Snowflake free trial
2. Run SQL schema from `app/server/database/snowflake-schema.sql`
3. Add credentials to `.env`
4. Restart server

Snowflake is only for analytics - app works fine without it!

## Testing

1. Register a new user → Stored in MongoDB
2. Create a buyer request → Stored in MongoDB
3. Switch to seller role → Updated in MongoDB
4. Submit a quote → Stored in MongoDB
5. Accept quote → Transaction created in MongoDB
6. Restart server → All data still there! ✅

## Troubleshooting

**"MongoDB not connected"**
- Check MongoDB is running
- Verify `MONGODB_URI` in `.env`
- Check connection string format

**"Collection not found"**
- Collections are created automatically on first use
- Check MongoDB connection is working

**"Index creation failed"**
- Usually means indexes already exist (safe to ignore)
- Or MongoDB connection issue

## All Done! 🎉

Your app now has:
- ✅ Full database persistence
- ✅ User authentication with roles
- ✅ Self-dealing prevention
- ✅ Negotiation threads
- ✅ Chat messages
- ✅ Transaction tracking
- ✅ Ready for Snowflake analytics (optional)

Just add your MongoDB connection string and you're ready to go!

