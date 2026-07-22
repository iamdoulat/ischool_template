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

import { useTranslation } from "@/hooks/use-translation";

interface NoticeItem {
  id?: number;
  title?: string;
  notice_date?: string;
  publish_date?: string;
  message?: string;
  message_to?: string;
  is_published?: boolean;
}

interface CmsData {
  header_footer_sections?: Record<string, any>;
  about_us?: Record<string, any>;
  main_courses?: any[];
  experienced_staffs?: any[];
}

export default function Home() {
  const { t } = useTranslation();
  const [cms, setCms] = useState<CmsData | null>(null);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewNotice, setViewNotice] = useState<NoticeItem | null>(null);

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
        const all: NoticeItem[] = Array.isArray(noticeResult) ? noticeResult : [];
        all.sort((a, b) => new Date(b.notice_date || 0).getTime() - new Date(a.notice_date || 0).getTime());
        setNotices(all.slice(0, 5));
      } catch {
        setNotices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hfs = (cms?.header_footer_sections || {}) as Record<string, any>;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {hfs.header_enabled !== false && <PublicHeader />}

      <main className="flex-1">
        {/* Hero Section */}
        {hfs.hero_enabled !== false && (
        <section className="relative bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 text-white overflow-hidden pt-8 pb-16 md:pt-10 md:pb-24 lg:pt-12 lg:pb-28">
          <div
            className="absolute inset-0 opacity-40 bg-cover bg-center mix-blend-overlay"
            style={hfs.hero_background ? { backgroundImage: `url('${hfs.hero_background}')` } : {}}
          />
          {/* Animated decorative glows */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-blob pointer-events-none" />
          <div className="absolute top-1/3 -right-24 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-blob animation-delay-2000 pointer-events-none" />
          <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-blob animation-delay-4000 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              {hfs.header_text && (
                <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground border-none text-sm py-1.5 px-4 font-semibold uppercase tracking-wider mb-2">
                  {hfs.header_text}
                </Badge>
              )}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                {hfs.hero_title_part1 || t("empowering")} <span className="text-primary">{hfs.hero_title_highlight || t("minds")}</span>,<br />
                {hfs.hero_title_part2 || t("shaping")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">{hfs.hero_title_gradient || t("futures")}</span>.
              </h1>
              <p className="text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed font-light">
                {hfs.hero_subtitle || t("hero_subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-5 pt-6">
                <Button asChild size="lg" className="text-base font-bold px-10 h-14 rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300">
                  <Link href={hfs.hero_btn1_link || "/online_admission"}>
                    {hfs.hero_btn1_text || t("apply_for_admission")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base font-bold px-10 h-14 rounded-full bg-white/10 text-white border-white/20 hover:bg-white hover:text-slate-900 backdrop-blur-sm transition-all duration-300">
                  <Link href={hfs.hero_btn2_link || "#"}>
                    {hfs.hero_btn2_text || t("take_a_tour")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* New About Section */}
        {hfs.about_enabled !== false && <AboutSection about={cms?.about_us} />}

        {/* New Courses Section */}
        {hfs.courses_enabled !== false && (
        <CoursesSection courses={cms?.main_courses} sectionTitle={hfs.courses_section_title} sectionSubtitle={hfs.courses_section_subtitle} />
        )}

        {/* New Staff Section */}
        {hfs.staff_enabled !== false && (
        <StaffSection staff={cms?.experienced_staffs} sectionTitle={hfs.staff_section_title} sectionSubtitle={hfs.staff_section_subtitle} />
        )}

        {/* Notice Board Section */}
        {hfs.notices_enabled !== false && (
        <section id="notices" className="py-[50px] bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight">
                  {t("latest_notices")}
                </h2>
                <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
              </div>

              <Card className="border-t-4 border-t-primary shadow-xl overflow-hidden bg-white">
                <div className="bg-slate-100/50 p-6 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3 font-bold text-xl text-slate-800">
                    <Megaphone className="h-6 w-6 text-primary" />
                    {t("school_notice_board")}
                  </div>
                  <Button variant="outline" size="sm" className="font-semibold" asChild><Link href="/notices">{t("view_all_notices")}</Link></Button>
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
                        const d = new Date(notice.notice_date || Date.now());
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
                    Notice: {format(new Date(viewNotice.notice_date || Date.now()), 'dd/MM/yyyy')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    Publish: {format(new Date(viewNotice.publish_date || Date.now()), 'dd/MM/yyyy')}
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
                    dangerouslySetInnerHTML={{ __html: viewNotice.message || "" }}
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
        {hfs.stats_enabled !== false && (
        <StatsSection
            students={hfs.stats_students ?? 2500}
            teachers={hfs.stats_teachers ?? 150}
            awards={hfs.stats_awards ?? 50}
            courses={hfs.stats_courses ?? 30}
        />
        )}

      </main>

      {hfs.footer_enabled !== false && <PublicFooter />}
    </div>
  );
}
