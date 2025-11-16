# Quick MongoDB Setup - Step by Step

## 🚀 Fastest Way: MongoDB Atlas (5 minutes)

### Step 1: Create Account & Cluster
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up (free)
3. Click **"Build a Database"**
4. Choose **"M0 FREE"** (free forever)
5. Click **"Create"** (wait 3-5 minutes)

### Step 2: Create Database User
1. Click **"Database Access"** (left menu)
2. Click **"Add New Database User"**
3. Enter:
   - Username: `carbon_user` (or any name)
   - Password: Click **"Autogenerate Secure Password"** → **COPY IT!**
   - Role: **"Atlas admin"**
4. Click **"Add User"**

### Step 3: Whitelist Your IP
1. Click **"Network Access"** (left menu)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** → Enter `0.0.0.0/0`
   - ⚠️ **Only for development/testing!**
4. Click **"Confirm"**

### Step 4: Get Connection String
1. Click **"Database"** (left menu)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** → Version **"5.5 or later"**
5. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 5: Update Your .env File

Open `server/.env` and add:

```env
MONGO_URL=mongodb+srv://carbon_user:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/carbon_marketplace?retryWrites=true&w=majority
```

**Replace:**
- `carbon_user` → Your database username
- `YOUR_PASSWORD_HERE` → Your database password (from Step 2)
- `cluster0.xxxxx.mongodb.net` → Your actual cluster address
- Add `/carbon_marketplace` before the `?` (database name)

**Example:**
```env
MONGO_URL=mongodb+srv://carbon_user:MyP@ssw0rd123@cluster0.abc123.mongodb.net/carbon_marketplace?retryWrites=true&w=majority
```

### Step 6: Test Connection

```bash
cd server
node scripts/test-mongodb.js
```

**If you see:**
```
✅ Connected to MongoDB
✅ Connection successful!
```
**You're done! ✅**

**If you see an error:**
- Check your password is correct
- Check IP is whitelisted (Step 3)
- Make sure you added `/carbon_marketplace` to the connection string

---

## 🔧 Alternative: Local MongoDB

### Windows:
1. Download: https://www.mongodb.com/try/download/community
2. Install (default settings)
3. MongoDB starts automatically

### macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Then in `.env`:
```env
MONGO_URL=mongodb://localhost:27017/carbon_marketplace
```

---

## 📝 What Variable Names Work?

The app supports these (in order of priority):
1. ✅ `MONGO_URL` (recommended)
2. `MONGODB_URI`
3. `MONGODB_URL`

**You can also use separate variables:**
```env
MONGODB_HOST=cluster0.xxxxx.mongodb.net
MONGODB_USER=carbon_user
MONGO_DB_PASSWORD=your_password
MONGODB_DB_NAME=carbon_marketplace
```

---

## ❌ Common Issues

### "SSL error" or "Connection refused"
→ **Fix:** Whitelist your IP in MongoDB Atlas (Step 3)

### "Authentication failed"
→ **Fix:** Check username/password in connection string

### "MongoDB not connected"
→ **Fix:** Make sure MongoDB service is running (for local) or IP is whitelisted (for Atlas)

---

## ✅ After Setup

1. Test: `cd server && node scripts/test-mongodb.js`
2. Start backend: `cd server && npm run dev`
3. Start frontend: `cd client && npm run dev`
4. Open: http://localhost:3000

Your data will be saved in MongoDB! 🎉

