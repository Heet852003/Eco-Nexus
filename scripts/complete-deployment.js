#!/usr/bin/env node
/**
 * Complete Automated Deployment
 * Uses provided tokens to deploy everything
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your tokens
const RAILWAY_TOKEN = 'f2023a5f-23f4-4ce2-8ba3-1527c5be3fb9';
const VERCEL_TOKEN = 'fAgL0slFangI7CmWcMA80kLt';
const OPENROUTER_API_KEY = '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';
const MONGODB_URI = 'mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority';
const JWT_SECRET = 'mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=';

console.log('🚀 Complete Automated Deployment\n');

function exec(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf-8', 
      stdio: options.stdio || 'pipe',
      shell: true,
      ...options 
    });
    return { success: true, stdout: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || ''
    };
  }
}

// Install Railway CLI if needed
console.log('📦 Installing Railway CLI...');
if (!exec('railway --version').success) {
  if (process.platform === 'win32') {
    exec('powershell -Command "iwr https://railway.app/install.sh -useb | iex"', { stdio: 'inherit' });
  } else {
    exec('curl -fsSL https://railway.app/install.sh | sh', { stdio: 'inherit' });
  }
}

// Install Vercel CLI if needed
console.log('📦 Installing Vercel CLI...');
if (!exec('vercel --version').success) {
  exec('npm install -g vercel', { stdio: 'inherit' });
}

// Deploy Backend to Railway
console.log('\n🚂 Deploying Backend to Railway...');
try {
  process.chdir(path.join(__dirname, '..', 'server'));
  
  // Login
  console.log('Logging in to Railway...');
  exec(`railway login --token ${RAILWAY_TOKEN}`, { stdio: 'inherit' });
  
  // Initialize project if needed
  const status = exec('railway status', { stdio: 'pipe' });
  if (!status.success) {
    console.log('Initializing Railway project...');
    exec('railway init', { stdio: 'inherit' });
  }
  
  // Set environment variables
  console.log('Setting environment variables...');
  const envVars = {
    NODE_ENV: 'production',
    PORT: '3001',
    MONGODB_URI: MONGODB_URI,
    JWT_SECRET: JWT_SECRET,
    OPENROUTER_API_KEY: OPENROUTER_API_KEY,
    OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    LLM_MODEL: 'meta-llama/llama-3.2-3b-instruct:free',
    SOLANA_RPC_URL: 'https://api.devnet.solana.com',
    CORS_ORIGINS: 'https://your-app.vercel.app'
  };
  
  for (const [key, value] of Object.entries(envVars)) {
    exec(`railway variables set ${key}="${value.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
  }
  
  // Deploy
  console.log('Deploying...');
  exec('railway up', { stdio: 'inherit' });
  
  console.log('✅ Backend deployed to Railway!');
  
} catch (error) {
  console.error('❌ Railway deployment failed:', error.message);
}

// Deploy Frontend to Vercel
console.log('\n▲ Deploying Frontend to Vercel...');
try {
  process.chdir(path.join(__dirname, '..', 'client'));
  
  // Set token
  process.env.VERCEL_TOKEN = VERCEL_TOKEN;
  
  // Deploy
  console.log('Deploying to Vercel...');
  exec(`vercel --prod --token ${VERCEL_TOKEN} --yes`, { stdio: 'inherit' });
  
  console.log('✅ Frontend deployed to Vercel!');
  
} catch (error) {
  console.error('❌ Vercel deployment failed:', error.message);
}

console.log('\n✅ Deployment complete!');
console.log('Check your Railway and Vercel dashboards for URLs.');

