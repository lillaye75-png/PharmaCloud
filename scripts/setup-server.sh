#!/bin/bash
set -e

echo "🖥️  PharmaCloud Server Setup"
echo "============================"

# System update
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3-pip nodejs npm nginx certbot python3-certbot-nginx postgresql postgresql-contrib git

# Install PM2
sudo npm install -g pm2

# Setup PostgreSQL
echo "🔧 Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE USER pharmacloud WITH PASSWORD 'pharmacloud_secret';" || true
sudo -u postgres psql -c "CREATE DATABASE pharmacloud OWNER pharmacloud;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pharmacloud TO pharmacloud;" || true

# Clone repo
cd /var/www
sudo git clone https://github.com/layedevops/pharmacloud.git
sudo chown -R $USER:$USER pharmacloud
cd pharmacloud

# Setup environment
cp .env.production.example .env.production
echo "⚠️  Edit .env.production with your settings, then run:"
echo "   ./scripts/deploy.sh"
