import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Removed 'standalone' output to prevent static prerender of auth-protected pages
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.rentflow.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
