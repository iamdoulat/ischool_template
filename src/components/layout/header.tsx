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
    Settings
} from "lucide-react";
import { CurrencySwitcher } from "./currency-switcher";
import { ThemeToggle } from "./theme-toggle";
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
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/providers/settings-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

interface Language {
    id: number;
    name: string;
    short_code: string;
    country_code: string;
    is_rtl: boolean;
    is_active: boolean;
    is_enabled: boolean;
}

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const { settings, loading } = useSettings();
    const { selectedLanguage, setSelectedLanguage, t } = useLanguage();
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);

    useEffect(() => {
        setMounted(true);
        const fetchProfile = async () => {
            try {
                const response = await api.get("/profile");
                setUser(response.data.data);
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

                    // Set default language if none selected
                    if (!localStorage.getItem("selected_language")) {
                        const active = enabled.find((lang: Language) => lang.is_active) ||
                            enabled.find((lang: Language) => lang.short_code === 'en') ||
                            enabled[0];
                        if (active) setSelectedLanguage(active);
                    }
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
            router.push("/login");
        }
    };

    const LanguageSelector = () => (
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

    return (
        <header className="h-14 min-h-[56px] border-b bg-card/80 backdrop-blur-xl pl-2 pr-4 md:pr-8 flex items-center justify-between sticky top-0 z-30 transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className="relative group">
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
                <div className="flex flex-col min-w-0 text-left">
                    <h1 className="text-base md:text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-rose-500 animate-in fade-in slide-in-from-left-4 duration-500 whitespace-nowrap overflow-hidden text-ellipsis">
                        {loading ? (
                            <div className="h-6 w-32 bg-muted-foreground/10 animate-pulse rounded-md" />
                        ) : (
                            settings?.school_name || "Smart School"
                        )}
                    </h1>
                    <div className="h-0.5 w-12 bg-gradient-to-r from-primary to-transparent rounded-full mt-[-2px] hidden md:block opacity-70" />
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <div className="hidden lg:flex items-center relative max-w-sm group">
                    <Search className="absolute left-4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by Student Name..."
                        className="pl-11 h-10 w-[320px] bg-muted/30 border-muted/50 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all rounded-2xl shadow-sm group-hover:bg-muted/50"
                    />
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                        <LayoutGrid className="h-5 w-5" />
                    </Button>

                    <div className="relative group hidden sm:block">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                            <ArrowLeftRight className="h-5 w-5" />
                        </Button>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-[#6366f1] text-white text-[11px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#6366f1] rotate-45" />
                            Switch Branch
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-1 md:gap-2">
                        <CurrencySwitcher />

                        <LanguageSelector />

                        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-card animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        </Button>

                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                            <MessageSquare className="h-5 w-5" />
                        </Button>

                        {mounted && (
                            <ThemeToggle className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl" />
                        )}
                    </div>

                    <div className="md:hidden">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl bg-muted/30">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-fit p-2 bg-card/95 backdrop-blur-md border-muted/50 shadow-xl rounded-2xl" align="end" sideOffset={8}>
                                <div className="flex flex-row items-center gap-1">
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                                        <LayoutGrid className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                                        <ArrowLeftRight className="h-5 w-5" />
                                    </Button>
                                    <CurrencySwitcher />

                                    <LanguageSelector />

                                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                                        <Bell className="h-5 w-5" />
                                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-card animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                                        <MessageSquare className="h-5 w-5" />
                                    </Button>
                                    {mounted && (
                                        <ThemeToggle className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl" />
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="h-8 w-[1px] bg-border mx-1" />

                <Popover>
                    <PopoverTrigger asChild>
                        <div className="relative group cursor-pointer active:scale-95 transition-transform">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-500 rounded-full blur opacity-25 group-hover:opacity-60 transition duration-300" />
                            <Avatar className="h-9 w-9 border-2 border-background shadow-lg relative rounded-full ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/50">
                                <AvatarImage
                                    src={user?.avatar ? (user.avatar.startsWith('http://127.0.0.1:8000http') ? user.avatar.replace('http://127.0.0.1:8000http', 'http') : user.avatar) : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2000&auto=format&fit=crop"}
                                    alt={user?.name}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white font-bold text-xs ring-inset ring-1 ring-white/20">
                                    {user?.name ? user.name.substring(0, 2).toUpperCase() : "AD"}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2 bg-card/95 backdrop-blur-md border-muted/50 shadow-2xl rounded-2xl" align="end" sideOffset={12}>
                        <div className="p-3 border-b border-muted/50 mb-2">
                            <p className="text-sm font-bold text-foreground truncate">{user?.name || "Loading..."}</p>
                            <p className="text-[10px] md:text-xs font-medium text-muted-foreground truncate">{user?.email || "..."}</p>
                            <div className="mt-2 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary w-fit px-2 py-0.5 rounded-full ring-1 ring-primary/20">
                                {user?.role || "Staff"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 h-10 text-sm font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                onClick={() => router.push(`/dashboard/hr/staff-directory/edit/${user?.staff_id}`)}
                            >
                                <UserIcon className="h-4 w-4" />
                                My Profile
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="w-full justify-start gap-3 h-10 text-sm font-semibold rounded-xl text-destructive hover:bg-destructive/10 transition-all mt-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </header>
    );
}
