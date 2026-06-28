#!/bin/bash
set -e
echo "🚀 PharmaCloud Docker Deployment"
docker-compose pull
docker-compose up -d --build
docker system prune -f
echo "✅ Done!"
