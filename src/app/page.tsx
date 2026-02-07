"use client";

import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { StaffSection } from "@/components/public/staff-section";
import { CoursesSection } from "@/components/public/courses-section";
import { AboutSection } from "@/components/public/about-section";
import { StatsSection } from "@/components/public/stats-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CalendarDays,
  Megaphone,
} from "lucide-react";

export default function Home() {
  const notices = [
    { title: "Winter Term-end Exams Start", date: "01 Dec 2025" },
    { title: "Parents and Guardians Teacher's Meeting", date: "22 Dec 2025" },
    { title: "The Junior Red Cross Program", date: "12 Jan 2026" },
    { title: "Annual Sports Day Registration Open", date: "15 Jan 2026" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 text-white overflow-hidden py-[50px]">
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground border-none text-sm py-1.5 px-4 font-semibold uppercase tracking-wider mb-2">
                Admissions Open for 2026-27
              </Badge>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.1]">
                Empowering <span className="text-primary">Minds</span>,<br />
                Shaping <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">Futures</span>.
              </h1>
              <p className="text-xl md:text-2xl text-slate-200 max-w-2xl leading-relaxed font-light">
                Provide your children with the best education possible. We focus on holistic development, academic excellence, and character building.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 pt-6">
                <Button size="lg" className="text-base font-bold px-10 h-14 rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300">
                  Apply for Admission
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" className="text-base font-bold px-10 h-14 rounded-full bg-white/10 text-white border-white/20 hover:bg-white hover:text-slate-900 backdrop-blur-sm transition-all duration-300">
                  Take a Tour
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* New About Section */}
        <AboutSection />

        {/* New Courses Section */}
        <CoursesSection />

        {/* New Staff Section */}
        <StaffSection />

        {/* Notice Board Section */}
        <section id="notices" className="py-[50px] bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight">
                  Latest Notices
                </h2>
                <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
              </div>

              <Card className="border-t-4 border-t-primary shadow-xl overflow-hidden bg-white">
                <div className="bg-slate-100/50 p-6 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3 font-bold text-xl text-slate-800">
                    <Megaphone className="h-6 w-6 text-primary" />
                    School Notice Board
                  </div>
                  <Button variant="outline" size="sm" className="font-semibold">View All Notices</Button>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {notices.map((notice, i) => (
                      <div key={i} className="p-6 hover:bg-slate-50 transition-colors group cursor-pointer flex gap-6 items-center">
                        <div className="shrink-0 flex flex-col items-center justify-center bg-white border-2 border-primary/20 text-primary rounded-xl h-20 w-20 font-bold shadow-sm group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                          <span className="text-2xl leading-none">{notice.date.split(' ')[0]}</span>
                          <span className="text-xs uppercase font-bold mt-1">{notice.date.split(' ')[1]}</span>
                        </div>
                        <div className="space-y-2 flex-1">
                          <h4 className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">
                            {notice.title}
                          </h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" /> {notice.date}
                          </p>
                        </div>
                        <div className="hidden md:block">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>

        {/* Animated Stats Section */}
        <StatsSection />

      </main>

      <PublicFooter />
    </div>
  );
}
