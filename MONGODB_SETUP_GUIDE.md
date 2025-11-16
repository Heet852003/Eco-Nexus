# MongoDB Setup Guide for Eco-Nexus Carbon Marketplace

This guide covers setting up MongoDB for the Carbon Marketplace application. You can use either **MongoDB Atlas (Cloud)** or **Local MongoDB**.

---

## Option 1: MongoDB Atlas (Recommended - Cloud)

MongoDB Atlas is a cloud-hosted MongoDB service. It's free for development and doesn't require local installation.

### Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (or log in if you already have one)
3. Choose the **FREE (M0) tier** for development

### Step 2: Create a Cluster

1. After logging in, click **"Build a Database"** or **"Create"**
2. Choose **"M0 FREE"** tier (Free forever, shared cluster)
3. Select a **Cloud Provider** (AWS, Google Cloud, or Azure)
4. Choose a **Region** closest to you
5. Name your cluster (e.g., "EcoNexus" or "CarbonMarketplace")
6. Click **"Create"** (takes 3-5 minutes)

### Step 3: Create Database User

1. In the **Security** section, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter:
   - **Username**: `tangolearns_db_user` (or your preferred username)
   - **Password**: Click "Autogenerate Secure Password" or create your own
   - **Save the password** - you'll need it!
5. Under **"Database User Privileges"**, select **"Atlas admin"** or **"Read and write to any database"**
6. Click **"Add User"**

### Step 4: Configure Network Access (IP Whitelist)

1. In the **Security** section, click **"Network Access"**
2. Click **"Add IP Address"**
3. For development, you can:
   - **Option A (Recommended for testing)**: Click **"Allow Access from Anywhere"** and add `0.0.0.0/0`
     - ⚠️ **Warning**: Only use this for development/testing, not production!
   - **Option B (More secure)**: Add your specific IP address
     - Click **"Add Current IP Address"** to add your current IP
     - Or manually enter your IP: `xxx.xxx.xxx.xxx/32`
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go to **"Database"** section (or click **"Connect"** on your cluster)
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"5.5 or later"**
5. Copy the connection string - it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` with your database username
7. Replace `<password>` with your database password (URL-encode special characters if needed)
8. Add your database name at the end:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/carbon_marketplace?retryWrites=true&w=majority
   ```

### Step 6: Configure Environment Variables

1. Open `server/.env` file
2. Add or update these variables:

```env
# MongoDB Atlas Connection (Full URI with credentials)
MONGO_URL=mongodb+srv://tangolearns_db_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/carbon_marketplace?retryWrites=true&w=majority

# OR if you want to use separate variables:
# MONGODB_HOST=cluster0.xxxxx.mongodb.net
# MONGODB_USER=tangolearns_db_user
# MONGO_DB_PASSWORD=YOUR_PASSWORD
# MONGODB_DB_NAME=carbon_marketplace
```

**Important Notes:**
- Replace `YOUR_PASSWORD` with your actual database password
- If your password contains special characters (`@`, `:`, `/`, `#`, `?`, etc.), you need to URL-encode them:
  - `@` → `%40`
  - `:` → `%3A`
  - `/` → `%2F`
  - `#` → `%23`
  - `?` → `%3F`
- The database name `carbon_marketplace` will be created automatically on first connection

### Step 7: Test Connection

Run the test script:
```bash
cd server
node scripts/test-mongodb.js
```

You should see:
```
✅ Connected to MongoDB
✅ Connection successful!
📊 Users in database: 0
```

---

## Option 2: Local MongoDB (Alternative)

If you prefer to run MongoDB locally on your machine.

### Step 1: Install MongoDB

**Windows:**
1. Download MongoDB Community Server from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Choose "Complete" installation
4. Install MongoDB as a Windows Service (recommended)
5. Install MongoDB Compass (GUI tool) - optional but helpful

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install -y mongodb
```

### Step 2: Start MongoDB Service

**Windows:**
- MongoDB should start automatically as a Windows Service
- Or start manually: Open Services → Find "MongoDB" → Start

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod  # Start on boot
```

### Step 3: Verify MongoDB is Running

```bash
# Test connection
mongosh
# Or older versions:
mongo
```

