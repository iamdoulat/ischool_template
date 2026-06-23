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
    ArrowUpDown, Copy, FileSpreadsheet,
    FileBox, Printer, Eye, CheckSquare, AlertCircle, Loader2,
    ClipboardList, CalendarClock, Clock, FileText, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";

interface OnlineExam {
    id: number;
    exam: string;
    isQuiz: boolean;
    dateFrom: string;
    dateTo: string;
    duration: string;
    totalAttempt: number;
    attempted: number;
    status: string;
    description: string;
    passingPercentage: number;
    isResultPublished: boolean;
}

export default function UserOnlineExamPage() {
    const { t } = useTranslation();
    const [exams, setExams] = useState<OnlineExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"upcoming" | "closed">("upcoming");
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchData = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const perPage = parseInt(itemsPerPage, 10) || 50;
            const response = await api.get("/user/online-exams", {
                params: {
                    page,
                    per_page: perPage,
                    status: activeTab,
                    search: searchTerm || undefined,
                },
            });
            const res = response.data?.data || response.data || {};
            const dataArr = Array.isArray(res) ? res : (res.data || []);
            setExams(dataArr);
            setTotalEntries(res.total || dataArr.length);
            setTotalPages(res.last_page || Math.ceil((res.total || dataArr.length) / perPage) || 1);
            setCurrentPage(res.current_page || page);
        } catch (error) {
            console.error("Error fetching online exams:", error);
            toast.error(t("failed_to_load_online_exams"));
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage, activeTab, searchTerm]);

    useEffect(() => {
        fetchData(1);
    }, [itemsPerPage, activeTab]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchData(1);
    };

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    // ── Status pill ──────────────────────────────────────────────────────────────
    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Available":  return "bg-[#4caf50] text-white";
            case "Exhausted":  return "bg-[#f89b29] text-white";
            case "Closed":     return "bg-[#9ca3af] text-white";
            default:           return "bg-[#6366f1] text-white";
        }
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold shadow-sm", getStatusStyle(status))}>
            {t(status.toLowerCase())}
        </span>
    );

    const QuizBadge = ({ isQuiz }: { isQuiz: boolean }) => (
        isQuiz ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckSquare className="h-3 w-3" /> {t("quiz")}
            </span>
        ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                <AlertCircle className="h-3 w-3" /> {t("exam")}
            </span>
        )
    );

    return (
        <div className="p-4 lg:p-6 space-y-5 min-h-screen font-sans text-xs animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <ClipboardList className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">{t("online_exam")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {totalEntries} {activeTab === "upcoming" ? t("upcoming") : t("closed")} exam{totalEntries === 1 ? "" : "s"}
                        </p>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex border-b border-gray-200 px-2">
                    {[
                        { key: "upcoming", label: t("upcoming_exams") },
                        { key: "closed", label: t("completed_exams") },
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => { setActiveTab(t.key as "upcoming" | "closed"); setCurrentPage(1); }}
                            className={cn(
                                "relative px-4 sm:px-6 py-3 text-[13px] font-semibold transition-colors",
                                activeTab === t.key ? "text-[#6366f1]" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {t.label}
                            {activeTab === t.key && (
                                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1]" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-4 lg:p-5 space-y-5">

                    {/* ── Toolbar ── */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={t("search")}
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
                                {[
                                    { Icon: Copy, tooltip: t("copy") },
                                    { Icon: FileSpreadsheet, tooltip: t("excel") },
                                    { Icon: FileBox, tooltip: t("pdf") },
                                    { Icon: Printer, tooltip: t("print") },
                                ].map(({ Icon, tooltip }, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        title={tooltip}
                                        className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-md border border-transparent hover:border-gray-200 transition-all"
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Desktop Table (lg+) ── */}
                    <div className="hidden lg:block rounded-lg border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-gray-50/80 border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4 h-auto">{t("exam")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">{t("type")}</TableHead>
                                    <TableHead className="py-3 px-4 h-auto">{t("date_from")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">{t("date_to")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">{t("duration")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-center">{t("total_attempt")}</TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-center">{t("attempted")}</TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-center">{t("status")}</TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-12">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t("loading")}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : exams.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={9} className="py-14 text-center">
                                            <div className="flex flex-col items-center text-gray-400">
                                                <ClipboardList className="h-10 w-10 opacity-30 mb-2" />
                                                <p className="text-[11px] font-bold uppercase tracking-widest">{t("no_exams_available")}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    exams.map((item, idx) => (
                                        <TableRow key={item.id || idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/30 transition-colors whitespace-nowrap text-gray-600">
                                            <TableCell className="py-3 px-4 font-semibold text-gray-800">{item.exam}</TableCell>
                                            <TableCell className="py-3 px-4"><QuizBadge isQuiz={item.isQuiz} /></TableCell>
                                            <TableCell className="py-3 px-4">{item.dateFrom}</TableCell>
                                            <TableCell className="py-3 px-4">{item.dateTo}</TableCell>
                                            <TableCell className="py-3 px-4">{item.duration}</TableCell>
                                            <TableCell className="py-3 px-4 text-center">{item.totalAttempt}</TableCell>
                                            <TableCell className="py-3 px-4 text-center">{item.attempted}</TableCell>
                                            <TableCell className="py-3 px-4 text-center"><StatusBadge status={item.status} /></TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <Button
                                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white h-7 px-2.5 rounded-lg text-[11px] font-bold shadow-sm transition-all active:scale-95 border-0"
                                                    title={t("view_exam")}
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-1" /> {t("view")}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* ── Mobile / tablet cards (<lg) ── */}
                    <div className="lg:hidden">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 text-gray-400 py-12">
                                <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
                            </div>
                        ) : exams.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <ClipboardList className="h-12 w-12 opacity-30 mb-3" />
                                <p className="font-bold uppercase text-[11px] tracking-widest">{t("no_exams_available")}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {exams.map((item, idx) => (
                                    <div key={item.id || idx} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-2.5">
                                        {/* Title + status */}
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-[13px] font-bold text-gray-800 leading-snug">{item.exam}</h3>
                                            <StatusBadge status={item.status} />
                                        </div>

                                        <QuizBadge isQuiz={item.isQuiz} />

                                        {/* Meta grid */}
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-gray-600 border-t border-gray-100 pt-2.5">
                                            <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{t("from")}: {item.dateFrom}</span>
                                            <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{t("to")}: {item.dateTo}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{item.duration}</span>
                                            <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{t("attempts")}: {item.totalAttempt}</span>
                                            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{t("attempted")}: {item.attempted}</span>
                                        </div>

                                        <Button
                                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white h-8 text-[11px] font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 border-0 w-full mt-1"
                                            title={t("view_exam")}
                                        >
                                            <Eye className="h-3.5 w-3.5" /> {t("view_exam")}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Pagination ── */}
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
