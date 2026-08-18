"use client";

import {
    Bell,
    Search,
    Moon,
    Sun,
    MessageSquare,
    Menu,
    Languages,
    CircleDollarSign,
    LayoutGrid,
    MoreVertical,
    ArrowLeftRight,
    LogOut,
    User as UserIcon,
    Settings,
    Check,
    Trash2,
    Loader2,
    X,
    GraduationCap
} from "lucide-react";
import { CurrencySwitcher } from "./currency-switcher";
import { BranchSwitcher } from "./branch-switcher";
import { HeaderShortcutsPopover } from "./header-shortcuts-popover";
import { ThemeToggle } from "./theme-toggle";
import { InternalChatDialog } from "@/components/chat/internal-chat-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import api from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import { useSettings } from "@/components/providers/settings-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import { useImageUrl } from "@/lib/image-url";

interface Language {
    id: number;
    name: string;
    short_code: string;
    country_code: string;
    is_rtl: boolean;
    is_active: boolean;
    is_enabled: boolean;
}

const STUDENT_PORTAL_SEARCH_ITEMS = [
    {
        id: "profile",
        title: "My Student Profile",
        subtitle: "View personal details, class, section, & guardian info",
        keywords: ["profile", "my profile", "personal", "info", "admission", "guardian", "class", "section", "father", "mother", "address", "details", "me", "student"],
        path: "/user/profile",
        category: "My Account"
    },
    {
        id: "fees",
        title: "My Fees & Outstanding Dues",
        subtitle: "View fee structure, paid invoices & submit offline payments",
        keywords: ["fee", "fees", "due", "dues", "payment", "bank", "receipt", "paid", "bill", "invoice", "balance", "offline payment"],
        path: "/user/fees",
        category: "Finance"
    },
    {
        id: "attendance",
        title: "My Attendance Records",
        subtitle: "Daily attendance status & monthly percentage summary",
        keywords: ["attendance", "absent", "present", "leave", "summary", "monthly", "register", "percentage", "present count"],
        path: "/user/attendance",
        category: "Academics"
    },
    {
        id: "exam_results",
        title: "My Exam Results & Marksheet",
        subtitle: "Term exam marks, grades, report card, & rank",
        keywords: ["exam", "exams", "result", "results", "marks", "grade", "marksheet", "rank", "cbse", "report card", "gpa"],
        path: "/user/exam-results",
        category: "Examinations"
    },
    {
        id: "exam_schedule",
        title: "My Exam Schedule & Timetable",
        subtitle: "Upcoming exam dates, times, & hall ticket details",
        keywords: ["schedule", "exam schedule", "date sheet", "routine", "hall ticket", "admit card", "exam dates"],
        path: "/user/exam-schedule",
        category: "Examinations"
    },
    {
        id: "class_timetable",
        title: "My Class Routine & Timetable",
        subtitle: "Weekly subject period timetable & daily schedule",
        keywords: ["timetable", "class timetable", "routine", "period", "subjects", "timing", "daily schedule", "teachers"],
        path: "/user/class-timetable",
        category: "Academics"
    },
    {
        id: "homework",
        title: "My Homework & Daily Assignments",
        subtitle: "Pending homework tasks & submission status",
        keywords: ["homework", "assignment", "assignments", "task", "project", "work", "submission", "pending homework"],
        path: "/user/homework",
        category: "Academics"
    },
    {
        id: "lesson_plan",
        title: "My Syllabus & Lesson Plan",
        subtitle: "Subject syllabus coverage & lesson topics",
        keywords: ["lesson", "lesson plan", "syllabus", "topic", "chapter", "subject progress", "curriculum"],
        path: "/user/lesson-plan",
        category: "Academics"
    },
    {
        id: "online_exams",
        title: "My Online Exams & MCQ Tests",
        subtitle: "Available online tests & instant test scores",
        keywords: ["online exam", "mcq", "test", "quiz", "online test", "score"],
        path: "/user/online-exams",
        category: "Examinations"
    },
    {
        id: "library",
        title: "My Issued Library Books",
        subtitle: "Currently borrowed library books & due dates",
        keywords: ["library", "book", "books", "issued", "borrow", "return", "overdue"],
        path: "/user/library/books-issued",
        category: "Resources"
    },
    {
        id: "certificates",
        title: "My Certificates",
        subtitle: "Download official student & transfer certificates",
        keywords: ["certificate", "certificates", "transfer certificate", "tc", "document"],
        path: "/user/certificates",
        category: "Documents"
    },
    {
        id: "id_card",
        title: "My Digital ID Card",
        subtitle: "Student identity card view & digital badge",
        keywords: ["id", "id card", "identity", "card", "badge"],
        path: "/user/id-card",
        category: "My Account"
    },
    {
        id: "qr_code",
        title: "My Attendance QR Code",
        subtitle: "Personal QR code for attendance scanner check-in",
        keywords: ["qr", "qr code", "scan", "barcode", "checkin"],
        path: "/user/my-qr-code",
        category: "My Account"
    },
    {
        id: "apply_leave",
        title: "Apply Student Leave",
        subtitle: "Submit leave application to class teacher",
        keywords: ["leave", "apply leave", "sick leave", "absence request"],
        path: "/user/apply-leave",
        category: "Attendance"
    },
    {
        id: "transport",
        title: "My Transport Route & Bus Info",
        subtitle: "Assigned bus route & pickup point details",
        keywords: ["transport", "bus", "route", "vehicle", "driver", "pickup"],
        path: "/user/transport-routes",
        category: "Logistics"
    },
    {
        id: "hostel",
        title: "My Hostel & Room Details",
        subtitle: "Hostel building & room assignment info",
        keywords: ["hostel", "room", "bed", "dorm", "roommate"],
        path: "/user/hostel-rooms",
        category: "Logistics"
    },
    {
        id: "live_classes",
        title: "Live Online Classes (GMeet & Zoom)",
        subtitle: "Join scheduled online video classes",
        keywords: ["live", "zoom", "gmeet", "class link", "online class", "video"],
        path: "/user/gmeet-live-classes",
        category: "Academics"
    },
    {
        id: "notifications",
        title: "Notices & Announcements",
        subtitle: "School notice board circulars & announcements",
        keywords: ["notice", "announcement", "circular", "news", "message", "notification"],
        path: "/user/notifications",
        category: "Notice Board"
    }
];

