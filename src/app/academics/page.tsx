import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { BookOpen, GraduationCap, Award, Compass, CheckCircle2, Search } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Academic Programs & Curriculum",
  description:
    "Explore academic programs, grade curricula, distinguished faculty, and learning resources at iSchool. Comprehensive education from primary to higher secondary.",
  alternates: {
    canonical: "/academics",
  },
  openGraph: {
    title: "Academic Programs & Curriculum — iSchool",
    description:
      "Explore comprehensive academic curricula, grade-wise subjects, faculty excellence, and student learning opportunities at iSchool.",
    url: "/academics",
  },
};

const ACADEMIC_PROGRAMS = [
  {
    title: "Primary Education (Grade 1 - 5)",
    description: "Foundational learning focusing on literacy, numeracy, creative expression, and social-emotional development in an engaging environment.",
    icon: BookOpen,
    features: ["Interactive Activity-based Learning", "Core Literacy & Numeracy", "Art, Music & Physical Education", "Moral & Value Education"],
    badge: "Foundation",
  },
  {
    title: "Middle School (Grade 6 - 8)",
    description: "Comprehensive curriculum designed to bridge fundamental concepts with analytical thinking, sciences, and digital literacy.",
    icon: Compass,
    features: ["Integrated Science & Mathematics", "Language & Literature", "Computer Science & Coding", "Extracurricular Clubs & Sports"],
    badge: "Intermediate",
  },
  {
    title: "Secondary & Higher Secondary (Grade 9 - 12)",
    description: "Rigorous academic pathways preparing students for board examinations, competitive university admissions, and future careers.",
    icon: GraduationCap,
    features: ["Science, Commerce & Humanities Streams", "Advanced Lab Facilities", "Board Exam Preparation & Mock Tests", "Career Counseling & Mentorship"],
    badge: "Advanced",
  },
];

export default function AcademicsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-25 bg-[url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-transparent" />
          <div className="container mx-auto px-6 sm:px-8 md:px-12 relative z-10 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
              <Award className="h-3.5 w-3.5" />
              Academic Excellence
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight uppercase">
              Academics & Curriculum
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Empowering students through innovative pedagogy, comprehensive curriculum standards, and holistic character development.
            </p>
          </div>
        </section>

        {/* Academic Overview Grid */}
        <section className="container mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Our Academic Framework
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Structured progressive learning stages tailored to inspire curiosity and academic excellence at every grade level.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ACADEMIC_PROGRAMS.map((prog, idx) => {
              const Icon = prog.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
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
              <p className="text-xs text-indigo-200">Our academic counseling team is ready to guide you through course selection and admissions.</p>
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
