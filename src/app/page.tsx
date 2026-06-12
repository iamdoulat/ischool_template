"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Loader2,
  Eye,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import api from "@/lib/api";
import { format } from "date-fns";

export default function Home() {
  const [cms, setCms] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewNotice, setViewNotice] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cmsRes, noticesRes] = await Promise.all([
          api.get("/front-cms/settings"),
          api.get("/communicate/notices"),
        ]);
        const cmsData = cmsRes.data?.data || null;
        setCms(cmsData);

        const noticeResult = noticesRes.data?.data || noticesRes.data || [];
        const all = Array.isArray(noticeResult) ? noticeResult : [];
        all.sort((a: any, b: any) => new Date(b.notice_date).getTime() - new Date(a.notice_date).getTime());
        setNotices(all.slice(0, 5));
      } catch {
        setNotices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {cms?.header_footer_sections?.header_enabled !== false && <PublicHeader />}

      <main className="flex-1">
        {/* Hero Section */}
        {cms?.header_footer_sections?.hero_enabled !== false && (
        <section className="relative bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 text-white overflow-hidden py-[50px]">
          <div
            className="absolute inset-0 opacity-40 bg-cover bg-center mix-blend-overlay"
            style={cms?.header_footer_sections?.hero_background ? { backgroundImage: `url('${cms.header_footer_sections.hero_background}')` } : {}}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              {cms?.header_footer_sections?.header_text && (
                <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground border-none text-sm py-1.5 px-4 font-semibold uppercase tracking-wider mb-2">
                  {cms.header_footer_sections.header_text}
                </Badge>
              )}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                {cms?.header_footer_sections?.hero_title_part1 || "Empowering"} <span className="text-primary">{cms?.header_footer_sections?.hero_title_highlight || "Minds"}</span>,<br />
                {cms?.header_footer_sections?.hero_title_part2 || "Shaping"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">{cms?.header_footer_sections?.hero_title_gradient || "Futures"}</span>.
              </h1>
              <p className="text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed font-light">
                {cms?.header_footer_sections?.hero_subtitle || "Provide your children with the best education possible. We focus on holistic development, academic excellence, and character building."}
              </p>
              <div className="flex flex-col sm:flex-row gap-5 pt-6">
                <Button asChild size="lg" className="text-base font-bold px-10 h-14 rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300">
                  <Link href={cms?.header_footer_sections?.hero_btn1_link || "/online_admission"}>
                    {cms?.header_footer_sections?.hero_btn1_text || "Apply for Admission"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-base font-bold px-10 h-14 rounded-full bg-white/10 text-white border-white/20 hover:bg-white hover:text-slate-900 backdrop-blur-sm transition-all duration-300">
                  <Link href={cms?.header_footer_sections?.hero_btn2_link || "#"}>
                    {cms?.header_footer_sections?.hero_btn2_text || "Take a Tour"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* New About Section */}
        {cms?.header_footer_sections?.about_enabled !== false && <AboutSection about={cms?.about_us} />}

        {/* New Courses Section */}
        {cms?.header_footer_sections?.courses_enabled !== false && (
        <CoursesSection courses={cms?.main_courses} sectionTitle={cms?.header_footer_sections?.courses_section_title} sectionSubtitle={cms?.header_footer_sections?.courses_section_subtitle} />
        )}

        {/* New Staff Section */}
        {cms?.header_footer_sections?.staff_enabled !== false && (
        <StaffSection staff={cms?.experienced_staffs} sectionTitle={cms?.header_footer_sections?.staff_section_title} sectionSubtitle={cms?.header_footer_sections?.staff_section_subtitle} />
        )}

        {/* Notice Board Section */}
        {cms?.header_footer_sections?.notices_enabled !== false && (
        <section id="notices" className="py-[50px] bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
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
                  <Button variant="outline" size="sm" className="font-semibold" asChild><Link href="/notices">View All Notices</Link></Button>
                </div>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : notices.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <Megaphone className="h-12 w-12 mx-auto opacity-20 mb-3" />
                      <p className="font-semibold">No notices available</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notices.map((notice, i) => {
                        const d = new Date(notice.notice_date);
                        const day = format(d, 'dd');
                        const month = format(d, 'MMM');
                        const formattedDate = format(d, 'dd MMM yyyy');
                        return (
                          <div key={notice.id || i} className="p-6 hover:bg-slate-50 transition-colors group cursor-pointer flex gap-6 items-center" onClick={() => setViewNotice(notice)}>
                            <div className="shrink-0 flex flex-col items-center justify-center bg-white border-2 border-primary/20 text-primary rounded-xl h-20 w-20 font-bold shadow-sm group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                              <span className="text-2xl leading-none">{day}</span>
                              <span className="text-xs uppercase font-bold mt-1">{month}</span>
                            </div>
                            <div className="space-y-2 flex-1">
                              <h4 className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">
                                {notice.title}
                              </h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" /> {formattedDate}
                              </p>
                            </div>
                            <div className="hidden md:block">
                              <button onClick={(e) => { e.stopPropagation(); setViewNotice(notice); }} className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <ArrowRight className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </section>
        )}

        <Dialog open={!!viewNotice} onOpenChange={(open) => !open && setViewNotice(null)}>
          <DialogContent className="sm:max-w-[700px] p-0 rounded-lg border-none shadow-2xl">
            <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
              <DialogHeader className="p-0">
                <DialogTitle className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {viewNotice?.title}
                </DialogTitle>
              </DialogHeader>
              <button onClick={() => setViewNotice(null)} className="text-white/80 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            {viewNotice && (
              <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[65vh]">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    Notice: {format(new Date(viewNotice.notice_date), 'dd/MM/yyyy')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    Publish: {format(new Date(viewNotice.publish_date), 'dd/MM/yyyy')}
                  </div>
                </div>

                {viewNotice.message_to && (
                  <div className="flex flex-wrap items-center gap-2">
                    {viewNotice.message_to.split(',').map((s: string) => s.trim()).filter(Boolean).map((to: string, i: number) => (
                      <span key={i} className="inline-flex items-center px-3 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-semibold">
                        {to}
                      </span>
                    ))}
                  </div>
                )}

                {viewNotice.is_published !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      viewNotice.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {viewNotice.is_published ? 'Published' : 'Pending'}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-6">
                  <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-headings:font-bold prose-a:text-indigo-600 prose-img:max-w-full prose-img:h-auto prose-table:w-full prose-pre:overflow-x-auto break-words [&_*]:break-words"
                    dangerouslySetInnerHTML={{ __html: viewNotice.message }}
                  />
                </div>
              </div>
            )}
            <div className="p-6 bg-gray-50/50 border-t border-gray-100">
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewNotice(null)} className="h-10 text-[10px] uppercase font-bold rounded-full px-8 bg-white border-gray-200">
                  Close
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Animated Stats Section */}
        {cms?.header_footer_sections?.stats_enabled !== false && (
        <StatsSection
            students={cms?.header_footer_sections?.stats_students ?? 2500}
            teachers={cms?.header_footer_sections?.stats_teachers ?? 150}
            awards={cms?.header_footer_sections?.stats_awards ?? 50}
            courses={cms?.header_footer_sections?.stats_courses ?? 30}
        />
        )}

      </main>

      {cms?.header_footer_sections?.footer_enabled !== false && <PublicFooter />}
    </div>
  );
}
