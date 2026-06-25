import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/leads", "/settings", "/login", "/api/"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://pre-diagnostico.contadorgerardohuerta.com"}/sitemap.xml`,
  };
}
