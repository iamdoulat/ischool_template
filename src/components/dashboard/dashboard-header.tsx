"use client";

import { useEffect, useState } from "react";
import { RefreshCw, CalendarDays, Clock, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime, toLocaleNumber } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useSettings } from "@/components/providers/settings-provider";

interface BranchInfo {
    id?: number | string;
    branch_name?: string;
    branch_code?: string;
    slug?: string;
    is_main?: boolean;
}

interface DashboardHeaderProps {
    onRefresh: () => void;
    refreshing: boolean;
    lastUpdated: Date | null;
    branch?: BranchInfo | null;
}

function getGreeting(t: (key: string) => string): string {
    const h = new Date().getHours();
    if (h < 12) return t("good_morning");
    if (h < 17) return t("good_afternoon");
    return t("good_evening");
}

function formatLastUpdated(date: Date | null, timeFormat: "12" | "24"): string {
    if (!date) return "";
    return formatTime(date, timeFormat);
}

export function DashboardHeader({ onRefresh, refreshing, lastUpdated, branch }: DashboardHeaderProps) {
    const { t, language } = useTranslation();
    const { settings } = useSettings();
    const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);
    const [session, setSession] = useState<string>("");
    const [now, setNow] = useState(new Date());

    const shortCode = language?.short_code || "en";
    const dateLocale = shortCode === "bn" ? "bn-BD" : shortCode === "hi" ? "hi-IN" : shortCode === "ar" ? "ar-SA" : "en-US";

    // tick the live clock every minute
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        api.get("/profile")
            .then(r => setUser(r.data?.data))
            .catch(() => {});
        api.get("/system-setting/general-setting")
            .then(r => {
                const d = r.data?.data || r.data || {};
                setSession(d.session || "");
            })
            .catch(() => {});
    }, []);

    const dateStr = now.toLocaleDateString(dateLocale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const tf = settings.time_format === "12" ? "12" : "24" as const;
    const rawTimeStr = formatTime(now, tf);
    const timeStr = toLocaleNumber(rawTimeStr, shortCode);
    const localizedSession = toLocaleNumber(session, shortCode);
    const localizedLastUpdated = toLocaleNumber(formatLastUpdated(lastUpdated, tf), shortCode);

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: greeting + date */}
            <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <h2 className="text-lg md:text-2xl font-extrabold tracking-tight text-foreground truncate">
                        {getGreeting(t)}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
                    </h2>
                    {user?.role && (
                        <Badge
                            variant="secondary"
                            className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/20 px-2.5 py-0.5 rounded-full"
                        >
                            {user.role}
                        </Badge>
                    )}
                    {branch && !branch.is_main && (
                        <Badge
                            variant="outline"
                            className="text-[10px] font-extrabold uppercase tracking-wider border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs"
                        >
                            <Building2 className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            <span>{branch.branch_name}</span>
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {dateStr}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {timeStr}
                    </span>
                </div>
            </div>

            {/* Right: session badge + refresh */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {session && (
                    <Badge
                        variant="outline"
                        className="text-[11px] font-bold uppercase tracking-widest border-indigo-200 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-400 px-3 py-1 rounded-lg"
                    >
                        {t("session_x", { session: localizedSession })}
                    </Badge>
                )}
                <div className="flex items-center gap-1.5">
                    {lastUpdated && (
                        <span className="text-[10px] text-muted-foreground/70 font-medium hidden sm:inline">
                            {t("updated_at", { time: localizedLastUpdated })}
                        </span>
                    )}
                    <Button
                        size="sm"
                        onClick={onRefresh}
                        disabled={refreshing}
                        className={cn(
                            "h-8 gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f57c00] hover:to-[#4f46e5] border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg active:scale-95",
                            refreshing && "opacity-80"
                        )}
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                        {refreshing ? t("refreshing") : t("refresh")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
