# Database Setup Guide

This application uses **MongoDB** for operational data and **Snowflake** for analytics.

## MongoDB Setup

### Option 1: Local MongoDB

1. Install MongoDB locally or use Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

2. Update `.env`:
```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=carbon_marketplace
```

### Option 2: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/carbon_marketplace
MONGODB_DB_NAME=carbon_marketplace
```

### Collections Created Automatically

The application will automatically create these collections:
- `users` - User accounts and roles
- `buyerRequests` - Buyer requests for carbon credits
- `sellerQuotes` - Seller quotes on requests
- `negotiationThreads` - Negotiation conversations
- `chatMessages` - Chat messages in negotiations
- `transactions` - Completed transactions

Indexes are created automatically for performance.

## Snowflake Setup (Optional - for Analytics)

1. Create Snowflake account (trial available)
2. Run the SQL schema in `app/server/database/snowflake-schema.sql`
3. Update `.env`:
```
SNOWFLAKE_ACCOUNT=your-account
SNOWFLAKE_USER=your-username
SNOWFLAKE_PASSWORD=your-password
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=ECO_NEXUS
SNOWFLAKE_SCHEMA=PUBLIC
```

## Environment Variables

Copy `env.template` to `.env` and fill in:

```bash
# Required
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=carbon_marketplace
JWT_SECRET=your-secret-key
OPENROUTER_API_KEY=your-api-key

# Optional
SNOWFLAKE_ACCOUNT=
SNOWFLAKE_USER=
SNOWFLAKE_PASSWORD=
```

## Testing Database Connection

The server will automatically connect to MongoDB on startup. Check logs for:
- ✅ Connected to MongoDB
- ✅ MongoDB indexes created

If you see errors, check:
1. MongoDB is running
2. `MONGODB_URI` is correct
3. Network/firewall allows connection

