#!/usr/bin/env bash
# ==============================================================================
# iSchool Production Deployment Script
# Automates Next.js build, Laravel cache/migrations, PM2 restart, and permissions
# Usage: ./deploy/deploy.sh
# ==============================================================================

set -e

echo "🚀 [1/6] Navigating to project root..."
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

echo "📦 [2/6] Building Next.js frontend for production..."
export NODE_ENV=production
npm ci --legacy-peer-deps
npm run build

echo "⚙️ [3/6] Optimizing Laravel 12 Backend..."
cd "$PROJECT_ROOT/backend"
composer install --no-dev --optimize-autoloader

php artisan config:clear
php artisan route:clear
php artisan view:clear

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "🗄️ [4/6] Running database migrations..."
php artisan migrate --force

echo "🔒 [5/6] Fixing storage and cache permissions..."
sudo chown -R www-data:www-data "$PROJECT_ROOT/backend/storage" "$PROJECT_ROOT/backend/bootstrap/cache"
sudo chmod -R 775 "$PROJECT_ROOT/backend/storage" "$PROJECT_ROOT/backend/bootstrap/cache"

echo "🔄 [6/6] Reloading PM2 Node services..."
cd "$PROJECT_ROOT"
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
    pm2 save
else
    echo "⚠️ PM2 not found. Install globally: npm install -g pm2"
fi

echo "✅ Production deployment complete! All systems operational."
