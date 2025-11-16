# Snowflake Setup Guide

## What is Snowflake Used For?

Snowflake is used for **analytics and reporting only** in this application. It stores:
- Carbon savings records
- Transaction analytics
- Seller ratings and performance metrics
- Daily summaries
- Product emissions data

**Important**: Snowflake is **OPTIONAL**. The app works perfectly without it. If you don't set it up, the app will use MongoDB data for analytics.

## When is Snowflake Used?

1. **After a transaction is completed** - Data is synced to Snowflake for analytics
2. **Analytics Dashboard** - `/api/analytics/dashboard` tries Snowflake first, falls back to MongoDB
3. **Carbon Analytics** - `/api/analytics/carbon` tries Snowflake first, falls back to MongoDB
4. **Seller Ratings** - Stored in Snowflake for historical tracking

## Setup Steps

### Step 1: Create Snowflake Account

1. Go to https://signup.snowflake.com/
2. Sign up for a free trial (30 days, $400 credit)
3. Choose your cloud provider (AWS, Azure, or GCP)
4. Choose your region

### Step 2: Get Your Account Details

After signup, you'll get:
- **Account Identifier**: Something like `xy12345.us-east-1` or `xy12345.us-east-1.aws`
- **Username**: The username you created
- **Password**: The password you set

### Step 3: Create Database and Schema

1. Log into Snowflake web interface
2. Go to **Worksheets** tab
3. Run the SQL from `server/database/snowflake-schema.sql`

Or run these commands:

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS ECO_NEXUS;

-- Use the database
USE DATABASE ECO_NEXUS;

-- Create schema
CREATE SCHEMA IF NOT EXISTS PUBLIC;

-- Use the schema
USE SCHEMA PUBLIC;

-- Then run all the CREATE TABLE statements from snowflake-schema.sql
```

### Step 4: Update .env File

Add these to your `server/.env`:

```env
# Snowflake Analytics (Optional)
SNOWFLAKE_ACCOUNT=xy12345.us-east-1
SNOWFLAKE_USER=your-username
SNOWFLAKE_PASSWORD=your-password
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=ECO_NEXUS
SNOWFLAKE_SCHEMA=PUBLIC
```

**Important Notes:**
- `SNOWFLAKE_ACCOUNT`: Your account identifier (without `.snowflakecomputing.com`)
- `SNOWFLAKE_WAREHOUSE`: Usually `COMPUTE_WH` (default warehouse)
- If you created a custom warehouse, use that name instead

### Step 5: Create Warehouse (if needed)

If `COMPUTE_WH` doesn't exist, create it:

```sql
CREATE WAREHOUSE IF NOT EXISTS COMPUTE_WH
  WITH WAREHOUSE_SIZE = 'X-SMALL'
  AUTO_SUSPEND = 60
  AUTO_RESUME = TRUE;
```

### Step 6: Grant Permissions

Make sure your user has permissions:

```sql
GRANT USAGE ON WAREHOUSE COMPUTE_WH TO ROLE PUBLIC;
GRANT ALL PRIVILEGES ON DATABASE ECO_NEXUS TO ROLE PUBLIC;
GRANT ALL PRIVILEGES ON SCHEMA ECO_NEXUS.PUBLIC TO ROLE PUBLIC;
```

## Testing the Connection

1. Start your server
2. Check logs for Snowflake connection messages
3. Complete a transaction
4. Check Snowflake to see if data was inserted

## What Gets Stored in Snowflake?

### Tables Created:

1. **USERS** - User analytics (synced from MongoDB)
2. **BUYER_REQUESTS** - Request analytics
3. **SELLER_QUOTES** - Quote analytics
4. **TRANSACTIONS** - All completed transactions
5. **CARBON_SAVINGS** - Carbon savings records (main analytics table)
6. **SELLER_RATINGS** - Seller performance ratings
7. **PRODUCT_EMISSIONS** - Product-level carbon data
8. **DAILY_SUMMARIES** - Daily aggregated metrics

### Data Flow:

```
Transaction Completed
    ↓
MongoDB (operational data)
    ↓
Snowflake (analytics data)
    ↓
Analytics Dashboard
```

## Troubleshooting

### Error: "Snowflake not configured"
- Check that all Snowflake env variables are set
- Verify account identifier format (no `.snowflakecomputing.com`)

### Error: "Connection timeout"
- Check your network/firewall
- Verify account identifier is correct
- Try different region

### Error: "Warehouse not found"
- Create the warehouse or update `SNOWFLAKE_WAREHOUSE` in .env
- Grant warehouse usage permissions

### Error: "Database not found"
- Run the SQL schema to create tables
- Verify `SNOWFLAKE_DATABASE` and `SNOWFLAKE_SCHEMA` in .env

## Cost Considerations

- **Free Trial**: 30 days, $400 credit
- **After Trial**: Pay-as-you-go (very cheap for small apps)
- **Auto-suspend**: Warehouse suspends after inactivity (saves money)
- **Data Storage**: First 10GB free, then ~$40/TB/month

## Best Practices

1. **Start with Free Trial** - Test everything first
2. **Use Auto-suspend** - Saves money when not in use
3. **Monitor Usage** - Check Snowflake dashboard for costs
4. **Optional Feature** - App works fine without it, add when needed

## Verification Queries

After setup, test with these queries in Snowflake:

```sql
-- Check if tables exist
SHOW TABLES IN SCHEMA ECO_NEXUS.PUBLIC;

-- Check user count
SELECT COUNT(*) FROM USERS;

-- Check transaction count
SELECT COUNT(*) FROM TRANSACTIONS;

-- Check carbon savings
SELECT SUM(CARBON_SAVED) FROM CARBON_SAVINGS;
```

## Next Steps

1. Set up Snowflake account
2. Run the schema SQL
3. Update .env with credentials
4. Restart server
5. Complete a test transaction
6. Verify data in Snowflake

That's it! Snowflake will automatically start storing analytics data once configured.

