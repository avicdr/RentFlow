// ecosystem.config.js — PM2 process manager config
// Usage: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    // ─── NestJS API ──────────────────────────────────────────────────────────
    {
      name: 'rentflow-api',
      cwd: '/var/www/rentflow/backend/api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/pm2/rentflow-api-error.log',
      out_file: '/var/log/pm2/rentflow-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '5s',
      kill_timeout: 5000,
    },

    // ─── Public Website ───────────────────────────────────────────────────────
    {
      name: 'rentflow-web',
      cwd: '/var/www/rentflow/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3005',
      instances: 1,
      watch: false,
      env_production: { NODE_ENV: 'production', PORT: 3005 },
      error_file: '/var/log/pm2/rentflow-web-error.log',
      out_file: '/var/log/pm2/rentflow-web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },

    // ─── Landlord App ─────────────────────────────────────────────────────────
    {
      name: 'rentflow-landlord',
      cwd: '/var/www/rentflow/apps/landlord',
      script: 'node_modules/.bin/next',
      args: 'start --port 3002',
      instances: 1,
      watch: false,
      env_production: { NODE_ENV: 'production', PORT: 3002 },
      error_file: '/var/log/pm2/rentflow-landlord-error.log',
      out_file: '/var/log/pm2/rentflow-landlord-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },

    // ─── Tenant App ───────────────────────────────────────────────────────────
    {
      name: 'rentflow-tenant',
      cwd: '/var/www/rentflow/apps/tenant',
      script: 'node_modules/.bin/next',
      args: 'start --port 3004',
      instances: 1,
      watch: false,
      env_production: { NODE_ENV: 'production', PORT: 3004 },
      error_file: '/var/log/pm2/rentflow-tenant-error.log',
      out_file: '/var/log/pm2/rentflow-tenant-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },

    // ─── Admin App ────────────────────────────────────────────────────────────
    {
      name: 'rentflow-admin',
      cwd: '/var/www/rentflow/apps/admin',
      script: 'node_modules/.bin/next',
      args: 'start --port 3003',
      instances: 1,
      watch: false,
      env_production: { NODE_ENV: 'production', PORT: 3003 },
      error_file: '/var/log/pm2/rentflow-admin-error.log',
      out_file: '/var/log/pm2/rentflow-admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
