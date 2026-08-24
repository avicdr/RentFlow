# RentFlow — Part 4: Frontend, DigiLocker, Security & Roadmap

## 1. NEXT.JS MIDDLEWARE (Subdomain Auth Guard)

```typescript
// apps/landlord/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC = ['/login', '/register', '/forgot-password'];
const ALLOWED_ROLES = ['LANDLORD', 'PROPERTY_MANAGER'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (PUBLIC.some(p => path.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get('rf_access_token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (!ALLOWED_ROLES.includes(payload.role as string))
      return NextResponse.redirect('https://rentflow.com/unauthorized');
    return NextResponse.next();
  } catch {
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }
}
export const config = { matcher: ['/((?!_next|favicon|public).*)'] };
```

## 2. ZUSTAND AUTH STORE

```typescript
// packages/stores/src/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthUser { id: string; email: string; role: string; firstName: string; lastName: string; orgId?: string; }
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (u: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'rf_auth', storage: createJSONStorage(() => sessionStorage) }
  )
);
```

## 3. AXIOS + REACT QUERY SETUP

```typescript
// packages/api-client/src/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`, {}, { withCredentials: true })
          .then(r => r.data.data.accessToken)
          .finally(() => { refreshPromise = null; });
      }
      const token = await refreshPromise;
      orig.headers['Authorization'] = `Bearer ${token}`;
      return apiClient(orig);
    }
    return Promise.reject(error);
  }
);

// React Query hook example — payments
export const usePayments = (params: { status?: string; month?: number; year?: number }) =>
  useQuery({
    queryKey: ['payments', params],
    queryFn: () => apiClient.get('/api/v1/payments', { params }).then(r => r.data.data),
    staleTime: 60_000,
  });

export const useSubmitPayment = (paymentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SubmitPaymentDto) =>
      apiClient.post(`/api/v1/payments/${paymentId}/submit`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};
```

## 4. ZOD VALIDATION EXAMPLES

```typescript
// packages/validators/src/payment.schema.ts
import { z } from 'zod';

export const submitPaymentSchema = z.object({
  screenshotPath: z.string().min(1, 'Screenshot required'),
  utrNumber: z.string()
    .min(8, 'UTR must be at least 8 characters')
    .max(50)
    .regex(/^[A-Za-z0-9]+$/, 'UTR must be alphanumeric only'),
  paymentMethod: z.enum(['UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'OTHER']),
  paymentApp: z.enum(['GPAY', 'PHONEPE', 'PAYTM', 'BHIM', 'OTHER']).optional(),
  paidAmount: z.number().positive('Amount must be positive'),
  note: z.string().max(500).optional(),
});

export const rejectPaymentSchema = z.object({
  reason: z.string().min(10, 'Provide a clear rejection reason').max(500),
});

// packages/validators/src/property.schema.ts
export const createPropertySchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['PG', 'APARTMENT', 'VILLA', 'COMMERCIAL', 'HOSTEL']),
  address: z.object({
    line1: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  }),
});
```

## 5. FILE UPLOAD SERVICE (Local Storage)

```typescript
// backend/api/src/modules/documents/documents.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';

const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf', 'image/gif',
];

export const multerConfig = {
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const category = req.body.category ?? 'misc';
      const dir = path.join(process.env.UPLOAD_DIR, category);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuid()}${ext}`);
    },
  }),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB ?? '20') * 1024 * 1024 },
  fileFilter: (req: any, file: any, cb: any) => {
    if (!ALLOWED_MIMES.includes(file.mimetype))
      return cb(new BadRequestException(`File type not allowed: ${file.mimetype}`), false);
    cb(null, true);
  },
};

@Injectable()
export class DocumentsService {
  async saveDocument(file: Express.Multer.File, userId: string, category: string, relatedTo?: string) {
    return this.documentModel.create({
      uploadedBy: userId,
      filePath: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      category,
      relatedTo,
      status: 'PENDING_REVIEW',
    });
  }

  // Relative URL for client — never expose absolute server path
  getPublicUrl(filePath: string): string {
    const relative = filePath.replace(process.env.UPLOAD_DIR, '');
    return `${process.env.UPLOAD_BASE_URL}${relative}`;
  }
}
```

## 6. DIGILOCKER OAUTH FLOW

