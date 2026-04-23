import type { MetadataRoute } from "next";

/**
 * Explicitly disallow all crawlers. This is layer 3 of no-indexing,
 * complementing the <meta robots> tag (app/layout.tsx) and the
 * X-Robots-Tag HTTP header (next.config.ts).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
