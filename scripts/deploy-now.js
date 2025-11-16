#!/usr/bin/env node
/**
 * One-Click Deployment Script
 * Automates the entire deployment process
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe', ...options });
  } catch (error) {
    return { error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

console.log('🚀 Automated Deployment Script\n');
console.log('This script will deploy your website automatically!\n');

// Step 1: Check prerequisites
console.log('📋 Step 1: Checking prerequisites...\n');

const hasNode = exec('node --version').error === undefined;
const hasNpm = exec('npm --version').error === undefined;
const hasGit = exec('git --version').error === undefined;

if (!hasNode || !hasNpm) {
  console.error('❌ Node.js and npm are required. Please install them first.');
  process.exit(1);
}

console.log('✅ Node.js:', exec('node --version').stdout.trim());
console.log('✅ npm:', exec('npm --version').stdout.trim());
console.log('✅ Git:', exec('git --version').stdout.trim());

// Step 2: Install CLI tools if needed
console.log('\n📦 Step 2: Installing deployment tools...\n');

// Check Railway CLI
let hasRailway = exec('railway --version').error === undefined;
if (!hasRailway) {
  console.log('Installing Railway CLI...');
  try {
    if (process.platform === 'win32') {
      exec('powershell -Command "iwr https://railway.app/install.sh -useb | iex"', { stdio: 'inherit' });
    } else {
      exec('curl -fsSL https://railway.app/install.sh | sh', { stdio: 'inherit' });
    }
    hasRailway = exec('railway --version').error === undefined;
  } catch (e) {
    console.log('⚠️  Railway CLI installation may have failed. Please install manually:');
    console.log('   Windows: iwr https://railway.app/install.sh -useb | iex');
    console.log('   Mac/Linux: curl -fsSL https://railway.app/install.sh | sh');
  }
}

// Check Vercel CLI
let hasVercel = exec('vercel --version').error === undefined;
if (!hasVercel) {
  console.log('Installing Vercel CLI...');
  try {
    exec('npm install -g vercel', { stdio: 'inherit' });
    hasVercel = exec('vercel --version').error === undefined;
  } catch (e) {
    console.log('⚠️  Vercel CLI installation may have failed.');
  }
}

if (hasRailway) {
  console.log('✅ Railway CLI installed');
} else {
  console.log('❌ Railway CLI not available');
}

if (hasVercel) {
  console.log('✅ Vercel CLI installed');
} else {
  console.log('❌ Vercel CLI not available');
}

// Step 3: Get credentials
console.log('\n🔑 Step 3: Setting up credentials...\n');

const railwayToken = process.env.RAILWAY_TOKEN || await question('Railway Token (or press Enter to skip): ');
const vercelToken = process.env.VERCEL_TOKEN || await question('Vercel Token (or press Enter to skip): ');

// Step 4: Deploy Backend
if (hasRailway && railwayToken) {
  console.log('\n🚂 Step 4: Deploying Backend to Railway...\n');
  
  try {
    process.chdir(path.join(__dirname, '..', 'server'));
    
    // Login to Railway
    console.log('Logging in to Railway...');
    exec(`railway login --token ${railwayToken}`, { stdio: 'inherit' });
    
    // Deploy
    console.log('Deploying to Railway...');
    exec('railway up', { stdio: 'inherit' });
    
    console.log('\n✅ Backend deployed to Railway!');
    
    // Get Railway URL
    const url = exec('railway domain').stdout.trim();
    if (url) {
      console.log(`🌐 Backend URL: ${url}`);
    }
  } catch (error) {
    console.error('❌ Backend deployment failed:', error.message);
    console.log('\n💡 Manual deployment:');
    console.log('   1. Go to https://railway.app');
    console.log('   2. Create new project from GitHub');
    console.log('   3. Select ui-3 branch');
    console.log('   4. Set root directory: server');
    console.log('   5. Add environment variables');
  }
} else {
  console.log('\n⏭️  Skipping Railway deployment');
  console.log('   Set RAILWAY_TOKEN environment variable or deploy manually at https://railway.app');
}

// Step 5: Deploy Frontend
if (hasVercel && vercelToken) {
  console.log('\n▲ Step 5: Deploying Frontend to Vercel...\n');
  
  try {
    process.chdir(path.join(__dirname, '..', 'client'));
    
    // Deploy to Vercel
    console.log('Deploying to Vercel...');
    exec(`vercel --prod --token ${vercelToken} --yes`, { stdio: 'inherit' });
    
    console.log('\n✅ Frontend deployed to Vercel!');
  } catch (error) {
    console.error('❌ Frontend deployment failed:', error.message);
    console.log('\n💡 Manual deployment:');
    console.log('   1. Go to https://vercel.com');
    console.log('   2. Import GitHub repository');
    console.log('   3. Select ui-3 branch');
    console.log('   4. Set root directory: client');
    console.log('   5. Add environment variables');
  }
} else {
  console.log('\n⏭️  Skipping Vercel deployment');
  console.log('   Set VERCEL_TOKEN environment variable or deploy manually at https://vercel.com');
}

rl.close();

console.log('\n✅ Deployment process completed!');
console.log('\n📝 Next steps:');
console.log('   1. Get your deployment URLs from Railway/Vercel dashboards');
console.log('   2. Update CORS_ORIGINS in Railway with your Vercel URL');
console.log('   3. Test your deployed application');
console.log('\n🎉 Your website should be live!');

