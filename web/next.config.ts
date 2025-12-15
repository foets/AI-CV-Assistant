import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external API calls
  async rewrites() {
    return [];
  },
  // Suppress hydration warnings for editor
  reactStrictMode: false,
};

export default nextConfig;
