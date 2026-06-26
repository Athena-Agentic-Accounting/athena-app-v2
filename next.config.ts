import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/board", permanent: false },
      { source: "/dashboard/:path*", destination: "/board", permanent: false },
    ]
  },
}

export default nextConfig
