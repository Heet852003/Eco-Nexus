# Transaction Settlement & Analytics Implementation

## Summary of Changes

After a transaction is settled (quote accepted), the system now:
1. ✅ **Auto-commits to blockchain** - Saves transaction to Solana
2. ✅ **Calculates analytics scores** - Based on quantity, carbon credits, reliability
3. ✅ **Stores in Snowflake** - All analytics data synced to Snowflake
4. ✅ **Updates user scores** - Both buyer and seller scores updated
5. ✅ **Fixed 404 error** - Created transaction detail page

---

## Changes Made

### 1. Transaction Detail Page (Fixes 404)
**File:** `app/client/src/app/transaction/[id]/page.tsx`
- Created new page to display transaction details
- Shows transaction info, blockchain status, commit button
- Users can manually commit if auto-commit fails

### 2. Auto-Commit to Blockchain
**File:** `app/server/controllers/buyerController.js`
- After accepting quote, transaction auto-commits to blockchain
- Runs asynchronously (doesn't block response)
- Uses `setImmediate` to run in background

### 3. Analytics Scoring System
**File:** `app/server/services/scoringService.js`
- Added `calculateOverallScore()` function
- Calculates score based on:
  - **Quantity Score (25%)**: Total units purchased/sold
  - **Carbon Score (35%)**: Total green credits (carbon saved)
  - **Reliability Score (25%)**: User's reliability rating
  - **Transaction Score (15%)**: Number of completed transactions

### 4. Blockchain Controller Updates
**File:** `app/server/controllers/blockchainController.js`
- Enhanced to calculate and store analytics after blockchain commit
- Updates both buyer and seller scores
- Stores analytics in Snowflake

### 5. User Model Updates
**File:** `app/server/models/User.js`
- Added `updateCarbonSavings()` method
- Added `updateTotalTransactions()` method
- Tracks user's total carbon savings and transaction count

### 6. Snowflake Service Updates
**File:** `app/server/services/snowflakeService.js`
- Added `storeAnalyticsScore()` function
- Stores overall score and breakdown in `USER_ANALYTICS` table

### 7. Snowflake Schema Updates
**File:** `app/server/database/snowflake-schema.sql`
- Added `USER_ANALYTICS` table with:
  - Overall score
  - Quantity score
  - Carbon score
  - Reliability score
  - Transaction score
  - Quantity purchased
  - Green credits
  - Total transactions

### 8. Transaction Routes
**File:** `app/server/routes/transaction.js` (NEW)
- Added route to get transaction by ID
- File: `app/server/controllers/transactionController.js` (NEW)

### 9. API Client Updates
**File:** `app/client/src/lib/api.ts`
- Added `getTransaction()` function
- Added `commitTransactionToBlockchain()` function

---

## How It Works

### Flow After Quote Acceptance:

1. **Transaction Created**
   - Buyer accepts quote
   - Transaction created with status `PENDING`
   - Request and quote statuses updated

2. **Auto-Commit to Blockchain** (Background)
   - Transaction committed to Solana blockchain
   - SCC tokens minted
   - Transaction status → `COMMITTED`

3. **Analytics Calculation**
   - Calculate carbon saved: `carbonScore × quantity`
   - Update seller reliability score
   - Update buyer carbon savings
   - Calculate overall scores for both users

4. **Snowflake Storage**
   - Store transaction record
   - Store carbon savings
   - Store analytics scores (overall + breakdown)

5. **User Updates**
   - Seller: Reliability score updated
   - Buyer: Carbon savings and transaction count updated
   - Both: Analytics scores stored in Snowflake

---

## Scoring Formula

### Overall Score Calculation:
```
Overall Score = 
  (Quantity Score × 0.25) +
  (Carbon Score × 0.35) +
  (Reliability Score × 0.25) +
  (Transaction Score × 0.15)
```

### Individual Scores:
- **Quantity Score**: `min(100, (quantity / 100) × 100)` - Max 100 for 100+ units
- **Carbon Score**: `min(100, (greenCredits / 1000) × 100)` - Max 100 for 1000+ credits
- **Reliability Score**: Already 0-100 (from seller reliability calculation)
- **Transaction Score**: `min(100, (transactions / 10) × 100)` - Max 100 for 10+ transactions

---

## Snowflake Setup

### 1. Create Database & Schema
```sql
CREATE DATABASE IF NOT EXISTS ECO_NEXUS;
USE DATABASE ECO_NEXUS;
CREATE SCHEMA IF NOT EXISTS PUBLIC;
USE SCHEMA PUBLIC;
```

### 2. Run Schema File
Execute `app/server/database/snowflake-schema.sql` to create all tables including:
- `USERS`
- `BUYER_REQUESTS`
- `SELLER_QUOTES`
- `TRANSACTIONS`
- `CARBON_SAVINGS`
- `SELLER_RATINGS`
- `USER_ANALYTICS` (NEW)

### 3. Environment Variables
Add to `.env`:
```
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=ECO_NEXUS
SNOWFLAKE_SCHEMA=PUBLIC
```

---

## Testing

1. **Accept a Quote**
   - Buyer accepts a quote
   - Should redirect to `/transaction/[id]` (no more 404)

2. **Check Transaction Page**
   - Should show transaction details
   - Status should be `pending` initially
   - Auto-commits in background

3. **Verify Blockchain**
   - Check transaction status updates to `committed`
   - Blockchain signature should appear

4. **Check Analytics**
   - User scores should update
   - Check Snowflake `USER_ANALYTICS` table
   - Overall score calculated correctly

---

## Notes

- Auto-commit runs asynchronously (doesn't block user)
- If blockchain commit fails, user can manually retry from transaction page
- Analytics calculation happens after blockchain commit
- All scores stored in both MongoDB (for quick access) and Snowflake (for analytics)
- Snowflake is optional - system works without it but analytics won't be stored

