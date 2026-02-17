/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker/self-hosted deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Hide the Next.js dev indicator (bottom-left icon) and "Compiling..." status overlay
  devIndicators: false,
  // Allow larger payloads for Server Actions (e.g. product/verification image uploads up to 20 MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
}

export default nextConfig
