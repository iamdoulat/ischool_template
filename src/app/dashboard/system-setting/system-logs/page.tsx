"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Terminal,
    Trash2,
    Download,
    Copy,
    RefreshCw,
    Search,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    HardDrive,
    Calendar,
    Activity,
    User,
    Wifi,
    Check,
    Radio,
    Columns,
    Layers,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/components/providers/language-provider";
import { cn, toLocaleNumber } from "@/lib/utils";

interface LogEntry {
    id: string;
    timestamp: string;
    level: "ERROR" | "WARNING" | "INFO" | "ACTION" | "AUTH";
    source: string;
    message: string;
    action?: string;
    user?: string;
    ip_address?: string;
    platform?: string;
}

interface LogStats {
    total: number;
    errors: number;
    warnings: number;
    actions: number;
    auths: number;
    infos: number;
    log_file_size: string;
    retention_days: number;
    server_time: string;
}

export default function SystemLogsPage() {
    const { t } = useTranslation();
    const { language } = useLanguage();

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<LogStats>({
        total: 0,
        errors: 0,
        warnings: 0,
        actions: 0,
        auths: 0,
        infos: 0,
        log_file_size: "0 KB",
        retention_days: 7,
        server_time: "",
    });

    const [loading, setLoading] = useState<boolean>(true);
    const [clearing, setClearing] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const [levelFilter, setLevelFilter] = useState<string>("all");
    const [limit, setLimit] = useState<string>("100");
    const [liveStream, setLiveStream] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<"terminal" | "table">("terminal");
    const [isClearDialogOpen, setIsClearDialogOpen] = useState<boolean>(false);
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

    const terminalEndRef = useRef<HTMLDivElement>(null);
    const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchLogs = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const params = new URLSearchParams({
                search,
                level: levelFilter,
                limit,
            });
            const res = await api.get(`/system-setting/system-logs?${params.toString()}`);
            if (res.data?.status === "Success" || res.data?.data) {
                const data = res.data.data;
                setLogs(data.logs || []);
                if (data.stats) {
                    setStats(data.stats);
                }
            }
        } catch (error) {
            if (!silent) {
                toast.error(t("failed_to_fetch_logs"));
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [levelFilter, limit]);

    // Live streaming polling
    useEffect(() => {
        if (liveStream) {
            liveIntervalRef.current = setInterval(() => {
                fetchLogs(true);
            }, 3000);
        } else {
            if (liveIntervalRef.current) {
                clearInterval(liveIntervalRef.current);
            }
        }
        return () => {
            if (liveIntervalRef.current) {
                clearInterval(liveIntervalRef.current);
            }
        };
    }, [liveStream, search, levelFilter, limit]);

    const handleClearLogs = async () => {
        setClearing(true);
        try {
            const res = await api.post("/system-setting/system-logs/clear");
            if (res.data?.status === "Success" || res.data?.message) {
                toast.success(t("logs_cleared_successfully"));
                setIsClearDialogOpen(false);
                fetchLogs();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || t("failed_to_save"));
        } finally {
            setClearing(false);
        }
    };

    const handleDownloadLogs = () => {
        try {
            const downloadUrl = `${api.defaults.baseURL || "/api/v1"}/system-setting/system-logs/download`;
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.setAttribute("download", `ischool-logs-${new Date().toISOString().slice(0, 10)}.log`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(t("download_started"));
        } catch {
            toast.error(t("failed_to_save"));
        }
    };

    const handleCopyAll = () => {
        const text = logs
            .map(
                (l) =>
                    `[${l.timestamp}] [${l.level}] [${l.source}] (${l.user || "System"} @ ${l.ip_address}): ${l.message}`
            )
            .join("\n");
        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard"));
    };

    const handleCopyLine = (log: LogEntry) => {
        const text = `[${log.timestamp}] [${log.level}] [${log.source}] (${log.user || "System"} @ ${l.ip_address}): ${log.message}`;
        navigator.clipboard.writeText(text);
        setCopiedIndex(log.id);
        setTimeout(() => setCopiedIndex(null), 2000);
        toast.success(t("line_copied"));
    };

    const getLevelBadge = (level: string) => {
        switch (level) {
            case "ERROR":
                return (
                    <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[9px] font-mono px-1.5 py-0 uppercase">
                        {t("errors_exceptions")}
                    </Badge>
                );
            case "WARNING":
                return (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] font-mono px-1.5 py-0 uppercase">
                        {t("warnings")}
                    </Badge>
                );
            case "ACTION":
                return (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[9px] font-mono px-1.5 py-0 uppercase">
                        {t("user_actions")}
                    </Badge>
                );
            case "AUTH":
                return (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] font-mono px-1.5 py-0 uppercase">
                        {t("auth_logins")}
                    </Badge>
                );
            case "INFO":
            default:
                return (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] font-mono px-1.5 py-0 uppercase">
                        {t("info_logs")}
                    </Badge>
                );
        }
    };

    const tabsList = [
        { key: "all", label: t("all_logs"), count: stats.total },
        { key: "error", label: t("errors_exceptions"), count: stats.errors },
        { key: "warning", label: t("warnings"), count: stats.warnings },
        { key: "action", label: t("user_actions"), count: stats.actions },
        { key: "auth", label: t("auth_logins"), count: stats.auths },
        { key: "info", label: t("info_logs"), count: stats.infos },
    ];

    return (
        <div className="p-2 sm:p-4 space-y-4 max-w-7xl mx-auto font-sans">
            {/* Page Header Banner (Mandatory Rule: Edge-to-edge gradient div, NEVER inside Card) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Terminal className="h-5 w-5" />
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                                {t("system_logs")}
                            </h1>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold py-0.5">
                                {t("auto_retention_badge")}
                            </Badge>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("system_logs_desc")}
                        </p>
                    </div>
                </div>

                {/* Banner Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLiveStream(!liveStream)}
                        className={`h-8 text-xs font-semibold rounded-lg border transition-all ${
                            liveStream
                                ? "bg-emerald-500 text-white border-emerald-600 shadow-xs hover:bg-emerald-600"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        <Radio className={`h-3.5 w-3.5 mr-1.5 ${liveStream ? "animate-pulse" : ""}`} />
                        {liveStream ? t("live_stream_on") : t("stream_paused")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLogs()}
                        disabled={loading}
                        className="h-8 text-xs font-semibold rounded-lg bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                        {t("refresh")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadLogs}
                        className="h-8 text-xs font-semibold rounded-lg bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs"
                    >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        {t("export_log")}
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsClearDialogOpen(true)}
                        className="h-8 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        {t("clear_logs")}
                    </Button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Card className="p-3.5 bg-white border-gray-100 shadow-xs rounded-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            {t("total_logs")}
                        </span>
                        <Activity className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="text-xl font-extrabold text-gray-800 mt-1">
                        {toLocaleNumber(stats.total, language?.short_code)}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                        {t("entries_in_buffer")}
                    </div>
                </Card>

                <Card className="p-3.5 bg-white border-gray-100 shadow-xs rounded-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
                            {t("errors_24h")}
                        </span>
                        <XCircle className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="text-xl font-extrabold text-rose-600 mt-1">
                        {toLocaleNumber(stats.errors, language?.short_code)}
                    </div>
                    <div className="text-[10px] text-rose-400 mt-0.5">
                        {t("exceptions_recorded")}
                    </div>
                </Card>

                <Card className="p-3.5 bg-white border-gray-100 shadow-xs rounded-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                            {t("warnings")}
                        </span>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-xl font-extrabold text-amber-600 mt-1">
                        {toLocaleNumber(stats.warnings, language?.short_code)}
                    </div>
                    <div className="text-[10px] text-amber-400 mt-0.5">
                        {t("notice_warning_logs")}
                    </div>
                </Card>

                <Card className="p-3.5 bg-white border-gray-100 shadow-xs rounded-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            {t("log_file_size")}
                        </span>
                        <HardDrive className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-xl font-extrabold text-gray-800 mt-1">
                        {stats.log_file_size}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                        {t("laravel_log_on_server")}
                    </div>
                </Card>

                <Card className="p-3.5 bg-white border-gray-100 shadow-xs rounded-xl col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                            {t("auto_prune")}
                        </span>
                        <Calendar className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-extrabold text-emerald-600 mt-1">
                        {t("seven_days")}
                    </div>
                    <div className="text-[10px] text-emerald-500 mt-0.5">
                        {t("auto_delete_enabled")}
                    </div>
                </Card>
            </div>

            {/* Segmented Level Tabs & View Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs">
                {/* High Contrast Scope Tabs */}
                <div className="flex items-center p-1 rounded-xl bg-gray-50 border border-gray-200/80 gap-1 overflow-x-auto max-w-full">
                    {tabsList.map((tab) => {
                        const isActive = levelFilter === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setLevelFilter(tab.key)}
                                className={cn(
                                    "h-8 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none",
                                    isActive
                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-200/60"
                                )}
                            >
                                <span>{tab.label}</span>
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span
                                        className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold leading-none",
                                            isActive
                                                ? "bg-white/25 text-white"
                                                : "bg-gray-200/80 text-gray-600"
                                        )}
                                    >
                                        {toLocaleNumber(tab.count, language?.short_code)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* View Mode Switcher: Terminal vs Table */}
                <div className="flex items-center p-1 rounded-lg bg-gray-50 border border-gray-200/80 gap-1">
                    <button
                        type="button"
                        onClick={() => setViewMode("terminal")}
                        className={cn(
                            "h-7 px-2.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer select-none",
                            viewMode === "terminal"
                                ? "bg-slate-900 text-white shadow-xs"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                        )}
                    >
                        <Terminal className="h-3.5 w-3.5" />
                        <span>{t("terminal_console")}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        className={cn(
                            "h-7 px-2.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer select-none",
                            viewMode === "table"
                                ? "bg-slate-900 text-white shadow-xs"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                        )}
                    >
                        <Columns className="h-3.5 w-3.5" />
                        <span>{t("table_view")}</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") fetchLogs();
                        }}
                        placeholder={t("search_logs_placeholder")}
                        className="pl-9 h-9 text-xs rounded-lg border-gray-200 bg-gray-50/50 placeholder:text-gray-400"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                    <Select value={limit} onValueChange={(val) => setLimit(val)}>
                        <SelectTrigger className="h-9 text-xs rounded-lg border-gray-200 w-32 bg-gray-50/50">
                            <SelectValue placeholder={t("limit")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="50">{t("last_50")}</SelectItem>
                            <SelectItem value="100">{t("last_100")}</SelectItem>
                            <SelectItem value="200">{t("last_200")}</SelectItem>
                            <SelectItem value="500">{t("last_500")}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyAll}
                        className="h-9 text-xs font-semibold rounded-lg bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-100 shadow-2xs"
                    >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        {t("copy_all")}
                    </Button>
                </div>
            </div>

            {/* View Mode 1: Terminal Window View */}
            {viewMode === "terminal" && (
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-[#0B0F19]">
                    {/* Terminal Window Titlebar */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#151C2C] border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="h-3 w-3 rounded-full bg-rose-500/80 shadow-xs" />
                                <div className="h-3 w-3 rounded-full bg-amber-500/80 shadow-xs" />
                                <div className="h-3 w-3 rounded-full bg-emerald-500/80 shadow-xs" />
                            </div>
                            <span className="text-[11px] font-mono font-medium text-slate-400 ml-2">
                                root@ischool-sms: ~/logs/server.log
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {liveStream && (
                                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                                    {t("live_feed")}
                                </span>
                            )}
                            <span className="text-[10px] font-mono text-slate-500">
                                {toLocaleNumber(logs.length, language?.short_code)} {t("lines")} • UTF-8
                            </span>
                        </div>
                    </div>

                    {/* Terminal Content Body */}
                    <div className="p-4 sm:p-5 font-mono text-xs max-h-[620px] overflow-y-auto space-y-1.5 text-slate-200">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                                <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                                <p className="text-xs font-mono">{t("reading_system_streams")}</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                                <CheckCircle2 className="h-8 w-8 text-emerald-400/60" />
                                <p className="text-sm font-bold text-slate-300">{t("clean_slate_no_logs")}</p>
                                <p className="text-xs text-slate-500">{t("clean_slate_desc")}</p>
                            </div>
                        ) : (
                            logs.map((log, idx) => (
                                <div
                                    key={log.id || idx}
                                    className="group flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 py-1 px-2 rounded-md hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-800"
                                >
                                    {/* Line Number & Timestamp */}
                                    <div className="flex items-center gap-2 shrink-0 text-slate-500 text-[11px]">
                                        <span className="w-8 text-right select-none opacity-40">
                                            {toLocaleNumber(idx + 1, language?.short_code)}
                                        </span>
                                        <span className="text-slate-400 select-none">{log.timestamp}</span>
                                    </div>

                                    {/* Level Badge */}
                                    <div className="shrink-0">{getLevelBadge(log.level)}</div>

                                    {/* Source / Module */}
                                    <div className="shrink-0 text-indigo-300/80 text-[11px] font-semibold">
                                        [{log.source}]
                                    </div>

                                    {/* Message */}
                                    <div className="flex-1 break-words leading-relaxed text-slate-300">
                                        {log.message}
                                    </div>

                                    {/* Metadata: User & IP */}
                                    <div className="shrink-0 flex items-center gap-2 text-[10px] text-slate-500 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {log.user && (
                                            <span className="flex items-center gap-1 text-slate-400">
                                                <User className="h-3 w-3" /> {log.user}
                                            </span>
                                        )}
                                        {log.ip_address && (
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <Wifi className="h-3 w-3" /> {log.ip_address}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleCopyLine(log)}
                                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                            title={t("copy_log")}
                                        >
                                            {copiedIndex === log.id ? (
                                                <Check className="h-3 w-3 text-emerald-400" />
                                            ) : (
                                                <Copy className="h-3 w-3" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={terminalEndRef} />
                    </div>

                    {/* Terminal Status Bar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-[#080B12] border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {t("online")}
                            </span>
                            <span>{t("retention_notice")}</span>
                        </div>
                        <div>
                            <span>
                                {t("server_time")}: {stats.server_time || new Date().toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* View Mode 2: Structured Data Table View */}
            {viewMode === "table" && (
                <Card className="rounded-xl shadow-sm border border-gray-100 overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="border-b border-gray-100">
                                    <TableHead className="h-10 px-4 font-bold text-gray-700 text-xs w-28">
                                        {t("log_level")}
                                    </TableHead>
                                    <TableHead className="h-10 px-4 font-bold text-gray-700 text-xs w-32">
                                        {t("log_source")}
                                    </TableHead>
                                    <TableHead className="h-10 px-4 font-bold text-gray-700 text-xs w-40">
                                        {t("log_time")}
                                    </TableHead>
                                    <TableHead className="h-10 px-4 font-bold text-gray-700 text-xs">
                                        {t("log_message")}
                                    </TableHead>
                                    <TableHead className="h-10 px-4 font-bold text-gray-700 text-xs w-36">
                                        {t("log_user")}
                                    </TableHead>
                                    <TableHead className="h-10 px-4 font-bold text-gray-700 text-xs w-32">
                                        {t("log_ip")}
                                    </TableHead>
                                    <TableHead className="h-10 px-4 font-bold text-gray-700 text-xs text-center w-20">
                                        {t("log_action")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-xs text-gray-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                                                {t("reading_system_streams")}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-xs text-gray-400">
                                            {t("clean_slate_no_logs")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log, idx) => (
                                        <TableRow
                                            key={log.id || idx}
                                            className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                                        >
                                            <TableCell className="py-2.5 px-4">{getLevelBadge(log.level)}</TableCell>
                                            <TableCell className="py-2.5 px-4 text-xs font-semibold text-indigo-600">
                                                {log.source}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-4 text-xs text-gray-500 font-mono">
                                                {log.timestamp}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-4 text-xs text-gray-800 break-words max-w-md leading-relaxed">
                                                {log.message}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-4 text-xs text-gray-600">
                                                {log.user || "-"}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-4 text-xs text-gray-500 font-mono">
                                                {log.ip_address || "-"}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-4 text-center">
                                                <button
                                                    onClick={() => handleCopyLine(log)}
                                                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                                                    title={t("copy_log")}
                                                >
                                                    {copiedIndex === log.id ? (
                                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* Clear Logs Confirmation Dialog */}
            <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                            <AlertTriangle className="h-5 w-5" />
                            {t("clear_system_logs_title")}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="text-xs text-gray-600 leading-relaxed space-y-2">
                                <div>{t("clear_logs_desc_1")}</div>
                                <div className="font-semibold text-rose-600">{t("clear_logs_desc_2")}</div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={clearing}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearLogs}
                            disabled={clearing}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                        >
                            {clearing ? t("clearing") : t("confirm_clear_logs")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
