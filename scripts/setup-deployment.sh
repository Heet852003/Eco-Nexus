#!/bin/bash
# Automated Deployment Setup Script

echo "🚀 Setting up automated deployment..."

# Install Railway CLI
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    curl -fsSL https://railway.app/install.sh | sh
else
    echo "✅ Railway CLI already installed"
fi

# Install Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI already installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get Railway token: railway login (then copy token from ~/.railway/config.json)"
echo "2. Get Vercel token: vercel login (then get from https://vercel.com/account/tokens)"
echo "3. Add tokens to GitHub Secrets:"
echo "   - Go to your repo → Settings → Secrets and variables → Actions"
echo "   - Add RAILWAY_TOKEN"
echo "   - Add VERCEL_TOKEN"
echo "   - Add VERCEL_ORG_ID (from vercel project settings)"
echo "   - Add VERCEL_PROJECT_ID (from vercel project settings)"
echo ""
echo "4. Push to ui-3 branch and deployment will happen automatically!"

