"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search, ChevronLeft, ChevronRight,
    ArrowUpDown, Video, Copy, FileSpreadsheet,
    FileBox, Printer, Columns, Loader2,
    CalendarClock, Clock, GraduationCap, User,
    CheckCircle2, XCircle, MonitorPlay,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";

interface LiveClass {
    id: number;
    title: string;
    dateTime: string;
    duration: number;
    className: string;
    host: string;
    description: string;
    status: string;
    url: string;
}

export default function UserGmeetLiveClassesPage() {
    const { t } = useTranslation();
    const [classes, setClasses] = useState<LiveClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchData = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const perPage = parseInt(itemsPerPage, 10) || 50;
            const response = await api.get("/user/gmeet-live-classes", {
                params: { page, per_page: perPage, search: searchTerm || undefined },
            });
            const res = response.data?.data || response.data || {};
            const dataArr = Array.isArray(res) ? res : (res.data || []);
            setClasses(dataArr);
            setTotalEntries(res.total || dataArr.length);
            setTotalPages(res.last_page || Math.ceil((res.total || dataArr.length) / perPage) || 1);
            setCurrentPage(res.current_page || page);
        } catch (error) {
            console.error("Error fetching live classes:", error);
            toast.error(t("failed_to_load_live_classes"));
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage, searchTerm]);

    useEffect(() => {
        fetchData(1);
    }, [itemsPerPage]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchData(1);
    };

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    // ── Status helpers ──────────────────────────────────────────────────────────
    const getStatusStyle = (status: string) => {
        switch ((status || "").toLowerCase()) {
            case "finished":   return "bg-[#4caf50] text-white";
            case "cancelled":  return "bg-[#e0e0e0] text-gray-600";
            default:           return "bg-[#ff9800] text-white"; // awaited
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const s = (status || "Awaited").toLowerCase();
        const Icon = s === "finished" ? CheckCircle2 : s === "cancelled" ? XCircle : Clock;
        return (
            <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                getStatusStyle(status)
            )}>
                <Icon className="h-3 w-3" />
                {status || "Awaited"}
            </span>
        );
    };

    // ── Join button (always visible — Google Meet links are always shareable) ──
    const JoinBtn = ({ url }: { url: string }) => (
        <Button
            onClick={() => { if (url) window.open(url, "_blank"); }}
            disabled={!url}
            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-2.5 h-7 text-[11px] font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95 border-0 disabled:opacity-40"
        >
            <Video className="h-3 w-3" /> {t("join")}
        </Button>
    );

    return (
        <div className="p-4 lg:p-6 space-y-5 min-h-screen font-sans text-xs animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <MonitorPlay className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("google_meet_live_classes")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {totalEntries} class{totalEntries === 1 ? "" : "es"} scheduled
                        </p>
                    </div>
                </div>

                <div className="p-4 lg:p-5 space-y-5">

                    {/* ── Toolbar ────────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={t("search_classes")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                                className="pl-9 h-9 text-[12px] border-gray-200 focus-visible:ring-indigo-300 rounded-lg shadow-none"
                            />
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-2">
                            <Select value={itemsPerPage} onValueChange={(val) => setItemsPerPage(val)}>
                                <SelectTrigger className="h-8 w-16 text-[11px] border-gray-200 shadow-none rounded-lg font-semibold text-gray-700 bg-white">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 text-gray-400">
                                {[Copy, FileSpreadsheet, FileBox, Printer, Columns].map((Icon, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-md border border-transparent hover:border-gray-200 transition-all"
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Desktop Table (lg+) ─────────────────────────────────── */}
                    <div className="hidden lg:block rounded-lg border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-gray-50/80 border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4 h-auto">
                                        {t("class_title")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" />
                                    </TableHead>
                                    <TableHead className="py-3 px-4 h-auto">
                                        {t("date_time")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" />
                                    </TableHead>
                                    <TableHead className="py-3 px-4 h-auto">
                                        {t("duration_min")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" />
                                    </TableHead>
                                    <TableHead className="py-3 px-4 h-auto">
                                        {t("class")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" />
                                    </TableHead>
                                    <TableHead className="py-3 px-4 h-auto">
                                        {t("host")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" />
                                    </TableHead>
                                    <TableHead className="py-3 px-4 h-auto">{t("description")}</TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-center">
                                        {t("status")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" />
                                    </TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t("loading_live_classes")}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : classes.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={8} className="py-14 text-center">
                                            <div className="flex flex-col items-center text-gray-400">
                                                <MonitorPlay className="h-10 w-10 opacity-30 mb-2" />
                                                <p className="text-[11px] font-bold uppercase tracking-widest">
                                                    {t("no_live_classes_available")}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    classes.map((item, idx) => (
                                        <TableRow
                                            key={item.id || idx}
                                            className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/30 transition-colors whitespace-nowrap"
                                        >
                                            <TableCell className="py-3 px-4 text-[#6366f1] font-semibold">
                                                {item.title}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{item.dateTime}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{item.duration}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{item.className}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{item.host}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 max-w-[200px] truncate" title={item.description}>
                                                {item.description || "-"}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                                <StatusBadge status={item.status} />
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <JoinBtn url={item.url} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* ── Mobile / tablet cards (<lg) ────────────────────────── */}
                    <div className="lg:hidden">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 text-gray-400 py-12">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading live classes...
                            </div>
                        ) : classes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <MonitorPlay className="h-12 w-12 opacity-30 mb-3" />
                                <p className="font-bold uppercase text-[11px] tracking-widest">
                                    {t("no_live_classes_available")}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {classes.map((item, idx) => (
                                    <div
                                        key={item.id || idx}
                                        className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-2.5"
                                    >
                                        {/* Title + Status */}
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-[13px] font-bold text-[#6366f1] leading-snug">
                                                {item.title}
                                            </h3>
                                            <StatusBadge status={item.status} />
                                        </div>

                                        {/* Meta grid */}
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-gray-600">
                                            <span className="flex items-center gap-1.5">
                                                <CalendarClock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                                {item.dateTime}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                                {item.duration} min
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <GraduationCap className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                                {item.className}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                                {item.host}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        {item.description && (
                                            <p className="text-[11px] text-gray-500 line-clamp-2 border-t border-gray-100 pt-2">
                                                {item.description}
                                            </p>
                                        )}

                                        {/* Join button */}
                                        <Button
                                            onClick={() => { if (item.url) window.open(item.url, "_blank"); }}
                                            disabled={!item.url}
                                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white h-8 text-[11px] font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 border-0 w-full mt-1 disabled:opacity-40"
                                        >
                                            <Video className="h-3.5 w-3.5" /> {t("join_class")}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Pagination ──────────────────────────────────────────── */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                        <div>
                            {t("showing")} {totalEntries > 0 ? startIndex + 1 : 0} {t("to")}{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} {t("of")} {totalEntries} {t("entries")}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={safePage === 1}
                                    onClick={() => fetchData(safePage - 1)}
                                    className="h-8 w-8 bg-white text-gray-400 rounded-[10px] border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none hover:shadow-sm transition-all active:scale-95"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => fetchData(page)}
                                        className={cn(
                                            "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold rounded-[10px]",
                                            safePage === page
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-500/20"
                                                : "bg-white text-gray-500 border border-gray-200 hover:shadow-sm active:scale-95"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    disabled={safePage === totalPages}
                                    onClick={() => fetchData(safePage + 1)}
                                    className="h-8 w-8 bg-white text-gray-400 rounded-[10px] border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none hover:shadow-sm transition-all active:scale-95"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
