"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    Loader2,
    Mail,
    User,
    Clock,
    Bell,
    BookOpen,
    CalendarClock,
    ClipboardList,
    GraduationCap,
    UserCheck,
    Library,
    MapPin,
    CheckCircle2,
    AlertCircle,
    Percent,
    CalendarDays,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import QRCode from "qrcode";
import { Progress } from "@/components/ui/progress";
import { mockUserDashboardData } from "@/lib/mock-user-dashboard";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

// ─── Reusable presentational helpers ────────────────────────────────────────────

/** KPI tile with a gradient accent + icon. Animated lift on hover. */
function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    gradient,
}: {
    icon: LucideIcon;
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    gradient: string;
}) {
    return (
        <div className={cn("group relative rounded-xl shadow-sm overflow-hidden text-white bg-gradient-to-br transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg", gradient)}>
            {/* decorative sheen */}
            <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/15" />
            <div className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">{label}</p>
                    <p className="mt-1 text-2xl font-bold leading-none">{value}</p>
                    {sub && <p className="mt-1.5 text-[11px]">{sub}</p>}
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                </span>
            </div>
        </div>
    );
}

/** Section card with a gradient-accent header (icon + title + optional count) and a scrollable body. */
function SectionCard({
    icon: Icon,
    title,
    count,
    children,
    className,
    bodyClassName,
}: {
    icon: LucideIcon;
    title: string;
    count?: number;
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
}) {
    return (
        <Card className={cn("flex flex-col h-[340px] p-0 gap-0 border border-gray-200 shadow-sm rounded-xl overflow-hidden", className)}>
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                    <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-gray-800 truncate">{title}</h3>
                {count != null && (
                    <span className="ml-auto text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{count}</span>
                )}
            </div>
            <CardContent className={cn("p-0 flex-1 overflow-y-auto custom-scrollbar", bodyClassName)}>
                {children}
            </CardContent>
        </Card>
    );
}

/** Centered empty-state for a section body. */
function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-8 px-4">
            <Icon className="h-9 w-9 mb-2 opacity-40" />
            <p className="text-xs">{text}</p>
        </div>
    );
}

