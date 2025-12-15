import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external API calls
  async rewrites() {
    return [];
  },
  // Suppress hydration warnings for editor
  reactStrictMode: false,
  // Hide Next.js dev indicators
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
};

export default nextConfig;
