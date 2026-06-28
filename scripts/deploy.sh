#!/bin/bash
set -e

echo "🚀 PharmaCloud Deployment"
echo "========================"

# ── Platform selection ──────────────────────────────────────────
PLATFORM="${1:-vps}"   # vps | render | railway

case "$PLATFORM" in
  render)
    echo "📡 Deploying to Render via Blueprint..."
    echo "   Push to GitHub main branch → auto-deploy via render.yaml"
    echo "   Or trigger manually:"
    echo "   curl -X POST https://api.render.com/deploy/srv/\$RENDER_SERVICE_ID?key=\$RENDER_DEPLOY_KEY"
    exit 0
    ;;
  railway)
    echo "📡 Deploying to Railway..."
    echo "   Push to GitHub main branch → auto-deploy via railway.json"
    echo "   Or use Railway CLI:"
    echo "   railway up"
    exit 0
    ;;
  vps)
    echo "🏠 Deploying to VPS..."
    ;;
  *)
    echo "Usage: $0 {vps|render|railway}"
    exit 1
    ;;
esac

# ── VPS deployment ──────────────────────────────────────────────

# Load env
if [ -f .env.production ]; then
  export $(grep -v '^#' .env.production | xargs)
fi

# Pull latest
echo "📦 Pulling latest changes..."
git pull origin main

# Build and restart backend
echo "🔧 Building backend..."
cd backend
pip install -r requirements.txt -q
cd ..

# Build and restart frontend
echo "🔧 Building frontend..."
cd frontend
npm ci --silent
npm run build
cd ..

# Restart services
echo "🔄 Restarting services..."
pm2 restart pharmacloud-backend || pm2 start "cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000" --name pharmacloud-backend
pm2 restart pharmacloud-frontend || pm2 start "cd frontend && npm start" --name pharmacloud-frontend

echo "✅ Deployment complete!"
