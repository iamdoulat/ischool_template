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
    Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

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

const reportLinks = [
    { name: "Stack Report", icon: FileText, active: true },
    { name: "Add Item Report", icon: PlusSquare },
    { name: "Issue Item Report", icon: ClipboardList },
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
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("Stack Report");

    // Stack Report State
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
            toast.success("Stack report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch stack report", error);
            toast.error("Failed to load stack report");
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
            toast.success("Add Item report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch Add Item report", error);
            toast.error("Failed to load Add Item report");
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
            toast.success("Issue Item report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch Issue Item report", error);
            toast.error("Failed to load Issue Item report");
        } finally {
            setLoading(false);
        }
    };

    // Derived data - Stack Report
    const filteredStack = stackList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            (item.name || "").toLowerCase().includes(lower) ||
            (item.category || "").toLowerCase().includes(lower) ||
            (item.supplier || "").toLowerCase().includes(lower) ||
            (item.store || "").toLowerCase().includes(lower)
        );
    });

    // Derived data - Add Item Report
    const filteredAdd = addItemList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            (item.name || "").toLowerCase().includes(lower) ||
            (item.category || "").toLowerCase().includes(lower) ||
            (item.supplier || "").toLowerCase().includes(lower) ||
            (item.store || "").toLowerCase().includes(lower)
        );
    });

    // Derived data - Issue Item Report
    const filteredIssue = issueItemList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            (item.item || "").toLowerCase().includes(lower) ||
            (item.note || "").toLowerCase().includes(lower) ||
            (item.category || "").toLowerCase().includes(lower) ||
            (item.issue_to || "").toLowerCase().includes(lower) ||
            (item.issue_by || "").toLowerCase().includes(lower)
        );
    });

    const sizeNum = parseInt(itemsPerPage, 10) || 10;

    // Stack pagination variables
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

    // ── Export helpers ────────────────────────────────────────────────────────
    const getActiveData = () => {
        if (activeTab === "Stack Report") return filteredStack;
        if (activeTab === "Add Item Report") return filteredAdd;
        return filteredIssue;
    };

    const exportToCopy = () => {
        const data = getActiveData();
        if (data.length === 0) { toast.error("No data to copy"); return; }
        let text = "";
        if (activeTab === "Stack Report") {
            text = ["Name\tCategory\tSupplier\tStore\tAvailable Qty\tTotal Qty\tTotal Issued",
                ...(data as StockItem[]).map(r => `${r.name}\t${r.category}\t${r.supplier}\t${r.store}\t${r.availableQty}\t${r.totalQty}\t${r.totalIssued}`)].join("\n");
        } else if (activeTab === "Add Item Report") {
            text = ["Name\tCategory\tSupplier\tStore\tQuantity\tPurchase Price\tDate",
                ...(data as AddItemRow[]).map(r => `${r.name}\t${r.category}\t${r.supplier}\t${r.store}\t${r.quantity}\t$${r.purchase_price}\t${r.date}`)].join("\n");
        } else {
            text = ["Item\tNote\tCategory\tIssue - Return\tIssue To\tIssued By\tQuantity",
                ...(data as IssueItemRow[]).map(r => `${r.item}\t${r.note}\t${r.category}\t${r.dateRange}\t${r.issue_to}\t${r.issue_by}\t${r.quantity}`)].join("\n");
        }
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        const data = getActiveData();
        if (data.length === 0) { toast.error("No data to export"); return; }
        let mapped: Record<string, unknown>[];
        let fileName = "";
        if (activeTab === "Stack Report") {
            mapped = (data as StockItem[]).map(r => ({ "Name": r.name, "Category": r.category, "Supplier": r.supplier, "Store": r.store, "Available Qty": r.availableQty, "Total Qty": r.totalQty, "Total Issued": r.totalIssued }));
            fileName = "stack_report";
        } else if (activeTab === "Add Item Report") {
            mapped = (data as AddItemRow[]).map(r => ({ "Name": r.name, "Category": r.category, "Supplier": r.supplier, "Store": r.store, "Quantity": r.quantity, "Purchase Price": `$${r.purchase_price}`, "Date": r.date }));
            fileName = "add_item_report";
        } else {
            mapped = (data as IssueItemRow[]).map(r => ({ "Item": r.item, "Note": r.note, "Category": r.category, "Issue - Return": r.dateRange, "Issue To": r.issue_to, "Issued By": r.issue_by, "Quantity": r.quantity }));
            fileName = "issue_item_report";
        }
        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, activeTab);
        if (isCsv) { XLSX.writeFile(wb, `${fileName}.csv`, { bookType: "csv" }); toast.success("CSV downloaded"); }
        else { XLSX.writeFile(wb, `${fileName}.xlsx`); toast.success("Excel file downloaded"); }
    };

    const exportToPDF = () => {
        const data = getActiveData();
        if (data.length === 0) { toast.error("No data to export"); return; }
        const doc = new jsPDF("landscape");
        if (activeTab === "Stack Report") {
            const rows = data as StockItem[];
            autoTable(doc, { head: [["Name", "Category", "Supplier", "Store", "Available", "Total", "Issued"]], body: rows.map(r => [r.name, r.category, r.supplier, r.store, r.availableQty, r.totalQty, r.totalIssued]), theme: "grid" });
            doc.save("stack_report.pdf");
        } else if (activeTab === "Add Item Report") {
            const rows = data as AddItemRow[];
            autoTable(doc, { head: [["Name", "Category", "Supplier", "Store", "Qty", "Price", "Date"]], body: rows.map(r => [r.name, r.category, r.supplier, r.store, r.quantity, `$${r.purchase_price}`, r.date]), theme: "grid" });
            doc.save("add_item_report.pdf");
        } else {
            const rows = data as IssueItemRow[];
            autoTable(doc, { head: [["Item", "Note", "Category", "Issue - Return", "Issue To", "Issued By", "Qty"]], body: rows.map(r => [r.item, r.note, r.category, r.dateRange, r.issue_to, r.issue_by, r.quantity]), theme: "grid" });
            doc.save("issue_item_report.pdf");
        }
        toast.success("PDF downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

    const renderPagination = (total: number, listLen: number, safePg: number, totalPg: number, startIdx: number) => (
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
            <div>
                Showing {total > 0 ? startIdx + 1 : 0} to{" "}
                {Math.min(startIdx + sizeNum, total)} of {total} entries
                {searchTerm && ` (filtered from ${listLen} total entries)`}
            </div>
            {listLen > 0 && (
                <div className="flex items-center gap-1.5">
                    <button
                        disabled={safePg === 1}
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPg }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                                "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer border-none font-bold",
                                safePg === page
                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white font-extrabold shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95"
                                    : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                            )}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        disabled={safePg === totalPg}
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPg))}
                        className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
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
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                />
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                    <Select value={itemsPerPage} onValueChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}>
                        <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                    <Button variant="ghost" size="icon" title="Copy" onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                        <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                        <FileBox className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" title="PDF" onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                        <FileText className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Print" onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                        <Printer className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20 text-xs">
            {/* Gradient header card */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Package className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800 leading-none">Inventory Report</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">Stock, item addition, and issue reports</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {reportLinks.map((link) => {
                            const isActive = activeTab === link.name;
                            return (
                                <div
                                    key={link.name}
                                    onClick={() => {
                                        setActiveTab(link.name);
                                        setSearchTerm("");
                                        setCurrentPage(1);
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group",
                                        isActive
                                            ? "border-indigo-200 bg-indigo-50/50 shadow-sm"
                                            : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-lg transition-all duration-300",
                                        isActive ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                    )}>
                                        <link.icon className="h-4 w-4" />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold tracking-tight uppercase transition-colors duration-300",
                                        isActive ? "text-indigo-700" : "text-gray-600"
                                    )}>
                                        {link.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Select Criteria Sections */}
            {activeTab === "Stack Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type</Label>
                            <Select value={stackSearchType} onValueChange={setStackSearchType}>
                                <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="All Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="this_week">This Week</SelectItem>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                    <SelectItem value="last_month">Last Month</SelectItem>
                                    <SelectItem value="this_year">This Year</SelectItem>
                                    <SelectItem value="all_time">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                onClick={handleStackSearch}
                                disabled={loading}
                                variant="gradient"
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                            >
                                <Search className="h-4 w-4" />
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "Add Item Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type</Label>
                            <Select value={addSearchType} onValueChange={setAddSearchType}>
                                <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="All Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="this_week">This Week</SelectItem>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                    <SelectItem value="last_month">Last Month</SelectItem>
                                    <SelectItem value="this_year">This Year</SelectItem>
                                    <SelectItem value="all_time">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                onClick={handleAddSearch}
                                disabled={loading}
                                variant="gradient"
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                            >
                                <Search className="h-4 w-4" />
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "Issue Item Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type</Label>
                            <Select value={issueSearchType} onValueChange={setIssueSearchType}>
                                <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="All Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="this_week">This Week</SelectItem>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                    <SelectItem value="last_month">Last Month</SelectItem>
                                    <SelectItem value="this_year">This Year</SelectItem>
                                    <SelectItem value="all_time">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                onClick={handleIssueSearch}
                                disabled={loading}
                                variant="gradient"
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                            >
                                <Search className="h-4 w-4" />
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stack Report Table Section */}
            {activeTab === "Stack Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Stock Report</h2>
                    {renderToolbar()}
                    <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Category <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Supplier <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Store <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Available Quantity <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Total Quantity <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Total Issued</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={7} />
                                ) : !stackIsSearched ? (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                        <Package className="h-8 w-8 text-gray-200" />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                        <PlusSquare className="h-3 w-3 text-indigo-300" />
                                                    </div>
                                                </div>
                                                <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                    <span className="text-lg">←</span> Search with criteria to retrieve stock details.
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
                                            <TableCell className="py-3 px-4 text-center text-emerald-600 font-bold">{item.availableQty}</TableCell>
                                            <TableCell className="py-3 px-4 text-center text-gray-500">{item.totalQty}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-gray-500">{item.totalIssued}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No items match the search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {renderPagination(totalStackEntries, stackList.length, safeStackPage, totalStackPages, startStackIndex)}
                </div>
            )}

            {/* Add Item Report Table Section */}
            {activeTab === "Add Item Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Add Item Report</h2>
                    {renderToolbar()}
                    <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Category <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Supplier <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Store <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Quantity <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Purchase Price <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={7} />
                                ) : !addIsSearched ? (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                        <Package className="h-8 w-8 text-gray-200" />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                        <PlusSquare className="h-3 w-3 text-indigo-300" />
                                                    </div>
                                                </div>
                                                <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                    <span className="text-lg">←</span> Search with criteria to retrieve add item records.
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
                                            <TableCell className="py-3 px-4 text-center text-gray-700 font-bold">{item.quantity}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-indigo-600 font-bold">${item.purchase_price}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-gray-500">{item.date}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No items match the search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {renderPagination(totalAddEntries, addItemList.length, safeAddPage, totalAddPages, startAddIndex)}
                </div>
            )}

            {/* Issue Item Report Table Section */}
            {activeTab === "Issue Item Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Issue Item Report</h2>
                    {renderToolbar()}
                    <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Item <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Note <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Item Category <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Issue - Return <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Issue To <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Issued By <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Quantity <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={7} />
                                ) : !issueIsSearched ? (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                        <Package className="h-8 w-8 text-gray-200" />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                        <PlusSquare className="h-3 w-3 text-indigo-300" />
                                                    </div>
                                                </div>
                                                <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                    <span className="text-lg">←</span> Search with criteria to retrieve issue item records.
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
                                            <TableCell className="py-3 px-4 text-gray-500">{item.dateRange}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.issue_to}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.issue_by}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">{item.quantity}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No items match the search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {renderPagination(totalIssueEntries, issueItemList.length, safeIssuePage, totalIssuePages, startIssueIndex)}
                </div>
            )}
        </div>
    );
}
