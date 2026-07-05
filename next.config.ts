import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // uploadProductImage accepts files up to 5MB; Next's server-action default
  // is 1MB. 6mb leaves headroom for multipart overhead.
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "axbsghyqhhdaiylcksbv.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
