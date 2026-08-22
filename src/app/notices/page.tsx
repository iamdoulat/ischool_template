"use client";

import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { NoticeBoardSection } from "@/components/public/notice-board-section";
import { Bell } from "lucide-react";

export default function NoticesPage() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 font-sans">
            <PublicHeader />
            
            <main className="flex-1">
                {/* Hero Header Section */}
                <div className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
                    <div className="container mx-auto px-6 sm:px-8 md:px-12 relative z-10 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-indigo-400/30">
                            <Bell className="h-3.5 w-3.5" /> Bulletins & Announcements
                        </span>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight uppercase">
                            School Notices & Circulars
                        </h1>
                        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-xl mx-auto">
                            Stay up to date with official school news, upcoming academic schedules, exam timetables, and administrative updates.
                        </p>
                    </div>
                </div>

                {/* Main Notices Section */}
                <div className="container mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 max-w-6xl">
                    <NoticeBoardSection />
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
