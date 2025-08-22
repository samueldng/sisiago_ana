/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de build
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  
  // Configurações experimentais
  experimental: {
    // Configurações experimentais para Next.js 14
  },
  
  // Configurações de imagens
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'localhost',
      'sisana.netlify.app',
      'sisiago.com'
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  
  // Configurações de ambiente
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-secret-key',
    BUILD_TIME: new Date().toISOString()
  },
  
  // Headers de segurança e cache
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/manifest.json',
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
            value: 'no-store, max-age=0'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      },
      {
        source: '/dashboard',
        destination: '/pdv',
        permanent: false
      }
    ]
  },
  
  // Rewrites para API
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health-check'
      }
    ]
  },
  
  // Configurações de webpack
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Otimizações de bundle
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      }
    }
    
    // Configurações para bibliotecas específicas
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src')
    }
    
    // Ignorar warnings específicos
    config.ignoreWarnings = [
      { module: /node_modules/ },
      { file: /node_modules/ }
    ]
    
    return config
  },
  
  // Configurações de TypeScript
  typescript: {
    ignoreBuildErrors: true
  },
  
  // Configurações de ESLint
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src', 'pages', 'components', 'lib', 'utils']
  },
  
  // Configurações de exportação
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  
  // Configurações de logging
  logging: {
    fetches: {
      fullUrl: true
    }
  }
}

module.exports = nextConfig