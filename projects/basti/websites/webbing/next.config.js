/** @type {import('next').NextConfig} */
const nextConfig = {
  // Base path für /Webbin Subfolder
  basePath: process.env.NODE_ENV === 'production' ? '/Webbin' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Webbin' : '',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'screenshotapi.com',
      },
      {
        protocol: 'https',
        hostname: '**.producthunt.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig

