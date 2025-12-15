import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external API calls
  async rewrites() {
    return [];
  },
  // Suppress hydration warnings for editor
  reactStrictMode: false,
  // Hide Next.js dev indicators completely
  devIndicators: false,
  // Additional experimental flags to disable dev indicators
  experimental: {
    // Disable dev overlay
    appDocumentPreloading: false,
  },
};

export default nextConfig;
