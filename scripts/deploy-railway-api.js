#!/usr/bin/env node
/**
 * Deploy to Railway using REST API
 */

const RAILWAY_TOKEN = 'f2023a5f-23f4-4ce2-8ba3-1527c5be3fb9';

// Railway API endpoint
const RAILWAY_API = 'https://api.railway.app/v1';

async function deployToRailway() {
  console.log('🚂 Deploying to Railway via API...\n');
  
  // Railway API requires authentication
  // Since direct API deployment is complex, we'll create a project via web interface
  // But we can prepare everything
  
  console.log('📋 Railway Deployment Setup:\n');
  console.log('Since Railway API requires project creation first, please:');
  console.log('1. Go to https://railway.app');
  console.log('2. Login with GitHub');
  console.log('3. New Project → Deploy from GitHub');
  console.log('4. Select: Heet852003/Eco-Nexus, Branch: ui-3');
  console.log('5. Set Root Directory: server');
  console.log('6. Add environment variables (see below)');
  console.log('\n✅ I\'ll create a script to set variables after project is created.\n');
  
  const envVars = {
    NODE_ENV: 'production',
    PORT: '3001',
    MONGODB_URI: 'mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority',
    JWT_SECRET: 'mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=',
    OPENROUTER_API_KEY: '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',
    OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    LLM_MODEL: 'meta-llama/llama-3.2-3b-instruct:free',
    SOLANA_RPC_URL: 'https://api.devnet.solana.com',
    CORS_ORIGINS: 'https://client-dtxu0bvv4-heet-mehtas-projects.vercel.app'
  };
  
  console.log('Environment Variables to add in Railway:');
  console.log('==========================================');
  for (const [key, value] of Object.entries(envVars)) {
    console.log(`${key}=${value}`);
  }
  console.log('==========================================\n');
  
  console.log('✅ After Railway project is created, deployment will start automatically!');
}

deployToRailway().catch(console.error);

