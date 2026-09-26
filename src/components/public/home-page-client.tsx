"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { StaffSection } from "@/components/public/staff-section";
import { CoursesSection } from "@/components/public/courses-section";
import { AboutSection } from "@/components/public/about-section";
import { PrincipalSpeechSection } from "@/components/public/principal-speech-section";
import { StatsSection } from "@/components/public/stats-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CalendarDays,
  Megaphone,
  Eye,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { sanitizeHtml } from "@/lib/sanitize";
import { MadrashaTemplate } from "@/components/public/madrasha-template";
import { CardBorderBeam } from "@/components/public/card-border-beam";
import { getImageUrl } from "@/lib/image-url";
import { useTranslation } from "@/hooks/use-translation";

export interface NoticeItem {
  id?: number;
  title?: string;
  notice_date?: string;
  publish_date?: string;
  message?: string;
  message_to?: string;
  is_published?: boolean;
}

export interface HeaderFooterSections {
  header_text?: string;
  header_link?: string;
  hero_background?: string;
  hero_title_part1?: string;
  hero_title_highlight?: string;
  hero_title_part2?: string;
  hero_title_gradient?: string;
  hero_subtitle?: string;
  hero_btn1_text?: string;
  hero_btn1_link?: string;
  hero_btn2_text?: string;
  hero_btn2_link?: string;
  courses_section_title?: string;
  courses_section_subtitle?: string;
  staff_section_title?: string;
  staff_section_subtitle?: string;
  header_enabled?: boolean;
  hero_enabled?: boolean;
  about_enabled?: boolean;
  courses_enabled?: boolean;
  staff_enabled?: boolean;
  notices_enabled?: boolean;
  stats_enabled?: boolean;
  stats_students?: number;
  stats_teachers?: number;
  stats_awards?: number;
  stats_courses?: number;
  footer_enabled?: boolean;
  website_template?: string;
  school_name?: string;
  muhtamim_enabled?: boolean;
  [key: string]: unknown;
}

export interface CmsData {
  website_template?: string;
  header_footer_sections?: HeaderFooterSections;
  about_us?: Record<string, unknown>;
  main_courses?: Record<string, unknown>[];
  experienced_staffs?: Record<string, unknown>[];
  footer_text?: string;
  latest_notices?: NoticeItem[];
}

export interface BannerItem {
  id: number;
  title: string | null;
  image_path: string;
}

interface HomePageClientProps {
  initialCms: CmsData | null;
  initialNotices: NoticeItem[];
  initialBanners: BannerItem[];
}

