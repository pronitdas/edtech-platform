import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  }, 
  output: 'export', // Enables static export mode
};

export default nextConfig;
