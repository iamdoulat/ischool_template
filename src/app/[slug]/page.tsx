import type { Metadata } from "next";
import { SlugPageClient } from "./slug-page-client";
import { getSchoolSeoData } from "@/lib/seo-utils";
import { serverFetch } from "@/lib/server-api";

interface Props {
  params: Promise<{ slug: string }>;
}

function formatSlugTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const school = await getSchoolSeoData();
  const baseUrl = school.baseUrl;

  let title = formatSlugTitle(slug);
  let description = `${title} — Learn more about educational programs, campus events, and official notices at ${school.schoolName}.`;

  try {
    const { data: page } = await serverFetch<{
      title?: string;
      content?: string;
    }>(`/front-cms/pages/show-by-slug/${slug}`, {
      revalidate: 60,
    });

    if (page?.title) {
      title = page.title;
      if (page.content) {
        const stripped = page.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (stripped.length > 20) {
          description = stripped.slice(0, 160) + "...";
        }
      }
    }
  } catch {
    // Fallback to title generated from slug
  }

  return {
    title: `${title} — ${school.schoolName}`,
    description,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title: `${title} — ${school.schoolName}`,
      description,
      url: `${baseUrl}/${slug}`,
      siteName: school.schoolName,
      images: [
        {
          url: school.logoUrl,
          width: 512,
          height: 512,
          alt: `${school.schoolName} Logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${school.schoolName}`,
      description,
      images: [school.logoUrl],
    },
  };
}

export default async function DynamicSlugPage({ params }: Props) {
  const { slug } = await params;
  const school = await getSchoolSeoData();
  const baseUrl = school.baseUrl;
  const title = formatSlugTitle(slug);

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${title} — ${school.schoolName}`,
    url: `${baseUrl}/${slug}`,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: school.logoUrl,
    },
    isPartOf: {
      "@type": "WebSite",
      name: school.schoolName,
      url: baseUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <SlugPageClient slug={slug} />
    </>
  );
}
