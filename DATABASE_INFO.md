# Database Storage Information

## Current Storage Implementation

### ⚠️ **In-Memory Storage (Current)**

Currently, the application uses **in-memory JavaScript arrays** for data storage. This means:

**Location**: Data is stored in server RAM (memory)

**What's Stored In-Memory:**
- ✅ Users (authentication, profiles, roles)
- ✅ Buyer Requests
- ✅ Seller Quotes  
- ✅ Transactions
- ✅ Chat Messages

**Important Limitations:**
- ❌ **Data is lost when server restarts**
- ❌ **No persistence between sessions**
- ❌ **Not suitable for production**
- ❌ **No data backup**
- ❌ **Single server instance only**

**Files Using In-Memory Storage:**
- `server/models/User.js` - `let users = []`
- `server/models/BuyerRequest.js` - `let requests = []`
- `server/models/SellerQuote.js` - `let quotes = []`
- `server/models/Transaction.js` - `let transactions = []`
- `server/models/ChatMessage.js` - `let messages = []`

### 📊 **Snowflake (Analytics - Optional)**

**Location**: Cloud database (Snowflake trial account)

**What's Stored:**
- ✅ Carbon savings records
- ✅ Transaction analytics
- ✅ Seller ratings
- ✅ Daily summaries

**Status**: 
- Optional - app works without it
- Falls back to in-memory data if not configured
- Requires Snowflake trial account setup

**Tables:**
- `CARBON_SAVINGS`
- `TRANSACTIONS`
- `SELLER_RATINGS`
- `PRODUCT_EMISSIONS`

### 🔗 **Solana Blockchain (Transaction Proof)**

**Location**: Solana Devnet blockchain

**What's Stored:**
- ✅ Transaction signatures (proof of transaction)
- ✅ SCC token minting records
- ✅ Blockchain transaction hashes

**Status**: 
- Active for transaction commitment
- Stores proof on-chain
- Keypair stored in `.solana/keypair.json` (local file)

## 🚀 Recommended: Add a Real Database

For production, you should use a proper database. Options:

### Option 1: SQLite (Simple, File-Based)
- ✅ No setup required
- ✅ Data persists in a file
- ✅ Good for development
- ❌ Not ideal for production scale

### Option 2: PostgreSQL (Recommended for Production)
- ✅ Robust and scalable
- ✅ ACID compliant
- ✅ Great for production
- ❌ Requires database server setup

### Option 3: MongoDB (NoSQL)
- ✅ Flexible schema
- ✅ Easy to use
- ✅ Good for rapid development
- ❌ Different query language

## 📝 Current Data Flow

1. **User Registration/Login** → Stored in `users[]` array (memory)
2. **Create Request** → Stored in `requests[]` array (memory)
3. **Submit Quote** → Stored in `quotes[]` array (memory)
4. **Accept Quote** → Creates transaction in `transactions[]` array (memory)
5. **Commit to Blockchain** → 
   - Updates `transactions[]` array
   - Writes to Solana blockchain (permanent)
   - Optionally writes to Snowflake (if configured)

## ⚠️ Important Notes

- **All data is lost when you restart the server**
- **Each server restart = fresh start**
- **No data migration or backup**
- **Perfect for development/testing**
- **NOT suitable for production use**

Would you like me to set up a proper database (SQLite or PostgreSQL)?

