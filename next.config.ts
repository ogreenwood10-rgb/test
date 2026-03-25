import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow JSON imports from src/data/
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
