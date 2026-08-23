import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { AboutUsSection } from "@/components/public/about-section";

export const metadata: Metadata = {
  title: "About Us — Mission, Vision & Campus",
  description:
    "Learn about iSchool's history, leadership, educational philosophy, campus facilities, and our dedication to academic excellence and student success.",
  alternates: {
    canonical: "/about-us",
  },
  openGraph: {
    title: "About Us — Mission, Vision & Campus — iSchool",
    description:
      "Discover the heritage, mission, educational philosophy, leadership, and modern campus infrastructure of iSchool.",
    url: "/about-us",
  },
};

export default function AboutUsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-slate-900 text-white py-14 sm:py-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
          <div className="container mx-auto px-6 sm:px-8 md:px-12 relative z-10 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight uppercase">
              About Our School
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Committed to nurturing intellect, character, and lifelong learning since our inception.
            </p>
          </div>
        </div>

        {/* About Us Component */}
        <div className="container mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-14">
          <AboutUsSection />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
