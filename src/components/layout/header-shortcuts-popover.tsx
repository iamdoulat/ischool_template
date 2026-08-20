"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    LayoutGrid,
    Wallet,
    UserPlus,
    GraduationCap,
    Users,
    CalendarCheck,
    Bell,
    Clock,
    TrendingUp,
    TrendingDown,
    BookOpen,
    Building2,
    Settings,
    FileText,
    Award,
    Send,
    Loader2,
    SlidersHorizontal,
    X,
    LayoutDashboard,
    FileSearch,
    PhoneCall,
    MessageSquareWarning,
    Globe,
    UserX,
    FolderTree,
    Home,
    Landmark,
    Receipt,
    Zap,
    CheckSquare,
    FileSpreadsheet,
    UserCheck,
    Book,
    School,
    Banknote,
    CheckCircle,
    FilePlus,
    List,
    Building,
    Badge,
    Mail,
    MessageSquare,
    MessageCircle,
    Upload,
    Share2,
    Video,
    PackageCheck,
    PackagePlus,
    Package,
    Tags,
    Store,
    Truck,
    MapPin,
    Bus,
    Bed,
    IdCard,
    FileBarChart,
    AlertTriangle,
    ShieldAlert,
    PieChart,
    QrCode,
    ShieldCheck,
    Menu,
    LucideIcon
} from "lucide-react";
import api from "@/lib/api";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import { getShortcutGradientStyle } from "@/lib/shortcut-colors";

const ICON_MAP: Record<string, LucideIcon> = {
    Wallet,
    UserPlus,
    GraduationCap,
    Users,
    CalendarCheck,
    Bell,
    Clock,
    TrendingUp,
    TrendingDown,
    BookOpen,
    Building2,
    Settings,
    FileText,
    Award,
    Send,
    LayoutGrid,
    LayoutDashboard,
    FileSearch,
    PhoneCall,
    MessageSquareWarning,
    Globe,
    UserX,
    FolderTree,
    Home,
    Landmark,
    Receipt,
    Zap,
    CheckSquare,
    FileSpreadsheet,
    UserCheck,
    Book,
    School,
    Banknote,
    CheckCircle,
    FilePlus,
    List,
    Building,
    Badge,
    Mail,
    MessageSquare,
    MessageCircle,
    Upload,
    Share2,
    Video,
    PackageCheck,
    PackagePlus,
    Package,
    Tags,
    Store,
    Truck,
    MapPin,
    Bus,
    Bed,
    IdCard,
    FileBarChart,
    AlertTriangle,
    ShieldAlert,
    PieChart,
    QrCode,
    ShieldCheck,
    Menu,
};

export interface HeaderShortcutItem {
    id: string;
    title: string;
    path: string;
    icon: string;
    color?: string;
    category?: string;
    is_active: boolean;
    order: number;
}

const DEFAULT_SHORTCUTS: HeaderShortcutItem[] = [
    { id: "collect_fees", title: "Collect Fees", path: "/dashboard/fees-collection/collect-fees", icon: "Wallet", color: "from-amber-500 to-orange-600", is_active: true, order: 1 },
    { id: "student_admission", title: "Student Admission", path: "/dashboard/student-information/student-admission", icon: "UserPlus", color: "from-indigo-500 to-purple-600", is_active: true, order: 2 },
    { id: "student_details", title: "Student Details", path: "/dashboard/student-information/student-details", icon: "GraduationCap", color: "from-blue-500 to-cyan-600", is_active: true, order: 3 },
    { id: "staff_directory", title: "Staff Directory", path: "/dashboard/hr/staff-directory", icon: "Users", color: "from-emerald-500 to-teal-600", is_active: true, order: 4 },
    { id: "student_attendance", title: "Student Attendance", path: "/dashboard/attendance/student-attendance", icon: "CalendarCheck", color: "from-rose-500 to-pink-600", is_active: true, order: 5 },
    { id: "notice_board", title: "Notice Board", path: "/dashboard/communicate/notice-board", icon: "Bell", color: "from-sky-500 to-blue-600", is_active: true, order: 6 },
];

export function HeaderShortcutsPopover() {
    const router = useRouter();
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [shortcuts, setShortcuts] = useState<HeaderShortcutItem[]>(DEFAULT_SHORTCUTS);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchShortcuts = async () => {
        setLoading(true);
        try {
            const res = await api.get("/system-setting/header-shortcuts", { skipGlobalErrorHandler: true });
            const list = res.data?.data || res.data || [];
            if (Array.isArray(list) && list.length > 0) {
                const activeOnly = list.filter((item: HeaderShortcutItem) => item.is_active);
                if (activeOnly.length > 0) {
                    setShortcuts(activeOnly.sort((a, b) => a.order - b.order));
                } else {
                    setShortcuts(DEFAULT_SHORTCUTS);
                }
            }
        } catch (error) {
            console.error("Failed to fetch header shortcuts:", error);
            setShortcuts(DEFAULT_SHORTCUTS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchShortcuts();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                const triggerBtn = document.getElementById("header-shortcuts-trigger");
                if (triggerBtn && triggerBtn.contains(event.target as Node)) return;
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                <LayoutGrid className="h-5 w-5" />
            </Button>
        );
    }

    const handleShortcutClick = (path: string) => {
        setIsOpen(false);
        if (path) {
            router.push(path);
        }
    };

    return (
        <div className="relative">
            <Button
                id="header-shortcuts-trigger"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "hidden sm:flex text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl relative group",
                    isOpen ? "bg-primary/15 text-primary" : ""
                )}
                title={t("header_shortcuts") || "Header Shortcuts"}
            >
                <LayoutGrid className="h-5 w-5" />
            </Button>

            {isOpen && (
                <div
                    ref={panelRef}
                    className="fixed top-14 left-0 right-0 w-full z-50 bg-card/95 backdrop-blur-2xl border-b border-muted/60 shadow-2xl p-4 sm:p-5 md:p-6 animate-in slide-in-from-top-2 duration-300"
                >
                    <div className="max-w-7xl mx-auto space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center shadow-md">
                                    <LayoutGrid className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider leading-none">
                                        {t("header_shortcuts") || "HEADER SHORTCUTS"}
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Quick access navigation — {shortcuts.length} active shortcuts
                                    </p>
                                </div>
                                {loading && <Loader2 className="h-4 w-4 animate-spin text-primary ml-2" />}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOpen(false);
                                        router.push("/dashboard/system-setting/header-shortcuts");
                                    }}
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer bg-primary/10 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    Manage Shortcuts
                                </button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {shortcuts.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 sm:gap-4 py-1">
                                {shortcuts.map((item) => {
                                    const IconComponent = ICON_MAP[item.icon] || LayoutGrid;
                                    const gradientColor = item.color || "from-primary to-indigo-600";
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleShortcutClick(item.path)}
                                            className="group relative flex flex-col items-center justify-center p-3 rounded-2xl border border-muted/50 bg-background/80 hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95 text-center min-h-[95px]"
                                        >
                                            <div
                                                style={getShortcutGradientStyle(item.color)}
                                                className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-md drop-shadow-xs group-hover:scale-110 transition-transform duration-200"
                                            >
                                                <IconComponent className="h-5.5 w-5.5" />
                                            </div>
                                            <span className="text-xs font-bold text-foreground mt-2.5 leading-tight truncate w-full group-hover:text-primary transition-colors">
                                                {item.title}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-muted-foreground italic">
                                No shortcuts selected. Configure them in Header Shortcuts settings.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
