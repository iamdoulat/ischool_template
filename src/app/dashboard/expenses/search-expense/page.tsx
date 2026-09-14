"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search, Loader2, Filter, ListChecks, Download, Copy, FileSpreadsheet, FileText, FileCode, Printer, Columns } from "lucide-react";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useTranslation } from "@/hooks/use-translation";
import api from "@/lib/api";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { cn, formatDate, toLocaleNumber } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas-pro";
import { useSettings } from "@/components/providers/settings-provider";
import { sanitizeHtml } from "@/lib/sanitize";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

interface ExpenseRecord {
    id: string;
    name: string;
    description: string;
    invoice_number: string;
    date: string;
    expense_head_name: string;
    amount: number;
}

interface PrintSettingItem {
    type: string;
    header_image_url?: string | null;
    header_image_base64?: string | null;
    footer_content?: string;
    [key: string]: unknown;
}

interface InvoiceData {
    type: string;
    id: string;
    date: string;
    reference_no: string;
    recipientName: string;
    detail: string;
    amount: number;
}

export default function SearchExpensePage() {
    const { symbol, formatCurrency } = useCurrencyFormatter();
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const [searchType, setSearchType] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const [printSettings, setPrintSettings] = useState<PrintSettingItem | null>(null);
    const { settings } = useSettings();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);

    // Compute paginated data
    const totalRecords = expenses.length;
    const totalPages = Math.ceil(totalRecords / perPage) || 1;
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, totalRecords);
    const paginatedExpenses = expenses.slice(startIndex, endIndex);

    const searchTypeOptions = [
        { value: "all", label: t("all") },
        { value: "today", label: t("today") },
        { value: "this-week", label: t("this_week") },
        { value: "last-week", label: t("last_week") },
        { value: "this-month", label: t("this_month") },
        { value: "last-month", label: t("last_month") },
        { value: "last-3-months", label: t("last_3_months") },
        { value: "last-6-months", label: t("last_6_months") },
        { value: "last-12-months", label: t("last_12_months") },
        { value: "this-year", label: t("this_year") },
        { value: "last-year", label: t("last_year") },
        { value: "period", label: t("period") },
    ];

    const fetchExpenses = async (params: Record<string, string>) => {
        try {
            setLoading(true);
            const res = await api.get("expense/expenses", { params });
            if (res.data?.status === "Success") {
                const mappedData = (res.data.data || []).map((item: {
                    id: number | string;
                    name: string;
                    description?: string;
                    invoice_number?: string;
                    date: string;
                    expense_head?: { expense_head?: string };
                    amount: string | number;
                }) => ({
                    id: item.id.toString(),
                    name: item.name,
                    description: item.description || "",
                    invoice_number: item.invoice_number || "",
                    date: item.date,
                    expense_head_name: item.expense_head?.expense_head || "N/A",
                    amount: parseFloat(String(item.amount))
                }));
                setExpenses(mappedData);
                setCurrentPage(1);
                if (mappedData.length === 0) {
                    toast.info(t("no_records_found_for_criteria"));
                }
            }
        } catch (error) {
            console.error("Error searching expenses:", error);
            toast.error(t("failed_to_search_expenses"));
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodSearch = () => {
        if (searchType === "period" && (!startDate || !endDate)) {
            toast.error(t("please_select_both_start_and_end_dates"));
            return;
        }
        fetchExpenses({ search_type: searchType, start_date: startDate, end_date: endDate });
    };

    const handleKeywordSearch = () => {
        if (!keyword.trim()) {
            toast.error(t("please_enter_keyword_to_search"));
            return;
        }
        fetchExpenses({ keyword: keyword.trim() });
    };

    const downloadExpenseInvoice = async (expense: ExpenseRecord) => {
        let currentSettings = printSettings;
        if (!currentSettings) {
            try {
                const res = await api.get('system-setting/print-settings');
                if (res.data?.status === 'success') {
                    const invoiceSetting = res.data.data.find((s: PrintSettingItem) => s.type === 'Invoice');
                    setPrintSettings(invoiceSetting);
                    currentSettings = invoiceSetting;
                }
            } catch {
                // silently fail
            }
        }

        setInvoiceData({
            type: 'expense',
            id: expense.id,
            date: expense.date,
            reference_no: expense.invoice_number,
            recipientName: expense.name,
            detail: `Expense Category: ${expense.expense_head_name}`,
            amount: expense.amount,
        });

        setTimeout(async () => {
            const element = document.getElementById('modern-invoice-template-expense');
            if (element) {
                try {
                    const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    const pdf = new jsPDF();
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`expense_${expense.invoice_number || expense.id}.pdf`);
                    toast.success(t("invoice_downloaded") || "Invoice downloaded successfully");
                } catch (e: unknown) {
                    console.error("PDF Gen Error:", e);
                    const msg = e instanceof Error ? e.message : 'Unknown error';
                    toast.error(`Failed to generate PDF: ${msg}`);
                } finally {
                    setInvoiceData(null);
                }
            }
        }, 500);
    };

    const exportData = expenses.map(item => ({
        [t("name")]: item.name,
        [t("description")]: item.description,
        [t("invoice_number")]: item.invoice_number,
        [t("date")]: item.date,
        [t("expense_head")]: item.expense_head_name,
        [t("amount")]: formatCurrency(item.amount)
    }));

    const exportToExcel = () => {
        if (expenses.length === 0) {
            toast.info(t("no_data_found") || "No data to export");
            return;
        }
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("expenses") || "Expenses");
        XLSX.writeFile(wb, "expenses.xlsx");
        toast.success(t("exported_to_excel") || "Exported to Excel");
    };

    const exportToCSV = () => {
        if (expenses.length === 0) {
            toast.info(t("no_data_found") || "No data to export");
            return;
        }
        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "expenses.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t("exported_to_csv") || "Exported to CSV");
    };

    const exportToPDF = () => {
        if (expenses.length === 0) {
            toast.info(t("no_data_found") || "No data to export");
            return;
        }
        const doc = new jsPDF();
        doc.text(t("expense_list"), 14, 15);
        autoTable(doc, {
            head: [[t("name"), t("invoice_number"), t("expense_head"), t("date"), t("amount")]],
            body: expenses.map(item => [item.name, item.invoice_number, item.expense_head_name, formatDate(item.date), formatCurrency(item.amount)]),
            startY: 20,
        });
        doc.save("expenses.pdf");
        toast.success(t("exported_to_pdf") || "Exported to PDF");
    };

    const copyToClipboard = () => {
        if (exportData.length === 0) {
            toast.info(t("no_data_found") || "No data to copy");
            return;
        }
        const text = exportData.map(d => Object.values(d).join('\t')).join('\n');
        const header = Object.keys(exportData[0] || {}).join('\t');
        navigator.clipboard.writeText(header + '\n' + text);
        toast.success(t("copied_to_clipboard") || "Copied to clipboard");
    };

    return (
        <div className="space-y-6">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("search_expenses_by_period_or_keyword")}</p>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Search Type Column */}
                        <div className="space-y-2">
                            <Label htmlFor="search-type" className="text-xs font-semibold text-gray-600">
                                {t("search_type")} <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <Select value={searchType} onValueChange={setSearchType}>
                                        <SelectTrigger id="search-type" className="h-9">
                                            <SelectValue placeholder={t("select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {searchTypeOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {searchType !== "period" && (
                                    <Button
                                        onClick={handlePeriodSearch}
                                        disabled={loading}
                                        className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all shrink-0"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        {t("search")}
                                    </Button>
                                )}
                            </div>

                            {searchType === "period" && (
                                <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-600">{t("start_date")}</Label>
                                            <DatePicker value={startDate} onChange={(val) => setStartDate(val)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-600">{t("end_date")}</Label>
                                            <DatePicker value={endDate} onChange={(val) => setEndDate(val)} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handlePeriodSearch}
                                            disabled={loading}
                                            className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                            {t("search")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search Input Column */}
                        <div className="space-y-2">
                            <Label htmlFor="search-text" className="text-xs font-semibold text-gray-600">
                                {t("search_by_keyword")} <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="search-text"
                                    placeholder={t("search_by_expense_invoice")}
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleKeywordSearch()}
                                    className="h-9"
                                />
                                <Button
                                    onClick={handleKeywordSearch}
                                    disabled={loading}
                                    className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all shrink-0"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    {t("search")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ListChecks className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("expense_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{toLocaleNumber(totalRecords, shortCode)} {totalRecords === 1 ? t("record_found") : t("records_found")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={String(perPage)} onValueChange={(val) => { setPerPage(Number(val)); setCurrentPage(1); }}>
                            <SelectTrigger className="h-8 w-[68px] text-xs bg-white border border-gray-200 shadow-xs">
                                <SelectValue placeholder={toLocaleNumber("20", shortCode)}>
                                    {toLocaleNumber(String(perPage), shortCode)}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="20">{toLocaleNumber("20", shortCode)}</SelectItem>
                                <SelectItem value="50">{toLocaleNumber("50", shortCode)}</SelectItem>
                                <SelectItem value="100">{toLocaleNumber("100", shortCode)}</SelectItem>
                                <SelectItem value="200">{toLocaleNumber("200", shortCode)}</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center border rounded-md p-0.5 bg-white/90 border-gray-200 shadow-xs text-gray-500">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                onClick={copyToClipboard}
                                title={t("copy") || "Copy"}
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                onClick={exportToExcel}
                                title="Excel"
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                onClick={exportToCSV}
                                title="CSV"
                            >
                                <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                onClick={exportToPDF}
                                title="PDF"
                            >
                                <FileCode className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                onClick={() => window.print()}
                                title={t("print") || "Print"}
                            >
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                title={t("columns") || "Columns"}
                            >
                                <Columns className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md border overflow-x-auto min-h-[300px]">
                        <Table>
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow>
                                    <TableHead className="font-bold text-black">{t("name")}</TableHead>
                                    <TableHead className="font-bold text-black">{t("invoice_number")}</TableHead>
                                    <TableHead className="font-bold text-black">{t("expense_head")}</TableHead>
                                    <TableHead className="font-bold text-black">{t("date")}</TableHead>
                                    <TableHead className="font-bold text-black text-right">{t("amount")} ({symbol})</TableHead>
                                    <TableHead className="font-bold text-black text-center">{t("invoice") || "Invoice"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton rows={5} cols={6} />
                                ) : expenses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3 text-red-500/80">
                                                <span className="text-xs font-medium uppercase tracking-wider">{t("no_data_available_in_table")}</span>
                                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-2 shadow-inner border border-gray-100">
                                                    <Search className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
                                                </div>
                                                <div className="flex items-center text-green-600 space-x-1 animate-pulse">
                                                    <span className="font-bold text-lg">+</span>
                                                    <span className="text-xs font-semibold">{t("select_criteria_and_click_search")}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedExpenses.map((expense) => (
                                        <TableRow key={expense.id} className="hover:bg-gray-50 transition-colors">
                                            <TableCell className="font-medium text-gray-700 py-3">{expense.name}</TableCell>
                                            <TableCell className="text-gray-600">{expense.invoice_number || "-"}</TableCell>
                                            <TableCell className="text-gray-600">{expense.expense_head_name}</TableCell>
                                            <TableCell className="text-gray-600">{toLocaleNumber(formatDate(expense.date), shortCode)}</TableCell>
                                            <TableCell className="text-gray-600 text-right font-semibold">{toLocaleNumber(formatCurrency(expense.amount), shortCode)}</TableCell>
                                            <TableCell className="text-center">
                                                {expense.invoice_number ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg bg-green-500 text-white hover:bg-green-600 hover:text-white transition-colors flex items-center justify-center shadow-sm mx-auto"
                                                        onClick={() => downloadExpenseInvoice(expense)}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                        <div>
                            {t("showing_x_to_y_of_z", {
                                from: toLocaleNumber(totalRecords > 0 ? startIndex + 1 : 0, shortCode),
                                to: toLocaleNumber(endIndex, shortCode),
                                total: toLocaleNumber(totalRecords, shortCode)
                            })}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                                disabled={activePage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {Array.from({ length: totalPages }).map((_, idx) => {
                                const pageNum = idx + 1;
                                if (totalPages > 5 && Math.abs(pageNum - activePage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                                    if (pageNum === 2 || pageNum === totalPages - 1) {
                                        return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                                    }
                                    return null;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        size="sm"
                                        className={cn(
                                            "h-7 w-7 p-0 rounded-[10px] text-xs font-bold transition-all",
                                            activePage === pageNum
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md"
                                                : "bg-white border border-gray-200 text-gray-600 shadow-sm hover:bg-gray-100"
                                        )}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {toLocaleNumber(pageNum, shortCode)}
                                    </Button>
                                );
                            })}

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                                disabled={activePage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invoice Template (Hidden) */}
            {invoiceData && (
                <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -50, opacity: 0, pointerEvents: 'none' }}>
                    <div id="modern-invoice-template-expense" style={{ width: '800px', backgroundColor: '#ffffff', padding: '48px', fontFamily: 'sans-serif', color: '#1e293b', minHeight: '1122px', boxSizing: 'border-box' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            {/* Left Column: Logo + School Name */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {printSettings?.header_image_base64 ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={printSettings.header_image_base64} alt="Header" style={{ maxHeight: '80px', objectFit: 'contain', marginBottom: '8px' }} />
                                ) : settings?.print_logo_base64 ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={settings.print_logo_base64} alt="Logo" style={{ maxHeight: '80px', objectFit: 'contain', marginBottom: '8px' }} />
                                ) : null}
                                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', lineHeight: '1.2', margin: 0 }}>{settings?.school_name || "iSchool"}</h1>
                            </div>

                            {/* Right Column: Address and Others */}
                            <div style={{ textAlign: 'right', fontSize: '13px', color: '#1e293b', lineHeight: '1.5' }}>
                                {settings?.address && (
                                    <div><span style={{ fontWeight: 'bold' }}>Address:</span> {settings.address}</div>
                                )}
                                {settings?.phone && (
                                    <div><span style={{ fontWeight: 'bold' }}>Phone No.:</span> {settings.phone}</div>
                                )}
                                {settings?.email && (
                                    <div><span style={{ fontWeight: 'bold' }}>Email:</span> {settings.email}</div>
                                )}
                                <div><span style={{ fontWeight: 'bold' }}>Website:</span> {(settings?.frontend_url || (typeof window !== 'undefined' ? window.location.host : '') || process.env.NEXT_PUBLIC_FRONTEND_URL || "localhost:3000")?.replace(/^https?:\/\//, '')}</div>
                            </div>
                        </div>

                        {/* Centered full-width black bar */}
                        <div style={{ backgroundColor: '#000000', color: '#ffffff', fontWeight: 'bold', textAlign: 'center', padding: '10px 0', letterSpacing: '0.2em', fontSize: '15px', marginBottom: '24px', textTransform: 'uppercase', borderRadius: '4px' }}>
                            EXPENSE VOUCHER
                        </div>

                        {/* Invoice Meta Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
                            <div>
                                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Voucher / Invoice No:</span> <span style={{ color: '#4f46e5', fontWeight: '900' }}>{invoiceData.reference_no}</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Date:</span> <span style={{ fontWeight: '600' }}>{new Date(invoiceData.date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Paid To */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Paid To / Name</p>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px 0' }}>{invoiceData.recipientName}</h3>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Status</p>
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '32px', padding: '0 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                    PAID
                                </span>
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '32px' }}>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                                            <p style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px', margin: 0 }}>{invoiceData.detail}</p>
                                        </td>
                                        <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
                                            {formatCurrency(invoiceData.amount)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Total */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '64px' }}>
                            <div style={{ width: '50%', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #f1f5f9', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Subtotal</span>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{formatCurrency(invoiceData.amount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0', marginTop: '16px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>Total Paid</span>
                                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#4f46e5' }}>{formatCurrency(invoiceData.amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ textAlign: 'center', paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
                            {printSettings?.footer_content ? (
                                <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(printSettings.footer_content) }} />
                            ) : (
                                <p style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', margin: 0 }}>Expense Voucher generated by iSchool</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}