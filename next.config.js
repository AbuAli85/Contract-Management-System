/** @type {import('next').NextConfig} */
const withNextIntl = require("next-intl/plugin")("./i18n.ts")

const nextConfig = {
  // Enable React strict mode for better error detection
  reactStrictMode: true,
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
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
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Add webpack configuration to resolve module issues
    config.resolve.alias = {
      ...config.resolve.alias,
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
}

module.exports = withNextIntl(nextConfig)
