import type { NextConfig } from "next";

/**
 * Baseline hardening headers.
 *
 * - HSTS: force HTTPS, 2-year max-age (browser-submitted preload-eligible).
 * - X-Content-Type-Options: block MIME sniffing.
 * - X-Frame-Options: DENY (paired with frame-ancestors below via CSP-equivalent).
 * - Referrer-Policy: minimal leakage cross-origin.
 * - Permissions-Policy: disable sensors we never use.
 * - X-Robots-Tag: second layer of no-indexing on top of the <meta robots> tag
 *   in app/layout.tsx AND /robots.txt. Three layers so search engines cannot
 *   accidentally list the bot.
 */
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