export default function UserDashboardPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const [selectedNotice, setSelectedNotice] = useState<any>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Live data from the backend (kept in sync with the admin panel)
                const response = await api.get('/user/dashboard');
                if (response.data && response.data.success) {
                    setData(response.data.data);
                } else {
                    setData(mockUserDashboardData);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                // Fallback to mock data if API fails
                setData(mockUserDashboardData);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (data?.profile?.barcode) {
            QRCode.toDataURL(data.profile.barcode, {
                width: 150,
                margin: 1,
                color: { dark: "#000000", light: "#ffffff" },
            }).then(setQrDataUrl).catch(() => {});
        }
    }, [data]);

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const {
        profile,
        notices,
        subjectProgress,
        upcomingClasses,
        homework,
        teachers,
        visitors,
        libraryBooks,
        widgets
    } = data || mockUserDashboardData;

    // Card visibility controlled from admin (student-profile-setting → Dashboard Setting).
    // Defaults to visible when the backend doesn't supply a flag (e.g. mock data).
    const showWidget = (key: string): boolean => {
        if (!widgets || typeof widgets[key] === "undefined") return true;
        return !!widgets[key];
    };

    const attendance = Number(profile.attendance_percentage) || 0;
    const minAttendance = Number(profile.minimum_attendance) || 0;
    const isAboveMin = attendance >= minAttendance;
    const pendingHomework = (homework || []).filter((h: any) => h.status === "Pending").length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ── KPI Summary Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Percent}
                    label={t("attendance")}
                    value={`${attendance}%`}
                    gradient={isAboveMin ? "from-green-500 to-emerald-400" : "from-red-500 to-rose-400"}
                    sub={
                        <span className="inline-flex items-center gap-1 font-semibold text-white/90">
                            {isAboveMin ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {isAboveMin ? t("above") : t("below")} {minAttendance}% {t("min")}
                        </span>
                    }
                />
                <StatCard
                    icon={CalendarClock}
                    label={t("upcoming_classes")}
                    value={upcomingClasses?.length ?? 0}
                    gradient="from-[#FF9800] to-amber-400"
                    sub={<span className="text-white/80 font-medium">{t("scheduled_today")}</span>}
                />
                <StatCard
                    icon={ClipboardList}
                    label={t("pending_homework")}
                    value={pendingHomework}
                    gradient="from-indigo-500 to-[#6366F1]"
                    sub={<span className="text-white/80 font-medium">{t("of")} {homework?.length ?? 0} {t("total")}</span>}
                />
                <StatCard
                    icon={Library}
                    label={t("books_issued")}
                    value={libraryBooks?.length ?? 0}
                    gradient="from-purple-500 to-fuchsia-400"
                    sub={<span className="text-white/80 font-medium">{t("from_library")}</span>}
                />
            </div>

            {/* ── Top Row: Welcome + Notice Board ── */}
            {(showWidget("welcome_student") || showWidget("notice_board")) && (
            <div className={cn("grid grid-cols-1 gap-6 items-stretch", showWidget("welcome_student") && showWidget("notice_board") ? "lg:grid-cols-2" : "lg:grid-cols-1")}>
                {/* Welcome / Hero Card */}
                {showWidget("welcome_student") && (
                <Card className="shadow-sm rounded-xl overflow-hidden border-0 w-full p-0 gap-0">
                    <CardContent className="p-0 h-full">
                        <div className="flex flex-col sm:flex-row h-full">
                            {/* Gradient identity side */}
                            <div className="relative bg-gradient-to-br from-[#FF9800] to-[#6366F1] p-5 flex items-center gap-4 sm:w-[52%] overflow-hidden">
                                <div className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-white/10" />
                                <div className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/10" />
                                <div className="relative h-[84px] w-[84px] rounded-full ring-4 ring-white/40 bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 overflow-hidden">
                                    {profile.image ? (
                                        <img src={profile.image} alt={profile.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-12 w-12 text-white/90" />
                                    )}
                                </div>
                                <div className="relative text-white min-w-0">
                                    <p className="text-[12px] font-medium text-white/80">{t("welcome_back")},</p>
                                    <h2 className="text-xl font-bold leading-tight truncate">{profile.name}!</h2>
                                    <p className="text-[12px] text-white/90 mt-1">{t("keep_going_message")} 🎯</p>
                                </div>
                            </div>

                            {/* Attendance + codes side */}
                            <div className="flex-1 p-4 sm:p-5 bg-white flex flex-col justify-center gap-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[12px] font-semibold text-gray-600">{t("current_attendance")}</span>
                                        <span className="text-sm font-bold text-gray-800">{attendance}%</span>
                                    </div>
                                    <Progress
                                        value={attendance}
                                        className="h-2 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-[#FF9800] [&>div]:to-[#6366F1]"
                                    />
                                    <p className={cn("text-[11px] mt-1.5 inline-flex items-center gap-1 font-semibold", isAboveMin ? "text-green-600" : "text-red-500")}>
                                        {isAboveMin ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                        {isAboveMin ? t("above") : t("below")} {t("the")} {minAttendance}% {t("minimum_mark")}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                                    <div className="flex flex-col items-center">
                                        <div className="h-16 w-16 bg-white border border-gray-200 rounded-md p-1 shadow-sm">
                                            {qrDataUrl ? (
                                                <img src={qrDataUrl} alt="QR Code" className="h-full w-full object-contain" />
                                            ) : (
                                                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                                    <span className="text-[8px] text-gray-400">QR</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[9px] text-gray-400 mt-1 font-medium">{t("qr_code")}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <svg className="h-[26px] w-[120px]" viewBox="0 0 100 30" preserveAspectRatio="none">
                                            <rect x="0" y="0" width="2" height="30" fill="black" />
                                            <rect x="3" y="0" width="1" height="30" fill="black" />
                                            <rect x="6" y="0" width="3" height="30" fill="black" />
                                            <rect x="11" y="0" width="2" height="30" fill="black" />
                                            <rect x="15" y="0" width="1" height="30" fill="black" />
                                            <rect x="18" y="0" width="4" height="30" fill="black" />
                                            <rect x="24" y="0" width="1" height="30" fill="black" />
                                            <rect x="27" y="0" width="3" height="30" fill="black" />
                                            <rect x="32" y="0" width="2" height="30" fill="black" />
                                            <rect x="36" y="0" width="1" height="30" fill="black" />
                                            <rect x="39" y="0" width="3" height="30" fill="black" />
                                            <rect x="44" y="0" width="1" height="30" fill="black" />
                                            <rect x="47" y="0" width="4" height="30" fill="black" />
                                            <rect x="53" y="0" width="2" height="30" fill="black" />
                                            <rect x="57" y="0" width="1" height="30" fill="black" />
                                            <rect x="60" y="0" width="3" height="30" fill="black" />
                                            <rect x="65" y="0" width="2" height="30" fill="black" />
                                            <rect x="69" y="0" width="1" height="30" fill="black" />
                                            <rect x="72" y="0" width="4" height="30" fill="black" />
                                            <rect x="78" y="0" width="1" height="30" fill="black" />
                                            <rect x="81" y="0" width="3" height="30" fill="black" />
                                            <rect x="86" y="0" width="2" height="30" fill="black" />
                                            <rect x="90" y="0" width="1" height="30" fill="black" />
                                            <rect x="93" y="0" width="3" height="30" fill="black" />
                                            <rect x="98" y="0" width="2" height="30" fill="black" />
                                        </svg>
                                        <span className="text-[9px] font-bold font-mono tracking-widest leading-none mt-[2px] text-gray-600">{profile.barcode}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                )}

                {/* Notice Board */}
                {showWidget("notice_board") && (
                <SectionCard icon={Bell} title={t("notice_board")} count={notices?.length} className="h-auto lg:h-full lg:min-h-[208px]">
                    {notices.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {notices.map((notice: any) => (
                                <button
                                    key={notice.id}
                                    type="button"
                                    onClick={() => setSelectedNotice(notice)}
                                    className="w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                                >
                                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5cb85c]/10 text-[#5cb85c]">
                                        <Mail className="h-3.5 w-3.5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-medium text-gray-700 group-hover:text-[#337ab7] truncate">{notice.title}</p>
                                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                            <Clock className="h-3 w-3" /> {notice.date || notice.notice_date}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Bell} text={t("no_notices_to_display")} />
                    )}
                </SectionCard>
                )}
            </div>
            )}

            {/* ── Middle Row ── */}
            {(showWidget("subject_progress") || showWidget("upcoming_class") || showWidget("homework")) && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Subject Progress */}
                {showWidget("subject_progress") && (
                <SectionCard icon={BookOpen} title={t("subject_progress")} count={subjectProgress?.length}>
                    {subjectProgress.length > 0 ? (
                        <div className="p-4 space-y-4">
                            {subjectProgress.map((item: any) => (
                                <div key={item.id}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[13px] font-medium text-gray-700 truncate pr-2" title={item.subject}>{item.subject}</span>
                                        <span className="text-[12px] font-bold text-gray-600 shrink-0">{item.progress}%</span>
                                    </div>
                                    <Progress
                                        value={item.progress}
                                        className="h-2 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-[#FF9800] [&>div]:to-[#6366F1]"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={BookOpen} text={t("no_subject_progress_data")} />
                    )}
                </SectionCard>
                )}

                {/* Upcoming Class */}
                {showWidget("upcoming_class") && (
                <SectionCard icon={CalendarClock} title={t("upcoming_class")} count={upcomingClasses?.length}>
                    {upcomingClasses.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {upcomingClasses.map((item: any) => (
                                <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-indigo-50/30 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-100 to-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-gray-800 truncate">{item.teacher}{item.code ? ` (${item.code})` : ""}</p>
                                            <p className="text-[11px] text-gray-500 truncate">{item.subject}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                            <MapPin className="h-3 w-3" /> {t("room")} {item.room}
                                        </span>
                                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 justify-end whitespace-nowrap">
                                            <Clock className="h-3 w-3" /> {item.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={CalendarClock} text={t("no_upcoming_classes")} />
                    )}
                </SectionCard>
                )}

                {/* Homework */}
                {showWidget("homework") && (
                <SectionCard icon={ClipboardList} title={t("homework")} count={homework?.length}>
                    {homework.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {homework.map((item: any) => (
                                <div key={item.id} className="p-3.5 hover:bg-indigo-50/30 transition-colors">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <p className="text-[13px] font-semibold text-gray-800 truncate">{item.subject}</p>
                                        <span className={cn(
                                            "shrink-0 px-2 py-0.5 text-[10px] rounded-full font-bold text-white uppercase",
                                            item.status === "Pending" ? "bg-red-500" : "bg-[#5cb85c]"
                                        )}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 text-[11px] text-gray-500">
                                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-gray-400" /> {t("assigned")}: {item.date}</span>
                                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-gray-400" /> {t("submission")}: {item.submission}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={ClipboardList} text={t("no_homework_assigned")} />
                    )}
                </SectionCard>
                )}
            </div>
            )}

            {/* ── Bottom Row ── */}
            {(showWidget("teacher_list") || showWidget("visitor_list") || showWidget("library")) && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Teacher List */}
                {showWidget("teacher_list") && (
                <SectionCard icon={GraduationCap} title={t("teacher_list")} count={teachers?.length}>
                    {teachers.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {teachers.map((item: any) => (
                                <div key={item.id} className="p-3.5 flex items-center gap-3 hover:bg-indigo-50/30 transition-colors">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-100 to-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex flex-col items-start">
                                        <p className="text-[13px] font-semibold text-gray-800 truncate">{item.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[11px] text-gray-500">({item.code})</span>
                                            {item.isClassTeacher && (
                                                <span className="bg-[#5cb85c] text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold">
                                                    {t("class_teacher")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={GraduationCap} text={t("no_teachers_assigned")} />
                    )}
                </SectionCard>
                )}

                {/* Visitor List */}
                {showWidget("visitor_list") && (
                <SectionCard icon={UserCheck} title={t("visitor_list")} count={visitors?.length}>
                    {visitors.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {visitors.map((item: any) => (
                                <div key={item.id} className="p-3.5 flex items-start gap-3 hover:bg-indigo-50/30 transition-colors">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-100 to-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-gray-800 truncate">{item.name}</p>
                                        <p className="text-[11px] text-gray-500">{t("purpose")}: {item.purpose}</p>
                                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                            <Clock className="h-3 w-3" /> {item.date}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={UserCheck} text={t("no_recent_visitors")} />
                    )}
                </SectionCard>
                )}

                {/* Library Book Issue List */}
                {showWidget("library") && (
                <SectionCard icon={Library} title={t("library_books")} count={libraryBooks?.length} bodyClassName="overflow-auto">
                    {libraryBooks.length > 0 ? (
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-gray-50/95 backdrop-blur z-10">
                                <tr className="border-b border-gray-200 text-gray-600">
                                    <th className="text-left font-bold py-2.5 px-3 whitespace-nowrap">{t("no")}</th>
                                    <th className="text-left font-bold py-2.5 px-3">{t("title")}</th>
                                    <th className="text-left font-bold py-2.5 px-3 whitespace-nowrap">{t("issued")}</th>
                                    <th className="text-left font-bold py-2.5 px-3 whitespace-nowrap">{t("return")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {libraryBooks.map((item: any) => (
                                    <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-indigo-50/30 transition-colors">
                                        <td className="py-2.5 px-3 text-gray-500 font-medium align-top">{item.no}</td>
                                        <td className="py-2.5 px-3 align-top">
                                            <p className="text-gray-800 font-medium truncate max-w-[140px]" title={item.title}>{item.title}</p>
                                            <p className="text-gray-400">({item.author})</p>
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap align-top">{item.issueDate}</td>
                                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap align-top">{item.returnDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <EmptyState icon={Library} text={t("no_books_issued")} />
                    )}
                </SectionCard>
                )}
            </div>
            )}

            {/* Notice Detail Modal */}
            <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
                <DialogContent className="sm:max-w-[760px] w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-start gap-2 text-[#333333]">
                            <Mail className="h-5 w-5 text-[#5cb85c] mt-0.5 shrink-0" />
                            <span>{selectedNotice?.title}</span>
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-1 text-[#337ab7] pt-1">
                            <Clock className="h-[14px] w-[14px]" />
                            {selectedNotice?.date || selectedNotice?.notice_date}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedNotice?.message ? (
                        <div
                            className="prose prose-sm w-full max-w-full break-words whitespace-normal overflow-x-hidden overflow-y-auto max-h-[72vh] min-h-[200px] prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:whitespace-normal prose-p:break-words prose-a:text-indigo-600 prose-a:break-all prose-img:max-w-full prose-img:h-auto prose-pre:whitespace-pre-wrap prose-pre:break-words"
                            dangerouslySetInnerHTML={{ __html: selectedNotice.message }}
                        />
                    ) : (
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-words min-h-[200px]">
                            {selectedNotice?.description || t("no_additional_details")}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
