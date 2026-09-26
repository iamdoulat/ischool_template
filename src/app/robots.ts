import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://ischool.coolify.mddoulat.com").replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "Googlebot-Image",
        allow: "/",
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/_next/image", "/_next/static/"],
        disallow: [
          "/dashboard/",
          "/user/",
          "/api/",
          "/login",
          "/forgot-password",
          "/reset-password",
        ],
      },
      {
        userAgent: "*",
        allow: ["/", "/_next/image", "/_next/static/"],
        disallow: [
          "/dashboard/",
          "/user/",
          "/api/",
          "/login",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