You should see:
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017
```

### Step 4: Create Database User (Optional but Recommended)

```bash
mongosh
```

Then run:
```javascript
use carbon_marketplace
db.createUser({
  user: "carbon_user",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "carbon_marketplace" }]
})
```

### Step 5: Configure Environment Variables

Open `server/.env`:

```env
# Local MongoDB Connection
MONGO_URL=mongodb://localhost:27017/carbon_marketplace

# OR with authentication:
# MONGO_URL=mongodb://carbon_user:your_secure_password@localhost:27017/carbon_marketplace?authSource=carbon_marketplace

# OR use separate variables:
# MONGODB_HOST=localhost:27017
# MONGODB_USER=carbon_user
# MONGO_DB_PASSWORD=your_secure_password
# MONGODB_DB_NAME=carbon_marketplace
```

### Step 6: Test Connection

```bash
cd server
node scripts/test-mongodb.js
```

---

## Environment Variable Options

The application supports multiple ways to configure MongoDB:

### Option A: Full Connection String (Easiest)
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```

### Option B: Separate Variables
```env
MONGODB_HOST=cluster0.xxxxx.mongodb.net
MONGODB_USER=username
MONGO_DB_PASSWORD=password
MONGODB_DB_NAME=carbon_marketplace
```

### Option C: Alternative Variable Names (Also Supported)
```env
MONGODB_URI=mongodb+srv://...
# OR
MONGODB_URL=mongodb+srv://...
```

**Note:** The application checks for these in order:
1. `MONGO_URL`
2. `MONGODB_URI`
3. `MONGODB_URL`

---

## Troubleshooting

### SSL/TLS Error (MongoDB Atlas)

**Error:** `SSL routines:ssl3_read_bytes:tlsv1 alert internal error`

**Solutions:**
1. **Check IP Whitelist**: Your IP must be whitelisted in MongoDB Atlas Network Access
2. **Check Password**: Ensure password is correct and URL-encoded if it has special characters
3. **Check Connection String**: Verify the full connection string is correct
4. **Try from MongoDB Compass**: Test the connection string in MongoDB Compass first

### Connection Refused (Local MongoDB)

**Error:** `connect ECONNREFUSED 127.0.0.1:27017`

**Solutions:**
1. **Check if MongoDB is running**: 
   ```bash
   # Windows
   Get-Service MongoDB
   
   # macOS/Linux
   brew services list
   # OR
   sudo systemctl status mongod
   ```
2. **Start MongoDB service** (see Step 2 above)
3. **Check firewall**: Ensure port 27017 is not blocked

### Authentication Failed

**Error:** `Authentication failed`

**Solutions:**
1. **Verify username and password** are correct
2. **Check database name** matches the one where the user was created
3. **For local MongoDB**, ensure `authSource` parameter is set correctly

---

## Recommended Setup for Development

**For quick setup (testing):**
- Use **MongoDB Atlas** (free tier)
- Whitelist `0.0.0.0/0` (allow all IPs) - **ONLY for development**
- Use full connection string in `MONGO_URL`

**For production:**
- Use **MongoDB Atlas** (paid tier for better performance)
- Whitelist specific IP addresses only
- Use environment-specific connection strings
- Enable MongoDB Atlas monitoring and backups

---

## Next Steps

After MongoDB is connected:

1. **Test the connection:**
   ```bash
   cd server
   node scripts/test-mongodb.js
   ```

2. **Start the servers:**
   ```bash
   # Backend (in one terminal)
   cd server
   npm run dev
   
   # Frontend (in another terminal)
   cd client
   npm run dev
   ```

3. **Verify in application:**
   - Register a new user
   - Create a buyer request
   - Check if data is saved in MongoDB

4. **View data in MongoDB:**
   - **MongoDB Atlas**: Use the built-in Data Explorer
   - **Local MongoDB**: Use MongoDB Compass or `mongosh`

---

## Database Collections

The application will automatically create these collections:
- `users` - User accounts and profiles
- `buyerRequests` - Buyer carbon credit requests
- `sellerQuotes` - Seller quotes for requests
- `transactions` - Completed transactions
- `negotiationThreads` - Chat threads for negotiations
- `chatMessages` - Chat messages in threads

Indexes are created automatically on first connection.

---

## Support

If you encounter issues:
1. Check the MongoDB connection test: `node scripts/test-mongodb.js`
2. Check server logs for MongoDB connection messages
3. Verify environment variables are set correctly
4. Test connection string in MongoDB Compass (for Atlas) or `mongosh` (for local)

