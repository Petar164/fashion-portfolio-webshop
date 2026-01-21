/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip static optimization to reduce build resource usage on Railway
  output: 'standalone',
  // Disable static page generation to avoid resource limits
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // Skip static optimization completely
  swcMinify: true,
  // Skip page data collection to avoid Railway resource limits
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Ensure environment variables are loaded
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  // Force HTTPS and prevent mixed content
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "upgrade-insecure-requests",
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
