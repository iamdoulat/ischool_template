"use client";

import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { NoticeBoardSection } from "@/components/public/notice-board-section";

export default function NoticesPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <PublicHeader />
      <main className="flex-1 py-[50px] bg-slate-50">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight">
              All Notices
            </h1>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
          </div>
          <NoticeBoardSection />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
