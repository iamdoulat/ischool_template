import type { Metadata } from "next";
import Image from "next/image";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { PublicPageBanner } from "@/components/public/public-page-banner";
import { BookOpen, GraduationCap, Compass, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getSchoolSeoData } from "@/lib/seo-utils";
import { getImageUrl } from "@/lib/image-url";

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchoolSeoData();
  const title = `Academic Programs & Curriculum — ${school.schoolName}`;
  const description = `Explore academic programs, grade curricula, distinguished faculty, and learning resources at ${school.schoolName}. Comprehensive education from primary to higher secondary.`;

  return {
    title,
    description,
    alternates: {
      canonical: "/academics",
    },
    openGraph: {
      title,
      description,
      url: `${school.baseUrl}/academics`,
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

export default async function AcademicsPage() {
  const school = await getSchoolSeoData();
  const baseUrl = school.baseUrl;

  // Dynamically resolve courses from Front CMS or generate dynamic academic programs
  const dynamicCourses =
    school.cmsCourses && school.cmsCourses.length > 0
      ? school.cmsCourses.map((c, idx) => ({
          title: c.title,
          description: c.description,
          badge: c.category || (idx === 0 ? "Foundation" : idx === 1 ? "Intermediate" : "Advanced"),
          image: c.image ? getImageUrl(c.image) : undefined,
          icon: idx === 0 ? BookOpen : idx === 1 ? Compass : GraduationCap,
          features: [
            "Activity-based Interactive Learning",
            "Core Literacy & Analytical Thinking",
            "Modern Classrooms & Equipment",
            "Continuous Progress Mentorship",
          ],
        }))
      : [
          {
            title: `Primary Education (Grade 1 - 5) — ${school.schoolName}`,
            description:
              "Foundational learning focusing on literacy, numeracy, creative expression, and social-emotional development in an engaging environment.",
            icon: BookOpen,
            badge: "Primary Level",
            features: [
              "Interactive Activity-based Learning",
              "Core Literacy & Numeracy",
              "Art, Music & Physical Education",
              "Moral & Value Education",
            ],
          },
          {
            title: `Middle School (Grade 6 - 8) — ${school.schoolName}`,
            description:
              "Comprehensive curriculum designed to bridge fundamental concepts with analytical thinking, sciences, and digital literacy.",
            icon: Compass,
            badge: "Middle Level",
            features: [
              "Integrated Science & Mathematics",
              "Language & Literature",
              "Computer Science & ICT",
              "Extracurricular Clubs & Sports",
            ],
          },
          {
            title: `Secondary & Board Level (Grade 9 - 10) — ${school.schoolName}`,
            description:
              "Rigorous academic pathways preparing students for board examinations, competitive admissions, and future careers.",
            icon: GraduationCap,
            badge: "Secondary Level",
            features: [
              "Science, Humanities & Core Streams",
              "Advanced Lab Facilities",
              "Board Exam Preparation & Mock Tests",
              "Career Counseling & Mentorship",
            ],
          },
        ];

  const academicsSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Academic Programs & Curriculum — ${school.schoolName}`,
    description: `Explore academic programs, grade curricula, distinguished faculty, and learning resources at ${school.schoolName}.`,
    url: `${baseUrl}/academics`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(academicsSchema) }}
      />
      <PublicHeader />

      <main className="flex-1">
        {/* Modern Theme-Aware Hero Banner */}
        <PublicPageBanner
          title="Academics & Curriculum"
          subtitle={`Empowering students at ${school.schoolName} through innovative pedagogy, comprehensive curriculum standards, and holistic character development.`}
          badgeText="Academic Excellence"
          breadcrumbTitle="Academics"
        />

        {/* Academic Overview Grid */}
        <section className="container mx-auto px-4 sm:px-6 md:px-12 pt-6 pb-12 sm:pt-8 sm:pb-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Academic Framework & Programs
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Structured progressive learning stages tailored to inspire curiosity and academic excellence at {school.schoolName}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dynamicCourses.map((prog, idx) => {
              const Icon = prog.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group overflow-hidden"
                >
                  <div>
                    {prog.image && (
                      <div className="relative mb-4 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 h-44 overflow-hidden bg-slate-100">
                        <Image
                          src={prog.image}
                          alt={`${prog.title} at ${school.schoolName}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {prog.badge}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {prog.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                      {prog.description}
                    </p>

                    <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                      {prog.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-4">
                    <Link
                      href="/online_admission"
                      className="block w-full text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-[#044E43] hover:bg-[#033b33] text-white shadow-xs transition-colors"
                    >
                      Apply for Admission
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="bg-indigo-900 text-white py-12">
          <div className="container mx-auto px-4 sm:px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-xl font-bold">Have Questions About Admissions or Syllabus?</h3>
              <p className="text-xs text-indigo-200">Our academic counseling team at {school.schoolName} is ready to guide you.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/contact-us"
                className="px-6 py-3 rounded-full bg-white text-indigo-900 font-bold text-xs hover:bg-slate-100 transition-colors shadow-sm"
              >
                Contact Admissions
              </Link>
              <Link
                href="/exam-results"
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/20"
              >
                View Exam Results
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
