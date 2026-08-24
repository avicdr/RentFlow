# RentFlow — Blueprint Part 1: Structure, NGINX & VPS Deployment

---

## 1. MONOREPO FOLDER STRUCTURE

```
rentflow/                                    ← Git root
├── apps/
│   ├── web/                                 ← rentflow.com (public marketing)
│   ├── admin/                               ← admin.rentflow.com
│   ├── landlord/                            ← landlord.rentflow.com
│   └── tenant/                              ← tenant.rentflow.com
├── backend/
│   └── api/                                 ← api.rentflow.com (NestJS)
├── packages/
│   ├── ui/                                  ← Shared ShadCN component library
│   ├── types/                               ← Shared TypeScript interfaces/enums
│   ├── validators/                          ← Shared Zod schemas
│   ├── api-client/                          ← Shared Axios + React Query hooks
│   └── constants/                           ← Shared enums, route maps, configs
├── scripts/
│   ├── deploy.sh                            ← Production deploy script
│   ├── backup-mongo.sh                      ← MongoDB backup cron script
│   └── setup-vps.sh                         ← First-time server setup
├── turbo.json
├── pnpm-workspace.yaml
├── .env.example
└── package.json
```

### Each Frontend App Structure

```
apps/landlord/
├── src/
│   ├── app/                                 ← Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                   ← Shell: sidebar + topbar
│   │   │   ├── page.tsx                     ← /dashboard
│   │   │   ├── properties/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── rooms/page.tsx
│   │   │   │       └── tenants/page.tsx
│   │   │   ├── tenants/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── payments/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── complaints/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── listings/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       └── payment-methods/page.tsx ← UPI/QR/bank config
│   │   └── middleware.ts
│   ├── components/
│   │   ├── features/
│   │   │   ├── properties/
│   │   │   ├── tenants/
│   │   │   ├── payments/
│   │   │   └── complaints/
│   │   └── shared/
│   ├── hooks/
│   ├── stores/
│   └── lib/
├── next.config.ts
└── package.json
```

```
backend/api/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── properties/
│   │   ├── rooms/
│   │   ├── beds/
│   │   ├── tenants/
│   │   ├── payments/             ← Manual payment verification system
│   │   ├── complaints/
│   │   ├── notifications/
│   │   ├── documents/
│   │   ├── brokers/
│   │   ├── leads/
│   │   ├── visits/
│   │   ├── listings/
│   │   ├── analytics/
│   │   ├── audit/
│   │   ├── digilocker/
│   │   └── admin/
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   ├── middleware/
│   │   └── pipes/
│   ├── config/
│   ├── database/
│   └── main.ts
└── package.json
```

---

## 2. NGINX SUBDOMAIN CONFIGURATION

### Main nginx.conf

```nginx
# /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Security headers applied globally
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    server_tokens off;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=global:10m rate=60r/m;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=uploads:10m rate=5r/m;

    # Client body size
    client_max_body_size 25M;

    include /etc/nginx/sites-enabled/*.conf;
}
```

### API — api.rentflow.com

```nginx
# /etc/nginx/sites-available/api.rentflow.com.conf
server {
    listen 80;
    server_name api.rentflow.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.rentflow.com;

    ssl_certificate /etc/letsencrypt/live/rentflow.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rentflow.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;

    # Auth endpoints — strict rate limit
    location /api/v1/auth/ {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    location /api/v1/documents/upload {
        limit_req zone=uploads burst=3 nodelay;
        client_max_body_size 25M;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }

    # General API
    location /api/ {
        limit_req zone=global burst=30 nodelay;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static uploaded files served directly by NGINX
    location /uploads/ {
        alias /var/www/rentflow/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        # Protect direct access — only signed paths allowed
        valid_referers none blocked server_names *.rentflow.com;
        if ($invalid_referer) { return 403; }
    }
}
```

### Landlord App — landlord.rentflow.com

