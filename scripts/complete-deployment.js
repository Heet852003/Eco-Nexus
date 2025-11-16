#!/usr/bin/env node
/**
 * Complete Automated Deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';

const RAILWAY_TOKEN = 'f2023a5f-23f4-4ce2-8ba3-1527c5be3fb9';
const VERCEL_TOKEN = 'fAgL0slFangI7CmWcMA80kLt';
const MONGODB_URI = 'mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority';
const JWT_SECRET = 'mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=';
const OPENROUTER_API_KEY = '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';
const FRONTEND_URL = 'https://client-693wg8yxg-heet-mehtas-projects.vercel.app';

console.log('🚀 COMPLETE DEPLOYMENT AUTOMATION\n');
console.log('='.repeat(50));
console.log('Step 1: Verifying Frontend Deployment...\n');

try {
  // Check Vercel deployment
  const vercelStatus = execSync(`vercel ls --token ${VERCEL_TOKEN} --yes`, { 
    encoding: 'utf-8',
    cwd: 'client'
  });
  console.log('✅ Frontend Status:');
  console.log(vercelStatus.split('\n').slice(0, 5).join('\n'));
  console.log('\n✅ Frontend is deployed!\n');
} catch (e) {
  console.log('⚠️  Could not verify Vercel status, but deployment should be live\n');
}

console.log('='.repeat(50));
console.log('Step 2: Setting up Railway Backend...\n');

// Create Railway environment file
const railwayEnv = `NODE_ENV=production
PORT=3001
MONGODB_URI=${MONGODB_URI}
JWT_SECRET=${JWT_SECRET}
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
LLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
SOLANA_RPC_URL=https://api.devnet.solana.com
CORS_ORIGINS=${FRONTEND_URL}
`;

fs.writeFileSync('server/.env.railway', railwayEnv);
console.log('✅ Created Railway environment file\n');

console.log('='.repeat(50));
console.log('Step 3: Railway Deployment Instructions\n');

console.log(`
Since Railway requires web interface for first deployment, follow these steps:

1. Go to: https://railway.app/new
2. Click: "Deploy from GitHub repo"
3. Select:
   - Repository: Heet852003/Eco-Nexus
   - Branch: ui-3
4. After project loads:
   - Click on the service
   - Settings → Root Directory: server
5. Variables tab → Copy-paste these variables:

${railwayEnv}

6. Wait 1-2 minutes for deployment
7. Copy Railway URL from Settings → Domains
`);

console.log('='.repeat(50));
console.log('Step 4: Connecting Frontend to Backend\n');

console.log(`
After you get your Railway URL:

1. Go to: https://vercel.com/heet-mehtas-projects/client/settings/environment-variables
2. Add variable:
   - Name: NEXT_PUBLIC_API_URL
   - Value: https://your-railway-url.railway.app
3. Save (Vercel will auto-redeploy)
`);

console.log('='.repeat(50));
console.log('Step 5: Final Configuration\n');

console.log(`
1. Go back to Railway
2. Variables → Update CORS_ORIGINS with your final Vercel production URL
3. Railway will auto-redeploy
`);

console.log('='.repeat(50));
console.log('\n✅ DEPLOYMENT SUMMARY\n');
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log('Backend URL: https://your-railway-url.railway.app (after Railway deployment)');
console.log('\n📋 All environment variables are ready in server/.env.railway');
console.log('\n🎉 Your website will be fully live after Railway deployment!\n');
