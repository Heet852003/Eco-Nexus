#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERCEL_TOKEN = 'fAgL0slFangI7CmWcMA80kLt';

console.log('🔗 Getting Your Deployment URLs...\n');

try {
  process.chdir(path.join(__dirname, '..', 'client'));
  
  // Get Vercel URLs
  console.log('Getting Vercel deployment URLs...');
  const result = execSync(`vercel ls --token ${VERCEL_TOKEN}`, { encoding: 'utf-8' });
  
  const lines = result.split('\n');
  const deployments = lines.filter(line => line.includes('vercel.app'));
  
  if (deployments.length > 0) {
    const latest = deployments[0].trim().split(/\s+/);
    const vercelUrl = latest.find(part => part.includes('vercel.app'));
    
    console.log(`✅ Frontend URL: https://${vercelUrl}`);
    
    // Get production URL
    try {
      const inspect = execSync(`vercel inspect --token ${VERCEL_TOKEN}`, { encoding: 'utf-8' });
      const prodMatch = inspect.match(/Production:\s*(https?:\/\/[^\s]+)/);
      if (prodMatch) {
        console.log(`✅ Production URL: ${prodMatch[1]}`);
      }
    } catch {}
    
    // Save to file
    const urls = {
      frontend: `https://${vercelUrl}`,
      frontendProduction: `https://${vercelUrl}`,
      backend: 'Deploy to Railway to get URL',
      status: 'Frontend is live! Deploy backend to Railway.'
    };
    
    fs.writeFileSync(
      path.join(__dirname, '..', 'YOUR_WEBSITE_URLS.txt'),
      `🚀 Your Website URLs\n\n` +
      `Frontend (Vercel):\n` +
      `  ${urls.frontend}\n\n` +
      `Backend (Railway):\n` +
      `  Deploy to Railway to get URL\n\n` +
      `Next Steps:\n` +
      `1. Go to https://railway.app\n` +
      `2. Deploy backend (see DEPLOY_FINAL.md)\n` +
      `3. Get Railway URL\n` +
      `4. Update Vercel: NEXT_PUBLIC_API_URL\n` +
      `5. Update Railway: CORS_ORIGINS\n` +
      `6. Your website will be fully live!\n`
    );
    
    console.log('\n✅ URLs saved to YOUR_WEBSITE_URLS.txt');
    console.log(`\n🌐 Your Frontend is Live: https://${vercelUrl}`);
    
  } else {
    console.log('⚠️  No deployments found. Check Vercel dashboard.');
    console.log('   https://vercel.com/heet-mehtas-projects/client');
  }
  
} catch (error) {
  console.error('Error:', error.message);
  console.log('\n💡 Check Vercel dashboard manually:');
  console.log('   https://vercel.com/heet-mehtas-projects/client');
}

