"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { sanitizeHtml } from "@/lib/sanitize";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    MessageSquare,
    Paperclip,
    Award,
    ArrowRight,
    ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import QRCode from "qrcode";
import { Progress } from "@/components/ui/progress";
import { mockUserDashboardData } from "@/lib/mock-user-dashboard";
import api from "@/lib/api";
import {
    cn,
    toLocaleNumber,
    translateClassSection,
    translateDayName,
    translateSubjectName,
    translateVisitorPurpose,
    translateStatusBadge,
} from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useSettings } from "@/components/providers/settings-provider";
import { InternalChatDialog } from "@/components/chat/internal-chat-dialog";

// ─── Data Types ───────────────────────────────────────────────────────────────

interface NoticeItem {
    id: number | string;
    title: string;
    message?: string;
    description?: string;
    date?: string;
    notice_date?: string;
}

interface SubjectProgressItem {
    id: number | string;
    subject: string;
    progress: number;
}

interface UpcomingClassItem {
    id: number | string;
    teacher: string;
    code?: string;
    subject: string;
    room: string;
    time: string;
}

interface HomeworkItem {
    id: number | string;
    title?: string;
    subject: string;
    class?: string;
    date?: string;
    homework_date?: string;
    submission?: string;
    submission_date?: string;
    evaluation_date?: string;
    max_marks?: number;
    marks_obtained?: number | null;
    created_by?: string;
    description?: string;
    status: string;
    attachment?: string;
}

interface DailyAssignmentItem {
    id: number | string;
    title?: string;
    subject: string;
    class?: string;
    date?: string;
    submission_date?: string;
    evaluation_date?: string;
    marks_obtained?: number | null;
    max_marks?: number;
    evaluator?: string;
    description?: string;
    evaluation_remarks?: string;
    status: string;
    attachment?: string;
}

interface TeacherItem {
    id: number;
    name: string;
    email?: string;
    avatar?: string | null;
    chat_presence?: string;
    code?: string;
    isClassTeacher?: boolean;
}

interface VisitorItem {
    id: number | string;
    name: string;
    purpose: string;
    date: string;
}

interface LibraryBookItem {
    id: number | string;
    no: string;
    title: string;
    author: string;
    issueDate: string;
    returnDate: string;
}

interface ChatContact {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    chat_presence: string;
}

