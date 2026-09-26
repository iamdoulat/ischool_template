import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { PublicPageBanner } from "@/components/public/public-page-banner";
import { AboutUsSection } from "@/components/public/about-section";
import { getSchoolSeoData } from "@/lib/seo-utils";

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchoolSeoData();
  const title = `About Us — ${school.schoolName}`;
  const description =
    school.cmsAbout?.description ||
    `Learn about ${school.schoolName}'s heritage, educational leadership, mission, vision, campus facilities, and dedication to academic excellence.`;

  return {
    title,
    description,
    alternates: {
      canonical: "/about-us",
    },
    openGraph: {
      title,
      description,
      url: `${school.baseUrl}/about-us`,
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
      title,
      description,
      images: [school.logoUrl],
    },
  };
}

export default async function AboutUsPage() {
  const school = await getSchoolSeoData();
  const baseUrl = school.baseUrl;

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About Us — ${school.schoolName}`,
    description: `Discover the mission, vision, history, and campus facilities of ${school.schoolName}.`,
    url: `${baseUrl}/about-us`,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: school.logoUrl,
    },
    mainEntity: {
      "@type": "EducationalOrganization",
      name: school.schoolName,
      url: baseUrl,
      logo: school.logoUrl,
      image: school.logoUrl,
      telephone: school.phone,
      email: school.email,
      address: school.address,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 font-sans">
      {/* Schema.org AboutPage structured data */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <PublicHeader />

      <main className="flex-1">
        {/* Modern Theme-Aware Hero Banner */}
        <PublicPageBanner
          title="About Our School"
          subtitle={`Committed to nurturing intellect, character, and lifelong learning at ${school.schoolName}.`}
          breadcrumbTitle="About Us"
        />

        {/* About Us Component */}
        <div className="container mx-auto px-4 sm:px-6 md:px-12 pt-6 pb-12 sm:pt-8 sm:pb-16">
          <AboutUsSection about={school.cmsAbout} />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
