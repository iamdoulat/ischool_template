import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://ischool.coolify.mddoulat.com").replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/online_admission",
          "/admission",
          "/online-admission",
          "/admissions",
          "/academics",
          "/exam-results",
          "/notices",
          "/contact-us",
          "/about-us",
          "/privacy-policy",
          "/terms-and-conditions",
        ],
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
  };
}
