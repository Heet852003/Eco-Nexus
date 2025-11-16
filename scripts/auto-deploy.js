#!/usr/bin/env node
/**
 * Automated Deployment Script
 * This script helps automate the deployment process
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Automated Deployment...\n');

// Check if required tools are installed
function checkTool(tool, installCommand) {
  try {
    execSync(`which ${tool}`, { stdio: 'ignore' });
    console.log(`✅ ${tool} is installed`);
    return true;
  } catch {
    console.log(`❌ ${tool} is not installed`);
    console.log(`   Install with: ${installCommand}`);
    return false;
  }
}

// Check prerequisites
console.log('📋 Checking prerequisites...\n');
const hasRailway = checkTool('railway', 'npm install -g @railway/cli');
const hasVercel = checkTool('vercel', 'npm install -g vercel');
const hasGit = checkTool('git', 'Install Git from https://git-scm.com');

if (!hasGit) {
  console.error('\n❌ Git is required. Please install it first.');
  process.exit(1);
}

// Read environment variables
const envVars = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority',
  JWT_SECRET: process.env.JWT_SECRET || 'mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  RAILWAY_TOKEN: process.env.RAILWAY_TOKEN,
  VERCEL_TOKEN: process.env.VERCEL_TOKEN,
};

console.log('\n📦 Environment Variables:');
console.log(`   MONGODB_URI: ${envVars.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
console.log(`   JWT_SECRET: ${envVars.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`   OPENROUTER_API_KEY: ${envVars.OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   RAILWAY_TOKEN: ${envVars.RAILWAY_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`   VERCEL_TOKEN: ${envVars.VERCEL_TOKEN ? '✅ Set' : '❌ Missing'}`);

if (!envVars.OPENROUTER_API_KEY) {
  console.log('\n⚠️  OPENROUTER_API_KEY is missing. Get it from https://openrouter.ai/keys');
}

if (hasRailway && envVars.RAILWAY_TOKEN) {
  console.log('\n🚂 Deploying Backend to Railway...');
  try {
    process.chdir(path.join(__dirname, '..', 'server'));
    execSync('railway login --token ' + envVars.RAILWAY_TOKEN, { stdio: 'inherit' });
    execSync('railway up', { stdio: 'inherit' });
    console.log('✅ Backend deployed to Railway!');
  } catch (error) {
    console.error('❌ Backend deployment failed:', error.message);
  }
} else {
  console.log('\n⏭️  Skipping Railway deployment (CLI not installed or token missing)');
  console.log('   To deploy manually: https://railway.app');
}

if (hasVercel && envVars.VERCEL_TOKEN) {
  console.log('\n▲ Deploying Frontend to Vercel...');
  try {
    process.chdir(path.join(__dirname, '..', 'client'));
    execSync(`vercel --prod --token ${envVars.VERCEL_TOKEN} --yes`, { stdio: 'inherit' });
    console.log('✅ Frontend deployed to Vercel!');
  } catch (error) {
    console.error('❌ Frontend deployment failed:', error.message);
  }
} else {
  console.log('\n⏭️  Skipping Vercel deployment (CLI not installed or token missing)');
  console.log('   To deploy manually: https://vercel.com');
}

console.log('\n✅ Deployment process completed!');
console.log('\n📝 Next steps:');
console.log('   1. Get your deployment URLs from Railway/Vercel dashboards');
console.log('   2. Update CORS_ORIGINS in Railway with your Vercel URL');
console.log('   3. Test your deployed application');

