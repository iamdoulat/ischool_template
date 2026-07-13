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
    RefreshCw,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";

const activeGradient = "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:from-[#FF9800] hover:to-[#6366F1]";

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
    const { t } = useTranslation();
    const { symbol, formatCurrency } = useCurrencyFormatter();
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
    const [perPage, setPerPage] = useState(20);

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

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <BarChart3 className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("online_course_report")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("analyze_course_sales_and_performance")}</p>
                    </div>
                </div>
            </div>

            {/* Report Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("select_report_type")}</p>
                </div>
                <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {reportTypes.map((report) => (
                            <button
                                key={report.name}
                                onClick={() => setSelectedReport(report)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all text-left group",
                                    selectedReport.id === report.id
                                        ? "bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] text-gray-800 shadow-sm border border-indigo-100"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                )}
                            >
                                <report.icon className={cn(
                                    "h-4 w-4 shrink-0 transition-colors",
                                    selectedReport.id === report.id ? "text-[#6366F1]" : "text-gray-400 group-hover:text-gray-600"
                                )} />
                                <span className="truncate">{getTranslatedReportName(report)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="border-gray-100 shadow-sm overflow-hidden p-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Search className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-sm font-bold text-gray-800 leading-none">{getTranslatedReportName(selectedReport)}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("search_type")}</Label>
                            <Select value={filters.search_type} onValueChange={(v) => setFilters({ ...filters, search_type: v })}>
                                <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {criteria.search_types.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("payment_type")}</Label>
                            <Select value={filters.payment_type} onValueChange={(v) => setFilters({ ...filters, payment_type: v })}>
                                <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {criteria.payment_types.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("payment_status")}</Label>
                            <Select value={filters.payment_status} onValueChange={(v) => setFilters({ ...filters, payment_status: v })}>
                                <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {criteria.payment_status.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("users_type")}</Label>
                            <Select value={filters.user_type} onValueChange={(v) => setFilters({ ...filters, user_type: v })}>
                                <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {criteria.user_types.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button
                            onClick={() => fetchReports(1)}
                            disabled={loading}
                            className={cn("h-9 px-6 text-xs font-bold rounded-full shadow-md", activeGradient)}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                            {t("search")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50 text-[11px] uppercase">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="font-bold text-gray-700 py-3">{t("student_guest")}</TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 text-center">{t("date")}</TableHead>
                                <TableHead className="font-bold text-gray-700 py-3">{t("course")}</TableHead>
                                <TableHead className="font-bold text-gray-700 py-3">{t("course_provider")}</TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 text-center">{t("payment_type")}</TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 text-center">{t("payment_method")}</TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 text-right">{t("price")}</TableHead>
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
                                            <button onClick={() => fetchReports(1)} className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                                                <ArrowRight className="h-3.5 w-3.5" />
                                                {t("add_new_record_or_search_different_criteria")}
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((item) => (
                                    <TableRow key={item.id} className="text-[13px] hover:bg-indigo-50/40 transition-all border-b last:border-0 border-gray-50">
                                        <TableCell className="py-3.5 align-middle">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800">{item.user_name}</span>
                                                <span className="text-[10px] font-semibold text-gray-400 uppercase">{item.user_type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3.5 align-middle text-center text-gray-600">{item.date}</TableCell>
                                        <TableCell className="py-3.5 align-middle font-medium text-gray-800">{item.course}</TableCell>
                                        <TableCell className="py-3.5 align-middle text-gray-600">{item.provider}</TableCell>
                                        <TableCell className="py-3.5 align-middle text-center">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                                item.payment_type === "Online" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                                            )}>
                                                {item.payment_type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3.5 align-middle text-center text-gray-600">{item.payment_method}</TableCell>
                                        <TableCell className="py-3.5 align-middle text-right font-semibold text-gray-800">{formatCurrency(item.price)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-4 py-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                        <span>{t("showing_x_to_y_of_z", { from, to, total })}</span>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border-gray-200"
                            disabled={currentPage === 1}
                            onClick={() => fetchReports(currentPage - 1)}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                    "h-7 w-7 p-0 border-gray-200 text-[11px]",
                                    currentPage === page ? activeGradient : "hover:bg-indigo-50 hover:text-indigo-600"
                                )}
                                onClick={() => fetchReports(page)}
                            >
                                {page}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border-gray-200"
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