export function HomePageClient({
  initialCms,
  initialNotices,
  initialBanners,
}: HomePageClientProps) {
  const { t } = useTranslation();
  const [cms] = useState<CmsData | null>(initialCms);
  const [notices] = useState<NoticeItem[]>(initialNotices);
  const [banners] = useState<BannerItem[]>(initialBanners);
  const [viewNotice, setViewNotice] = useState<NoticeItem | null>(null);

  const currentTemplate =
    cms?.website_template || cms?.header_footer_sections?.website_template || "ischool";

  // If the admin chose the iMadrasha template, render the authentic Madrasa layout
  if (currentTemplate === "imadrasha") {
    return <MadrashaTemplate cms={cms} notices={notices} banners={banners} />;
  }

  const hfs: HeaderFooterSections = cms?.header_footer_sections || {};

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {hfs.header_enabled !== false && <PublicHeader cmsData={cms} />}

      <main className="flex-1">
        {/* Hero Section */}
        {hfs.hero_enabled !== false && (
          <section className="relative bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 text-white overflow-hidden pt-4 pb-8 sm:pt-6 sm:pb-10 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16">
            <div
              className="absolute inset-0 opacity-40 bg-cover bg-center mix-blend-overlay"
              style={
                hfs.hero_background
                  ? { backgroundImage: `url('${getImageUrl(hfs.hero_background)}')` }
                  : {}
              }
            />
            {/* Animated decorative glows */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-blob pointer-events-none" />
            <div className="absolute top-1/3 -right-24 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-blob animation-delay-2000 pointer-events-none" />
            <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-blob animation-delay-4000 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="container mx-auto pl-3 pr-5 sm:px-6 md:px-8 relative z-10">
              <div className="max-w-4xl space-y-5 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                {hfs.header_text && (
                  <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground border-none text-sm py-1.5 px-4 font-semibold uppercase tracking-wider mb-2">
                    {hfs.header_text}
                  </Badge>
                )}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                  {hfs.hero_title_part1 || t("empowering")}{" "}
                  <span className="text-primary">{hfs.hero_title_highlight || t("minds")}</span>,<br />
                  {hfs.hero_title_part2 || t("shaping")}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">
                    {hfs.hero_title_gradient || t("futures")}
                  </span>.
                </h1>
                <p className="text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed font-light">
                  {hfs.hero_subtitle || t("hero_subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-6 max-w-full">
                  <Button
                    asChild
                    size="lg"
                    className="text-base font-bold px-6 sm:px-10 h-14 rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                  >
                    <Link href={hfs.hero_btn1_link || "/online_admission"}>
                      {hfs.hero_btn1_text || t("apply_for_admission")}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="text-base font-bold px-6 sm:px-10 h-14 rounded-full bg-white/10 text-white border border-white/20 hover:bg-blue-600 hover:border-blue-500 hover:text-white backdrop-blur-sm shadow-md hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                  >
                    <Link href={hfs.hero_btn2_link || "/about-us"}>
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

        {/* Principal / Muhtamim's Speech Section */}
        {hfs.muhtamim_enabled !== false && (
          <PrincipalSpeechSection about={cms?.about_us} schoolName={hfs.school_name as string} />
        )}

        {/* New Courses Section */}
        {hfs.courses_enabled !== false && (
          <CoursesSection
            courses={cms?.main_courses}
            sectionTitle={hfs.courses_section_title}
            sectionSubtitle={hfs.courses_section_subtitle}
          />
        )}

        {/* New Staff Section */}
        {hfs.staff_enabled !== false && (
          <StaffSection
            staff={cms?.experienced_staffs}
            sectionTitle={hfs.staff_section_title}
            sectionSubtitle={hfs.staff_section_subtitle}
          />
        )}

        {/* Notice Board Section */}
        {hfs.notices_enabled !== false && (
          <section id="notices" className="py-[50px] bg-slate-50 border-t border-slate-200">
            <div className="container mx-auto pl-3 pr-5 sm:px-6 md:px-8">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight">
                    {t("latest_notices")}
                  </h2>
                  <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                </div>

                <Card className="border-t-4 border-t-primary shadow-xl overflow-hidden bg-white relative group">
                  <CardBorderBeam
                    rx={12}
                    ry={12}
                    strokeWidth={2.5}
                    gradientId="ischool-notice-board-beam"
                    colors={["#6366F1", "#3B82F6", "#10B981", "#F59E0B"]}
                  />
                  <div className="bg-slate-100/50 p-6 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3 font-bold text-xl text-slate-800">
                      <Megaphone className="h-6 w-6 text-primary" />
                      {t("school_notice_board")}
                    </div>
                    <Button variant="outline" size="sm" className="font-semibold" asChild>
                      <Link href="/notices">{t("view_all_notices")}</Link>
                    </Button>
                  </div>
                  <CardContent className="p-0">
                    {notices.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <Megaphone className="h-12 w-12 mx-auto opacity-20 mb-3" />
                        <p className="font-semibold">No notices available</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notices.map((notice, i) => {
                          const parsedDate = notice.notice_date
                            ? new Date(notice.notice_date)
                            : new Date();
                          const d = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
                          const day = format(d, "dd");
                          const month = format(d, "MMM");
                          const formattedDate = format(d, "dd MMM yyyy");
                          return (
                            <div
                              key={notice.id || i}
                              className="p-6 hover:bg-slate-50 transition-colors group cursor-pointer flex gap-6 items-center"
                              onClick={() => setViewNotice(notice)}
                            >
                              <div className="shrink-0 flex flex-col items-center justify-center bg-white border-2 border-primary/20 text-indigo-600 rounded-xl h-20 w-20 font-bold shadow-sm group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                <span className="text-2xl font-black leading-none">{day}</span>
                                <span className="text-xs uppercase font-bold mt-1 tracking-wider">
                                  {month}
                                </span>
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
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewNotice(notice);
                                  }}
                                  className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                                >
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

        {/* Notice Detail Dialog */}
        <Dialog open={!!viewNotice} onOpenChange={(open) => !open && setViewNotice(null)}>
          <DialogContent className="sm:max-w-[700px] p-0 rounded-lg border-none shadow-2xl">
            <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
              <DialogHeader className="p-0">
                <DialogTitle className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {viewNotice?.title}
                </DialogTitle>
              </DialogHeader>
              <button
                onClick={() => setViewNotice(null)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {viewNotice && (
              <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[65vh]">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    Notice: {viewNotice.notice_date ? format(new Date(viewNotice.notice_date), "dd/MM/yyyy") : "—"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    Publish: {viewNotice.publish_date ? format(new Date(viewNotice.publish_date), "dd/MM/yyyy") : "—"}
                  </div>
                </div>

                {viewNotice.message_to && (
                  <div className="flex flex-wrap items-center gap-2">
                    {viewNotice.message_to
                      .split(",")
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                      .map((to: string, i: number) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-3 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-semibold"
                        >
                          {to}
                        </span>
                      ))}
                  </div>
                )}

                {viewNotice.is_published !== undefined && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        viewNotice.is_published
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {viewNotice.is_published ? "Published" : "Pending"}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-6">
                  <div
                    className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-headings:font-bold prose-a:text-indigo-600 prose-img:max-w-full prose-img:h-auto prose-table:w-full prose-pre:overflow-x-auto break-words [&_*]:break-words"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewNotice.message || "") }}
                  />
                </div>
              </div>
            )}
            <div className="p-6 bg-gray-50/50 border-t border-gray-100">
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setViewNotice(null)}
                  className="h-10 text-[10px] uppercase font-bold rounded-full px-8 bg-white border-gray-200"
                >
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

      {hfs.footer_enabled !== false && <PublicFooter cmsData={cms} />}
    </div>
  );
}
