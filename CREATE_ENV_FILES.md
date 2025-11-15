# How to Create .env Files

Since `.env` files are git-ignored for security, you need to create them manually from the templates.

## Quick Setup

### Backend
```bash
cd backend
cp env.template .env
# Then edit .env and add your API keys
```

### Frontend
```bash
cd frontend
cp env.local.template .env.local
# Then edit .env.local and set your backend URL
```

## Step-by-Step Instructions

### 1. Backend Environment File

1. Navigate to backend directory:
   ```bash
   cd eco-nexus/backend
   ```

2. Copy the template:
   ```bash
   cp env.template .env
   ```

3. Open `.env` in your editor and fill in:
   - `OPENROUTER_API_KEY` - Get from https://openrouter.ai (free)
   - (Optional) Snowflake credentials if you want analytics
   - (Optional) Other settings as needed

### 2. Frontend Environment File

1. Navigate to frontend directory:
   ```bash
   cd eco-nexus/frontend
   ```

2. Copy the template:
   ```bash
   cp env.local.template .env.local
   ```

3. Open `.env.local` in your editor and set:
   - `NEXT_PUBLIC_API_URL` - Your backend URL (default: `http://localhost:3001`)

## Minimum Required Configuration

### Backend `.env` (Minimum)
```env
PORT=3001
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

### Frontend `.env.local` (Minimum)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Getting Your OpenRouter API Key

1. Visit https://openrouter.ai
2. Sign up for a free account
3. Go to "Keys" in the dashboard
4. Click "Create Key"
5. Copy the key (starts with `sk-or-v1-`)
6. Paste it in `backend/.env` as `OPENROUTER_API_KEY`

## Verification

After creating the files, verify they exist:

```bash
# Check backend
ls backend/.env
# Should show: backend/.env

# Check frontend
ls frontend/.env.local
# Should show: frontend/.env.local
```

## Important Notes

- ✅ `.env` and `.env.local` files are git-ignored (safe)
- ✅ Template files (`env.template`, `env.local.template`) are safe to commit
- ⚠️ Never commit actual API keys to git
- ⚠️ Never share your `.env` files publicly

## Troubleshooting

### "File not found" error
- Make sure you're in the correct directory
- Verify the template file exists: `ls env.template`

### "Permission denied"
- On Windows: Use PowerShell or Command Prompt
- On Linux/Mac: You may need `sudo` (but usually not)

### Variables not working
- Restart your development server after creating/editing `.env` files
- Check for typos in variable names
- Ensure no extra spaces around `=` sign

## Next Steps

After creating your `.env` files:

1. **Backend**: Start the server
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend**: Start the app
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test**: Visit http://localhost:3000

For more details, see [ENV_SETUP.md](./ENV_SETUP.md)

