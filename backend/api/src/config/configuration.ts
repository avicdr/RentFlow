export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  appUrl: process.env.APP_URL ?? 'http://localhost:3001',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-in-production',
    // Defaults to 15 minutes for access tokens (short-lived for security)
    // and 30 days for refresh tokens. Override via env in production.
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },

  database: {
    uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/rentflow',
  },

  upload: {
    dir: process.env.UPLOAD_DIR ?? './uploads',
    maxSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '20', 10),
    baseUrl: process.env.UPLOAD_BASE_URL ?? 'http://localhost:3001/uploads',
  },

  receipt: {
    storageDir: process.env.RECEIPT_STORAGE_DIR ?? './uploads/receipts',
    baseUrl: process.env.RECEIPT_BASE_URL ?? 'http://localhost:3001/receipts',
  },

  encryption: {
    fieldKey: process.env.FIELD_ENCRYPTION_KEY ?? 'dev-key-32-chars-change-in-prod!!',
    aadhaarSalt: process.env.AADHAAR_SALT ?? 'dev-aadhaar-salt-change-in-prod!!!',
  },

  smtp: {
    host: process.env.SMTP_HOST ?? 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.EMAIL_FROM ?? 'noreply@rentflow.com',
  },

  digilocker: {
    clientId: process.env.DIGILOCKER_CLIENT_ID ?? '',
    clientSecret: process.env.DIGILOCKER_CLIENT_SECRET ?? '',
    redirectUri: process.env.DIGILOCKER_REDIRECT_URI ?? 'http://localhost:3001/api/v1/digilocker/callback',
    authUrl: 'https://api.digitallocker.gov.in/public/oauth2/1/authorize',
    tokenUrl: 'https://api.digitallocker.gov.in/public/oauth2/1/token',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((o) => o.trim()),
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '60', 10),
  },

  subscription: {
    trialDays: parseInt(process.env.SUBSCRIPTION_TRIAL_DAYS ?? '14', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
    dir: process.env.LOG_DIR ?? 'logs',
  },
});
