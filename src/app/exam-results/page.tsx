import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { PublicPageBanner } from "@/components/public/public-page-banner";
import { ExamResultSection } from "@/components/public/exam-result-section";
import { getSchoolSeoData } from "@/lib/seo-utils";

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchoolSeoData();
  const title = `Online Examination Results & Marksheets — ${school.schoolName}`;
  const description = `Search and verify student examination results, terminal marksheets, grades, and academic evaluation reports online securely at ${school.schoolName}.`;

  return {
    title,
    description,
    alternates: {
      canonical: "/exam-results",
    },
    openGraph: {
      title,
      description,
      url: `${school.baseUrl}/exam-results`,
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

export default async function ExamResultsPage() {
  const school = await getSchoolSeoData();
  const baseUrl = school.baseUrl;

  const examSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Online Examination Results & Marksheets — ${school.schoolName}`,
    description: `Search and verify student examination results, terminal marksheets, grades, and academic evaluation reports online securely at ${school.schoolName}.`,
    url: `${baseUrl}/exam-results`,
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
      {/* Schema.org WebPage structured data */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(examSchema) }}
      />
      <PublicHeader />

      <main className="flex-1">
        {/* Modern Theme-Aware Hero Banner */}
        <PublicPageBanner
          title="Examination Results"
          subtitle={`Select your academic session, examination, and enter admission number or roll number to view and print official results for ${school.schoolName}.`}
          breadcrumbTitle="Exam Results"
        />

        {/* Exam Result Section Component */}
        <div className="container mx-auto px-4 sm:px-6 md:px-12 pt-6 pb-12 sm:pt-8 sm:pb-16">
          <ExamResultSection />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
