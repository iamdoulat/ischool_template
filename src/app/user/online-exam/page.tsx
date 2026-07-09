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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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

const stripHtml = (html: string) => {
    if (!html) return "";
    return html
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .replace(/&nbsp;/g, ' ') // Strip non-breaking spaces
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();
};

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

    // Exam Attempt / Taking states
    const [selectedExam, setSelectedExam] = useState<OnlineExam | null>(null);
    const [examDetails, setExamDetails] = useState<any>(null);
    const [isTakeExamDialogOpen, setIsTakeExamDialogOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [startedExam, setStartedExam] = useState(false);
    const [startedAt, setStartedAt] = useState<string | null>(null);
    const [answers, setAnswers] = useState<{ [questionId: number]: any }>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [submittingAttempt, setSubmittingAttempt] = useState(false);

    const handleViewExam = async (exam: OnlineExam) => {
        setSelectedExam(exam);
        setIsTakeExamDialogOpen(true);
        setLoadingDetails(true);
        setStartedExam(false);
        setAnswers({});
        
        try {
            const res = await api.get(`/user/online-exams/${exam.id}`);
            if (res.data && res.data.success) {
                setExamDetails(res.data.data);
            } else {
                toast.error(res.data?.message || t("failed_to_load_exam_details"));
            }
        } catch (error) {
            console.error("Error loading exam details:", error);
            toast.error(t("failed_to_load_exam_details"));
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleStartExam = () => {
        if (!examDetails) return;
        setStartedExam(true);
        setStartedAt(new Date().toISOString().slice(0, 19).replace('T', ' '));
        
        let durationSec = 3600;
        if (examDetails.duration) {
            const parts = examDetails.duration.split(":");
            if (parts.length === 3) {
                durationSec = (parseInt(parts[0], 10) * 3600) + (parseInt(parts[1], 10) * 60) + parseInt(parts[2], 10);
            } else if (parts.length === 2) {
                durationSec = (parseInt(parts[0], 10) * 3600) + (parseInt(parts[1], 10) * 60);
            } else {
                const num = parseInt(examDetails.duration, 10);
                if (!isNaN(num)) {
                    durationSec = num * 60;
                }
            }
        }
        setTimeLeft(durationSec);
    };

    const handleSubmitExam = useCallback(async () => {
        if (!selectedExam || !examDetails) return;
        setSubmittingAttempt(true);
        
        const formattedAnswers = Object.keys(answers).map((qId) => ({
            question_id: parseInt(qId, 10),
            answer: answers[parseInt(qId, 10)],
        }));

        try {
            const res = await api.post(`/user/online-exams/${selectedExam.id}/submit`, {
                started_at: startedAt,
                answers: formattedAnswers,
            });

            if (res.data && res.data.success) {
                toast.success(t("exam_submitted_successfully"));
                setIsTakeExamDialogOpen(false);
                setStartedExam(false);
                fetchData(currentPage);
            } else {
                toast.error(res.data?.message || t("failed_to_submit_exam"));
            }
        } catch (error) {
            console.error("Error submitting exam:", error);
            toast.error(t("failed_to_submit_exam"));
        } finally {
            setSubmittingAttempt(false);
        }
    }, [selectedExam, examDetails, answers, startedAt, currentPage, t]);

    useEffect(() => {
        if (!startedExam || timeLeft <= 0) {
            if (startedExam && timeLeft === 0) {
                handleSubmitExam();
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [startedExam, timeLeft, handleSubmitExam]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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
            case "Available":  return "bg-emerald-500 text-white";
            case "Submitted":  return "bg-blue-500 text-white";
            case "Passed":     return "bg-emerald-600 text-white";
            case "Failed":     return "bg-rose-600 text-white";
            case "Closed":     return "bg-gray-400 text-white";
            default:           return "bg-indigo-500 text-white";
        }
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm", getStatusStyle(status))}>
            {status}
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
                                                    onClick={() => handleViewExam(item)}
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
                                            onClick={() => handleViewExam(item)}
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

            {/* Take / View Exam Dialog */}
            <Dialog open={isTakeExamDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    if (startedExam && !confirm("Are you sure you want to leave the exam? Your progress will be lost.")) return;
                    setIsTakeExamDialogOpen(false);
                    setStartedExam(false);
                }
            }}>
                <DialogContent className="w-full sm:max-w-2xl md:max-w-3xl rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white">
                    <DialogTitle className="sr-only">{examDetails?.title || "Online Exam Details"}</DialogTitle>
                    <DialogDescription className="sr-only">Student taking or viewing details of the online exam.</DialogDescription>
                    {loadingDetails ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2.5">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                            <p className="text-xs font-bold uppercase tracking-wider">{t("loading_exam_details")}</p>
                        </div>
                    ) : examDetails ? (
                        <>
                            {/* Dialog Header */}
                            <DialogHeader className="p-6 bg-gradient-to-r from-[#F7A148] to-[#7778EC] text-white relative">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                            <ClipboardList className="h-5 w-5" /> {examDetails.title}
                                        </DialogTitle>
                                        <DialogDescription className="text-indigo-50/85 text-[11px] font-medium leading-none">
                                            {examDetails.is_quiz ? t("quiz_mode") : t("exam_mode")}
                                        </DialogDescription>
                                    </div>
                                    {startedExam && (
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-white shadow-inner transition-colors",
                                            timeLeft < 300 ? "text-red-600 animate-pulse bg-red-55 animate-bounce" : "text-indigo-600"
                                        )}>
                                            <Clock className="h-4 w-4" />
                                            <span>{formatTime(timeLeft)}</span>
                                        </div>
                                    )}
                                </div>
                            </DialogHeader>

                            {/* Main Content Area */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto bg-gray-50/50 space-y-6">
                                {!startedExam ? (
                                    // Instructions View
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center space-y-1">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase block">{t("duration")}</span>
                                                <span className="text-xs font-black text-gray-800">{examDetails.duration || "N/A"}</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center space-y-1">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase block">{t("total_questions")}</span>
                                                <span className="text-xs font-black text-gray-800">{examDetails.questions?.length || 0}</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center space-y-1">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase block">{t("passing_score")}</span>
                                                <span className="text-xs font-black text-gray-800">{examDetails.passing_percentage}%</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center space-y-1">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase block">{t("attempts_left")}</span>
                                                <span className="text-xs font-black text-gray-800">
                                                    {examDetails.attempt > 0 ? (examDetails.attempt - examDetails.attempted) : "Unlimited"}
                                                </span>
                                            </div>
                                        </div>

                                         {examDetails.description && (
                                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-2">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">{t("exam_instructions")}</h3>
                                                <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{examDetails.description}</p>
                                            </div>
                                        )}

                                        {examDetails.attempts && examDetails.attempts.length > 0 && (
                                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Your Attempts History</h3>
                                                <div className="space-y-3">
                                                    {examDetails.attempts.map((att: any, attIdx: number) => {
                                                        const scorePercent = att.total_marks > 0 ? (att.earned_marks / att.total_marks) * 100 : 0;
                                                        const isPassed = scorePercent >= (examDetails.passing_percentage || 33);
                                                        return (
                                                            <div key={att.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50/50 border border-gray-50 text-xs">
                                                                <div className="space-y-1">
                                                                    <p className="font-bold text-gray-700">Attempt #{attIdx + 1}</p>
                                                                    <p className="text-[10px] text-gray-400">Date: {new Date(att.completed_at).toLocaleString()}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-right">
                                                                        <span className="font-black text-gray-800">{att.earned_marks}</span>
                                                                        <span className="text-gray-400"> / {att.total_marks} Marks</span>
                                                                    </div>
                                                                    {examDetails.is_result_published ? (
                                                                        <span className={cn(
                                                                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-white",
                                                                            isPassed ? "bg-emerald-500" : "bg-rose-500"
                                                                        )}>
                                                                            {isPassed ? "Passed" : "Failed"}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white">
                                                                            Submitted
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {examDetails.is_closed || examDetails.is_exhausted ? (
                                            <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl flex gap-3 text-amber-800">
                                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                                <div className="space-y-1 text-xs">
                                                    <p className="font-bold">{t("exam_unavailable")}</p>
                                                    <p className="opacity-90">
                                                        {examDetails.is_exhausted 
                                                            ? t("you_have_exhausted_all_attempts_for_this_exam")
                                                            : t("this_exam_is_currently_closed")
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-indigo-50 border border-indigo-200/50 p-4 rounded-xl flex gap-3 text-indigo-900">
                                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                                <div className="space-y-1 text-xs">
                                                    <p className="font-bold">{t("ready_to_start")}</p>
                                                    <p className="opacity-90 leading-normal">
                                                        Once you click "Start Exam", the timer will begin. Closing this window or disconnecting will result in automatic submission.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Exam Taking View (Questions List)
                                    <div className="space-y-6">
                                        {examDetails.questions?.map((q: any, index: number) => {
                                            const isSingleChoice = q.question_type === "Single Choice" || q.question_type === "True/False";
                                            const isMultipleChoice = q.question_type === "Multiple Choice";
                                            const isDescriptive = q.question_type === "Descriptive";
                                            
                                            // Options parsing
                                            let opts = [];
                                            try {
                                                opts = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
                                            } catch (e) {
                                                opts = [];
                                            }

                                            return (
                                                <div key={q.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                                                    <div className="flex justify-between items-start border-b border-gray-50 pb-2">
                                                        <span className="text-xs font-bold text-gray-800">
                                                            Question {index + 1}
                                                        </span>
                                                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                                            {q.marks} Marks
                                                        </span>
                                                    </div>

                                                    <p className="text-xs font-bold text-gray-700 leading-relaxed">
                                                        {stripHtml(q.question)}
                                                    </p>

                                                    {/* Options or Answer Input */}
                                                    {isSingleChoice && opts.length > 0 && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                                                            {opts.map((opt: string, optIdx: number) => (
                                                                <label key={optIdx} className={cn(
                                                                    "flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all hover:bg-gray-50",
                                                                    answers[q.id] === opt 
                                                                        ? "border-indigo-500 bg-indigo-50/20 font-bold text-indigo-700" 
                                                                        : "border-gray-100"
                                                                )}>
                                                                    <input 
                                                                        type="radio" 
                                                                        name={`q-${q.id}`} 
                                                                        value={opt} 
                                                                        checked={answers[q.id] === opt}
                                                                        onChange={() => setAnswers({...answers, [q.id]: opt})}
                                                                        className="accent-indigo-600 animate-none cursor-pointer"
                                                                    />
                                                                    <span>{opt}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {isMultipleChoice && opts.length > 0 && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                                                            {opts.map((opt: string, optIdx: number) => {
                                                                const currentAnswers = answers[q.id] || [];
                                                                const isChecked = currentAnswers.includes(opt);
                                                                
                                                                return (
                                                                    <label key={optIdx} className={cn(
                                                                        "flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all hover:bg-gray-50",
                                                                        isChecked 
                                                                            ? "border-indigo-500 bg-indigo-50/20 font-bold text-indigo-700" 
                                                                            : "border-gray-100"
                                                                    )}>
                                                                        <input 
                                                                            type="checkbox" 
                                                                            value={opt} 
                                                                            checked={isChecked}
                                                                            onChange={(e) => {
                                                                                let updated = [...currentAnswers];
                                                                                if (e.target.checked) {
                                                                                    updated.push(opt);
                                                                                } else {
                                                                                    updated = updated.filter(val => val !== opt);
                                                                                }
                                                                                setAnswers({...answers, [q.id]: updated});
                                                                            }}
                                                                            className="accent-indigo-600 rounded cursor-pointer"
                                                                        />
                                                                        <span>{opt}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {isDescriptive && (
                                                        <div className="pt-2">
                                                            <textarea
                                                                value={answers[q.id] || ""}
                                                                onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                                                                placeholder="Type your answer here..."
                                                                rows={4}
                                                                className="w-full text-xs p-3 rounded-lg border border-gray-200 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-gray-50/30"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <DialogFooter className="p-6 bg-gray-50/50 flex justify-end gap-3 border-t border-gray-100">
                                {!startedExam ? (
                                    <>
                                        <Button 
                                            onClick={() => setIsTakeExamDialogOpen(false)} 
                                            variant="outline" 
                                            className="h-10 px-6 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-200"
                                        >
                                            {t("close")}
                                        </Button>
                                        {!examDetails.is_closed && !examDetails.is_exhausted && (
                                            <Button 
                                                onClick={handleStartExam} 
                                                className="btn-gradient text-white h-10 px-8 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-orange-200/50"
                                            >
                                                {t("start_exam")}
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Button 
                                            onClick={() => {
                                                if (confirm("Are you sure you want to cancel the exam? Your progress will be lost.")) {
                                                    setIsTakeExamDialogOpen(false);
                                                    setStartedExam(false);
                                                }
                                            }} 
                                            variant="outline" 
                                            className="h-10 px-6 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-200"
                                        >
                                            {t("cancel")}
                                        </Button>
                                        <Button 
                                            onClick={handleSubmitExam} 
                                            disabled={submittingAttempt}
                                            className="btn-gradient text-white h-10 px-10 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-orange-200/50"
                                        >
                                            {submittingAttempt ? (
                                                <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> {t("submitting")}</span>
                                            ) : (
                                                t("submit_exam")
                                            )}
                                        </Button>
                                    </>
                                )}
                            </DialogFooter>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}