function HeaderStudentSearch({ user }: { user?: any }) {
    const router = useRouter();
    const { t } = useLanguage();
    const getImageUrl = useImageUrl();
    const [mounted, setMounted] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isStudentUser = mounted && Boolean(
        user?.role === "Student" ||
        user?.role === "Parent" ||
        (typeof window !== "undefined" && window.location.pathname.startsWith("/user"))
    );

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        const q = query.trim().toLowerCase();

        if (isStudentUser) {
            setLoading(true);
            const matchedPortalItems = STUDENT_PORTAL_SEARCH_ITEMS.filter(item =>
                item.title.toLowerCase().includes(q) ||
                item.subtitle.toLowerCase().includes(q) ||
                item.keywords.some(k => k.toLowerCase().includes(q))
            );

            const ownName = `${user?.name || ""} ${user?.last_name || ""}`.trim().toLowerCase();
            const ownAdm = (user?.admission_no || "").toLowerCase();
            const ownRoll = (user?.roll_no || "").toLowerCase();
            const ownPhone = (user?.phone || "").toLowerCase();
            const ownFather = (user?.father_name || "").toLowerCase();

            const isOwnProfileMatch = Boolean(
                (ownName && ownName.includes(q)) ||
                (ownAdm && ownAdm.includes(q)) ||
                (ownRoll && ownRoll.includes(q)) ||
                (ownPhone && ownPhone.includes(q)) ||
                (ownFather && ownFather.includes(q))
            );

            let finalResults: any[] = matchedPortalItems.map(item => ({
                id: item.id,
                title: item.title,
                subtitle: item.subtitle,
                path: item.path,
                category: item.category,
                isPortalFeature: true
            }));

            if (isOwnProfileMatch && user) {
                const fullName = `${user.name} ${user.last_name || ""}`.trim();
                const className = user.school_class?.name || user.schoolClass?.name || "";
                const secName = user.section?.name || "";
                const classSec = className ? `${className}${secName ? ` (${secName})` : ''}` : "Student Profile";

                finalResults.unshift({
                    id: "own_student_profile",
                    title: `My Profile (${fullName})`,
                    subtitle: `Adm: ${user.admission_no || "-"} | Roll: ${user.roll_no || "-"} | ${classSec}`,
                    path: "/user/profile",
                    avatar: user.avatar,
                    category: "My Account",
                    isOwnProfileCard: true
                });
            }

            setResults(finalResults);
            setLoading(false);
            setIsOpen(true);
        } else {
            const timer = setTimeout(async () => {
                setLoading(true);
                try {
                    const res = await api.get("/students", {
                        params: { search: query.trim(), limit: 5 }
                    });
                    const data = res.data?.data?.data || res.data?.data || [];
                    setResults(data);
                    setIsOpen(true);
                } catch (err) {
                    console.error("Header search error:", err);
                    setResults([]);
                } finally {
                    setLoading(false);
                }
            }, 250);

            return () => clearTimeout(timer);
        }
    }, [query, isStudentUser, user]);

    const handleExecuteSearch = (searchKeyword = query) => {
        if (!searchKeyword.trim()) return;
        setIsOpen(false);

        if (isStudentUser) {
            const topMatch = results[0];
            if (topMatch?.path) {
                router.push(topMatch.path);
            } else {
                router.push("/user/profile");
            }
        } else {
            router.push(`/dashboard/student-information/student-details?search=${encodeURIComponent(searchKeyword.trim())}`);
        }
    };

    const handleSelectResult = (item: any) => {
        setIsOpen(false);
        if (isStudentUser) {
            router.push(item.path);
        } else {
            const searchVal = item.admission_no || `${item.name} ${item.last_name || ""}`.trim();
            router.push(`/dashboard/student-information/student-details?search=${encodeURIComponent(searchVal)}`);
        }
    };

    return (
        <div className="hidden lg:flex items-center relative w-1/2 max-w-[50%] ml-auto group">
            <div className="relative w-full">
                <Search
                    onClick={() => handleExecuteSearch()}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 cursor-pointer"
                />
                <Input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (query.trim() && results.length > 0) setIsOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleExecuteSearch();
                        }
                    }}
                    placeholder={isStudentUser ? "Search my portal (fees, exams, attendance...)" : t("search_student")}
                    className="pl-10 pr-9 h-10 w-full bg-muted/30 border-muted/50 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all rounded-2xl shadow-sm group-hover:bg-muted/50 text-xs"
                />
                {loading ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                ) : query ? (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery("");
                            setResults([]);
                            setIsOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                ) : null}

                {/* Dropdown Results */}
                {isOpen && query.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md border border-muted/50 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2.5 border-b border-muted/40 bg-muted/20 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                                {isStudentUser ? "My Student Portal" : "Student Database"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {loading ? "Searching..." : `${results.length} results`}
                            </span>
                        </div>

                        <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-1">
                            {results.length > 0 ? (
                                results.map((item) => {
                                    if (isStudentUser) {
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelectResult(item)}
                                                className="flex items-center gap-3 p-2.5 hover:bg-primary/10 rounded-xl cursor-pointer transition-colors group/item"
                                            >
                                                {item.isOwnProfileCard ? (
                                                    <Avatar className="h-9 w-9 rounded-lg border border-primary/20 shrink-0">
                                                        <AvatarImage src={getImageUrl(item.avatar)} />
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold rounded-lg">
                                                            {user?.name?.[0]?.toUpperCase() || "S"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ) : (
                                                    <div className="h-9 w-9 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                                        <GraduationCap className="h-4 w-4" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-bold text-foreground group-hover/item:text-primary truncate">
                                                            {item.title}
                                                        </p>
                                                        {item.category && (
                                                            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                                                                {item.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                        {item.subtitle}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Admin/Staff Result
                                    const fullName = `${item.name} ${item.last_name || ""}`.trim();
                                    const className = item.schoolClass?.name || item.school_class?.name || "";
                                    const sectionName = item.section?.name || "";
                                    const classSec = className ? `${className}${sectionName ? ` (${sectionName})` : ''}` : "";

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelectResult(item)}
                                            className="flex items-center gap-3 p-2.5 hover:bg-primary/10 rounded-xl cursor-pointer transition-colors group/item"
                                        >
                                            <Avatar className="h-9 w-9 rounded-lg border border-primary/20 shrink-0">
                                                <AvatarImage src={getImageUrl(item.avatar)} />
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold rounded-lg">
                                                    {item.name?.[0]?.toUpperCase() || "S"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold text-foreground group-hover/item:text-primary truncate">
                                                        {fullName}
                                                    </p>
                                                    {classSec && (
                                                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                                                            {classSec}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                    Adm: <span className="font-semibold text-foreground">{item.admission_no || "-"}</span>
                                                    {item.roll_no ? ` | Roll: ${item.roll_no}` : ''}
                                                    {item.father_name ? ` | Guardian: ${item.father_name}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : !loading ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">
                                    {isStudentUser
                                        ? `No personal portal items match "${query}"`
                                        : `No students found matching "${query}"`}
                                </div>
                            ) : null}
                        </div>

                        <div
                            onClick={() => handleExecuteSearch()}
                            className="p-2.5 bg-primary/5 hover:bg-primary/15 text-primary text-center text-xs font-bold cursor-pointer transition-colors border-t border-muted/40"
                        >
                            View details for &quot;{query}&quot; &rarr;
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { settings, loading } = useSettings();
    const isChatEnabled = settings?.enable_chat !== false && (typeof window === 'undefined' || localStorage.getItem('ischool_enable_chat') !== 'false');
    const { selectedLanguage, setSelectedLanguage, setUserContext, t } = useLanguage();
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [chatOpen, setChatOpen] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const getImageUrl = useImageUrl();

    useEffect(() => {
        const fetchUnreadChatCount = async () => {
            try {
                const res = await api.get('/chat/unread-count', { skipGlobalErrorHandler: true });
                if (res.data?.success) {
                    setUnreadChatCount(res.data.count || 0);
                }
            } catch {
                // Silently ignore
            }
        };

        fetchUnreadChatCount();
        const interval = setInterval(fetchUnreadChatCount, 15000);
        return () => clearInterval(interval);
    }, []);

    const NotificationBell = () => {
        const [notifications, setNotifications] = useState<any[]>([]);
        const [unreadCount, setUnreadCount] = useState(0);
        const [loadingNotifs, setLoadingNotifs] = useState(false);
        const [isOpen, setIsOpen] = useState(false);

        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications', { timeout: 3000, skipGlobalErrorHandler: true });
                setNotifications(res.data?.data?.data || []);
            } catch {
                // Silently ignore – endpoint may not be available yet
            }
        };

        const fetchUnreadCount = async () => {
            try {
                const res = await api.get('/notifications/unread-count', { timeout: 3000, skipGlobalErrorHandler: true });
                setUnreadCount(res.data?.data?.count || 0);
            } catch {
                // Silently ignore – endpoint may not be available yet
            }
        };

        useEffect(() => {
            if (user) {
                fetchUnreadCount();
                const interval = setInterval(fetchUnreadCount, 60000);
                return () => clearInterval(interval);
            }
        }, [user]);

        useEffect(() => {
            if (isOpen && user) {
                fetchNotifications();
            }
        }, [isOpen, user]);

        const markAsRead = async (id: number) => {
            try {
                await api.post(`/notifications/${id}/read`);
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Failed to mark as read", error);
            }
        };

        const markAllAsRead = async () => {
            try {
                await api.post('/notifications/read-all');
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            } catch (error) {
                console.error("Failed to mark all as read", error);
            }
        };

        if (!mounted) {
            return (
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                    <Bell className="h-5 w-5" />
                </Button>
            );
        }

        return (
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-card animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-card/95 backdrop-blur-md border-muted/50 shadow-2xl rounded-2xl overflow-hidden" align="end" sideOffset={12}>
                    <div className="flex items-center justify-between p-3 border-b border-muted/50 bg-muted/20">
                        <h4 className="text-sm font-bold text-foreground">{t("notifications")}</h4>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-6 text-[10px] uppercase text-primary hover:bg-primary/10 hover:text-primary px-2 rounded-md font-semibold">
                                {t("mark_all_as_read")}
                            </Button>
                        )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-2">
                                <Bell className="h-6 w-6 opacity-20" />
                                {t("no_notifications")}
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={cn(
                                            "flex items-start gap-3 p-3 border-b border-muted/30 hover:bg-muted/30 transition-colors cursor-pointer",
                                            !notif.is_read ? "bg-primary/5" : ""
                                        )}
                                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                                    >
                                        <div className={cn(
                                            "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                                            !notif.is_read ? "bg-primary" : "bg-transparent"
                                        )} />
                                        <div className="flex-1 space-y-1">
                                            <p className={cn("text-xs leading-tight", !notif.is_read ? "font-semibold text-foreground" : "text-muted-foreground font-medium")}>
                                                {notif.title}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground/80 line-clamp-2">
                                                {notif.body}
                                            </p>
                                            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                                                {new Date(notif.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-2 border-t border-muted/50 bg-muted/20 text-center">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsOpen(false);
                                const isUserPortal = typeof window !== "undefined" && window.location.pathname.startsWith("/user");
                                const target = (isUserPortal || user?.role === "Student" || user?.role === "Parent")
                                    ? "/user/notifications"
                                    : "/dashboard/notifications";
                                router.push(target);
                            }}
                            className="w-full h-8 text-[11px] uppercase font-bold text-muted-foreground hover:text-primary rounded-xl"
                        >
                            {t("view_all_notifications") || "VIEW ALL NOTIFICATIONS"}
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        );
    };

    useEffect(() => {
        setMounted(true);
        const fetchProfile = async () => {
            try {
                const response = await api.get("/profile");
                const userData = response.data.data;
                setUser(userData);
                if (userData) setUserContext(userData);
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            }
        };

        const fetchAvailableLanguages = async () => {
            try {
                const response = await api.get("/system-setting/languages");
                if (response.data.success) {
                    const enabled = response.data.data.filter((lang: Language) => lang.is_enabled);
                    setAvailableLanguages(enabled);
                }
            } catch (error) {
                console.error("Failed to fetch languages:", error);
            }
        };

        fetchProfile();
        fetchAvailableLanguages();
    }, []);

    const handleLogout = async () => {
        try {
            await api.post("/logout");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            localStorage.removeItem("auth_token");
            setUserContext(null);
            router.push("/login");
        }
    };

    const LanguageSelector = () => {
        if (!mounted) return (
            <div className="h-10 w-10 flex items-center justify-center">
                <Languages className="h-5 w-5 text-muted-foreground/20" />
            </div>
        );

        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl relative group">
                        <Languages className="h-5 w-5" />
                        {selectedLanguage && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold ring-2 ring-background uppercase">
                                {selectedLanguage.short_code.substring(0, 2)}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-card/95 backdrop-blur-md border-muted/50 shadow-2xl rounded-2xl" align="end" sideOffset={12}>
                    <div className="p-3 border-b border-muted/50 mb-2">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">{t("select_language")}</p>
                    </div>
                    <div className="space-y-1">
                        {availableLanguages.map((lang) => (
                            <Button
                                key={lang.id}
                                variant="ghost"
                                onClick={() => setSelectedLanguage(lang)}
                                className={cn(
                                    "w-full justify-between items-center h-10 text-sm font-medium rounded-xl hover:bg-primary/10 transition-all px-3",
                                    selectedLanguage?.id === lang.id ? "bg-primary/15 text-primary" : "text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={cn(
                                        "w-6 h-6 rounded bg-muted/50 flex items-center justify-center text-[10px] font-bold uppercase",
                                        selectedLanguage?.id === lang.id ? "bg-primary/20" : ""
                                    )}>
                                        {lang.short_code.substring(0, 2)}
                                    </div>
                                    <span className="font-semibold">{lang.name}</span>
                                </div>
                                {selectedLanguage?.id === lang.id && (
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                )}
                            </Button>
                        ))}
                        {availableLanguages.length === 0 && (
                            <div className="p-4 text-center text-[11px] text-muted-foreground italic">
                                {t("no_languages_available")}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        );
    };

    return (
        <header className="h-14 min-h-[56px] border-b bg-card/80 backdrop-blur-xl px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 transition-all duration-300 w-full">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 max-w-full">
                <div className="relative group shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 to-indigo-500/40 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-300 animate-pulse" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl bg-muted/50 border border-muted/50 shadow-sm backdrop-blur-sm"
                        onClick={onToggleSidebar}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
                <div className="flex flex-col text-left min-w-0 flex-1">
                    {(() => {
                        const localMobFz = mounted && typeof window !== 'undefined' ? localStorage.getItem("header_mobile_font_size") : null;
                        const localDeskFz = mounted && typeof window !== 'undefined' ? localStorage.getItem("header_desktop_font_size") : null;

                        const mobVal = settings?.header_mobile_font_size || localMobFz;
                        const deskVal = settings?.header_desktop_font_size || localDeskFz;

                        const mobileFz = mobVal ? (String(mobVal).endsWith('px') ? String(mobVal) : `${mobVal}px`) : undefined;
                        const desktopFz = deskVal ? (String(deskVal).endsWith('px') ? String(deskVal) : `${deskVal}px`) : undefined;

                        return (
                            <h1
                                title={settings?.school_name}
                                suppressHydrationWarning
                                style={{
                                    '--mobile-header-fz': `var(--preview-header-mobile-fz, ${mobileFz || '14px'})`,
                                    '--desktop-header-fz': `var(--preview-header-desktop-fz, ${desktopFz || '22px'})`,
                                } as React.CSSProperties}
                                className={cn(
                                    "font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-rose-500 animate-in fade-in slide-in-from-left-4 duration-500 whitespace-nowrap truncate leading-tight [font-size:var(--mobile-header-fz)] md:[font-size:var(--desktop-header-fz)]"
                                )}
                            >
                                {loading ? (
                                    <div className="h-6 w-32 md:w-48 bg-muted-foreground/10 animate-pulse rounded-md" />
                                ) : (
                                    settings?.school_name || (typeof t === "function" ? t("smart_school") : "Smart School")
                                )}
                            </h1>
                        );
                    })()}
                    <div className="h-0.5 w-12 bg-gradient-to-r from-primary to-transparent rounded-full mt-[-2px] hidden md:block opacity-70" />
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
                <HeaderStudentSearch user={user} />

                {mounted && typeof window !== "undefined" && localStorage.getItem("admin_auth_token") && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            const adminToken = localStorage.getItem("admin_auth_token");
                            if (adminToken) {
                                localStorage.setItem("auth_token", adminToken);
                                localStorage.removeItem("admin_auth_token");
                                localStorage.removeItem("is_impersonating");
                                window.location.href = "/dashboard/student-information/student-details";
                            }
                        }}
                        className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 rounded-xl shadow-md shrink-0 animate-pulse"
                        title="Exit impersonation and return to Admin portal"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Exit Impersonation</span>
                    </Button>
                )}

                <div className="hidden md:flex items-center gap-1 md:gap-2">
                    <HeaderShortcutsPopover />

                    <BranchSwitcher user={user} />

                    {user && ['Super Admin', 'Admin'].includes(user.role) && (
                        <CurrencySwitcher />
                    )}

                    <LanguageSelector />

                    <NotificationBell />

                    {mounted && (
                        <ThemeToggle className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl" />
                    )}
                </div>

                <div className="hidden md:block h-8 w-[1px] bg-border mx-1" />

                {mounted && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="relative group cursor-pointer active:scale-95 transition-transform">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-500 rounded-full blur opacity-25 group-hover:opacity-60 transition duration-300" />
                                <Avatar className="h-9 w-9 border-2 border-background shadow-lg relative rounded-full ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/50">
                                    <AvatarImage
                                        src={getImageUrl(user?.avatar)}
                                        alt={user?.name}
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white font-bold text-xs ring-inset ring-1 ring-white/20">
                                        <UserIcon className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-2 bg-card/95 backdrop-blur-md border-muted/50 shadow-2xl rounded-2xl" align="end" sideOffset={12}>
                            <div className="p-3 border-b border-muted/50 mb-2">
                                <p className="text-sm font-bold text-foreground truncate">{user?.name || t("loading")}</p>
                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground truncate">{user?.email || "..."}</p>
                                <div className="mt-2 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary w-fit px-2 py-0.5 rounded-full ring-1 ring-primary/20">
                                    {user?.role || t("staff")}
                                </div>
                            </div>

                            {/* Mobile mode quick action icons inside profile action menu */}
                            <div className="md:hidden p-2 border-b border-muted/50 mb-2 bg-muted/20 rounded-xl flex items-center justify-between gap-1">
                                <BranchSwitcher user={user} />
                                {user && ['Super Admin', 'Admin'].includes(user.role) && (
                                    <CurrencySwitcher />
                                )}
                                <LanguageSelector />
                                <NotificationBell />
                                {isChatEnabled && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setChatOpen(true)}
                                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                                        title="Open Chat"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                    </Button>
                                )}
                                {mounted && (
                                    <ThemeToggle className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" />
                                )}
                            </div>

                            <div className="space-y-1">
                                {isChatEnabled && (
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-3 h-10 text-sm font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                        onClick={() => setChatOpen(true)}
                                    >
                                        <MessageSquare className="h-4 w-4 text-primary" />
                                        {t("chat") || "Chat & Messages"}
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 h-10 text-sm font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                    onClick={() => {
                                        const isStudentPortal = pathname?.startsWith('/user') || user?.role === 'Student' || user?.role === 'Parent' || user?.role === 'Guardian';
                                        if (isStudentPortal) {
                                            router.push('/user/profile');
                                        } else if (user?.staff_id) {
                                            router.push(`/dashboard/hr/staff-directory/edit/${user?.staff_id}`);
                                        } else {
                                            router.push('/dashboard');
                                        }
                                    }}
                                >
                                    <UserIcon className="h-4 w-4" />
                                    {t("my_profile")}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="w-full justify-start gap-3 h-10 text-sm font-semibold rounded-xl text-destructive hover:bg-destructive/10 transition-all mt-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t("sign_out")}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            <InternalChatDialog
                open={chatOpen}
                onOpenChange={setChatOpen}
                currentUser={user}
            />
        </header>
    );
}
