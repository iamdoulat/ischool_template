import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { PublicPageBanner } from "@/components/public/public-page-banner";
import { NoticeBoardSection, type Notice } from "@/components/public/notice-board-section";
import { serverFetch } from "@/lib/server-api";
import { getSchoolSeoData } from "@/lib/seo-utils";

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchoolSeoData();
  const title = `Official Notices & Circulars — ${school.schoolName}`;
  const description = `Stay up to date with official school news, circulars, academic schedules, exam timetables, and administrative announcements from ${school.schoolName}.`;

  return {
    title,
    description,
    alternates: {
      canonical: "/notices",
    },
    openGraph: {
      title,
      description,
      url: `${school.baseUrl}/notices`,
      siteName: school.schoolName,
      images: [
        {
          url: school.logoUrl,
          width: 512,
          height: 512,
          alt: `${school.schoolName} Official Notices`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [school.logoUrl],
    },
  };
}

export default async function NoticesPage() {
  const school = await getSchoolSeoData();
  const { data } = await serverFetch<Notice[]>("/communicate/notices", {
    revalidate: 60,
  });

  const initialNotices: Notice[] = Array.isArray(data) ? data : [];

  const noticesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Official Notices & Circulars — ${school.schoolName}`,
    itemListElement: initialNotices.slice(0, 15).map((notice, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "NewsArticle",
        headline: notice.title,
        datePublished: notice.publish_date || notice.notice_date,
        description: notice.message
          ? notice.message.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
          : notice.title,
        publisher: {
          "@type": "EducationalOrganization",
          name: school.schoolName,
          logo: {
            "@type": "ImageObject",
            url: school.logoUrl,
          },
        },
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 font-sans">
      {/* Schema.org NewsArticle ItemList for Search Engine Indexing */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(noticesSchema) }}
      />
      <PublicHeader />

      <main className="flex-1">
        {/* Modern Theme-Aware Hero Banner */}
        <PublicPageBanner
          title="School Notices & Circulars"
          subtitle={`Stay up to date with official school news, upcoming academic schedules, exam timetables, and administrative updates from ${school.schoolName}.`}
          badgeText="Bulletins & Announcements"
          breadcrumbTitle="Notices"
        />

        {/* Main Notices Section: receives pre-fetched initialNotices as props */}
        <div className="container mx-auto px-4 sm:px-6 md:px-12 pt-6 pb-12 sm:pt-8 sm:pb-16 max-w-6xl">
          <NoticeBoardSection initialNotices={initialNotices} />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
