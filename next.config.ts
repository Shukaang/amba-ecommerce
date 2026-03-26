import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
   images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nqmuadkxbbrsdzvrxaxc.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      
    ],
  },
};

export default nextConfig;
