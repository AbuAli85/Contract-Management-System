/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')('./next-intl.config.ts');

// Minimal configuration for debugging Vercel build issues
const nextConfig = {
  // Basic Next.js configuration
  reactStrictMode: true,
  
  // Disable problematic features temporarily
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Minimal webpack configuration
  webpack: (config, { isServer }) => {
    // Basic fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  
  // Basic image configuration
  images: {
    domains: ['reootcngcptfogfozlmz.supabase.co'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
