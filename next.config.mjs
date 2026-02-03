/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Hide the Next.js dev indicator (bottom-left icon) and "Compiling..." status overlay
  devIndicators: false,
}

export default nextConfig
