import type { Metadata } from "next";
import { SlugPageClient } from "./slug-page-client";

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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ischool.coolify.mddoulat.com";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

  let title = formatSlugTitle(slug);
  let description = `${title} — Learn more about educational programs, events, and official portal notices at iSchool.`;

  try {
    const res = await fetch(`${apiUrl}/front-cms/pages/show-by-slug/${slug}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(1500),
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      const page = json.data || json;
      if (page?.title) {
        title = page.title;
        if (page.content) {
          const stripped = page.content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          if (stripped.length > 20) {
            description = stripped.slice(0, 160) + "...";
          }
        }
      }
    }
  } catch {
    // Fallback to title generated from slug
  }

  return {
    title: `${title}`,
    description,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title: `${title} — iSchool`,
      description,
      url: `${baseUrl}/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — iSchool`,
      description,
    },
  };
}

export default async function DynamicSlugPage({ params }: Props) {
  const { slug } = await params;
  return <SlugPageClient slug={slug} />;
}
