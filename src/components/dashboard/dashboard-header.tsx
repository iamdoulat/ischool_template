"use client";

import { useEffect, useState } from "react";
import { RefreshCw, CalendarDays, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useSettings } from "@/components/providers/settings-provider";

interface DashboardHeaderProps {
    onRefresh: () => void;
    refreshing: boolean;
    lastUpdated: Date | null;
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

export function DashboardHeader({ onRefresh, refreshing, lastUpdated }: DashboardHeaderProps) {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);
    const [session, setSession] = useState<string>("");
    const [now, setNow] = useState(new Date());

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

    const dateStr = now.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const tf = settings.time_format === "12" ? "12" : "24" as const;
    const timeStr = formatTime(now, tf);

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
                        {t("session_x", { session })}
                    </Badge>
                )}
                <div className="flex items-center gap-1.5">
                    {lastUpdated && (
                        <span className="text-[10px] text-muted-foreground/70 font-medium hidden sm:inline">
                            {t("updated_at", { time: formatLastUpdated(lastUpdated, tf) })}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={refreshing}
                        className={cn(
                            "h-8 gap-1.5 text-xs font-semibold border-border/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all rounded-lg",
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
