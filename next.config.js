/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    // Disable heavy features in development
    ...(process.env.NODE_ENV === 'development' && {
      // Disable some heavy optimizations in development
      optimizeCss: false,
      // Reduce bundle analysis
      bundlePagesRouterDependencies: false,
      // Disable heavy features
      optimizePackageImports: false,
    }),
  },

  // Image optimization - disable in development
  images: {
    ...(process.env.NODE_ENV === 'development' ? {
      unoptimized: true,
    } : {
      formats: ['image/webp', 'image/avif'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      minimumCacheTTL: 31536000, // 1 year
    }),
  },

  // Webpack configuration for performance
  webpack: (config, { dev, isServer }) => {
    // Handle SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    // Ultra-aggressive optimizations for development
    if (dev) {
      // Disable all heavy optimizations
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        minimize: false,
        concatenateModules: false,
        usedExports: false,
        sideEffects: false,
      }

      // Faster module resolution
      config.resolve.symlinks = false
      
      // Reduce the number of modules processed
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/dist', '**/coverage', '**/.git', '**/build'],
      }

      // Disable source maps in development for faster compilation
      config.devtool = false

      // Disable heavy loaders in development
      config.module.rules.forEach(rule => {
        if (rule.test && rule.test.toString().includes('css')) {
          rule.use = rule.use.map(loader => {
            if (typeof loader === 'object' && loader.loader === 'postcss-loader') {
              return {
                ...loader,
                options: {
                  ...loader.options,
                  postcssOptions: {
                    ...loader.options?.postcssOptions,
                    plugins: loader.options?.postcssOptions?.plugins?.filter(plugin => 
                      !['autoprefixer', 'cssnano'].includes(plugin)
                    ) || []
                  }
                }
              }
            }
            return loader
          })
        }
      })
    }

    // Exclude heavy packages from client bundle if not needed
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        buffer: false,
        process: false,
      }
    }

    return config
  },

  // Compression and caching - disable in development
  compress: process.env.NODE_ENV !== 'development',
  poweredByHeader: false,

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=30, stale-while-revalidate=60',
          },
        ],
      },
    ]
  },

  // Redirects for better performance
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
        permanent: false,
      },
    ]
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Performance optimizations - disable in development
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Development-specific optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Reduce logging
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
    // Disable telemetry
    telemetry: false,
  }),
}

module.exports = nextConfig