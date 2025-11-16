#!/usr/bin/env node
/**
 * Final Deployment - Complete the deployment and get final links
 */

import { execSync } from 'child_process';
import https from 'https';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAILWAY_TOKEN = 'f2023a5f-23f4-4ce2-8ba3-1527c5be3fb9';
const VERCEL_TOKEN = 'fAgL0slFangI7CmWcMA80kLt';

console.log('🚀 Completing Final Deployment...\n');

// Function to make HTTP requests
function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), raw: body });
        } catch {
          resolve({ status: res.statusCode, data: body, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Get Vercel deployment info
console.log('📡 Getting Vercel deployment info...');
try {
  process.chdir(path.join(__dirname, '..', 'client'));
  const vercelResult = execSync('vercel ls --token ' + VERCEL_TOKEN, { encoding: 'utf-8' });
  const vercelLines = vercelResult.split('\n');
  const vercelUrl = vercelLines.find(line => line.includes('vercel.app'))?.trim().split(/\s+/)[0];
  
  if (vercelUrl) {
    console.log(`✅ Frontend URL: ${vercelUrl}`);
    
    // Now deploy backend to Railway
    console.log('\n🚂 Deploying Backend to Railway...');
    console.log('Using Railway web interface is recommended.');
    console.log('\n📋 Railway Deployment Steps:');
    console.log('1. Go to https://railway.app');
    console.log('2. Login with GitHub');
    console.log('3. New Project → Deploy from GitHub');
    console.log('4. Select: Heet852003/Eco-Nexus, Branch: ui-3');
    console.log('5. Settings → Root Directory: server');
    console.log('6. Variables → Add environment variables');
    console.log(`7. Set CORS_ORIGINS = ${vercelUrl}`);
    console.log('\nAfter Railway deploys, update Vercel:');
    console.log(`NEXT_PUBLIC_API_URL = [your-railway-url]`);
    
    // Save URLs to file
    const urls = {
      frontend: vercelUrl,
      backend: 'https://your-app.railway.app (deploy to get URL)',
      status: 'Frontend deployed, backend needs deployment'
    };
    
    const fs = await import('fs');
    fs.writeFileSync(
      path.join(__dirname, '..', 'DEPLOYMENT_URLS.json'),
      JSON.stringify(urls, null, 2)
    );
    
    console.log('\n✅ URLs saved to DEPLOYMENT_URLS.json');
  }
} catch (error) {
  console.log('⚠️  Could not get Vercel URL automatically');
  console.log('Check Vercel dashboard: https://vercel.com/heet-mehtas-projects/client');
}

console.log('\n📝 Final Steps:');
console.log('1. Deploy backend to Railway (see steps above)');
console.log('2. Get Railway URL from Railway dashboard');
console.log('3. Update Vercel: NEXT_PUBLIC_API_URL = [railway-url]');
console.log('4. Update Railway: CORS_ORIGINS = [vercel-url]');
console.log('5. Test your website!');

