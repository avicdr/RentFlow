#!/bin/bash
# scripts/deploy.sh — Run on server after git pull
# Usage: bash scripts/deploy.sh

set -euo pipefail

APP_DIR="/var/www/rentflow"
LOG_FILE="/var/log/rentflow/deploy-$(date +%Y%m%d-%H%M%S).log"
mkdir -p /var/log/rentflow

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

cd "$APP_DIR"
log "🚀 Starting RentFlow deployment"

log "📦 Installing dependencies..."
pnpm install --frozen-lockfile >> "$LOG_FILE" 2>&1

log "🔨 Building all apps..."
pnpm turbo build >> "$LOG_FILE" 2>&1

log "📁 Ensuring upload directories exist..."
mkdir -p uploads/{payments,documents,avatars,listings,receipts}
mkdir -p logs

log "🔄 Reloading PM2 processes..."
pm2 reload ecosystem.config.js --env production >> "$LOG_FILE" 2>&1

log "✅ Deployment complete!"
pm2 list
