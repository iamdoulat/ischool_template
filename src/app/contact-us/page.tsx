"use client";

import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { ContactFormSection } from "@/components/public/contact-form";

export default function ContactUsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
            <PublicHeader />
            
            <main className="flex-1">
                {/* Hero Header Section */}
                <div className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
                    <div className="container mx-auto px-6 sm:px-8 md:px-12 relative z-10 text-center">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight uppercase">
                            Contact Us
                        </h1>
                        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-xl mx-auto">
                            We'd love to hear from you. Reach out to our administration or send us a message below.
                        </p>
                    </div>
                </div>

                {/* Main 2-Column Contact Section */}
                <div className="container mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16">
                    <ContactFormSection />
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
