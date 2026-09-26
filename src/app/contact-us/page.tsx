import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { PublicPageBanner } from "@/components/public/public-page-banner";
import { ContactFormSection } from "@/components/public/contact-form";
import { getSchoolSeoData } from "@/lib/seo-utils";

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchoolSeoData();
  const title = `Contact Us & Campus Location — ${school.schoolName}`;
  const description = `Get in touch with ${school.schoolName} administration, admissions desk, and student support. Campus address: ${school.address}. Phone: ${school.phone}.`;

  return {
    title,
    description,
    alternates: {
      canonical: "/contact-us",
    },
    openGraph: {
      title,
      description,
      url: `${school.baseUrl}/contact-us`,
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

export default async function ContactUsPage() {
  const school = await getSchoolSeoData();
  const baseUrl = school.baseUrl;

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact Us & Campus Location — ${school.schoolName}`,
    description: `Get in touch with ${school.schoolName} administration, admissions desk, and student support.`,
    url: `${baseUrl}/contact-us`,
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
      {/* Schema.org ContactPage structured data */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <PublicHeader />

      <main className="flex-1">
        {/* Modern Theme-Aware Hero Banner */}
        <PublicPageBanner
          title="Contact Us"
          subtitle={`We are here to answer your questions regarding admissions, academics, and campus life at ${school.schoolName}.`}
          breadcrumbTitle="Contact Us"
        />

        {/* Contact Form Component */}
        <div className="container mx-auto px-4 sm:px-6 md:px-12 pt-6 pb-12 sm:pt-8 sm:pb-16">
          <ContactFormSection />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
