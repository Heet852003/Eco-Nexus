#!/usr/bin/env node
/**
 * Automated Deployment with Provided Tokens
 * Deploys backend to Railway and frontend to Vercel automatically
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Using CLI tools directly, no axios needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your provided tokens
const RAILWAY_TOKEN = 'f2023a5f-23f4-4ce2-8ba3-1527c5be3fb9';
const VERCEL_TOKEN = 'fAgL0slFangI7CmWcMA80kLt';
const OPENROUTER_API_KEY = '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';
const MONGODB_URI = 'mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority';
const JWT_SECRET = 'mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=';

console.log('🚀 Starting Automated Deployment...\n');

// Environment variables for Railway
const railwayEnvVars = {
  NODE_ENV: 'production',
  PORT: '3001',
  MONGODB_URI: MONGODB_URI,
  JWT_SECRET: JWT_SECRET,
  OPENROUTER_API_KEY: OPENROUTER_API_KEY,
  OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  LLM_MODEL: 'meta-llama/llama-3.2-3b-instruct:free',
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  CORS_ORIGINS: 'https://your-app.vercel.app' // Will update after Vercel deployment
};

// Function to execute commands
function exec(command, options = {}) {
  try {
    const result = execSync(command, { encoding: 'utf-8', stdio: options.stdio || 'pipe', ...options });
    return { success: true, stdout: result, stderr: '' };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      stdout: error.stdout?.toString() || '', 
      stderr: error.stderr?.toString() || '' 
    };
  }
}

// Step 1: Install CLI tools if needed
console.log('📦 Step 1: Checking/Installing CLI tools...\n');

let hasRailway = exec('railway --version').success;
if (!hasRailway) {
  console.log('Installing Railway CLI...');
  if (process.platform === 'win32') {
    exec('powershell -Command "iwr https://railway.app/install.sh -useb | iex"', { stdio: 'inherit' });
  } else {
    exec('curl -fsSL https://railway.app/install.sh | sh', { stdio: 'inherit' });
  }
  hasRailway = exec('railway --version').success;
}

let hasVercel = exec('vercel --version').success;
if (!hasVercel) {
  console.log('Installing Vercel CLI...');
  exec('npm install -g vercel', { stdio: 'inherit' });
  hasVercel = exec('vercel --version').success;
}

// Step 2: Deploy Backend to Railway
console.log('\n🚂 Step 2: Deploying Backend to Railway...\n');

if (hasRailway) {
  try {
    process.chdir(path.join(__dirname, '..', 'server'));
    
    // Login to Railway
    console.log('Logging in to Railway...');
    exec(`railway login --token ${RAILWAY_TOKEN}`, { stdio: 'inherit' });
    
    // Check if project exists, if not create one
    console.log('Setting up Railway project...');
    const projectCheck = exec('railway status', { stdio: 'pipe' });
    
    if (!projectCheck.success) {
      console.log('Creating new Railway project...');
      exec('railway init', { stdio: 'inherit' });
    }
    
    // Set environment variables
    console.log('Setting environment variables...');
    for (const [key, value] of Object.entries(railwayEnvVars)) {
      exec(`railway variables set ${key}="${value}"`, { stdio: 'pipe' });
    }
    
    // Deploy
    console.log('Deploying to Railway...');
    exec('railway up', { stdio: 'inherit' });
    
    // Get Railway URL
    console.log('Getting Railway URL...');
    const domainResult = exec('railway domain', { stdio: 'pipe' });
    const railwayUrl = domainResult.stdout.trim() || 'Check Railway dashboard for URL';
    
    console.log(`\n✅ Backend deployed to Railway!`);
    console.log(`🌐 Backend URL: ${railwayUrl}`);
    
    // Update CORS_ORIGINS after we get Vercel URL
    railwayEnvVars.RAILWAY_URL = railwayUrl;
    
  } catch (error) {
    console.error('❌ Railway deployment error:', error.message);
    console.log('\n💡 You can deploy manually at https://railway.app');
  }
} else {
  console.log('⚠️  Railway CLI not available. Please install it manually.');
}

// Step 3: Deploy Frontend to Vercel
console.log('\n▲ Step 3: Deploying Frontend to Vercel...\n');

if (hasVercel) {
  try {
    process.chdir(path.join(__dirname, '..', 'client'));
    
    // Set Vercel token
    process.env.VERCEL_TOKEN = VERCEL_TOKEN;
    
    // Check if project exists
    const vercelCheck = exec('vercel ls --token ' + VERCEL_TOKEN, { stdio: 'pipe' });
    
    // Deploy to Vercel
    console.log('Deploying to Vercel...');
    const deployResult = exec(`vercel --prod --token ${VERCEL_TOKEN} --yes`, { stdio: 'inherit' });
    
    // Get deployment URL from output or vercel ls
    const lsResult = exec('vercel ls --token ' + VERCEL_TOKEN, { stdio: 'pipe' });
    let vercelUrl = 'Check Vercel dashboard for URL';
    
    if (lsResult.success) {
      const lines = lsResult.stdout.split('\n');
      const urlLine = lines.find(line => line.includes('vercel.app'));
      if (urlLine) {
        vercelUrl = urlLine.trim().split(/\s+/)[0];
      }
    }
    
    console.log(`\n✅ Frontend deployed to Vercel!`);
    console.log(`🌐 Frontend URL: ${vercelUrl}`);
    
    // Update Railway CORS if we have both URLs
    if (railwayEnvVars.RAILWAY_URL && vercelUrl.includes('vercel.app')) {
      console.log('\n🔄 Updating CORS settings...');
      process.chdir(path.join(__dirname, '..', 'server'));
      exec(`railway variables set CORS_ORIGINS="${vercelUrl}"`, { stdio: 'pipe' });
      console.log('✅ CORS updated!');
    }
    
  } catch (error) {
    console.error('❌ Vercel deployment error:', error.message);
    console.log('\n💡 You can deploy manually at https://vercel.com');
  }
} else {
  console.log('⚠️  Vercel CLI not available. Please install it manually.');
}

console.log('\n✅ Deployment process completed!');
console.log('\n📝 Next steps:');
console.log('   1. Check Railway dashboard: https://railway.app');
console.log('   2. Check Vercel dashboard: https://vercel.com');
console.log('   3. Update CORS_ORIGINS in Railway with your Vercel URL');
console.log('   4. Test your deployed application');
console.log('\n🎉 Your website should be live!');

