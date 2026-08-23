import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { ContactFormSection } from "@/components/public/contact-form";

export const metadata: Metadata = {
  title: "Contact Us & Campus Location",
  description:
    "Get in touch with iSchool administration, admissions desk, and student support. Find campus address, contact phone numbers, email, and visiting hours.",
  alternates: {
    canonical: "/contact-us",
  },
  openGraph: {
    title: "Contact Us & Campus Location — iSchool",
    description:
      "Reach out to iSchool admissions, office staff, and administrative teams. View campus address, telephone, email, and inquiry form.",
    url: "/contact-us",
  },
};

export default function ContactUsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-slate-900 text-white py-14 sm:py-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
          <div className="container mx-auto px-6 sm:px-8 md:px-12 relative z-10 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight uppercase">
              Contact Us
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              We are here to answer your questions regarding admissions, academics, and campus life.
            </p>
          </div>
        </div>

        {/* Contact Form Component */}
        <div className="container mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-14">
          <ContactFormSection />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
