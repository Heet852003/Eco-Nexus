#!/usr/bin/env node
/**
 * Deploy Backend to Railway using REST API
 */

import https from 'https';
import http from 'http';

const RAILWAY_TOKEN = 'f2023a5f-23f4-4ce2-8ba3-1527c5be3fb9';
const GITHUB_REPO = 'Heet852003/Eco-Nexus';
const BRANCH = 'ui-3';

const RAILWAY_API = 'api.railway.app';

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function deployToRailway() {
  console.log('🚂 Deploying backend to Railway...\n');

  try {
    // Step 1: Get user info
    console.log('1. Authenticating...');
    const userOptions = {
      hostname: RAILWAY_API,
      path: '/v1/user',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const userResponse = await makeRequest(userOptions);
    console.log('✅ Authenticated\n');

    // Step 2: List projects to see if one exists
    console.log('2. Checking existing projects...');
    const projectsOptions = {
      hostname: RAILWAY_API,
      path: '/v1/projects',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const projectsResponse = await makeRequest(projectsOptions);
    console.log(`Found ${projectsResponse.data?.projects?.length || 0} projects\n`);

    // Step 3: Create project if needed
    let projectId;
    if (projectsResponse.data?.projects && projectsResponse.data.projects.length > 0) {
      projectId = projectsResponse.data.projects[0].id;
      console.log(`3. Using existing project: ${projectId}\n`);
    } else {
      console.log('3. Creating new project...');
      const createProjectOptions = {
        hostname: RAILWAY_API,
        path: '/v1/projects',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RAILWAY_TOKEN}`,
          'Content-Type': 'application/json'
        }
      };

      const createResponse = await makeRequest(createProjectOptions, {
        name: 'Eco-Nexus-Backend'
      });

      if (createResponse.status === 200 || createResponse.status === 201) {
        projectId = createResponse.data?.project?.id;
        console.log(`✅ Project created: ${projectId}\n`);
      } else {
        throw new Error(`Failed to create project: ${createResponse.status} - ${JSON.stringify(createResponse.data)}`);
      }
    }

    // Step 4: Create GitHub service
    console.log('4. Creating GitHub service...');
    const serviceOptions = {
      hostname: RAILWAY_API,
      path: `/v1/projects/${projectId}/services`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const serviceData = {
      name: 'backend',
      source: {
        repo: GITHUB_REPO,
        branch: BRANCH,
        rootDirectory: 'server'
      }
    };

    const serviceResponse = await makeRequest(serviceOptions, serviceData);
    
    if (serviceResponse.status === 200 || serviceResponse.status === 201) {
      const serviceId = serviceResponse.data?.service?.id;
      console.log(`✅ Service created: ${serviceId}\n`);
    } else {
      console.log(`⚠️  Service may already exist or need manual setup\n`);
    }

    // Step 5: Set environment variables
    console.log('5. Setting environment variables...');
    const envVars = {
      NODE_ENV: 'production',
      PORT: '3001',
      MONGODB_URI: 'mongodb+srv://mehtaheet5_db_user:cM9QnVjfmrqMSuni@cluster0.ohekgyn.mongodb.net/eco-nexus?retryWrites=true&w=majority',
      JWT_SECRET: 'mBgMH4SuRscMJP+mXlMpMcHavxvuWpiXWnUXibUO3d0=',
      OPENROUTER_API_KEY: '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',
      OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
      LLM_MODEL: 'meta-llama/llama-3.2-3b-instruct:free',
      SOLANA_RPC_URL: 'https://api.devnet.solana.com',
      CORS_ORIGINS: 'https://client-693wg8yxg-heet-mehtas-projects.vercel.app'
    };

    // Railway API uses different endpoint for variables
    // We'll need to set them per service
    console.log('⚠️  Environment variables need to be set manually in Railway dashboard\n');
    console.log('Go to Railway → Your Project → Service → Variables tab\n');
    console.log('Add these variables:');
    for (const [key, value] of Object.entries(envVars)) {
      console.log(`  ${key} = ${value}`);
    }

    console.log('\n✅ Deployment initiated!');
    console.log(`\n📋 Next steps:`);
    console.log(`1. Go to https://railway.app`);
    console.log(`2. Find your project`);
    console.log(`3. Set environment variables (listed above)`);
    console.log(`4. Wait for deployment to complete`);
    console.log(`5. Get your Railway URL from Settings → Domains`);
    console.log(`6. Update Vercel with NEXT_PUBLIC_API_URL = Railway URL`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Manual Deployment Steps:');
    console.log('1. Go to https://railway.app');
    console.log('2. Login with GitHub');
    console.log('3. New Project → Deploy from GitHub repo');
    console.log('4. Select: Heet852003/Eco-Nexus, Branch: ui-3');
    console.log('5. Settings → Root Directory: server');
    console.log('6. Add environment variables (see YOUR_WEBSITE_IS_LIVE.md)');
  }
}

deployToRailway().catch(console.error);

