"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    FileText,
    FileSearch,
    ArrowRight,
    BarChart3,
    Trophy,
    CheckCircle2,
    ShoppingBag,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    cn,
    toLocaleNumber,
    translateRoleName,
} from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";

const activeGradient = "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:from-[#f59e0b] hover:to-[#818cf8]";

const reportTypes = [
    { id: "purchase", name: "Student Course Purchase Report", icon: FileText },
    { id: "sell_count", name: "Course Sell Count Report", icon: ShoppingBag },
    { id: "trending", name: "Course Trending Report", icon: BarChart3 },
    { id: "complete", name: "Course Complete Report", icon: CheckCircle2 },
    { id: "assignment", name: "Course Assignment Report", icon: FileText },
    { id: "exam_result", name: "Course Exam Result Report", icon: Trophy },
    { id: "exam_attempt", name: "Course Exam Attempt Report", icon: BarChart3 },
];

interface ReportData {
    id: number;
    user_name: string;
    user_type: string;
    date: string;
    course: string;
    provider: string;
    payment_type: string;
    payment_method: string;
    price: number;
}

interface OptionItem {
    id: string;
    label: string;
}

export default function OnlineCourseReportPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const { symbol } = useCurrencyFormatter();

    const formatPrice = (amount: number | string) => {
        const val = typeof amount === "string" ? parseFloat(amount) : amount;
        if (isNaN(val)) return `${symbol}${toLocaleNumber("0.00", shortCode)}`;
        return `${symbol}${toLocaleNumber(val.toFixed(2), shortCode)}`;
    };

    const [selectedReport, setSelectedReport] = useState(reportTypes[0]);
    const [loading, setLoading] = useState(false);
    const [criteria, setCriteria] = useState<{
        search_types: OptionItem[];
        payment_types: OptionItem[];
        payment_status: OptionItem[];
        user_types: OptionItem[];
    }>({ search_types: [], payment_types: [], payment_status: [], user_types: [] });

    const [filters, setFilters] = useState({
        search_type: "all",
        payment_type: "all",
        payment_status: "success",
        user_type: "all"
    });

    const [reports, setReports] = useState<ReportData[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);
    const [perPage] = useState(20);

    useEffect(() => {
        fetchCriteria();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchReports(1), 300);
        return () => clearTimeout(timer);
    }, [selectedReport, filters]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get("/online-course/reports/criteria");
            const data = response.data?.data || response.data || {};
            setCriteria({
                search_types: data.search_types || [],
                payment_types: data.payment_types || [],
                payment_status: data.payment_status || [],
                user_types: data.user_types || [],
            });
        } catch (error) {
            console.error("Failed to fetch criteria:", error);
        }
    };

    const fetchReports = async (page = currentPage) => {
        setLoading(true);
        try {
            const response = await api.get("/online-course/reports", {
                params: {
                    report_type: selectedReport.id,
                    page,
                    per_page: perPage,
                    ...filters
                }
            });
            const d = response.data;
            if (d.data) {
                const list = Array.isArray(d.data) ? d.data : d.data.data || [];
                setReports(list);
                setTotal(d.total || d.meta?.total || 0);
                setLastPage(d.last_page || d.meta?.last_page || 1);
                setCurrentPage(d.current_page || d.meta?.current_page || 1);
                setFrom(d.from || d.meta?.from || 0);
                setTo(d.to || d.meta?.to || 0);
            } else {
                setReports([]);
                setTotal(0);
            }
        } catch {
            toast.error(t("failed_to_fetch_analytical_report"));
        } finally {
            setLoading(false);
        }
    };

    const getTranslatedReportName = (report: typeof reportTypes[number]) => {
        const keyMap: Record<string, string> = {
            "Student Course Purchase Report": t("student_course_purchase_report"),
            "Course Sell Count Report": t("course_sell_count_report"),
            "Course Trending Report": t("course_trending_report"),
            "Course Complete Report": t("course_complete_report"),
            "Course Assignment Report": t("course_assignment_report"),
            "Course Exam Result Report": t("course_exam_result_report"),
            "Course Exam Attempt Report": t("course_exam_attempt_report"),
        };
        return keyMap[report.name] || report.name;
    };

    const translateOption = (id: string, label: string) => {
        const lower = (id || label || "").toLowerCase().trim();
        if (shortCode === "bn") {
            const bnMap: Record<string, string> = {
                all: "সকল",
                today: "আজ",
                this_week: "এই সপ্তাহ",
                this_month: "এই মাস",
                this_year: "এই বছর",
                online: "অনলাইন",
                offline: "অফলাইন",
                success: "সফল",
                pending: "মুলতুবি",
                failed: "ব্যর্থ",
                student: "শিক্ষার্থী",
                guest: "অতিথি",
            };
            if (bnMap[lower]) return bnMap[lower];
        }
        if (shortCode === "ar") {
            const arMap: Record<string, string> = {
                all: "الكل",
                today: "اليوم",
                this_week: "هذا الأسبوع",
                this_month: "هذا الشهر",
                this_year: "هذا العام",
                online: "عبر الإنترنت",
                offline: "غير متصل",
                success: "ناجح",
                pending: "معلق",
                failed: "فاشل",
                student: "طالب",
                guest: "زائر",
            };
            if (arMap[lower]) return arMap[lower];
        }
        if (shortCode === "hi") {
            const hiMap: Record<string, string> = {
                all: "सभी",
                today: "आज",
                this_week: "इस सप्ताह",
                this_month: "इस महीने",
                this_year: "इस वर्ष",
                online: "ऑनलाइन",
                offline: "ऑफ़लाइन",
                success: "सफल",
                pending: "लंबित",
                failed: "विफल",
                student: "छात्र",
                guest: "अतिथि",
            };
            if (hiMap[lower]) return hiMap[lower];
        }
        return label || id;
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <BarChart3 className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">{t("online_course_report")}</h1>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{t("analyze_course_sales_and_performance")}</p>
                    </div>
                </div>
            </div>

            {/* Report Selection Card (Fixed font visibility and crisp contrast) */}
            <div className="bg-white dark:bg-card/50 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 border-b border-gray-100 dark:border-zinc-800">
                    <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-tight">{t("select_report_type")}</p>
                </div>
                <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                        {reportTypes.map((report) => {
                            const isSelected = selectedReport.id === report.id;
                            return (
                                <button
                                    key={report.id}
                                    type="button"
                                    onClick={() => setSelectedReport(report)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border",
                                        isSelected
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-500/20 border-transparent hover:from-[#f59e0b] hover:to-[#818cf8]"
                                            : "bg-white dark:bg-card/60 text-gray-700 dark:text-gray-300 hover:bg-indigo-50/50 dark:hover:bg-zinc-800/80 border-gray-200/80 dark:border-zinc-800 hover:border-indigo-200"
                                    )}
                                >
                                    <report.icon className={cn(
                                        "h-4 w-4 shrink-0 transition-colors",
                                        isSelected ? "text-white" : "text-indigo-500 dark:text-indigo-400"
                                    )} />
                                    <span className="truncate">{getTranslatedReportName(report)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden p-0 gap-0 bg-white dark:bg-card/50">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 border-b border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Search className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-none">{getTranslatedReportName(selectedReport)}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search Type */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{t("search_type")}</Label>
                            <Select value={filters.search_type} onValueChange={(v) => setFilters({ ...filters, search_type: v })}>
                                <SelectTrigger className="h-9 text-xs border-gray-200 dark:border-zinc-700 rounded-lg">
                                    <SelectValue placeholder={translateOption(filters.search_type, filters.search_type)}>
                                        {translateOption(filters.search_type, filters.search_type)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {criteria.search_types.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id}>{translateOption(opt.id, opt.label)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Payment Type */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{t("payment_type")}</Label>
                            <Select value={filters.payment_type} onValueChange={(v) => setFilters({ ...filters, payment_type: v })}>
                                <SelectTrigger className="h-9 text-xs border-gray-200 dark:border-zinc-700 rounded-lg">
                                    <SelectValue placeholder={translateOption(filters.payment_type, filters.payment_type)}>
                                        {translateOption(filters.payment_type, filters.payment_type)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {criteria.payment_types.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id}>{translateOption(opt.id, opt.label)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Payment Status */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{t("payment_status")}</Label>
                            <Select value={filters.payment_status} onValueChange={(v) => setFilters({ ...filters, payment_status: v })}>
                                <SelectTrigger className="h-9 text-xs border-gray-200 dark:border-zinc-700 rounded-lg">
                                    <SelectValue placeholder={translateOption(filters.payment_status, filters.payment_status)}>
                                        {translateOption(filters.payment_status, filters.payment_status)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {criteria.payment_status.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id}>{translateOption(opt.id, opt.label)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Users Type */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{t("users_type")}</Label>
                            <Select value={filters.user_type} onValueChange={(v) => setFilters({ ...filters, user_type: v })}>
                                <SelectTrigger className="h-9 text-xs border-gray-200 dark:border-zinc-700 rounded-lg">
                                    <SelectValue placeholder={translateOption(filters.user_type, filters.user_type)}>
                                        {translateOption(filters.user_type, filters.user_type)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {criteria.user_types.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id}>{translateOption(opt.id, opt.label)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={() => fetchReports(1)}
                            disabled={loading}
                            className={cn("h-9 px-6 text-xs font-bold rounded-lg shadow-md cursor-pointer transition-all active:scale-95 border-0", activeGradient)}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                            {t("search")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            <div className="bg-white dark:bg-card/50 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/70 dark:bg-zinc-800/80 text-[11px] uppercase">
                            <TableRow className="hover:bg-transparent border-gray-100 dark:border-zinc-800">
                                <TableHead className="font-bold text-gray-700 dark:text-gray-300 py-3">{t("student_guest")}</TableHead>
                                <TableHead className="font-bold text-gray-700 dark:text-gray-300 py-3 text-center">{t("date")}</TableHead>
                                <TableHead className="font-bold text-gray-700 dark:text-gray-300 py-3">{t("course")}</TableHead>
                                <TableHead className="font-bold text-gray-700 dark:text-gray-300 py-3">{t("course_provider")}</TableHead>
                                <TableHead className="font-bold text-gray-700 dark:text-gray-300 py-3 text-center">{t("payment_type")}</TableHead>
                                <TableHead className="font-bold text-gray-700 dark:text-gray-300 py-3 text-center">{t("payment_method")}</TableHead>
                                <TableHead className="font-bold text-gray-700 dark:text-gray-300 py-3 text-right">{t("price")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t("executing_course_analytical_audit")}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <FileSearch className="h-10 w-10 text-gray-300" />
                                            <p className="text-xs font-medium text-gray-400">{t("no_data_available_in_table")}</p>
                                            <button onClick={() => fetchReports(1)} className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer">
                                                <ArrowRight className="h-3.5 w-3.5" />
                                                {t("add_new_record_or_search_different_criteria")}
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((item) => (
                                    <TableRow key={item.id} className="text-[13px] hover:bg-indigo-50/40 dark:hover:bg-zinc-800/50 transition-all border-b last:border-0 border-gray-50 dark:border-zinc-800/60">
                                        <TableCell className="py-3.5 align-middle">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{item.user_name}</span>
                                                <span className="text-[10px] font-semibold text-gray-400 uppercase">{translateOption(item.user_type, item.user_type)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3.5 align-middle text-center text-gray-600 dark:text-gray-400">
                                            {item.date ? toLocaleNumber(item.date, shortCode) : "-"}
                                        </TableCell>
                                        <TableCell className="py-3.5 align-middle font-medium text-gray-800 dark:text-gray-200">{item.course}</TableCell>
                                        <TableCell className="py-3.5 align-middle text-gray-600 dark:text-gray-400">
                                            {translateRoleName(item.provider, shortCode) || item.provider}
                                        </TableCell>
                                        <TableCell className="py-3.5 align-middle text-center">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                                (item.payment_type || "").toLowerCase() === "online" 
                                                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800" 
                                                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800"
                                            )}>
                                                {translateOption(item.payment_type, item.payment_type)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3.5 align-middle text-center text-gray-600 dark:text-gray-400">
                                            {translateOption(item.payment_method, item.payment_method)}
                                        </TableCell>
                                        <TableCell className="py-3.5 align-middle text-right font-semibold text-gray-800 dark:text-gray-200">{formatPrice(item.price)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium px-4 py-3 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5">
                        <span>
                            {t("showing_x_to_y_of_z", {
                                from: toLocaleNumber(from, shortCode),
                                to: toLocaleNumber(to, shortCode),
                                total: toLocaleNumber(total, shortCode),
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border-gray-200 dark:border-zinc-700"
                            disabled={currentPage === 1}
                            onClick={() => fetchReports(currentPage - 1)}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                size="sm"
                                className={cn(
                                    "h-7 w-7 p-0 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer",
                                    currentPage === page 
                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md shadow-indigo-500/25 border-0" 
                                        : "bg-white dark:bg-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                )}
                                onClick={() => fetchReports(page)}
                            >
                                {toLocaleNumber(page, shortCode)}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border-gray-200 dark:border-zinc-700"
                            disabled={currentPage === lastPage}
                            onClick={() => fetchReports(currentPage + 1)}
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}