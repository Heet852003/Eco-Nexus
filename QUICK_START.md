# Quick Start Guide

## ✅ Everything is Complete!

All code is done. Just add your MongoDB connection and you're ready!

## Step 1: MongoDB Connection

Your `.env` file should have one of these:

### Option A: Full Connection String
```env
MONGODB_URI=mongodb://username:password@host:27017/dbname
# OR
MONGODB_URL=mongodb://username:password@host:27017/dbname
```

### Option B: Separate Credentials (What you have)
```env
MONGODB_URL=mongodb://your-host:27017
MONGODB_PASSWORD=your-password
MONGODB_USER=your-username  # Optional, defaults to 'admin'
MONGODB_HOST=your-host:27017  # Optional, extracted from URL if not set
MONGODB_DB_NAME=carbon_marketplace
```

**The code will automatically construct the full URI from your separate credentials!**

## Step 2: Start the Server

```bash
cd server
npm run dev
```

Look for:
```
✅ Connected to MongoDB
✅ MongoDB indexes created
```

## Step 3: Test It

1. Register a user → Check MongoDB `users` collection
2. Create a request → Check MongoDB `buyerRequests` collection
3. Restart server → All data still there! ✅

## What's Stored in MongoDB?

- ✅ Users (email, password hash, roles)
- ✅ Buyer Requests
- ✅ Seller Quotes  
- ✅ Transactions
- ✅ Negotiation Threads
- ✅ Chat Messages

**Everything persists!** No more data loss on restart.

## Snowflake Setup (Later)

See `SNOWFLAKE_SETUP_GUIDE.md` for complete instructions.

**Quick Summary:**
- Snowflake is **OPTIONAL** - app works without it
- Used only for analytics/reporting
- Free trial available (30 days, $400 credit)
- Setup when you need advanced analytics

## Troubleshooting

**"MongoDB connection error"**
- Check MongoDB is running
- Verify credentials in `.env`
- Test connection string format

**"Collection not found"**
- Normal! Collections created automatically on first use

That's it! You're ready to go! 🚀

