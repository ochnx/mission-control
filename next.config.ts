import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/mission-control',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
