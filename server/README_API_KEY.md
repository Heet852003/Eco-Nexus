# OpenRouter API Key Setup

## Quick Setup

1. **Get your API key:**
   - Go to https://openrouter.ai/keys
   - Sign up or log in
   - Create a new API key
   - Copy the key (it should start with `sk-or-`)

2. **Create `.env` file in the `server` folder:**
   ```bash
   cd server
   cp env.template .env
   ```

3. **Edit `.env` file:**
   - Open `server/.env` in a text editor
   - Find the line: `OPENROUTER_API_KEY=your-openrouter-api-key`
   - Replace `your-openrouter-api-key` with your actual key:
     ```
     OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx
     ```

4. **Restart your server:**
   - Stop the server (Ctrl+C)
   - Start it again: `npm start` or `node server.js`

## Troubleshooting

### Error: "OpenRouter API key not configured"
- Make sure you created a `.env` file in the `server` folder
- Check that `OPENROUTER_API_KEY` is set in the `.env` file
- Make sure the key doesn't have quotes around it: `OPENROUTER_API_KEY=sk-or-xxx` (not `OPENROUTER_API_KEY="sk-or-xxx"`)

### Error: "OpenRouter API key is invalid or expired" (401)
- Your API key might be wrong or expired
- Get a new key from https://openrouter.ai/keys
- Make sure you copied the entire key (they're long!)

### Error: "OpenRouter API rate limit exceeded" (429)
- You've hit the rate limit for the free tier
- Wait a few minutes and try again
- Or upgrade your plan at https://openrouter.ai

### Error: "Provider returned error" (429)
- The free model `meta-llama/llama-3.2-3b-instruct:free` is rate-limited
- Try using a different model in `.env`:
  ```
  LLM_MODEL=google/gemini-flash-1.5:free
  ```
  Or add your own API key to get better rate limits

## Example .env file

```env
PORT=3001
JWT_SECRET=your-secret-key
MONGO_URL=mongodb://localhost:27017/carbon_marketplace

# OpenRouter API (REQUIRED for AI features)
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
LLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

## Free Models Available

If you're using the free tier, you can try these models:
- `meta-llama/llama-3.2-3b-instruct:free`
- `google/gemini-flash-1.5:free`
- `mistralai/mistral-7b-instruct:free`

Note: Free models have rate limits. For production, consider adding your own API key.

