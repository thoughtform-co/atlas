import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Increase body size limit for large video uploads (up to 100MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // Allow Next.js Image Optimization to process Supabase storage URLs
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
