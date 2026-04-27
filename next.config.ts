import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
   images: {
    domains: ["https://nqmuadkxbbrsdzvrxaxc.supabase.co"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nqmuadkxbbrsdzvrxaxc.supabase.co',
      },
      
    ],
  },
};

export default nextConfig;
