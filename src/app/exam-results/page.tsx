import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { ExamResultSection } from "@/components/public/exam-result-section";

export const metadata: Metadata = {
  title: "Online Examination Results & Marksheets",
  description:
    "Search and verify student examination results, terminal marksheets, grades, and academic evaluation reports online securely at iSchool.",
  alternates: {
    canonical: "/exam-results",
  },
  openGraph: {
    title: "Online Examination Results & Marksheets — iSchool",
    description:
      "Access student examination results, subject-wise marks, GPA, and official marksheets online.",
    url: "/exam-results",
  },
};

export default function ExamResultsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-slate-900 text-white py-14 sm:py-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
          <div className="container mx-auto px-6 sm:px-8 md:px-12 relative z-10 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight uppercase">
              Examination Results
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Select your academic session, examination, and enter admission number or roll number to view and print official results.
            </p>
          </div>
        </div>

        {/* Exam Result Section Component */}
        <div className="container mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-14">
          <ExamResultSection />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
