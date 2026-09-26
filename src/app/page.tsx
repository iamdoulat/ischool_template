import type { Metadata } from "next";
import { HomePageClient, type CmsData, type NoticeItem, type BannerItem } from "@/components/public/home-page-client";
import { serverFetch } from "@/lib/server-api";
import { getSchoolSeoData } from "@/lib/seo-utils";

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchoolSeoData();

  return {
    title: `${school.schoolName} — Official Educational Portal & Management System`,
    description: school.schoolDescription,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      alternateLocale: ["bn_BD"],
      url: school.baseUrl,
      siteName: school.schoolName,
      title: `${school.schoolName} — Official Educational Institution Portal`,
      description: school.schoolDescription,
      images: [
        {
          url: school.logoUrl,
          width: 512,
          height: 512,
          alt: `${school.schoolName} Official Logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${school.schoolName} — Official Portal`,
      description: school.schoolDescription,
      images: [school.logoUrl],
    },
  };
}

export default async function HomePage() {
  let initialCms: CmsData | null = null;
  let initialNotices: NoticeItem[] = [];
  let initialBanners: BannerItem[] = [];

  // Parallel server fetch keeps server-to-server latency minimal and pre-renders HTML for Googlebot
  try {
    const [cmsResult, noticesResult, bannersResult] = await Promise.all([
      serverFetch<CmsData>("/front-cms/settings", { revalidate: 60 }),
      serverFetch<NoticeItem[]>("/communicate/notices", { revalidate: 60 }),
      serverFetch<BannerItem[]>("/front-cms/banners", { revalidate: 180 }),
    ]);

    if (cmsResult.data) {
      initialCms = cmsResult.data;
    }

    if (Array.isArray(noticesResult.data)) {
      const all = [...noticesResult.data];
      all.sort(
        (a, b) =>
          new Date(b.notice_date || b.publish_date || 0).getTime() -
          new Date(a.notice_date || a.publish_date || 0).getTime()
      );
      initialNotices = all.slice(0, 5);
    }

    if (Array.isArray(bannersResult.data)) {
      initialBanners = bannersResult.data;
    }
  } catch {
    // Non-blocking fallback
  }

  return (
    <HomePageClient
      initialCms={initialCms}
      initialNotices={initialNotices}
      initialBanners={initialBanners}
    />
  );
}