```nginx
# /etc/nginx/sites-available/landlord.rentflow.com.conf
server {
    listen 80;
    server_name landlord.rentflow.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name landlord.rentflow.com;

    ssl_certificate /etc/letsencrypt/live/rentflow.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rentflow.com/privkey.pem;

    root /var/www/rentflow/apps/landlord/.next;

    # Next.js standalone server (PM2 runs on port 3002)
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Next.js static assets — served directly
    location /_next/static/ {
        alias /var/www/rentflow/apps/landlord/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

> **Repeat pattern** for `admin.rentflow.com` (port 3003), `tenant.rentflow.com` (port 3004), `rentflow.com` (port 3005).

---

## 3. PM2 ECOSYSTEM CONFIG

```javascript
// ecosystem.config.js (at repo root on server)
module.exports = {
  apps: [
    // ─── NestJS API ─────────────────────────────────────────────
    {
      name: 'rentflow-api',
      cwd: '/var/www/rentflow/backend/api',
      script: 'dist/main.js',
      instances: 2,                // 2 workers (use 'max' for all CPU cores)
      exec_mode: 'cluster',
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/pm2/api-error.log',
      out_file: '/var/log/pm2/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '5s',
    },

    // ─── Next.js Apps ───────────────────────────────────────────
    {
      name: 'rentflow-web',
      cwd: '/var/www/rentflow/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3005',
      instances: 1,
      env_production: { NODE_ENV: 'production', PORT: 3005 },
      error_file: '/var/log/pm2/web-error.log',
      out_file: '/var/log/pm2/web-out.log',
    },
    {
      name: 'rentflow-landlord',
      cwd: '/var/www/rentflow/apps/landlord',
      script: 'node_modules/.bin/next',
      args: 'start --port 3002',
      instances: 1,
      env_production: { NODE_ENV: 'production', PORT: 3002 },
      error_file: '/var/log/pm2/landlord-error.log',
      out_file: '/var/log/pm2/landlord-out.log',
    },
    {
      name: 'rentflow-tenant',
      cwd: '/var/www/rentflow/apps/tenant',
      script: 'node_modules/.bin/next',
      args: 'start --port 3004',
      instances: 1,
      env_production: { NODE_ENV: 'production', PORT: 3004 },
      error_file: '/var/log/pm2/tenant-error.log',
      out_file: '/var/log/pm2/tenant-out.log',
    },
    {
      name: 'rentflow-admin',
      cwd: '/var/www/rentflow/apps/admin',
      script: 'node_modules/.bin/next',
      args: 'start --port 3003',
      instances: 1,
      env_production: { NODE_ENV: 'production', PORT: 3003 },
      error_file: '/var/log/pm2/admin-error.log',
      out_file: '/var/log/pm2/admin-out.log',
    },
  ],
};
```

---

## 4. VPS DEPLOYMENT GUIDE

### First-Time Server Setup

```bash
#!/bin/bash
# scripts/setup-vps.sh — Run once on fresh Ubuntu 22.04 VPS

# Update system
apt update && apt upgrade -y

# Install Node.js 20 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm pm2

# Install NGINX
apt install -y nginx certbot python3-certbot-nginx

# Install MongoDB 7.0
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update && apt install -y mongodb-org
systemctl enable mongod && systemctl start mongod

# MongoDB — create app user
mongosh --eval "
  use admin;
  db.createUser({ user: 'rentflow_admin', pwd: 'CHANGE_THIS_STRONG_PASSWORD', roles: ['userAdminAnyDatabase', 'readWriteAnyDatabase'] });
  use rentflow;
  db.createUser({ user: 'rentflow_app', pwd: 'CHANGE_THIS_APP_PASSWORD', roles: [{ role: 'readWrite', db: 'rentflow' }] });
"

# Enable MongoDB auth
sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf
systemctl restart mongod

# UFW Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable

# Upload directory
mkdir -p /var/www/rentflow/uploads/{payments,documents,avatars,listings}
chown -R www-data:www-data /var/www/rentflow/uploads
chmod -R 755 /var/www/rentflow/uploads

# PM2 startup
pm2 startup systemd -u $USER --hp $HOME
```

### SSL Certificate (Wildcard)

```bash
# Issue wildcard certificate for all subdomains
certbot certonly --nginx \
  -d rentflow.com \
  -d "*.rentflow.com" \
  --email admin@rentflow.com \
  --agree-tos \
  --non-interactive

# Auto-renew cron (add to /etc/cron.d/certbot)
0 12 * * * root /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
```

### Deploy Script

```bash
#!/bin/bash
# scripts/deploy.sh — Run on server after git pull

set -e
APP_DIR="/var/www/rentflow"
cd $APP_DIR

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🔨 Building apps..."
pnpm turbo build

echo "🔄 Reloading PM2..."
pm2 reload ecosystem.config.js --env production

echo "✅ Deploy complete — $(date)"
pm2 list
```

### Git Pull Workflow

```bash
# On VPS — simple deployment
cd /var/www/rentflow
git fetch origin main
git pull origin main
bash scripts/deploy.sh

