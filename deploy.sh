#!/usr/bin/env bash
set -euo pipefail

# Freight Pilot — Railway Deployment Script
# Reproduces the production deployment from scratch.
#
# Prerequisites:
#   - Node.js 20+ (for Railway CLI)
#   - A Railway account (https://railway.app)
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh

echo "=== Freight Pilot — Railway Deployment ==="
echo ""

# 1. Install Railway CLI if not present
if ! command -v railway &> /dev/null; then
  echo "[1/5] Installing Railway CLI..."
  npm i -g @railway/cli
else
  echo "[1/5] Railway CLI already installed."
fi

# 2. Authenticate
echo "[2/5] Logging in to Railway..."
railway login

# 3. Initialize or link project
if [ -f ".railway" ] || [ -d ".railway" ]; then
  echo "[3/5] Railway project already linked."
else
  echo "[3/5] Creating new Railway project..."
  railway init
fi

# 4. Set environment variables
echo "[4/5] Setting environment variables..."
echo "  Enter your API key (used to authenticate API requests):"
read -r API_KEY_VALUE
railway variables set API_KEY="$API_KEY_VALUE"

echo "  Enter your FMCSA web key (from https://mobile.fmcsa.dot.gov/):"
read -r FMCSA_KEY_VALUE
railway variables set FMCSA_WEBKEY="$FMCSA_KEY_VALUE"

# 5. Deploy
echo "[5/5] Deploying to Railway..."
railway up --detach

echo ""
echo "=== Deployment initiated ==="
echo "Railway will auto-detect the Dockerfile and build."
echo "HTTPS is provisioned automatically via Let's Encrypt."
echo ""
echo "Check status:  railway status"
echo "View logs:     railway logs"
echo "Open in browser: railway open"
