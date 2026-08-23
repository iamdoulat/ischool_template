"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
    Shield,
    Clock,
    User,
    Wifi,
    Check,
    Radio
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";

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
                toast.error(t("failed_to_fetch_logs") || "Failed to load system logs");
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
                toast.success(t("logs_cleared_successfully") || "All system & activity logs cleared!");
                setIsClearDialogOpen(false);
                fetchLogs();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to clear logs");
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
            toast.success(t("download_started") || "Downloading system logs...");
        } catch {
            toast.error("Failed to download logs");
        }
    };

    const handleCopyAll = () => {
        const text = logs
            .map(l => `[${l.timestamp}] [${l.level}] [${l.source}] (${l.user || "System"} @ ${l.ip_address}): ${l.message}`)
            .join("\n");
        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard") || "All visible logs copied to clipboard!");
    };

    const handleCopyLine = (log: LogEntry) => {
        const text = `[${log.timestamp}] [${log.level}] [${log.source}] (${log.user || "System"} @ ${log.ip_address}): ${log.message}`;
        navigator.clipboard.writeText(text);
        setCopiedIndex(log.id);
        setTimeout(() => setCopiedIndex(null), 2000);
        toast.success("Line copied!");
    };

    const getLevelBadge = (level: string) => {
        switch (level) {
            case "ERROR":
                return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[9px] font-mono px-1.5 py-0 uppercase">ERROR</Badge>;
            case "WARNING":
                return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] font-mono px-1.5 py-0 uppercase">WARN</Badge>;
            case "ACTION":
                return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[9px] font-mono px-1.5 py-0 uppercase">ACTION</Badge>;
            case "AUTH":
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] font-mono px-1.5 py-0 uppercase">AUTH</Badge>;
            case "INFO":
            default:
                return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] font-mono px-1.5 py-0 uppercase">INFO</Badge>;
        }
    };

    return (
        <div className="p-2 sm:p-4 space-y-4 max-w-7xl mx-auto font-sans">
            
            {/* Header Title Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Terminal className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none flex items-center gap-2">
                            {t("system_logs") || "System & Activity Logs"}
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold py-0.5">
                                7-Day Auto Retention
                            </Badge>
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">
                            {t("system_logs_desc") || "Live terminal console, server error logs, user audit trails, and automatic 7-day auto-purge"}
                        </p>
                    </div>
                </div>

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
                        {liveStream ? "Live Stream ON" : "Stream Paused"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLogs()}
                        disabled={loading}
                        className="h-8 text-xs font-semibold rounded-lg bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                        {t("refresh") || "Refresh"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadLogs}
                        className="h-8 text-xs font-semibold rounded-lg bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        {t("download_logs") || "Export Log"}
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsClearDialogOpen(true)}
                        className="h-8 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        {t("clear_logs") || "Clear All Logs"}
                    </Button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Card className="p-3.5 bg-white border-gray-100 shadow-xs rounded-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Logs</span>
                        <Activity className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="text-xl font-extrabold text-gray-800 mt-1">{stats.total}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Entries loaded in buffer</div>
                </Card>

                <Card className="p-3.5 bg-white border-gray-100 shadow-xs rounded-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Errors (24h)</span>
                        <XCircle className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="text-xl font-extrabold text-rose-600 mt-1">{stats.errors}</div>
                    <div className="text-[10px] text-rose-400 mt-0.5">Exceptions recorded</div>
                </Card>

                <Card className="p-3.5 bg-white border-gray-100 shadow-xs rounded-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Warnings</span>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-xl font-extrabold text-amber-600 mt-1">{stats.warnings}</div>
                    <div className="text-[10px] text-amber-400 mt-0.5">Notice & warning logs</div>
                </Card>

                <Card className="p-3.5 bg-white border-gray-100 shadow-xs rounded-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Log File Size</span>
                        <HardDrive className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-xl font-extrabold text-gray-800 mt-1">{stats.log_file_size}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">laravel.log on server</div>
                </Card>

                <Card className="p-3.5 bg-white border-gray-100 shadow-xs rounded-xl col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Auto-Prune</span>
                        <Calendar className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-extrabold text-emerald-600 mt-1">7 Days</div>
                    <div className="text-[10px] text-emerald-500 mt-0.5">Auto delete enabled</div>
                </Card>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") fetchLogs(); }}
                        placeholder="Search logs, IP, error message..."
                        className="pl-9 h-9 text-xs rounded-lg border-gray-200 bg-gray-50/50"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                    <Select value={levelFilter} onValueChange={(val) => setLevelFilter(val)}>
                        <SelectTrigger className="h-9 text-xs rounded-lg border-gray-200 w-36 bg-gray-50/50">
                            <SelectValue placeholder="All Levels" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="error">Errors & Exceptions</SelectItem>
                            <SelectItem value="warning">Warnings</SelectItem>
                            <SelectItem value="action">User Actions</SelectItem>
                            <SelectItem value="auth">Auth & Logins</SelectItem>
                            <SelectItem value="info">Info Logs</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={limit} onValueChange={(val) => setLimit(val)}>
                        <SelectTrigger className="h-9 text-xs rounded-lg border-gray-200 w-28 bg-gray-50/50">
                            <SelectValue placeholder="Limit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="50">Last 50</SelectItem>
                            <SelectItem value="100">Last 100</SelectItem>
                            <SelectItem value="200">Last 200</SelectItem>
                            <SelectItem value="500">Last 500</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyAll}
                        className="h-9 text-xs font-semibold rounded-lg bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy All
                    </Button>
                </div>
            </div>

            {/* Terminal Window View */}
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
                                LIVE FEED
                            </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500">
                            {logs.length} Lines • UTF-8
                        </span>
                    </div>
                </div>

                {/* Terminal Content Body */}
                <div className="p-4 sm:p-5 font-mono text-xs max-h-[620px] overflow-y-auto space-y-1.5 text-slate-200">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                            <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                            <p className="text-xs font-mono">Reading system & activity streams...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                            <CheckCircle2 className="h-8 w-8 text-emerald-400/60" />
                            <p className="text-sm font-bold text-slate-300">Clean Slate — No Logs Found</p>
                            <p className="text-xs text-slate-500">All activity logs within 7 days are clear or matching filter.</p>
                        </div>
                    ) : (
                        logs.map((log, idx) => (
                            <div
                                key={log.id || idx}
                                className="group flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 py-1 px-2 rounded-md hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-800"
                            >
                                {/* Line Number & Timestamp */}
                                <div className="flex items-center gap-2 shrink-0 text-slate-500 text-[11px]">
                                    <span className="w-8 text-right select-none opacity-40">{idx + 1}</span>
                                    <span className="text-slate-400 select-none">{log.timestamp}</span>
                                </div>

                                {/* Level Badge */}
                                <div className="shrink-0">
                                    {getLevelBadge(log.level)}
                                </div>

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
                                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                        title="Copy Log"
                                    >
                                        {copiedIndex === log.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
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
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
                        </span>
                        <span>Retention: 7 Days (Purged on request)</span>
                    </div>
                    <div>
                        <span>Server Time: {stats.server_time || new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

            {/* Clear Logs Confirmation Dialog */}
            <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                            <AlertTriangle className="h-5 w-5" />
                            {t("clear_system_logs_title") || "Clear All System & Activity Logs?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="text-xs text-gray-600 leading-relaxed space-y-2">
                                <div>
                                    This will permanently erase all system logs from <code>storage/logs/laravel.log</code> and purge all database audit trail records.
                                </div>
                                <div className="font-semibold text-rose-600">
                                    This action cannot be undone. An audit log recording this clear action will be generated.
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={clearing}>{t("cancel") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearLogs}
                            disabled={clearing}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                        >
                            {clearing ? "Clearing..." : (t("confirm_clear_logs") || "Yes, Clear All Logs")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
