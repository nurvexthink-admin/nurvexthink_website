import type { NextConfig } from "next";

// Baseline security headers. Deliberately NOT a strict script/style CSP (which
// would need nonces and risks breaking the 3D scene / hydration) — we set the
// high-value, low-risk headers: anti-clickjacking, MIME-sniff block, referrer
// and permissions policies. HSTS is added by Vercel. `frame-ancestors 'none'`
// only controls who may frame US; it does not affect the Turnstile iframe we embed.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework.
  poweredByHeader: false,
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
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
