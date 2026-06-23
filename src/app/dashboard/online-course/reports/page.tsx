"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Search,
    ChevronDown,
    FileText,
    FileSearch,
    ArrowRight,
    BarChart3,
    Trophy,
    CheckCircle2,
    Users,
    Activity,
    ShoppingBag,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const reportTypes = [
    { id: "purchase", name: "Student Course Purchase Report", icon: FileText },
    { id: "sell_count", name: "Course Sell Count Report", icon: ShoppingBag },
    { id: "trending", name: "Course Trending Report", icon: Activity },
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

export default function OnlineCourseReportPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [selectedReport, setSelectedReport] = useState(reportTypes[0]);
    const [loading, setLoading] = useState(false);
    const [criteria, setCriteria] = useState<{
        search_types: any[],
        payment_types: any[],
        payment_status: any[],
        user_types: any[]
    }>({ search_types: [], payment_types: [], payment_status: [], user_types: [] });

    // Filter State
    const [filters, setFilters] = useState({
        search_type: "all",
        payment_type: "all",
        payment_status: "success",
        user_type: "all"
    });

    const [reports, setReports] = useState<ReportData[]>([]);

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/online-course/reports/criteria');
            setCriteria(response.data);
        } catch (error) {
            console.error("Failed to fetch course report criteria");
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await api.get('/online-course/reports', {
                params: {
                    report_type: selectedReport.id,
                    ...filters
                }
            });
            setReports(response.data.data || []);
        } catch (error) {
            toast({ title: t("error"), description: t("failed_to_fetch_analytical_report"), variant: "destructive" });
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
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
            {/* Title */}
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

            {/* Report Selection Grid */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {reportTypes.map((report) => (
                            <button
                                key={report.name}
                                onClick={() => setSelectedReport(report)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all text-left group",
                                    selectedReport.id === report.id
                                        ? "bg-muted text-primary shadow-sm"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <report.icon className={cn(
                                    "h-4 w-4 transition-colors",
                                    selectedReport.id === report.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                <span className="truncate">{getTranslatedReportName(report)}</span>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Filter Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight">{getTranslatedReportName(selectedReport)}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <FilterSelect
                            label={t("search_type")}
                            required
                            options={criteria.search_types}
                            value={filters.search_type}
                            onChange={(val) => setFilters({...filters, search_type: val})}
                        />
                        <FilterSelect
                            label={t("payment_type")}
                            required
                            options={criteria.payment_types}
                            value={filters.payment_type}
                            onChange={(val) => setFilters({...filters, payment_type: val})}
                        />
                        <FilterSelect
                            label={t("payment_status")}
                            options={criteria.payment_status}
                            value={filters.payment_status}
                            onChange={(val) => setFilters({...filters, payment_status: val})}
                        />
                        <FilterSelect
                            label={t("users_type")}
                            options={criteria.user_types}
                            value={filters.user_type}
                            onChange={(val) => setFilters({...filters, user_type: val})}
                        />

                        <div className="lg:col-start-4 flex justify-end">
                            <Button
                                onClick={fetchReports}
                                disabled={loading}
                                className="h-10 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all group"
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto relative">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-y border-muted/50">
                                <tr>
                                    <th className="px-6 py-4">{t("student_guest")}</th>
                                    <th className="px-6 py-4 text-center">{t("date")}</th>
                                    <th className="px-6 py-4">{t("course")}</th>
                                    <th className="px-6 py-4">{t("course_provider")}</th>
                                    <th className="px-6 py-4 text-center">{t("payment_type")}</th>
                                    <th className="px-6 py-4 text-center">{t("payment_method")}</th>
                                    <th className="px-6 py-4 text-right">{t("price_with_symbol", { symbol: "$" })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("executing_course_analytical_audit")}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : reports.length === 0 ? (
                                    <tr className="group transition-colors">
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <p className="text-destructive/60 font-medium text-xs">{t("no_data_available_in_table")}</p>

                                                <div className="relative group/folder cursor-help mb-4">
                                                    <div className="absolute -inset-4 bg-primary/5 rounded-full scale-0 group-hover/folder:scale-100 transition-transform duration-500" />
                                                    <div className="relative p-6 bg-card rounded-lg shadow-sm border border-muted/50">
                                                        <FileSearch className="h-16 w-16 text-muted-foreground/20 group-hover/folder:text-primary/40 transition-colors duration-500" />
                                                    </div>
                                                </div>

                                                <button onClick={fetchReports} className="flex items-center gap-2 group/btn px-4 py-2 hover:bg-primary/5 rounded-full transition-all">
                                                    <ArrowRight className="h-4 w-4 text-emerald-500 group-hover/btn:translate-x-1 transition-transform" />
                                                    <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">{t("add_new_record_or_search_different_criteria")}</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    reports.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/30 border-b border-muted/10 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                <div className="flex flex-col">
                                                    <span>{item.user_name}</span>
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-tighter">{item.user_type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center tabular-nums text-slate-500">{item.date}</td>
                                            <td className="px-6 py-4 font-bold text-slate-700">{item.course}</td>
                                            <td className="px-6 py-4 text-slate-500">{item.provider}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                                    item.payment_type === 'Online' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                                                )}>
                                                    {item.payment_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-500">{item.payment_method}</td>
                                            <td className="px-6 py-4 text-right tabular-nums font-black text-slate-800">${item.price.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-6 py-4 bg-muted/10 border-t border-muted/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            {t("showing_x_to_y_of_z", { from: reports.length > 0 ? 1 : 0, to: reports.length, total: reports.length })}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all" disabled>
                                <ChevronDown className="h-4 w-4 rotate-90" />
                            </Button>
                            <Button className="h-8 w-8 rounded-lg border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                                {reports.length > 0 ? 1 : 0}
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all" disabled>
                                <ChevronDown className="h-4 w-4 -rotate-90" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function FilterSelect({ label, required, value, onChange, options }: { label: string, required?: boolean, value: string, onChange: (val: string) => void, options: any[] }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer font-bold"
                >
                    {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
        </div>
    );
}