```typescript
// modules/digilocker/digilocker.service.ts
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class DigilockerService {
  // Step 1: Generate auth URL with PKCE
  async initVerification(userId: string, ip: string) {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    const stateToken = crypto.randomBytes(16).toString('hex');

    await this.verificationModel.create({
      userId, stateToken, codeVerifier, status: 'INITIATED', ipAddress: ip,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });

    const params = new URLSearchParams({
      response_type: 'code', client_id: process.env.DIGILOCKER_CLIENT_ID,
      redirect_uri: process.env.DIGILOCKER_REDIRECT_URI,
      state: stateToken, code_challenge: codeChallenge, code_challenge_method: 'S256',
      scope: 'aadhaar',
    });

    return { authUrl: `${process.env.DIGILOCKER_AUTH_URL}?${params}` };
  }

  // Step 2: OAuth callback — exchange code, fetch Aadhaar XML
  async handleCallback(code: string, state: string) {
    const verification = await this.verificationModel.findOne({
      stateToken: state, status: 'INITIATED', expiresAt: { $gt: new Date() },
    });
    if (!verification) throw new Error('Invalid or expired state token');

    // Exchange code for token
    const { data: tokenData } = await axios.post(process.env.DIGILOCKER_TOKEN_URL, {
      code, grant_type: 'authorization_code',
      client_id: process.env.DIGILOCKER_CLIENT_ID,
      client_secret: process.env.DIGILOCKER_CLIENT_SECRET,
      redirect_uri: process.env.DIGILOCKER_REDIRECT_URI,
      code_verifier: verification.codeVerifier,
    });

    // Fetch Aadhaar eXML
    const { data: aadhaarXml } = await axios.get(
      'https://api.digitallocker.gov.in/public/oauth2/1/xml/eaadhaar',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    // Parse XML — extract fields ONLY, never store raw XML or full Aadhaar
    const parsed = this.parseAadhaarXml(aadhaarXml);
    const maskedAadhaar = `XXXX-XXXX-${parsed.uid.slice(-4)}`;
    const aadhaarHash = crypto.createHash('sha256')
      .update(parsed.uid + process.env.AADHAAR_SALT).digest('hex');

    await this.verificationModel.updateOne({ _id: verification._id }, {
      status: 'VERIFIED', aadhaarXmlFetched: true, verifiedAt: new Date(),
      verifiedData: { name: parsed.name, dob: parsed.dob, gender: parsed.gender, maskedAadhaar },
    });

    await this.userModel.updateOne({ _id: verification.userId }, {
      'aadhaarData.maskedNumber': maskedAadhaar,
      'aadhaarData.encryptedHash': aadhaarHash,
      'aadhaarData.verificationMethod': 'DIGILOCKER',
      'aadhaarData.verificationStatus': 'VERIFIED',
      'aadhaarData.verifiedAt': new Date(),
    });

    // Audit log
    await this.auditModel.create({
      performedBy: verification.userId, action: 'DIGILOCKER_VERIFIED',
      resource: 'User', resourceId: verification.userId, severity: 'INFO',
    });

    return { verified: true, maskedAadhaar };
  }

  private parseAadhaarXml(xml: string) {
    // Use fast-xml-parser to extract fields
    // Returns: { uid, name, dob, gender, address, pincode }
    // NEVER return or store the full uid — mask immediately
  }
}
```

## 7. LOGGING STRATEGY

```typescript
// Winston logger config
import * as winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.colorize({ all: true }),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: `${process.env.LOG_DIR}/error.log`, level: 'error' }),
    new winston.transports.File({ filename: `${process.env.LOG_DIR}/combined.log` }),
  ],
});

// Log rotation — use logrotate on server
// /etc/logrotate.d/rentflow
// /var/log/rentflow/*.log {
//   daily
//   rotate 14
//   compress
//   missingok
//   notifempty
//   copytruncate
// }
```

## 8. MVP ROADMAP

| Phase | Weeks | Deliverables |
|---|---|---|
| **1 — Foundation** | 1–3 | Monorepo, NestJS bootstrap, Mongoose, JWT auth, PM2+NGINX setup |
| **2 — Core** | 4–6 | Properties, rooms, beds, tenants CRUD, landlord + tenant dashboards |
| **3 — Payments** | 7–8 | Manual payment flow, screenshot upload, UTR dedup, receipt PDF |
| **4 — Complaints** | 8–9 | Complaint system, timeline, notifications (email+SMS) |
| **5 — Verification** | 9–10 | DigiLocker OAuth, manual Aadhaar upload, admin review queue |
| **6 — Marketplace** | 10–11 | Public listings, visit scheduling, broker + lead management |
| **7 — Analytics** | 11–12 | Revenue charts, occupancy, complaint trends, landlord dashboard |
| **8 — Admin** | 12–13 | Super admin panel, user management, audit logs, broker approval |
| **9 — Polish** | 13–15 | Rate limiting, security audit, error monitoring, load test |
| **10 — Launch** | 15–16 | Production VPS deploy, SSL, monitoring, backup automation |

## 9. FUTURE SCALING PLAN

```
Phase MVP    → Single VPS (4 vCPU, 8GB RAM)
                PM2 cluster (2 API workers)
                MongoDB local or MongoDB Atlas M10

Phase Growth → MongoDB Atlas M30 (dedicated)
               Add Redis (rate limiting + caching)
               Separate VPS for DB
               CDN (Cloudflare) for static assets + DDoS

Phase Scale  → Migrate to Docker + reverse-proxy load balancer
               Add read replicas for analytics queries
               Background job queue (BullMQ + Redis)
               Razorpay/Cashfree payment gateway integration
               Monitoring: Prometheus + Grafana

Payment Gateway Migration:
  The payment schema has a `gateway` field ready.
  Add Razorpay module → payment.service.ts switches on
  gateway.provider. Manual flow remains as fallback.
  Zero breaking changes to existing data.
```

## 10. PRODUCTION SECURITY CHECKLIST

```
✅ JWT access tokens: 15-minute lifetime
✅ Refresh tokens: httpOnly cookies, SHA-256 hashed in DB
✅ Argon2id password hashing (m=65536, t=3, p=4)
✅ Helmet security headers on all responses
✅ Rate limiting: 10 req/min on auth, 60 req/min global
✅ CORS locked to known subdomains only
✅ DTO whitelist — strip unknown request fields
✅ File uploads: MIME + size validated before save
✅ Aadhaar: masked only (XXXX-XXXX-1234), salted SHA-256 hash
✅ Sensitive fields: AES-256-GCM encrypted at rest
✅ MongoDB auth enabled, not exposed to internet
✅ UFW firewall — only port 22, 80, 443 open
✅ Fail2Ban — SSH + NGINX brute force protection
✅ SSL TLS 1.2+ with HSTS preload
✅ Audit log on every write (payment approve/reject, tenant create, etc.)
✅ Soft deletes — never hard delete user data
✅ Payment receipts: HMAC verification hash for tamper detection
✅ Duplicate UTR detection before submission accepted
```