interface DashboardData {
    profile?: {
        name?: string;
        attendance_percentage?: number | string;
        minimum_attendance?: number | string;
        barcode?: string;
        image?: string | null;
        branch_id?: number | string;
    };
    notices?: NoticeItem[];
    subjectProgress?: SubjectProgressItem[];
    upcomingClasses?: UpcomingClassItem[];
    homework?: HomeworkItem[];
    dailyAssignments?: DailyAssignmentItem[];
    teachers?: TeacherItem[];
    visitors?: VisitorItem[];
    libraryBooks?: LibraryBookItem[];
    widgets?: Record<string, boolean>;
}

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
    langCode = "en",
    action,
    children,
    className,
    bodyClassName,
}: {
    icon: LucideIcon;
    title: React.ReactNode;
    count?: number;
    langCode?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
}) {
    return (
        <Card className={cn("flex flex-col h-[340px] p-0 gap-0 border border-gray-200 shadow-sm rounded-xl overflow-hidden", className)}>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Icon className="h-4 w-4" />
                    </span>
                    <div className="text-sm font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2 min-w-0">{title}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {action}
                    {count != null && (
                        <span className="min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] shadow-xs shrink-0">
                            {toLocaleNumber(count, langCode)}
                        </span>
                    )}
                </div>
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
    const { t, language } = useTranslation();
    const { settings } = useSettings();
    const langCode = language?.short_code || "en";
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
    const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null);
    const [selectedDailyAssignment, setSelectedDailyAssignment] = useState<DailyAssignmentItem | null>(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatTargetContact, setChatTargetContact] = useState<ChatContact | null>(null);
    const [chatTargetUserId, setChatTargetUserId] = useState<number | null>(null);

    const [localChatEnabled, setLocalChatEnabled] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("ischool_enable_chat");
            if (saved !== null) return saved !== "false";
        }
        return true;
    });

    useEffect(() => {
        const updateChatState = () => {
            if (typeof window !== "undefined") {
                const saved = localStorage.getItem("ischool_enable_chat");
                if (saved !== null) {
                    setLocalChatEnabled(saved !== "false");
                }
            }
        };
        window.addEventListener("storage", updateChatState);
        return () => window.removeEventListener("storage", updateChatState);
    }, []);

    const isChatEnabled = settings?.enable_chat !== false && localChatEnabled;

    const handleStartTeacherChat = (teacher: TeacherItem) => {
        setChatTargetUserId(teacher.id);
        setChatTargetContact({
            id: teacher.id,
            name: teacher.name,
            email: teacher.email || "",
            role: "Teacher",
            avatar: teacher.avatar || null,
            chat_presence: teacher.chat_presence || "online",
        });
        setChatOpen(true);
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Live data from the backend (kept in sync with the admin panel)
                const response = await api.get('/user/dashboard');
                const resData = response.data?.data || response.data;
                if (resData) {
                    setData(resData);
                }
            } catch {
                // Fallback handled gracefully
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
        dailyAssignments,
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

    const attendance = Number(profile?.attendance_percentage) || 0;
    const minAttendance = Number(profile?.minimum_attendance) || 0;
    const isAboveMin = attendance >= minAttendance;
    const pendingHomework = (homework || []).filter((h: HomeworkItem) => h.status === "Pending").length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ── KPI Summary Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Percent}
                    label={t("attendance")}
                    value={`${toLocaleNumber(attendance, langCode)}%`}
                    gradient={isAboveMin ? "from-green-500 to-emerald-400" : "from-red-500 to-rose-400"}
                    sub={
                        <span className="inline-flex items-center gap-1 font-semibold text-white/90">
                            {isAboveMin ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {isAboveMin ? t("above") : t("below")} {toLocaleNumber(minAttendance, langCode)}% {t("min")}
                        </span>
                    }
                />
                <StatCard
                    icon={CalendarClock}
                    label={t("upcoming_classes")}
                    value={toLocaleNumber(upcomingClasses?.length ?? 0, langCode)}
                    gradient="from-[#FF9800] to-amber-400"
                    sub={<span className="text-white/80 font-medium">{t("scheduled_today")}</span>}
                />
                <StatCard
                    icon={ClipboardList}
                    label={t("pending_homework")}
                    value={toLocaleNumber(pendingHomework, langCode)}
                    gradient="from-indigo-500 to-[#6366F1]"
                    sub={<span className="text-white/80 font-medium">{t("of")} {toLocaleNumber(homework?.length ?? 0, langCode)} {t("total")}</span>}
                />
                <StatCard
                    icon={Library}
                    label={t("books_issued")}
                    value={toLocaleNumber(libraryBooks?.length ?? 0, langCode)}
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
                                    <p className="text-[12px] font-medium text-white/80">{t("welcome_back")}</p>
                                    <h2 className="text-xl font-bold leading-tight truncate">{profile.name}</h2>
                                    <p className="text-[12px] text-white/90 mt-1">{t("keep_going_message")} 🎯</p>
                                </div>
                            </div>

                            {/* Attendance + codes side */}
                            <div className="flex-1 p-4 sm:p-5 bg-white flex flex-col justify-center gap-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[12px] font-semibold text-gray-600">{t("current_attendance")}</span>
                                        <span className="text-sm font-bold text-gray-800">{toLocaleNumber(attendance, langCode)}%</span>
                                    </div>
                                    <Progress
                                        value={attendance}
                                        className="h-2 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-[#FF9800] [&>div]:to-[#6366F1]"
                                    />
                                    <p className={cn("text-[11px] mt-1.5 inline-flex items-center gap-1 font-semibold", isAboveMin ? "text-green-600" : "text-red-500")}>
                                        {isAboveMin ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                        {isAboveMin ? t("above") : t("below")} {t("the")} {toLocaleNumber(minAttendance, langCode)}% {t("minimum_mark")}
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
                <SectionCard icon={Bell} title={t("notice_board")} count={notices?.length} langCode={langCode} className="h-auto lg:h-full lg:min-h-[208px]">
                    {notices.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {notices.map((notice: NoticeItem) => (
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
                                            <Clock className="h-3 w-3" /> {toLocaleNumber(notice.date || notice.notice_date, langCode)}
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

            {/* ── Academics Row: Subject Progress & Upcoming Classes ── */}
            {(showWidget("subject_progress") || showWidget("upcoming_class")) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject Progress */}
                {showWidget("subject_progress") && (
                <SectionCard icon={BookOpen} title={t("subject_progress")} count={subjectProgress?.length} langCode={langCode}>
                    {subjectProgress.length > 0 ? (
                        <div className="p-4 space-y-4">
                            {subjectProgress.map((item: SubjectProgressItem) => {
                                const translatedSubj = translateSubjectName(item.subject, langCode);
                                return (
                                <div key={item.id}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[13px] font-medium text-gray-700 truncate pr-2" title={translatedSubj}>{translatedSubj}</span>
                                        <span className="text-[12px] font-bold text-gray-600 shrink-0">{toLocaleNumber(item.progress, langCode)}%</span>
                                    </div>
                                    <Progress
                                        value={item.progress}
                                        className="h-2 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-[#FF9800] [&>div]:to-[#6366F1]"
                                    />
                                </div>
                            );})}
                        </div>
                    ) : (
                        <EmptyState icon={BookOpen} text={t("no_subject_progress_data")} />
                    )}
                </SectionCard>
                )}

                {/* Upcoming Class */}
                {showWidget("upcoming_class") && (
                <SectionCard
                    icon={CalendarClock}
                    title={
                        <div className="flex items-center gap-2">
                            <span>{t("upcoming_class")}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] shadow-xs">
                                {translateDayName(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()], langCode)}
                            </span>
                        </div>
                    }
                    count={upcomingClasses?.length}
                    langCode={langCode}
                >
                    {upcomingClasses.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {upcomingClasses.map((item: UpcomingClassItem) => (
                                <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-indigo-50/30 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-100 to-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-black dark:text-zinc-100 truncate">{translateSubjectName(item.subject, langCode)}</p>
                                            <p className="text-[12px] font-medium text-gray-600 dark:text-zinc-400 truncate">{item.teacher}{item.code ? ` (${toLocaleNumber(item.code, langCode)})` : ""}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                                            <MapPin className="h-3 w-3" /> {t("room") || "Room:"} {toLocaleNumber(item.room, langCode)}
                                        </span>
                                        <p className="text-[11px] font-bold text-black dark:text-zinc-100 mt-1 flex items-center gap-1 justify-end whitespace-nowrap">
                                            <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> {toLocaleNumber(item.time, langCode)}
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
            </div>
            )}

            {/* ── Assignments Row: Homework & Daily Assignment ── */}
            {(showWidget("homework") || showWidget("daily_assignment")) && (
            <div className={cn("grid grid-cols-1 gap-6", showWidget("homework") && showWidget("daily_assignment") ? "lg:grid-cols-2" : "lg:grid-cols-1")}>
                {/* Homework */}
                {showWidget("homework") && (
                <SectionCard
                    icon={ClipboardList}
                    title={t("homework")}
                    className="h-[420px]"
                    langCode={langCode}
                    action={
                        <Link
                            href="/user/homework"
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f57c00] hover:to-[#4f46e5] rounded-full shadow-xs hover:shadow-md transition-all duration-200 inline-flex items-center gap-1 hover:scale-105 active:scale-95"
                        >
                            <span>{t("view_all")}</span>
                            <ChevronRight className="h-3 w-3" />
                        </Link>
                    }
                    count={homework?.length}
                >
                    {(homework || []).length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {homework.map((item: HomeworkItem) => {
                                const isPending = item.status?.toLowerCase() === "pending";
                                const isSubmitted = item.status?.toLowerCase() === "submitted";
                                const transSubj = translateSubjectName(item.subject, langCode);
                                return (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedHomework(item)}
                                    className="p-3.5 hover:bg-indigo-50/40 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="min-w-0 flex-1">
                                             <p className="text-[13px] font-bold text-gray-800 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors truncate">
                                                {item.title || transSubj}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {transSubj}
                                                </span>
                                                {item.class && (
                                                    <span className="text-[10px] text-gray-500 font-medium">• {translateClassSection(item.class, langCode)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] rounded-full font-bold uppercase shadow-xs",
                                                isPending ? "bg-amber-500 text-white" :
                                                isSubmitted ? "bg-blue-500 text-white" :
                                                "bg-emerald-500 text-white"
                                            )}>
                                                {translateStatusBadge(item.status, langCode)}
                                            </span>
                                        </div>
                                    </div>

                                    {item.description && (
                                        <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">
                                            {item.description}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-y-1 text-[11px] text-gray-500 pt-1.5 border-t border-dashed border-gray-100 mt-1">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1 text-gray-600 dark:text-zinc-400">
                                                <CalendarDays className="h-3 w-3 text-amber-500" />
                                                <span className="text-gray-400">{t("assigned")}:</span> {toLocaleNumber(item.date || item.homework_date, langCode)}
                                            </span>
                                            <span className="flex items-center gap-1 text-gray-600 dark:text-zinc-400">
                                                <Clock className="h-3 w-3 text-indigo-500" />
                                                <span className="text-gray-400">{t("submission")}:</span> {toLocaleNumber(item.submission || item.submission_date, langCode)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 ml-auto">
                                            {item.created_by && (
                                                <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                                    <User className="h-2.5 w-2.5 text-indigo-500" /> {item.created_by}
                                                </span>
                                            )}
                                            {item.max_marks != null && (
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                    <Award className="h-2.5 w-2.5" />
                                                    {item.marks_obtained != null ? `${toLocaleNumber(item.marks_obtained, langCode)}/${toLocaleNumber(item.max_marks, langCode)}` : `${t("max")}: ${toLocaleNumber(item.max_marks, langCode)}`}
                                                </span>
                                            )}
                                            {item.attachment && (
                                                <Paperclip className="h-3 w-3 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );})}
                        </div>
                    ) : (
                        <EmptyState icon={ClipboardList} text={t("no_homework_assigned")} />
                    )}
                </SectionCard>
                )}

                {/* Daily Assignment */}
                {showWidget("daily_assignment") && (
                <SectionCard
                    icon={ClipboardList}
                    title={t("daily_assignment") || "Daily Assignment"}
                    className="h-[420px]"
                    langCode={langCode}
                    action={
                        <Link
                            href="/user/homework/daily-assignment"
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f57c00] hover:to-[#4f46e5] rounded-full shadow-xs hover:shadow-md transition-all duration-200 inline-flex items-center gap-1 hover:scale-105 active:scale-95"
                        >
                            <span>{t("view_all")}</span>
                            <ChevronRight className="h-3 w-3" />
                        </Link>
                    }
                    count={dailyAssignments?.length}
                >
                    {(dailyAssignments || []).length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {dailyAssignments.map((item: DailyAssignmentItem) => {
                                const isPending = item.status?.toLowerCase() === "pending";
                                const isSubmitted = item.status?.toLowerCase() === "submitted";
                                const transSubj = translateSubjectName(item.subject, langCode);
                                return (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedDailyAssignment(item)}
                                    className="p-3.5 hover:bg-indigo-50/40 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-bold text-gray-800 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors truncate">
                                                {item.title || transSubj}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {transSubj}
                                                </span>
                                                {item.class && (
                                                    <span className="text-[10px] text-gray-500 font-medium">• {translateClassSection(item.class, langCode)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] rounded-full font-bold uppercase shadow-xs",
                                                isPending ? "bg-amber-500 text-white" :
                                                isSubmitted ? "bg-blue-500 text-white" :
                                                "bg-emerald-500 text-white"
                                            )}>
                                                {translateStatusBadge(item.status, langCode)}
                                            </span>
                                        </div>
                                    </div>

                                    {item.description && (
                                        <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">
                                            {item.description}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-y-1 text-[11px] text-gray-500 pt-1.5 border-t border-dashed border-gray-100 mt-1">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1 text-gray-600 dark:text-zinc-400">
                                                <CalendarDays className="h-3 w-3 text-indigo-500" />
                                                <span className="text-gray-400">{t("submission") || "Date"}:</span> {toLocaleNumber(item.date || item.submission_date, langCode)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 ml-auto">
                                            {item.evaluator && (
                                                <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                                    <User className="h-2.5 w-2.5 text-indigo-500" /> {item.evaluator}
                                                </span>
                                            )}
                                            {item.marks_obtained != null && (
                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                    <Award className="h-2.5 w-2.5" />
                                                    {toLocaleNumber(item.marks_obtained, langCode)} {t("marks")}
                                                </span>
                                            )}
                                            {item.attachment && (
                                                <Paperclip className="h-3 w-3 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );})}
                        </div>
                    ) : (
                        <EmptyState icon={ClipboardList} text={t("no_assignments_found") || "No daily assignments assigned"} />
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
                <SectionCard icon={GraduationCap} title={t("teacher_list")} count={teachers?.length} langCode={langCode} className="h-[395px]">
                    {teachers.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {teachers.map((item: TeacherItem) => (
                                <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-indigo-50/30 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-100 to-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex flex-col items-start">
                                            <p className="text-[13px] font-semibold text-gray-800 truncate">{item.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {item.code && <span className="text-[11px] text-gray-500">({toLocaleNumber(item.code, langCode)})</span>}
                                                {item.isClassTeacher && (
                                                    <span className="bg-[#5cb85c] text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold">
                                                        {t("class_teacher")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {isChatEnabled && (
                                        <button
                                            type="button"
                                            onClick={() => handleStartTeacherChat(item)}
                                            className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex items-center justify-center transition-all shadow-xs hover:opacity-95 hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                                            title={t("chat_with_teacher") || "Chat with Teacher"}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                        </button>
                                    )}
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
                <SectionCard icon={UserCheck} title={t("visitor_list")} count={visitors?.length} langCode={langCode} className="h-[395px]">
                    {visitors.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {visitors.map((item: VisitorItem) => (
                                <div key={item.id} className="p-3.5 flex items-start gap-3 hover:bg-indigo-50/30 transition-colors">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-100 to-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-gray-800 truncate">{item.name}</p>
                                        <p className="text-[11px] text-gray-500">{t("purpose")}: {translateVisitorPurpose(item.purpose, langCode)}</p>
                                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                            <Clock className="h-3 w-3" /> {toLocaleNumber(item.date, langCode)}
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
                <SectionCard icon={Library} title={t("library_books")} count={libraryBooks?.length} langCode={langCode} className="h-[395px]">
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
                                {libraryBooks.map((item: LibraryBookItem) => (
                                    <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-indigo-50/30 transition-colors">
                                        <td className="py-2.5 px-3 text-gray-500 font-medium align-top">{toLocaleNumber(item.no, langCode)}</td>
                                        <td className="py-2.5 px-3 align-top">
                                            <p className="text-gray-800 font-medium truncate max-w-[140px]" title={item.title}>{item.title}</p>
                                            <p className="text-gray-400">({item.author})</p>
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap align-top">{toLocaleNumber(item.issueDate, langCode)}</td>
                                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap align-top">{toLocaleNumber(item.returnDate, langCode)}</td>
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
                            {toLocaleNumber(selectedNotice?.date || selectedNotice?.notice_date, langCode)}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedNotice?.message ? (
                        <div
                            className="prose prose-sm w-full max-w-full break-words whitespace-normal overflow-x-hidden overflow-y-auto max-h-[72vh] min-h-[200px] prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:whitespace-normal prose-p:break-words prose-a:text-indigo-600 prose-a:break-all prose-img:max-w-full prose-img:h-auto prose-pre:whitespace-pre-wrap prose-pre:break-words"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedNotice.message) }}
                        />
                    ) : (
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-words min-h-[200px]">
                            {selectedNotice?.description || t("no_additional_details")}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Homework Details Dialog */}
            <Dialog open={!!selectedHomework} onOpenChange={(open) => !open && setSelectedHomework(null)}>
                <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white dark:bg-card border-0 shadow-2xl rounded-2xl">
                    <DialogHeader className="p-5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                <ClipboardList className="h-4 w-4" />
                            </span>
                            <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">{translateSubjectName(selectedHomework?.subject, langCode)}</span>
                        </div>
                        <DialogTitle className="text-lg font-bold text-white leading-tight">
                            {selectedHomework?.title || translateSubjectName(selectedHomework?.subject, langCode) || t("homework_details")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Homework assignment details and submission information</DialogDescription>
                    </DialogHeader>
                    {selectedHomework && (
                        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                            {/* Status & Marks Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={cn(
                                    "px-2.5 py-1 text-[11px] rounded-full font-bold uppercase",
                                    selectedHomework.status?.toLowerCase() === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                                    selectedHomework.status?.toLowerCase() === "submitted" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                                    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                )}>
                                    {translateStatusBadge(selectedHomework.status, langCode)}
                                </span>
                                {selectedHomework.class && (
                                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-full">
                                        {translateClassSection(selectedHomework.class, langCode)}
                                    </span>
                                )}
                                {selectedHomework.max_marks != null && (
                                    <span className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center gap-1">
                                        <Award className="h-3.5 w-3.5" />
                                        {selectedHomework.marks_obtained != null
                                            ? `${t("marks")}: ${toLocaleNumber(selectedHomework.marks_obtained, langCode)} / ${toLocaleNumber(selectedHomework.max_marks, langCode)}`
                                            : `${t("max_marks")}: ${toLocaleNumber(selectedHomework.max_marks, langCode)}`}
                                    </span>
                                )}
                            </div>

                            {/* Key Info Grid */}
                            <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50/80 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">{t("homework_date")}</p>
                                    <p className="font-semibold text-gray-800 dark:text-zinc-200 mt-0.5">{toLocaleNumber(selectedHomework.date || selectedHomework.homework_date, langCode) || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">{t("submission_date")}</p>
                                    <p className="font-semibold text-gray-800 dark:text-zinc-200 mt-0.5">{toLocaleNumber(selectedHomework.submission || selectedHomework.submission_date, langCode) || "—"}</p>
                                </div>
                                {selectedHomework.evaluation_date && (
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400">{t("evaluation_date")}</p>
                                        <p className="font-semibold text-gray-800 dark:text-zinc-200 mt-0.5">{toLocaleNumber(selectedHomework.evaluation_date, langCode)}</p>
                                    </div>
                                )}
                                {selectedHomework.created_by && (
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400">{t("assigned_by")}</p>
                                        <p className="font-semibold text-gray-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1">
                                            <User className="h-3 w-3 text-indigo-500" />
                                            {selectedHomework.created_by}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Description / Instructions */}
                            {selectedHomework.description && (
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">{t("description_instructions")}</p>
                                    <div className="p-3.5 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs text-gray-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                        {selectedHomework.description}
                                    </div>
                                </div>
                            )}

                            {/* Attachment Link */}
                            {selectedHomework.attachment && (
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">{t("attachment")}</p>
                                    <a
                                        href={selectedHomework.attachment.startsWith("http") ? selectedHomework.attachment : `/storage/${selectedHomework.attachment}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg transition-colors"
                                    >
                                        <Paperclip className="h-3.5 w-3.5" />
                                        {t("download_view_attachment")}
                                    </a>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedHomework(null)}
                                    className="rounded-lg text-xs"
                                >
                                    {t("close")}
                                </Button>
                                <Link
                                    href="/user/homework"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                                >
                                    {t("go_to_homework_portal")} <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Daily Assignment Details Dialog */}
            <Dialog open={!!selectedDailyAssignment} onOpenChange={(open) => !open && setSelectedDailyAssignment(null)}>
                <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white dark:bg-card border-0 shadow-2xl rounded-2xl">
                    <DialogHeader className="p-5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                <ClipboardList className="h-4 w-4" />
                            </span>
                            <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">{translateSubjectName(selectedDailyAssignment?.subject, langCode)}</span>
                        </div>
                        <DialogTitle className="text-lg font-bold text-white leading-tight">
                            {selectedDailyAssignment?.title || translateSubjectName(selectedDailyAssignment?.subject, langCode) || t("daily_assignment_details")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Daily assignment details and submission information</DialogDescription>
                    </DialogHeader>
                    {selectedDailyAssignment && (
                        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                            {/* Status & Marks Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={cn(
                                    "px-2.5 py-1 text-[11px] rounded-full font-bold uppercase",
                                    selectedDailyAssignment.status?.toLowerCase() === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                                    selectedDailyAssignment.status?.toLowerCase() === "submitted" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                                    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                )}>
                                    {translateStatusBadge(selectedDailyAssignment.status, langCode)}
                                </span>
                                {selectedDailyAssignment.class && (
                                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-full">
                                        {translateClassSection(selectedDailyAssignment.class, langCode)}
                                    </span>
                                )}
                                {selectedDailyAssignment.marks_obtained != null && (
                                    <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center gap-1">
                                        <Award className="h-3.5 w-3.5" />
                                        {t("marks_obtained")}: {toLocaleNumber(selectedDailyAssignment.marks_obtained, langCode)}
                                    </span>
                                )}
                            </div>

                            {/* Key Info Grid */}
                            <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50/80 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">{t("submission_date")}</p>
                                    <p className="font-semibold text-gray-800 dark:text-zinc-200 mt-0.5">{toLocaleNumber(selectedDailyAssignment.date || selectedDailyAssignment.submission_date, langCode) || "—"}</p>
                                </div>
                                {selectedDailyAssignment.evaluation_date && (
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400">{t("evaluation_date")}</p>
                                        <p className="font-semibold text-gray-800 dark:text-zinc-200 mt-0.5">{toLocaleNumber(selectedDailyAssignment.evaluation_date, langCode)}</p>
                                    </div>
                                )}
                                {selectedDailyAssignment.evaluator && (
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400">{t("evaluated_by")}</p>
                                        <p className="font-semibold text-gray-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1">
                                            <User className="h-3 w-3 text-indigo-500" />
                                            {selectedDailyAssignment.evaluator}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Description / Instructions */}
                            {selectedDailyAssignment.description && (
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">{t("description_assignment_details")}</p>
                                    <div className="p-3.5 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs text-gray-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                        {selectedDailyAssignment.description}
                                    </div>
                                </div>
                            )}

                            {/* Evaluation Remarks */}
                            {selectedDailyAssignment.evaluation_remarks && (
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">{t("teacher_evaluation_remarks")}</p>
                                    <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap leading-relaxed">
                                        {selectedDailyAssignment.evaluation_remarks}
                                    </div>
                                </div>
                            )}

                            {/* Attachment Link */}
                            {selectedDailyAssignment.attachment && (
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">{t("attachment")}</p>
                                    <a
                                        href={selectedDailyAssignment.attachment.startsWith("http") ? selectedDailyAssignment.attachment : `/storage/${selectedDailyAssignment.attachment.replace(/^\/?storage\/?/, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg transition-colors"
                                    >
                                        <Paperclip className="h-3.5 w-3.5" />
                                        {t("download_view_attachment")}
                                    </a>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedDailyAssignment(null)}
                                    className="rounded-lg text-xs"
                                >
                                    {t("close")}
                                </Button>
                                <Link
                                    href="/user/homework/daily-assignment"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                                >
                                    {t("go_to_daily_assignment_portal")} <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Internal Chat Dialog for Direct Teacher Messaging */}
            {isChatEnabled && (
                <InternalChatDialog
                    open={chatOpen}
                    onOpenChange={setChatOpen}
                    initialContact={chatTargetContact}
                    initialContactId={chatTargetUserId}
                />
            )}
        </div>
    );
}