# Or with zero-downtime reload (PM2 cluster mode)
pm2 reload rentflow-api --update-env
pm2 reload rentflow-landlord --update-env
```

---

## 5. FIREWALL & SECURITY RECOMMENDATIONS

```bash
# UFW rules — only NGINX public ports exposed
ufw allow ssh             # 22 (consider changing SSH port)
ufw allow 80/tcp          # HTTP (redirects to HTTPS)
ufw allow 443/tcp         # HTTPS

# Block direct port access (MongoDB, Node.js ports)
ufw deny 27017            # MongoDB — never expose publicly
ufw deny 3001             # API (only via NGINX proxy)
ufw deny 3002:3005/tcp    # Next.js apps (only via NGINX proxy)

# Fail2Ban — protect against brute force
apt install -y fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
EOF
systemctl restart fail2ban
```

---

## 6. MONGODB BACKUP STRATEGY

```bash
#!/bin/bash
# scripts/backup-mongo.sh — Daily cron at 2am

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/var/backups/mongodb"
MONGO_URI="mongodb://rentflow_app:APP_PASSWORD@127.0.0.1:27017/rentflow"
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

mongodump \
  --uri="$MONGO_URI" \
  --out="$BACKUP_DIR/$DATE" \
  --gzip

# Compress backup
tar -czf "$BACKUP_DIR/rentflow-$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_DIR/$DATE"

# Delete backups older than retention period
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup complete: rentflow-$DATE.tar.gz"

# Crontab: 0 2 * * * /var/www/rentflow/scripts/backup-mongo.sh >> /var/log/mongo-backup.log 2>&1
```

---

## 7. ENVIRONMENT VARIABLE STRUCTURE

```bash
# backend/api/.env.production

# ─── App ──────────────────────────────────────────────────
NODE_ENV=production
PORT=3001
APP_NAME=RentFlow API
APP_VERSION=1.0.0
APP_URL=https://api.rentflow.com

# ─── JWT ──────────────────────────────────────────────────
JWT_ACCESS_SECRET=<64-char-cryptographically-random-string>
JWT_REFRESH_SECRET=<64-char-cryptographically-random-string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── MongoDB ──────────────────────────────────────────────
MONGO_URI=mongodb://rentflow_app:PASSWORD@127.0.0.1:27017/rentflow?authSource=rentflow
MONGO_DB_NAME=rentflow

# ─── Redis (optional for MVP, use in-memory fallback) ─────
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>

# ─── File Storage ─────────────────────────────────────────
UPLOAD_DIR=/var/www/rentflow/uploads
MAX_FILE_SIZE_MB=20
UPLOAD_BASE_URL=https://api.rentflow.com/uploads

# ─── Email (SMTP) ─────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@rentflow.com
SMTP_PASS=<app-specific-password>
EMAIL_FROM="RentFlow <noreply@rentflow.com>"

# ─── SMS ──────────────────────────────────────────────────
MSG91_API_KEY=<key>
MSG91_SENDER_ID=RNTFLW
MSG91_TEMPLATE_OTP=<template-id>

# ─── DigiLocker ───────────────────────────────────────────
DIGILOCKER_CLIENT_ID=<client-id>
DIGILOCKER_CLIENT_SECRET=<secret>
DIGILOCKER_REDIRECT_URI=https://api.rentflow.com/api/v1/digilocker/callback

# ─── Encryption ───────────────────────────────────────────
FIELD_ENCRYPTION_KEY=<32-byte-hex>
AADHAAR_SALT=<32-byte-hex>

# ─── Security ─────────────────────────────────────────────
THROTTLE_TTL=60
THROTTLE_LIMIT=60
AUTH_THROTTLE_LIMIT=10
CORS_ORIGINS=https://rentflow.com,https://admin.rentflow.com,https://landlord.rentflow.com,https://tenant.rentflow.com

# ─── Receipts ─────────────────────────────────────────────
RECEIPT_STORAGE_DIR=/var/www/rentflow/uploads/receipts
RECEIPT_BASE_URL=https://api.rentflow.com/receipts

# ─── Logging ──────────────────────────────────────────────
LOG_LEVEL=info
LOG_DIR=/var/log/rentflow

# ─── Trial / Subscriptions ────────────────────────────────
SUBSCRIPTION_TRIAL_DAYS=14
```

```bash
# apps/landlord/.env.production
NEXT_PUBLIC_API_URL=https://api.rentflow.com
NEXT_PUBLIC_APP_URL=https://landlord.rentflow.com
NEXT_PUBLIC_WEB_URL=https://rentflow.com
JWT_ACCESS_SECRET=<same-as-api-secret>   # For edge middleware verification
```
