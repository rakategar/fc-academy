import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/coach$"],
      // Area login & data pribadi tidak perlu diindeks
      disallow: ["/admin", "/pemain", "/coach/", "/daftar", "/menunggu", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
