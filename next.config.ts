import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/board", permanent: false },
      { source: "/dashboard/:path*", destination: "/board", permanent: false },
      { source: "/knowledge", destination: "/skills", permanent: false },
      { source: "/knowledge/:path*", destination: "/skills", permanent: false },
    ]
  },
}

export default nextConfig
