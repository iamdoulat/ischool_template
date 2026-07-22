"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Building2,
    Users,
    Wallet,
    GraduationCap,
    Calendar,
    Settings,
    FileText,
    UserPlus,
    LayoutDashboard,
    ChevronRight,
    BookOpen,
    ClipboardList,
    Bus,
    Home,
    ShieldCheck,
    Video,
    PenSquare,
    Library,
    Package,
    FileUser,
    Hotel,
    Award,
    Globe,
    UserCheck,
    Monitor,
    DollarSign,
    CreditCard,
    Rss,
    GitBranch,
    CalendarDays,
    BookMarked,
    MessageSquare,
    Download,
    X,
    QrCode,
    Newspaper,
    Images,
    CalendarRange
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useSettings } from "@/components/providers/settings-provider";
import { useImageUrl } from "@/lib/image-url";
import { useTranslation } from "@/hooks/use-translation";

const formatLabel = (name: string) => {
    return name
        .split('_')
        .map(word => {
            const lowerWord = word.toLowerCase();
            if (lowerWord === 'sms') return 'SMS';
            if (lowerWord === 'wa') return 'WA';
            if (lowerWord === 'cv') return 'CV';
            if (lowerWord === 'qr') return 'QR';
            if (lowerWord === 'cms') return 'CMS';
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ')
        .replace(/\bSetting\b/g, 'Settings');
};

type MenuItem = {
    name: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    color: string;
    badge?: boolean;
    submenus: { name: string; href: string; label?: string }[];
};

const menuItems: { group: string; items: MenuItem[] }[] = [
    {
        group: "main", items: [
            { name: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/user/dashboard", submenus: [], color: "amber" }
        ]
    },
    {
        group: "modules", items: [
            { name: "profile", label: "My Profile", icon: UserPlus, href: "/user/profile", submenus: [], color: "blue" },
            { name: "fees", label: "Fees", icon: Wallet, href: "/user/fees", submenus: [], color: "emerald" },
            { name: "online_course", label: "Online Course", icon: Monitor, href: "/user/online-course", submenus: [], color: "indigo" },
            { name: "zoom_live_classes", label: "Zoom Live Classes", icon: Video, href: "/user/zoom-live-classes", submenus: [], color: "blue" },
            { name: "gmeet_live_classes", label: "Gmeet Live Classes", icon: Video, href: "/user/gmeet-live-classes", submenus: [], color: "blue" },
            { name: "class_timetable", label: "Class Timetable", icon: Calendar, href: "/user/class-timetable", submenus: [], color: "amber" },
            { name: "lesson_plan", label: "Lesson Plan", icon: BookMarked, href: "/user/lesson-plan", submenus: [], color: "emerald" },
            { name: "syllabus_status", label: "Syllabus Status", icon: ClipboardList, href: "/user/syllabus-status", submenus: [], color: "rose" },
            { 
                name: "homework", label: "Homework", icon: BookOpen, href: "#", color: "amber",
                submenus: [
                    { name: "homework", href: "/user/homework", label: "Homework" },
                    { name: "daily_assignment", href: "/user/homework/daily-assignment", label: "Daily Assignment" }
                ]
            },
            { name: "online_exam", label: "Online Exam", icon: Rss, href: "/user/online-exam", submenus: [], color: "fuchsia" },
            { name: "apply_leave", label: "Apply Leave", icon: CalendarDays, href: "/user/apply-leave", submenus: [], color: "cyan" },
            { name: "visitor_book", label: "Visitor Book", icon: Building2, href: "/user/visitor-book", submenus: [], color: "indigo" },
            {
                name: "download_center", label: "Download Center", icon: Download, href: "#", color: "blue",
                submenus: [
                    { name: "contents", href: "/user/content" },
                    { name: "video_tutorial", href: "/user/video_tutorial" }
                ]
            },
            { name: "attendance", label: "Attendance", icon: Calendar, href: "/user/attendance", submenus: [], color: "orange" },
            { name: "behaviour", label: "Behaviour Records", icon: ShieldCheck, href: "/user/behaviour", submenus: [], color: "rose" },
            {
                name: "cbse_examination", label: "CBSE Examination", icon: FileText, href: "#", color: "violet",
                submenus: [
                    { name: "exam_schedule", href: "/user/cbse-examination/exam-schedule" },
                    { name: "exam_result", href: "/user/cbse-examination/exam-result" },
                    { name: "marksheet", href: "/user/cbse-examination/marksheet" }
                ]
            },
            {
                name: "examinations", label: "Examinations", icon: PenSquare, href: "#", color: "purple",
                submenus: [
                    { name: "exam_schedule", href: "/user/examinations/exam-schedule" },
                    { name: "exam_result", href: "/user/examinations/exam-result" },
                    { name: "admit_card", href: "/user/examinations/admit-card" },
                    { name: "marksheet", href: "/user/examinations/marksheet" }
                ]
            },
            { name: "notice_board", label: "Notice Board", icon: MessageSquare, href: "/user/notice-board", submenus: [], color: "sky" },
            { name: "teachers_reviews", label: "Teachers Reviews", icon: Users, href: "/user/teachers-reviews", submenus: [], color: "blue" },
            {
                name: "library", label: "Library", icon: Library, href: "#", color: "emerald",
                submenus: [
                    { name: "books", href: "/user/library/books" },
                    { name: "book_issued", href: "/user/library/books-issued" }
                ]
            },
            { name: "transport_routes", label: "Transport Routes", icon: Bus, href: "/user/transport-routes", submenus: [], color: "amber" },
            { name: "hostel_rooms", label: "Hostel Rooms", icon: Hotel, href: "/user/hostel-rooms", submenus: [], color: "indigo" },
            { name: "certificates", label: "Certificates", icon: Award, href: "/user/certificates", submenus: [], color: "violet" },
            { name: "id_card", label: "ID Card", icon: CreditCard, href: "/user/id-card", submenus: [], color: "blue" },
            { name: "my_qr_pass", label: "My QR Pass", icon: QrCode, href: "/user/my-qr-pass", submenus: [], color: "orange" },
            { name: "branches", label: "Our Branches", icon: Globe, href: "/user/branches", submenus: [], color: "emerald" },
            { name: "events", label: "Events", icon: CalendarDays, href: "/user/events", submenus: [], color: "amber" },
            { name: "news", label: "News", icon: Newspaper, href: "/user/news", submenus: [], color: "blue" },
            { name: "gallery", label: "Gallery", icon: Images, href: "/user/gallery", submenus: [], color: "violet" },
            { name: "annual_calendar", label: "Annual Calendar", icon: CalendarRange, href: "/user/annual-calendar", submenus: [], color: "sky" },
        ]
    }
];

const sidebarColorMap = {
    amber: { active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40", icon: "text-[#ff6b00]", bg: "bg-orange-50 dark:bg-orange-900/10", border: "border-orange-100 dark:border-orange-900/20" },
    blue: { active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40", icon: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-100 dark:border-blue-900/20" },
    emerald: { active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40", icon: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-100 dark:border-emerald-900/20" },
    indigo: { active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40", icon: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/10", border: "border-indigo-100 dark:border-indigo-900/20" },
    rose: { active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40", icon: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/10", border: "border-rose-100 dark:border-rose-900/20" },
    cyan: { active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40", icon: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/10", border: "border-cyan-100 dark:border-cyan-900/20" },
    orange: { active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40", icon: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/10", border: "border-orange-100 dark:border-orange-900/20" },
    purple: { active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40", icon: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/10", border: "border-purple-100 dark:border-purple-900/20" },
    violet: { active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40", icon: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/10", border: "border-violet-100 dark:border-violet-900/20" },
    fuchsia: { active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40", icon: "text-fuchsia-500", bg: "bg-fuchsia-50 dark:bg-fuchsia-900/10", border: "border-fuchsia-100 dark:border-fuchsia-900/20" },
    sky: { active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40", icon: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-900/10", border: "border-sky-100 dark:border-sky-900/20" },
    gray: { active: "bg-gradient-to-r from-[#ff6b00] to-[#ff9100] shadow-orange-200/50 dark:shadow-orange-900/40", icon: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-900/10", border: "border-gray-100 dark:border-gray-900/20" }
};

import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { isPortalMenuVisible, visiblePortalSubmenus } from "@/lib/portal-menu-permissions";

export function UserSidebar({
    collapsed = false,
    mobileOpen = false,
    onClose
}: {
    collapsed?: boolean;
    mobileOpen?: boolean;
    onClose?: () => void;
}) {
    const pathname = usePathname();
    const { settings, loading: settingsLoading } = useSettings();
    const getImageUrl = useImageUrl();
    const { t } = useTranslation();

    const [mounted, setMounted] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [fetchingSessions, setFetchingSessions] = useState(false);
    const [changingSessionId, setChangingSessionId] = useState<number | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [fetchingPermissions, setFetchingPermissions] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const response = await api.get("/profile");
                setPermissions(response.data.data?.permissions || []);
            } catch (error) {
                console.error("Failed to fetch permissions", error);
                setPermissions([]);
            } finally {
                setFetchingPermissions(false);
            }
        };
        fetchPermissions();
    }, []);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setFetchingSessions(true);
                const response = await api.get("/system-setting/sessions");
                if (response.data.success) {
                    setSessions(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch sessions", error);
            } finally {
                setFetchingSessions(false);
            }
        };

        fetchSessions();
    }, []);

    // Filter portal menus by the logged-in user's role permissions.
    // While permissions load, show only the always-visible items (dashboard)
    // to avoid flashing menus the role may not have.
    const permissionSet = React.useMemo(() => new Set(permissions), [permissions]);

    const processedMenuItems = menuItems
        .map(group => ({
            ...group,
            items: group.items
                .filter(item => {
                    if (fetchingPermissions) return item.name === "dashboard";
                    return isPortalMenuVisible(item.name, permissionSet);
                })
                .map(item => {
                    // Filter submenus for items that define portal submenu permissions.
                    let submenus = item.submenus;
                    if (!fetchingPermissions && item.submenus && item.submenus.length > 0) {
                        const allowed = visiblePortalSubmenus(item.name, permissionSet);
                        if (allowed.length > 0) {
                            const allowedSet = new Set(allowed);
                            submenus = item.submenus.filter(s => allowedSet.has(s.name));
                        }
                    }
                    return { ...item, submenus, is_visible: true, label: item.label };
                })
        }))
        .filter(group => group.items.length > 0);

    const activeSession = sessions.find(s => s.is_active);

    const handleSessionChange = async (session: any) => {
        if (session.is_active) return;
        try {
            setChangingSessionId(session.id);
            await api.put(`/system-setting/sessions/${session.id}`, {
                session: session.session,
                is_active: true
            });
            window.location.reload();
        } catch (error) {
            console.error("Failed to switch session", error);
            setChangingSessionId(null);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300",
                    mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <aside className={cn(
                "fixed md:relative inset-y-0 left-0 z-50 md:z-0 flex flex-col border-r bg-card text-card-foreground transition-all duration-300 shadow-2xl md:shadow-none h-[100dvh] md:h-screen overflow-hidden overscroll-contain",
                collapsed ? "md:w-20" : "md:w-[230px] w-[230px]",
                mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="h-14 min-h-[56px] flex items-center justify-between md:justify-center bg-gradient-to-r from-primary to-primary/80 text-white shadow-md z-10 px-4">
                    <div className="flex items-center gap-2">
                        {collapsed && !mobileOpen ? (
                            <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/10 shadow-sm overflow-hidden flex items-center justify-center h-9 w-9">
                                {settings?.admin_small_logo ? (
                                    <img src={getImageUrl(settings.admin_small_logo)} alt="S" className="h-5 w-5 object-contain" />
                                ) : (
                                    <GraduationCap className="h-6 w-6 text-white" />
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/10 shadow-sm overflow-hidden flex items-center justify-center">
                                    {settings?.admin_small_logo ? (
                                        <img src={getImageUrl(settings.admin_small_logo)} alt="S" className="h-5 w-5 object-contain" />
                                    ) : (
                                        <GraduationCap className="h-6 w-6 text-white" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    {settingsLoading ? (
                                        <div className="h-5 w-24 bg-white/20 animate-pulse rounded" />
                                    ) : settings?.admin_logo ? (
                                        <img src={getImageUrl(settings.admin_logo)} alt={settings.school_name} className="h-6 object-contain" />
                                    ) : (
                                        <span className="font-extrabold text-lg tracking-tight uppercase animate-in fade-in slide-in-from-left-4 duration-300">
                                            {settings?.school_name || "Smart School"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-white hover:bg-white/20 transition-all rounded-lg"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <ScrollArea type="always" className="flex-1 min-h-0 w-full p-0 overscroll-contain">
                    <nav className={cn("space-y-6 py-4 pl-2 pr-4", collapsed && "md:px-2")}>
                        {processedMenuItems.map((group) => (
                            <div key={group.group} className="space-y-2">
                                {!collapsed && (
                                    <h3 className="px-2 mb-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                                        {t(group.group)}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const colors = sidebarColorMap[item.color as keyof typeof sidebarColorMap] || sidebarColorMap.blue;
                                        const isItemActive = pathname === item.href || (item.submenus && item.submenus.some(s => pathname === s.href));

                                        const menuItem = (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => {
                                                    if (window.innerWidth < 768 && onClose) onClose();
                                                }}
                                                className={cn(
                                                    "flex items-center justify-start transition-all group relative overflow-hidden",
                                                    collapsed ? "justify-center h-12 w-12 mx-auto rounded-xl" : "gap-3 px-2 py-2.5 rounded-xl",
                                                    isItemActive
                                                        ? `${colors.active} text-white shadow-lg`
                                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                                    !collapsed && "text-sm font-semibold"
                                                )}
                                                title={collapsed ? item.label : undefined}
                                            >
                                                <div className={cn(
                                                    "p-1.5 rounded-lg transition-all duration-300",
                                                    isItemActive ? "bg-white/20 backdrop-blur-sm border border-white/10" : `bg-muted group-hover:scale-110 ${colors.icon}`
                                                )}>
                                                    <item.icon className={cn(
                                                        "h-4 w-4",
                                                        isItemActive ? "text-white" : "transition-colors"
                                                    )} />
                                                </div>
                                                {!collapsed && (
                                                    <>
                                                        <span className="flex-1 text-left">
                                                            {t(item.name) !== item.name ? t(item.name) : item.label}
                                                        </span>
                                                        {/* Red Badge for Notice Board */}
                                                        {item.badge && (
                                                            <div className="w-2.5 h-2.5 rounded-sm bg-red-400 mr-2" />
                                                        )}
                                                        {item.submenus && item.submenus.length > 0 ? (
                                                            <ChevronRight className={cn(
                                                                "h-3.5 w-3.5 transition-transform duration-300",
                                                                isItemActive ? "rotate-90 text-white" : "group-hover:translate-x-0.5"
                                                            )} />
                                                        ) : (
                                                            <div className={cn(
                                                                "w-1.5 h-1.5 rounded-full transition-all duration-300 opacity-0 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]",
                                                                isItemActive && "opacity-100"
                                                            )} />
                                                        )}
                                                    </>
                                                )}
                                            </Link>
                                        );

                                        if (collapsed) {
                                            return (
                                                <Popover key={item.name}>
                                                    <PopoverTrigger asChild>
                                                        {menuItem}
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        side="right"
                                                        align="start"
                                                        sideOffset={15}
                                                        className="w-56 p-2 bg-popover/95 backdrop-blur-xl border-none shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200"
                                                    >
                                                        <div className="space-y-1">
                                                            <div className="px-3 py-2 border-b border-muted/20 mb-1">
                                                                <p className={cn("text-xs font-bold uppercase tracking-widest", colors.icon)}>
                                                                    {t(item.name) !== item.name ? t(item.name) : item.label}
                                                                </p>
                                                            </div>
                                                            <Link
                                                                href={item.href}
                                                                onClick={() => {
                                                                    if (window.innerWidth < 768 && onClose) onClose();
                                                                }}
                                                                className={cn(
                                                                    "block px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                                                    pathname === item.href ? `${colors.bg} ${colors.icon} font-bold` : "hover:bg-muted"
                                                                )}
                                                            >
                                                                {t("overview")}
                                                            </Link>
                                                            {item.submenus && item.submenus.length > 0 && (
                                                                <div className="pt-1 space-y-0.5">
                                                                    {item.submenus.map((submenu) => (
                                                                        <Link
                                                                            key={submenu.name}
                                                                            href={submenu.href}
                                                                            onClick={() => {
                                                                                if (window.innerWidth < 768 && onClose) onClose();
                                                                            }}
                                                                            className={cn(
                                                                                "block px-3 py-1.5 text-xs rounded-md transition-all",
                                                                                pathname === submenu.href
                                                                                    ? `${colors.icon} font-bold ${colors.bg}`
                                                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                            )}
                                                                        >
                                                                            {t(submenu.name) !== submenu.name ? t(submenu.name) : formatLabel(submenu.name)}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            );
                                        }

                                        if (item.submenus && item.submenus.length > 0) {
                                            return (
                                                <Accordion type="single" collapsible key={item.name} className="w-full">
                                                    <AccordionItem value={item.name} className="border-none">
                                                        <AccordionTrigger
                                                            className={cn(
                                                                "flex items-center justify-start transition-all group hover:no-underline py-0 cursor-pointer",
                                                                "gap-3 px-2 py-2.5 rounded-xl mb-1",
                                                                isItemActive
                                                                    ? `${colors.active} text-white shadow-lg`
                                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                                                "text-sm font-semibold text-left"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3 w-full">
                                                                <div className={cn(
                                                                    "p-1.5 rounded-lg transition-all duration-300",
                                                                    isItemActive ? "bg-white/20 backdrop-blur-sm border border-white/10" : `bg-muted group-hover:scale-110 ${colors.icon}`
                                                                )}>
                                                                    <item.icon className={cn(
                                                                        "h-4 w-4",
                                                                        isItemActive ? "text-white" : "transition-colors"
                                                                    )} />
                                                                </div>
                                                                <span className="flex-1 text-left">
                                                                    {t(item.name) !== item.name ? t(item.name) : item.label}
                                                                </span>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="pb-2 pt-1 pl-4 pr-1">
                                                            <div className={cn("flex flex-col gap-1 border-l-2 ml-3 pl-3 animate-in slide-in-from-top-2 duration-300 items-start", isItemActive ? `border-orange-500/20` : "border-primary/10")}>
                                                                {item.submenus.map((submenu) => {
                                                                    const isSubActive = pathname === submenu.href;
                                                                    return (
                                                                        <Link
                                                                            key={submenu.name}
                                                                            href={submenu.href}
                                                                            onClick={() => {
                                                                                if (window.innerWidth < 768 && onClose) onClose();
                                                                            }}
                                                                            className={cn(
                                                                                "relative py-2.5 text-xs font-bold rounded-xl transition-all duration-300 px-3 flex items-center justify-start text-left w-full group/sub",
                                                                                isSubActive
                                                                                    ? `${colors.active} text-white shadow-md shadow-orange-200/20 tracking-tight`
                                                                                    : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/50"
                                                                            )}
                                                                        >
                                                                            <span className="flex-1">{t(submenu.name) !== submenu.name ? t(submenu.name) : formatLabel(submenu.name)}</span>
                                                                            {isSubActive && (
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-in fade-in zoom-in duration-300 ml-2" />
                                                                            )}
                                                                        </Link>
                                                                    );
                                                                })}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            );
                                        }

                                        return menuItem;
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </ScrollArea>


                <div className={cn(
                    "border-t bg-card/80 backdrop-blur-md group hover:bg-muted/10 transition-all h-14 min-h-[56px] flex-shrink-0 z-20",
                    collapsed ? "px-4 flex justify-center items-center" : "px-4 flex justify-between items-center"
                )}>
                    {mounted ? (collapsed ? (
                        <div className="h-10 w-10 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-xl border border-muted/20">
                            <span className="text-[10px] font-bold text-foreground/70">{activeSession?.session?.substring(2, 4) || ""}</span>
                            <span className="text-[8px] font-bold text-muted-foreground/50">{activeSession?.session?.substring(5, 7) || ""}</span>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center w-full py-1">
                            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-[0.15em] font-black leading-tight mb-0.5">{t("session")}</p>
                            <p className="text-sm font-extrabold text-foreground/90 tracking-tight">
                                {fetchingSessions ? t("loading") : (activeSession?.session || t("not_set"))}
                            </p>
                        </div>
                    )) : (
                        <div className="h-9 w-full bg-muted/20 animate-pulse rounded-lg" />
                    )}
                </div>
            </aside >
        </>
    );
}
