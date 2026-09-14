"use client";

import { useState } from "react";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Search,
    FileText,
    PlusSquare,
    ClipboardList,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Package,
    Loader2,
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/language-provider";

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

function formatDateDDMMYYYY(dateStr: string | null | undefined, langCode = "en"): string {
    if (!dateStr || dateStr === "-") return "-";
    const parts = dateStr.split("/");
    if (parts.length === 3) {
        return `${toLocaleNumber(parts[0].padStart(2, "0"), langCode)}/${toLocaleNumber(parts[1].padStart(2, "0"), langCode)}/${toLocaleNumber(parts[2], langCode)}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear());
    return `${toLocaleNumber(day, langCode)}/${toLocaleNumber(month, langCode)}/${toLocaleNumber(year, langCode)}`;
}

function formatDateRange(rangeStr: string | null | undefined, langCode = "en"): string {
    if (!rangeStr || rangeStr === "-") return "-";
    const parts = rangeStr.split(" - ");
    if (parts.length === 2) {
        const start = formatDateDDMMYYYY(parts[0].trim(), langCode);
        const end = parts[1].trim() ? formatDateDDMMYYYY(parts[1].trim(), langCode) : "";
        return end ? `${start} - ${end}` : `${start} - `;
    }
    return formatDateDDMMYYYY(rangeStr, langCode);
}

const reportLinks = [
    { id: "stock_report", key: "stock_report", icon: FileText },
    { id: "add_item_report", key: "add_item_report", icon: PlusSquare },
    { id: "issue_item_report", key: "issue_item_report", icon: ClipboardList },
];

const searchTypeOptions = [
    { value: "today", key: "today", label: "Today" },
    { value: "this_week", key: "this_week", label: "This Week" },
    { value: "this_month", key: "this_month", label: "This Month" },
    { value: "last_month", key: "last_month", label: "Last Month" },
    { value: "this_year", key: "this_year", label: "This Year" },
    { value: "all_time", key: "all_time", label: "All Time" },
];

interface StockItem {
    name: string;
    category: string;
    supplier: string;
    store: string;
    availableQty: number;
    totalQty: number;
    totalIssued: number;
}

interface AddItemRow {
    name: string;
    category: string;
    supplier: string;
    store: string;
    quantity: number;
    purchase_price: string;
    date: string;
}

interface IssueItemRow {
    item: string;
    note: string;
    category: string;
    dateRange: string;
    issue_to: string;
    issue_by: string;
    quantity: number;
}

export default function InventoryReportPage() {
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("stock_report");

    // Stock Report State
    const [stackList, setStackList] = useState<StockItem[]>([]);
    const [stackIsSearched, setStackIsSearched] = useState(false);
    const [stackSearchType, setStackSearchType] = useState("all_time");

    // Add Item Report State
    const [addItemList, setAddItemList] = useState<AddItemRow[]>([]);
    const [addIsSearched, setAddIsSearched] = useState(false);
    const [addSearchType, setAddSearchType] = useState("all_time");

    // Issue Item Report State
    const [issueItemList, setIssueItemList] = useState<IssueItemRow[]>([]);
    const [issueIsSearched, setIssueIsSearched] = useState(false);
    const [issueSearchType, setIssueSearchType] = useState("all_time");

    const [loading, setLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("10");

    const handleStackSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/inventory/stack", {
                params: { search_type: stackSearchType },
            });
            setStackList(response.data.data || []);
            setStackIsSearched(true);
            setCurrentPage(1);
            toast.success(t("report_loaded_successfully") || "Stock report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch stock report", error);
            toast.error(t("failed_to_load_report") || "Failed to load stock report");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/inventory/add-item", {
                params: { search_type: addSearchType },
            });
            setAddItemList(response.data.data || []);
            setAddIsSearched(true);
            setCurrentPage(1);
            toast.success(t("report_loaded_successfully") || "Add Item report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch Add Item report", error);
            toast.error(t("failed_to_load_report") || "Failed to load Add Item report");
        } finally {
            setLoading(false);
        }
    };

    const handleIssueSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/inventory/issue-item", {
                params: { search_type: issueSearchType },
            });
            setIssueItemList(response.data.data || []);
            setIssueIsSearched(true);
            setCurrentPage(1);
            toast.success(t("report_loaded_successfully") || "Issue Item report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch Issue Item report", error);
            toast.error(t("failed_to_load_report") || "Failed to load Issue Item report");
        } finally {
            setLoading(false);
        }
    };

    // Derived data - Stock Report
    const filteredStack = stackList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            item.name.toLowerCase().includes(lower) ||
            item.category.toLowerCase().includes(lower) ||
            item.supplier.toLowerCase().includes(lower) ||
            item.store.toLowerCase().includes(lower)
        );
    });

    // Derived data - Add Item Report
    const filteredAdd = addItemList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            item.name.toLowerCase().includes(lower) ||
            item.category.toLowerCase().includes(lower) ||
            item.supplier.toLowerCase().includes(lower) ||
            item.store.toLowerCase().includes(lower) ||
            item.purchase_price.toLowerCase().includes(lower) ||
            item.date.toLowerCase().includes(lower)
        );
    });

    // Derived data - Issue Item Report
    const filteredIssue = issueItemList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            item.item.toLowerCase().includes(lower) ||
            item.note.toLowerCase().includes(lower) ||
            item.category.toLowerCase().includes(lower) ||
            item.dateRange.toLowerCase().includes(lower) ||
            item.issue_to.toLowerCase().includes(lower) ||
            item.issue_by.toLowerCase().includes(lower)
        );
    });

    const sizeNum = parseInt(itemsPerPage);

    // Stock Report pagination variables
    const totalStackEntries = filteredStack.length;
    const totalStackPages = Math.ceil(totalStackEntries / sizeNum) || 1;
    const safeStackPage = Math.min(currentPage, totalStackPages);
    const startStackIndex = (safeStackPage - 1) * sizeNum;
    const paginatedStackList = filteredStack.slice(startStackIndex, startStackIndex + sizeNum);

    // Add Item pagination variables
    const totalAddEntries = filteredAdd.length;
    const totalAddPages = Math.ceil(totalAddEntries / sizeNum) || 1;
    const safeAddPage = Math.min(currentPage, totalAddPages);
    const startAddIndex = (safeAddPage - 1) * sizeNum;
    const paginatedAddList = filteredAdd.slice(startAddIndex, startAddIndex + sizeNum);

    // Issue Item pagination variables
    const totalIssueEntries = filteredIssue.length;
    const totalIssuePages = Math.ceil(totalIssueEntries / sizeNum) || 1;
    const safeIssuePage = Math.min(currentPage, totalIssuePages);
    const startIssueIndex = (safeIssuePage - 1) * sizeNum;
    const paginatedIssueList = filteredIssue.slice(startIssueIndex, startIssueIndex + sizeNum);

    // Export helpers
    const getActiveData = () => {
        if (activeTab === "stock_report") return filteredStack;
        if (activeTab === "add_item_report") return filteredAdd;
        return filteredIssue;
    };

    const exportToCopy = () => {
        const data = getActiveData();
        if (data.length === 0) { toast.error(t("no_data_available_in_table") || "No data to copy"); return; }
        let text = "";
        if (activeTab === "stock_report") {
            text = ["Name\tCategory\tSupplier\tStore\tAvailable Qty\tTotal Qty\tTotal Issued",
                ...(data as StockItem[]).map(r => `${r.name}\t${r.category}\t${r.supplier}\t${r.store}\t${r.availableQty}\t${r.totalQty}\t${r.totalIssued}`)].join("\n");
        } else if (activeTab === "add_item_report") {
            text = ["Name\tCategory\tSupplier\tStore\tQuantity\tPurchase Price\tDate",
                ...(data as AddItemRow[]).map(r => `${r.name}\t${r.category}\t${r.supplier}\t${r.store}\t${r.quantity}\t$${r.purchase_price}\t${r.date}`)].join("\n");
        } else {
            text = ["Item\tNote\tCategory\tIssue - Return\tIssue To\tIssued By\tQuantity",
                ...(data as IssueItemRow[]).map(r => `${r.item}\t${r.note}\t${r.category}\t${r.dateRange}\t${r.issue_to}\t${r.issue_by}\t${r.quantity}`)].join("\n");
        }
        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard") || "Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        const data = getActiveData();
        if (data.length === 0) { toast.error(t("no_data_available_in_table") || "No data to export"); return; }
        let mapped: Record<string, unknown>[];
        let fileName = "";
        if (activeTab === "stock_report") {
            mapped = (data as StockItem[]).map(r => ({ "Name": r.name, "Category": r.category, "Supplier": r.supplier, "Store": r.store, "Available Qty": r.availableQty, "Total Qty": r.totalQty, "Total Issued": r.totalIssued }));
            fileName = "stock_report";
        } else if (activeTab === "add_item_report") {
            mapped = (data as AddItemRow[]).map(r => ({ "Name": r.name, "Category": r.category, "Supplier": r.supplier, "Store": r.store, "Quantity": r.quantity, "Purchase Price": `$${r.purchase_price}`, "Date": r.date }));
            fileName = "add_item_report";
        } else {
            mapped = (data as IssueItemRow[]).map(r => ({ "Item": r.item, "Note": r.note, "Category": r.category, "Issue - Return": r.dateRange, "Issue To": r.issue_to, "Issued By": r.issue_by, "Quantity": r.quantity }));
            fileName = "issue_item_report";
        }
        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, activeTab);
        if (isCsv) { XLSX.writeFile(wb, `${fileName}.csv`, { bookType: "csv" }); toast.success(t("csv_downloaded") || "CSV downloaded"); }
        else { XLSX.writeFile(wb, `${fileName}.xlsx`); toast.success(t("excel_downloaded") || "Excel file downloaded"); }
    };

    const exportToPDF = () => {
        const data = getActiveData();
        if (data.length === 0) { toast.error(t("no_data_available_in_table") || "No data to export"); return; }
        const doc = new jsPDF("landscape");
        if (activeTab === "stock_report") {
            const rows = data as StockItem[];
            autoTable(doc, { head: [["Name", "Category", "Supplier", "Store", "Available", "Total", "Issued"]], body: rows.map(r => [r.name, r.category, r.supplier, r.store, r.availableQty, r.totalQty, r.totalIssued]), theme: "grid" });
            doc.save("stock_report.pdf");
        } else if (activeTab === "add_item_report") {
            const rows = data as AddItemRow[];
            autoTable(doc, { head: [["Name", "Category", "Supplier", "Store", "Qty", "Price", "Date"]], body: rows.map(r => [r.name, r.category, r.supplier, r.store, r.quantity, `$${r.purchase_price}`, r.date]), theme: "grid" });
            doc.save("add_item_report.pdf");
        } else {
            const rows = data as IssueItemRow[];
            autoTable(doc, { head: [["Item", "Note", "Category", "Issue - Return", "Issue To", "Issued By", "Qty"]], body: rows.map(r => [r.item, r.note, r.category, r.dateRange, r.issue_to, r.issue_by, r.quantity]), theme: "grid" });
            doc.save("issue_item_report.pdf");
        }
        toast.success(t("pdf_downloaded") || "PDF downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

    const renderPagination = (total: number, listLen: number, safePg: number, totalPg: number, startIdx: number) => (
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100 mt-auto gap-3">
            <div>
                {total === 0 ? (
                    t("showing_x_to_y_of_z", {
                        from: toLocaleNumber(0, langCode),
                        to: toLocaleNumber(0, langCode),
                        total: toLocaleNumber(0, langCode),
                        x: toLocaleNumber(0, langCode),
                        y: toLocaleNumber(0, langCode),
                        z: toLocaleNumber(0, langCode),
                    }) || `${t("showing") || "Showing"} ${toLocaleNumber(0, langCode)} ${t("to") || "to"} ${toLocaleNumber(0, langCode)} ${t("of") || "of"} ${toLocaleNumber(0, langCode)} ${t("entries") || "entries"}`
                ) : (
                    t("showing_x_to_y_of_z", {
                        from: toLocaleNumber(startIdx + 1, langCode),
                        to: toLocaleNumber(Math.min(startIdx + sizeNum, total), langCode),
                        total: toLocaleNumber(total, langCode),
                        x: toLocaleNumber(startIdx + 1, langCode),
                        y: toLocaleNumber(Math.min(startIdx + sizeNum, total), langCode),
                        z: toLocaleNumber(total, langCode),
                    }) || `${t("showing") || "Showing"} ${toLocaleNumber(startIdx + 1, langCode)} ${t("to") || "to"} ${toLocaleNumber(Math.min(startIdx + sizeNum, total), langCode)} ${t("of") || "of"} ${toLocaleNumber(total, langCode)} ${t("entries") || "entries"}`
                )}
                {searchTerm && ` (${t("filtered_from") || "filtered from"} ${toLocaleNumber(listLen, langCode)} ${t("total_entries") || "total entries"})`}
            </div>
            {listLen > 0 && (
                <div className="flex items-center gap-1.5">
                    <button
                        disabled={safePg === 1}
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPg }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                                "h-8 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-all rounded-lg",
                                safePg === page
                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs font-bold"
                                    : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200"
                            )}
                        >
                            {toLocaleNumber(page, langCode)}
                        </button>
                    ))}
                    <button
                        disabled={safePg === totalPg}
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPg))}
                        className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );

    const renderToolbar = () => (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-64">
                <Input
                    placeholder={t("search") || "Search..."}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                />
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{t("show") || "Show"}</span>
                    <Select value={itemsPerPage} onValueChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}>
                        <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">{toLocaleNumber(10, langCode)}</SelectItem>
                            <SelectItem value="25">{toLocaleNumber(25, langCode)}</SelectItem>
                            <SelectItem value="50">{toLocaleNumber(50, langCode)}</SelectItem>
                            <SelectItem value="100">{toLocaleNumber(100, langCode)}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                    <Button variant="ghost" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                        <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" title={t("csv") || "CSV"} onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                        <FileBox className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                        <FileText className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                        <Printer className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-20 text-xs">
            {/* Standalone Edge-to-Edge Gradient Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Package className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("inventory_report") || "Inventory Report"}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("inventory_report_description") || "Stock, item addition, and item issue reports"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Grid of 3 Report Tabs */}
            <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {reportLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = activeTab === link.id;
                        return (
                            <div
                                key={link.id}
                                onClick={() => {
                                    setActiveTab(link.id);
                                    setCurrentPage(1);
                                    setSearchTerm("");
                                }}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group",
                                    isActive
                                        ? "border-indigo-200 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-200"
                                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-xs"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg transition-all duration-300",
                                    isActive ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                )}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span className={cn(
                                    "text-xs font-bold tracking-tight transition-colors duration-300",
                                    isActive ? "text-[#6366f1]" : "text-gray-700"
                                )}>
                                    {t(link.key) || link.id}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Stock Report ──────────────────────────────────────────────── */}
            {activeTab === "stock_report" && (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">
                            {t("select_criteria") || "Select Criteria"}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    {t("search_type") || "Search Type"}
                                </Label>
                                <Select value={stackSearchType} onValueChange={setStackSearchType}>
                                    <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue>
                                            {searchTypeOptions.find(o => o.value === stackSearchType)
                                                ? (t(searchTypeOptions.find(o => o.value === stackSearchType)!.key) || searchTypeOptions.find(o => o.value === stackSearchType)!.label)
                                                : stackSearchType}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {searchTypeOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {t(opt.key) || opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleStackSearch}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold h-8 flex items-center justify-center gap-2 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            {t("searching") || "Searching…"}
                                        </>
                                    ) : (
                                        <>
                                            <Search className="h-3.5 w-3.5" />
                                            {t("search") || "Search"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[420px] flex flex-col justify-between transition-all animate-fadeIn">
                        <div className="space-y-4 flex-1 flex flex-col">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("stock_report") || "Stock Report"}
                            </h2>
                            {renderToolbar()}
                            <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar flex-1">
                                <Table className="min-w-[1200px]">
                                    <TableHeader className="bg-transparent border-b border-gray-100">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                            <TableHead className="py-3 px-4">{t("name") || "Name"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("category") || "Category"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("supplier") || "Supplier"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("store") || "Store"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-center">{t("available_quantity") || "Available Quantity"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-center">{t("total_quantity") || "Total Quantity"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-right">{t("total_issued") || "Total Issued"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableSkeleton cols={7} />
                                        ) : !stackIsSearched ? (
                                            <TableRow className="hover:bg-transparent h-64">
                                                <TableCell colSpan={7} className="text-center py-12">
                                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                        <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">
                                                            {t("no_data_available_in_table") || "No data available in table"}
                                                        </p>
                                                        <div className="relative">
                                                            <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                                <Package className="h-8 w-8 text-gray-200" />
                                                            </div>
                                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                                <PlusSquare className="h-3 w-3 text-indigo-300" />
                                                            </div>
                                                        </div>
                                                        <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                            <span className="text-lg">←</span> {t("search_with_criteria_to_retrieve_stock_details") || "Search with criteria to retrieve stock details."}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedStackList.length > 0 ? (
                                            paginatedStackList.map((item, idx) => (
                                                <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{item.category}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{item.supplier}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{item.store}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-emerald-600 font-bold">{toLocaleNumber(item.availableQty, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-500">{toLocaleNumber(item.totalQty, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-500">{toLocaleNumber(item.totalIssued, langCode)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                    {t("no_items_match_the_search") || "No items match the search."}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        {renderPagination(totalStackEntries, stackList.length, safeStackPage, totalStackPages, startStackIndex)}
                    </div>
                </>
            )}

            {/* ── Add Item Report ───────────────────────────────────────────── */}
            {activeTab === "add_item_report" && (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">
                            {t("select_criteria") || "Select Criteria"}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    {t("search_type") || "Search Type"}
                                </Label>
                                <Select value={addSearchType} onValueChange={setAddSearchType}>
                                    <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue>
                                            {searchTypeOptions.find(o => o.value === addSearchType)
                                                ? (t(searchTypeOptions.find(o => o.value === addSearchType)!.key) || searchTypeOptions.find(o => o.value === addSearchType)!.label)
                                                : addSearchType}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {searchTypeOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {t(opt.key) || opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleAddSearch}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold h-8 flex items-center justify-center gap-2 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            {t("searching") || "Searching…"}
                                        </>
                                    ) : (
                                        <>
                                            <Search className="h-3.5 w-3.5" />
                                            {t("search") || "Search"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[420px] flex flex-col justify-between transition-all animate-fadeIn">
                        <div className="space-y-4 flex-1 flex flex-col">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("add_item_report") || "Add Item Report"}
                            </h2>
                            {renderToolbar()}
                            <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar flex-1">
                                <Table className="min-w-[1200px]">
                                    <TableHeader className="bg-transparent border-b border-gray-100">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                            <TableHead className="py-3 px-4">{t("name") || "Name"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("category") || "Category"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("supplier") || "Supplier"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("store") || "Store"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-center">{t("quantity") || "Quantity"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-right">{t("purchase_price") || "Purchase Price"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-right">{t("date") || "Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableSkeleton cols={7} />
                                        ) : !addIsSearched ? (
                                            <TableRow className="hover:bg-transparent h-64">
                                                <TableCell colSpan={7} className="text-center py-12">
                                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                        <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">
                                                            {t("no_data_available_in_table") || "No data available in table"}
                                                        </p>
                                                        <div className="relative">
                                                            <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                                <Package className="h-8 w-8 text-gray-200" />
                                                            </div>
                                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                                <PlusSquare className="h-3 w-3 text-indigo-300" />
                                                            </div>
                                                        </div>
                                                        <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                            <span className="text-lg">←</span> {t("search_with_criteria_to_retrieve_add_item_records") || "Search with criteria to retrieve add item records."}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedAddList.length > 0 ? (
                                            paginatedAddList.map((item, idx) => (
                                                <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{item.category}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{item.supplier}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{item.store}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-700 font-bold">{toLocaleNumber(item.quantity, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-indigo-600 font-bold">${toLocaleNumber(item.purchase_price, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-500">{formatDateDDMMYYYY(item.date, langCode)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                    {t("no_items_match_the_search") || "No items match the search."}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        {renderPagination(totalAddEntries, addItemList.length, safeAddPage, totalAddPages, startAddIndex)}
                    </div>
                </>
            )}

            {/* ── Issue Item Report ─────────────────────────────────────────── */}
            {activeTab === "issue_item_report" && (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">
                            {t("select_criteria") || "Select Criteria"}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    {t("search_type") || "Search Type"}
                                </Label>
                                <Select value={issueSearchType} onValueChange={setIssueSearchType}>
                                    <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue>
                                            {searchTypeOptions.find(o => o.value === issueSearchType)
                                                ? (t(searchTypeOptions.find(o => o.value === issueSearchType)!.key) || searchTypeOptions.find(o => o.value === issueSearchType)!.label)
                                                : issueSearchType}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {searchTypeOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {t(opt.key) || opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleIssueSearch}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold h-8 flex items-center justify-center gap-2 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            {t("searching") || "Searching…"}
                                        </>
                                    ) : (
                                        <>
                                            <Search className="h-3.5 w-3.5" />
                                            {t("search") || "Search"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[420px] flex flex-col justify-between transition-all animate-fadeIn">
                        <div className="space-y-4 flex-1 flex flex-col">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("issue_item_report") || "Issue Item Report"}
                            </h2>
                            {renderToolbar()}
                            <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar flex-1">
                                <Table className="min-w-[1200px]">
                                    <TableHeader className="bg-transparent border-b border-gray-100">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                            <TableHead className="py-3 px-4">{t("item") || "Item"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("note") || "Note"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("item_category") || "Item Category"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("issue_item_return") || t("issue_return_period") || "Issue - Return"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("issue_to") || "Issue To"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("issued_by") || "Issued By"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-right">{t("quantity") || "Quantity"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableSkeleton cols={7} />
                                        ) : !issueIsSearched ? (
                                            <TableRow className="hover:bg-transparent h-64">
                                                <TableCell colSpan={7} className="text-center py-12">
                                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                        <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">
                                                            {t("no_data_available_in_table") || "No data available in table"}
                                                        </p>
                                                        <div className="relative">
                                                            <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                                <Package className="h-8 w-8 text-gray-200" />
                                                            </div>
                                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                                <PlusSquare className="h-3 w-3 text-indigo-300" />
                                                            </div>
                                                        </div>
                                                        <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                            <span className="text-lg">←</span> {t("search_with_criteria_to_retrieve_issue_item_records") || "Search with criteria to retrieve issue item records."}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedIssueList.length > 0 ? (
                                            paginatedIssueList.map((item, idx) => (
                                                <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.item}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{item.note}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{item.category}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{formatDateRange(item.dateRange, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{item.issue_to}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{item.issue_by}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">{toLocaleNumber(item.quantity, langCode)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                    {t("no_items_match_the_search") || "No items match the search."}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        {renderPagination(totalIssueEntries, issueItemList.length, safeIssuePage, totalIssuePages, startIssueIndex)}
                    </div>
                </>
            )}
        </div>
    );
}
