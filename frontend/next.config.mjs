/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backend = (process.env.API_URL || "http://127.0.0.1:8000").replace(/\/$/, "")
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/auth/:path*", destination: `${backend}/auth/:path*` },
      { source: "/health", destination: `${backend}/health` },
    ]
  },
}

export default nextConfig
