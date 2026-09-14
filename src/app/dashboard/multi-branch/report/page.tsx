"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/components/providers/language-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { toLocaleNumber, cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    FileText,
    Wallet,
    Users,
    BarChart,
    Activity,
    Copy,
    FileSpreadsheet,
    Printer,
    PieChart,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface ReportItem {
    id: string;
    branch: string;
    name: string;
    invoice: string;
    head: string;
    date: string;
    amount: number;
}

const REPORT_TYPES = [
    { id: "daily", label: "daily_collection", icon: FileText },
    { id: "expense", label: "expenses", icon: Wallet },
    { id: "payroll", label: "staff_payroll", icon: Users },
    { id: "income", label: "income", icon: BarChart },
    { id: "userlog", label: "system_activity", icon: Activity },
];

const TABLE_COLS = 6;

function SkeletonRows({ rows = 5 }: { rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: TABLE_COLS }).map((_, j) => (
                        <TableCell key={j} className="py-3.5">
                            <div
                                className="h-3.5 rounded bg-gray-200/70 animate-pulse"
                                style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function ReportPage() {
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const { selectedCurrency } = useCurrency();
    const cur = selectedCurrency?.symbol || "৳";

    const [activeReport, setActiveReport] = useState("expense");
    const [searchTerm, setSearchTerm] = useState("");
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [grandTotal, setGrandTotal] = useState(0);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState("50");

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/multi-branch/reports", {
                params: { type: activeReport, search: searchTerm },
            });
            setReportData(response.data.data || []);
            setGrandTotal(response.data.grand_total || 0);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error fetching report data:", error);
            toast({
                title: t("error"),
                description: t("failed_to_fetch_data") || "Failed to fetch report data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [activeReport, searchTerm, t, toast]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const fmt = (n: number) =>
        n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleCopy = () => {
        const text = reportData
            .map((r) => `${r.branch}\t${r.name}\t${r.invoice}\t${r.head}\t${r.date}\t${r.amount}`)
            .join("\n");
        navigator.clipboard.writeText(text);
        toast({
            title: t("copied"),
            description: t("copied_to_clipboard") || "Data copied to clipboard",
        });
    };

    const handleExportCSV = () => {
        const rows = [
            ["Branch", "Name", "Invoice", "Head", "Date", "Amount"],
            ...reportData.map((r) => [r.branch, r.name, r.invoice, r.head, r.date, String(r.amount)]),
        ];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `multi_branch_${activeReport}_report.csv`;
        link.click();
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: t("excel") },
        { Icon: FileText, onClick: handleExportCSV, title: t("csv") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
    ];

    const activeType = REPORT_TYPES.find((r) => r.id === activeReport);
    const activeLabel = activeType ? t(activeType.label) : activeReport;

    // Client-side pagination calculations
    const numericPageSize = Number(pageSize) || 50;
    const totalRecords = reportData.length;
    const totalPages = Math.ceil(totalRecords / numericPageSize) || 1;
    const startIndex = (currentPage - 1) * numericPageSize;
    const endIndex = Math.min(startIndex + numericPageSize, totalRecords);

    const paginatedRecords = useMemo(() => {
        return reportData.slice(startIndex, endIndex);
    }, [reportData, startIndex, endIndex]);

    return (
        <div className="space-y-6">
            {/* Report Type Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {REPORT_TYPES.map((report) => {
                    const Icon = report.icon;
                    const isActive = activeReport === report.id;
                    return (
                        <button
                            key={report.id}
                            type="button"
                            onClick={() => {
                                setActiveReport(report.id);
                                setCurrentPage(1);
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-95",
                                isActive
                                    ? "border-indigo-200/80 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] shadow-sm ring-1 ring-[#6366F1]/30"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-2xs text-gray-600"
                            )}
                        >
                            <span
                                className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                    isActive
                                        ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                                        : "bg-gray-100 text-gray-500"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                            </span>
                            <span
                                className={cn(
                                    "text-xs font-bold tracking-tight text-center leading-tight line-clamp-1",
                                    isActive ? "text-gray-900" : "text-gray-600"
                                )}
                            >
                                {t(report.label)}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Report Card & Table */}
            <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
                {/* Header Banner - Flush with card border */}
                <div className="flex flex-row items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                        <PieChart className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-gray-800 tracking-tight leading-none">
                            {activeLabel} {t("report")}
                        </h2>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("cross_branch_aggregated_records")}
                        </p>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                fetchReport();
                            }}
                            className="flex items-center gap-2 w-full md:w-auto"
                        >
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                <Input
                                    placeholder={t("search_records")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/60"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                            >
                                <Search className="h-3.5 w-3.5" /> {t("search")}
                            </Button>
                        </form>

                        <div className="flex items-center gap-2 self-end md:self-auto">
                            {/* Limit Selector */}
                            <div className="flex items-center gap-1.5">
                                <Select
                                    value={pageSize}
                                    onValueChange={(val) => {
                                        setPageSize(val);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-20 text-xs border-gray-200 bg-white shadow-2xs rounded-lg px-2 font-medium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["10", "25", "50", "100"].map((n) => (
                                            <SelectItem key={n} value={n} className="text-xs">
                                                {toLocaleNumber(Number(n), langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Export Actions */}
                            <div className="flex items-center border border-gray-200/80 rounded-lg p-0.5 bg-gray-50/80 text-gray-500">
                                {toolbarActions.map((a, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        onClick={a.onClick}
                                        title={a.title}
                                        className="h-7 w-7 text-gray-500 hover:text-gray-800 hover:bg-white rounded-md transition-all shadow-none"
                                    >
                                        <a.Icon className="h-3.5 w-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar bg-white shadow-2xs">
                        <Table className="min-w-[820px]">
                            <TableHeader className="bg-gray-50/80 text-xs">
                                <TableRow className="border-b border-gray-100 whitespace-nowrap">
                                    <TableHead className="font-bold text-gray-600 py-3 pl-4">
                                        {t("branch")}
                                    </TableHead>
                                    <TableHead className="font-bold text-gray-600 py-3">
                                        {t("name")}
                                    </TableHead>
                                    <TableHead className="font-bold text-gray-600 py-3">
                                        {t("invoice")}
                                    </TableHead>
                                    <TableHead className="font-bold text-gray-600 py-3">
                                        {t("head")}
                                    </TableHead>
                                    <TableHead className="font-bold text-gray-600 py-3 text-center">
                                        {t("date")}
                                    </TableHead>
                                    <TableHead className="font-bold text-gray-600 py-3 pr-4 text-right">
                                        {t("amount")} ({cur})
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows />
                                ) : totalRecords === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={TABLE_COLS}
                                            className="py-12 text-center text-xs font-semibold text-gray-400"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <span>{t("no_records_found") || t("no_data")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedRecords.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            className="text-xs border-b border-gray-50 hover:bg-indigo-50/30 transition-colors whitespace-nowrap"
                                        >
                                            <TableCell className="py-3 pl-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                                                        {row.branch?.[0] || "B"}
                                                    </span>
                                                    <span className="font-semibold text-gray-800">
                                                        {row.branch}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-700 font-medium">
                                                {row.name}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="bg-gray-100/80 text-gray-700 px-2 py-0.5 rounded-md font-mono text-[11px] border border-gray-200/60">
                                                    {toLocaleNumber(row.invoice, langCode)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-600 font-medium">
                                                {row.head}
                                            </TableCell>
                                            <TableCell className="py-3 text-center text-gray-600 font-medium">
                                                {toLocaleNumber(row.date, langCode)}
                                            </TableCell>
                                            <TableCell className="py-3 pr-4 text-right font-bold text-gray-900">
                                                {cur}
                                                {toLocaleNumber(fmt(row.amount), langCode)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer / Pagination & Grand Total */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium pt-2 border-t border-gray-100">
                        {/* Summary Counter */}
                        <div>
                            {totalRecords > 0
                                ? t("showing_x_to_y_of_z", {
                                      from: toLocaleNumber(startIndex + 1, langCode),
                                      to: toLocaleNumber(endIndex, langCode),
                                      total: toLocaleNumber(totalRecords, langCode),
                                  })
                                : t("showing_x_entries", { count: toLocaleNumber(0, langCode) })}
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1 || loading}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1 cursor-pointer disabled:opacity-40"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" /> {t("previous")}
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => {
                                    const pageNum = i + 1;
                                    const isActive = currentPage === pageNum;
                                    // Show first, last, current, and adjacent pages if many pages
                                    if (
                                        totalPages > 7 &&
                                        pageNum !== 1 &&
                                        pageNum !== totalPages &&
                                        Math.abs(pageNum - currentPage) > 1
                                    ) {
                                        if (
                                            pageNum === 2 ||
                                            pageNum === totalPages - 1
                                        ) {
                                            return (
                                                <span
                                                    key={pageNum}
                                                    className="px-1 text-gray-400"
                                                >
                                                    ...
                                                </span>
                                            );
                                        }
                                        return null;
                                    }
                                    return (
                                        <Button
                                            key={pageNum}
                                            size="sm"
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={cn(
                                                "h-8 w-8 p-0 text-xs font-bold rounded-full transition-all cursor-pointer",
                                                isActive
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                            )}
                                        >
                                            {toLocaleNumber(pageNum, langCode)}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages || loading}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1 cursor-pointer disabled:opacity-40"
                            >
                                {t("next")} <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        {/* Grand Total Badge */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {t("grand_total")}:
                            </span>
                            <span
                                className={cn(
                                    "px-4 py-1.5 rounded-xl font-bold text-xs shadow-2xs",
                                    activeReport === "income"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                )}
                            >
                                {cur}
                                {toLocaleNumber(fmt(grandTotal), langCode)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
