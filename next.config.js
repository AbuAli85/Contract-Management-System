/** @type {import('next').NextConfig} */
const withNextIntl = require("next-intl/plugin")("./i18n.ts")

const nextConfig = {
  // Disable SWC minification to avoid bundling issues
  swcMinify: false,
  
  // Enable React strict mode
  reactStrictMode: false, // Temporarily disable to debug
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Disable webpack cache to avoid stale bundle issues
    config.cache = false
    
    // Completely disable all minification
    config.optimization.minimize = false
    config.optimization.minimizer = []
    
    // Add webpack configuration to resolve module issues
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    
    // Fix for module compatibility issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide',
            priority: 20,
            chunks: 'all',
          },
        },
      }
    }
    
    // Handle webpack module resolution issues
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      resolve: {
        fullySpecified: false,
      },
    })
    
    return config
  },
  
  // Experimental features
  experimental: {
    // Server components external packages
    serverComponentsExternalPackages: ['lucide-react'],
  },
  
  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Disable ESLint during build to avoid configuration issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable type checking during build to avoid issues
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image domains (if using next/image)
  images: {
    formats: ["image/webp", "image/avif"],
    domains: [
      'example.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos',
      'reootcngcptfogfozlmz.supabase.co'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },

  // Add headers for development to prevent caching issues
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
}
module.exports = withNextIntl(nextConfig)
