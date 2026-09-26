import type { MetadataRoute } from "next";
import { serverFetch } from "@/lib/server-api";
import { getSchoolSeoData } from "@/lib/seo-utils";
import { getImageUrl } from "@/lib/image-url";

interface FrontCmsPage {
  id: number;
  title?: string;
  slug?: string;
  is_active?: boolean | number;
  featured_image?: string;
  image?: string;
  updated_at?: string;
}

interface SchoolNotice {
  id: number;
  title?: string;
  slug?: string;
  attachment?: string;
  publish_date?: string;
  updated_at?: string;
  is_published?: boolean | number;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const school = await getSchoolSeoData();
  const baseUrl = school.baseUrl;
  const logoUrl = school.logoUrl;
  const currentDate = new Date();

  // Helper to ensure clean absolute image URLs for Google Image Search
  const formatImageUrl = (path?: string): string | null => {
    if (!path) return null;
    const resolved = getImageUrl(path);
    if (!resolved) return null;
    if (resolved.startsWith("http://") || resolved.startsWith("https://")) return resolved;
    return `${baseUrl}${resolved.startsWith("/") ? "" : "/"}${resolved}`;
  };

  const schoolImages = [logoUrl].filter(Boolean);

  // 1. Core Public Institutional Pages with Image Sitemap Metadata
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
      images: schoolImages,
    },
    {
      url: `${baseUrl}/online_admission`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.95,
      images: schoolImages,
    },
    {
      url: `${baseUrl}/admission`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.95,
      images: schoolImages,
    },
    {
      url: `${baseUrl}/exam-results`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
      images: schoolImages,
    },
    {
      url: `${baseUrl}/notices`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
      images: schoolImages,
    },
    {
      url: `${baseUrl}/academics`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
      images: [
        ...schoolImages,
        ...(school.cmsCourses?.map((c) => formatImageUrl(c.image)).filter(Boolean) as string[] || []),
      ],
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [
        ...schoolImages,
        ...(school.cmsAbout?.image ? [formatImageUrl(school.cmsAbout.image)].filter(Boolean) as string[] : []),
      ],
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
      images: schoolImages,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.4,
      images: schoolImages,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.4,
      images: schoolImages,
    },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [];

  // 2. Dynamically Fetch Front CMS Published Pages & Their Images
  try {
    const { data: pages } = await serverFetch<FrontCmsPage[]>("/front-cms/pages", {
      revalidate: 300,
    });

    if (Array.isArray(pages)) {
      const reservedSlugs = new Set([
        "about-us",
        "about",
        "academics",
        "contact-us",
        "contact",
        "exam-results",
        "notices",
        "online_admission",
        "online-admission",
        "admission",
        "admissions",
        "login",
        "dashboard",
        "privacy-policy",
        "terms-and-conditions",
      ]);

      for (const page of pages) {
        if (!page.slug || reservedSlugs.has(page.slug)) continue;
        if (page.is_active === false || page.is_active === 0) continue;

        const pageImages = [...schoolImages];
        const pageImg = formatImageUrl(page.featured_image || page.image);
        if (pageImg) pageImages.push(pageImg);

        dynamicRoutes.push({
          url: `${baseUrl}/${page.slug}`,
          lastModified: page.updated_at ? new Date(page.updated_at) : currentDate,
          changeFrequency: "weekly",
          priority: 0.75,
          images: pageImages,
        });
      }
    }
  } catch {
    // Non-blocking fallback
  }

  // 3. Dynamically Fetch Official School Bulletins, Notices & Attachments
  try {
    const { data: notices } = await serverFetch<SchoolNotice[]>("/communicate/notices", {
      revalidate: 180,
    });

    if (Array.isArray(notices)) {
      for (const notice of notices) {
        if (notice.is_published === false || notice.is_published === 0) continue;

        const noticeDate = notice.publish_date || notice.updated_at;
        const noticeImages = [...schoolImages];
        const attachImg = formatImageUrl(notice.attachment);
        if (attachImg) noticeImages.push(attachImg);

        dynamicRoutes.push({
          url: `${baseUrl}/notices?id=${notice.id}`,
          lastModified: noticeDate ? new Date(noticeDate) : currentDate,
          changeFrequency: "daily",
          priority: 0.7,
          images: noticeImages,
        });
      }
    }
  } catch {
    // Non-blocking fallback
  }

  return [...staticRoutes, ...dynamicRoutes];
}
