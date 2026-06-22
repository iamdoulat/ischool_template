// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
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
    CalendarClock,
    Archive,
    RefreshCcw,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    BookMarked,
    Plus,
    BookOpen,
    Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Constants ───────────────────────────────────────────────────────────────

const reportLinks = [
    { name: "Book Issue Report",         icon: FileText      },
    { name: "Book Due Report",           icon: CalendarClock },
    { name: "Book Inventory Report",     icon: Archive       },
    { name: "Book Issue Return Report",  icon: RefreshCcw    },
];

const searchTypes = [
    { label: "Today",       value: "today"      },
    { label: "This Week",   value: "this_week"  },
    { label: "This Month",  value: "this_month" },
    { label: "Last Month",  value: "last_month" },
    { label: "This Year",   value: "this_year"  },
    { label: "All Time",    value: "all"         },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface LibraryIssue {
    bookTitle:   string;
    bookNumber:  string;
    issueDate:   string;
    dueDate:     string;
    memberId:    string;
    cardNo:      string;
    admissionNo: string;
    issueBy:     string;
    memberType:  string;
}

interface BookInventory {
    id:          number;
    bookTitle:   string;
    bookNumber:  string;
    isbnNumber:  string;
    publisher:   string;
    author:      string;
    subject:     string;
    rackNumber:  string;
    qty:         number;
    available:   number;
    issued:      number;
    bookPrice:   string;
    postDate:    string | null;
}

interface LibraryReturn {
    id:          number;
    bookTitle:   string;
    bookNumber:  string;
    issueDate:   string;
    returnDate:  string;
    memberId:    string;
    cardNo:      string;
    issueBy:     string;
    memberType:  string;
}

// ─── Component ───────────────────────────────────────────────────────────────

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

export default function LibraryReportPage() {
    const [activeTab, setActiveTab] = useState("Book Issue Report");

    // Issue Report criteria
    const [searchType, setSearchType]   = useState("today");
    const [memberType, setMemberType]   = useState("all");

    // Due Report criteria
    const [dueSearchType, setDueSearchType] = useState("today");
    const [dueMemberType, setDueMemberType] = useState("all");

    // Inventory criteria
    const [invSearchType, setInvSearchType] = useState("today");

    // Return criteria
    const [retSearchType, setRetSearchType] = useState("today");

    // Data
    const [issueList, setIssueList]         = useState<LibraryIssue[]>([]);
    const [dueList, setDueList]             = useState<LibraryIssue[]>([]);
    const [inventoryList, setInventoryList] = useState<BookInventory[]>([]);
    const [returnList, setReturnList]       = useState<LibraryReturn[]>([]);
    const [isSearched, setIsSearched]       = useState(false);
    const [dueIsSearched, setDueIsSearched] = useState(false);
    const [invIsSearched, setInvIsSearched] = useState(false);
    const [retIsSearched, setRetIsSearched] = useState(false);
    const [loading, setLoading]             = useState(false);

    // Table controls
    const [searchTerm, setSearchTerm]   = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage]  = useState(1);

    // ── Derived filtered / paginated lists ───────────────────────────────────
    const filterFn = (item: LibraryIssue) => {
        if (!searchTerm) return true;
        const t = searchTerm.toLowerCase();
        return (
            item.bookTitle.toLowerCase().includes(t)   ||
            item.bookNumber.toLowerCase().includes(t)  ||
            item.issueDate.toLowerCase().includes(t)   ||
            item.dueDate.toLowerCase().includes(t)     ||
            item.memberId.toLowerCase().includes(t)    ||
            item.cardNo.toLowerCase().includes(t)      ||
            item.admissionNo.toLowerCase().includes(t) ||
            item.issueBy.toLowerCase().includes(t)     ||
            item.memberType.toLowerCase().includes(t)
        );
    };

    const filtered    = issueList.filter(filterFn);
    const filteredDue = dueList.filter(filterFn);

    const filteredInv = inventoryList.filter(item => {
        if (!searchTerm) return true;
        const t = searchTerm.toLowerCase();
        return (
            (item.bookTitle  || "").toLowerCase().includes(t) ||
            (item.bookNumber || "").toLowerCase().includes(t) ||
            (item.isbnNumber || "").toLowerCase().includes(t) ||
            (item.publisher  || "").toLowerCase().includes(t) ||
            (item.author     || "").toLowerCase().includes(t) ||
            (item.subject    || "").toLowerCase().includes(t)
        );
    });

    const filteredRet = returnList.filter(item => {
        if (!searchTerm) return true;
        const t = searchTerm.toLowerCase();
        return (
            (item.bookTitle  || "").toLowerCase().includes(t) ||
            (item.bookNumber || "").toLowerCase().includes(t) ||
            (item.issueDate  || "").toLowerCase().includes(t) ||
            (item.returnDate || "").toLowerCase().includes(t) ||
            (item.memberId   || "").toLowerCase().includes(t) ||
            (item.cardNo     || "").toLowerCase().includes(t) ||
            (item.issueBy    || "").toLowerCase().includes(t) ||
            (item.memberType || "").toLowerCase().includes(t)
        );
    });

    const activeFiltered = activeTab === "Book Due Report" ? filteredDue
        : activeTab === "Book Inventory Report" ? filteredInv
        : activeTab === "Book Issue Return Report" ? filteredRet
        : filtered;

    const sizeNum      = parseInt(itemsPerPage);
    const totalEntries = activeFiltered.length;
    const totalPages   = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage     = Math.min(currentPage, totalPages) || 1;
    const startIndex   = (safePage - 1) * sizeNum;
    const paginated    = activeFiltered.slice(startIndex, startIndex + sizeNum);
    const paginatedInv = filteredInv.slice(startIndex, startIndex + sizeNum) as BookInventory[];
    const paginatedRet = filteredRet.slice(startIndex, startIndex + sizeNum) as LibraryReturn[];

    // ── API calls ─────────────────────────────────────────────────────────────
    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/library/issue", {
                params: { search_type: searchType, member_type: memberType },
            });
            setIssueList(response.data.data || []);
            setIsSearched(true);
            setCurrentPage(1);
            toast.success("Book issue report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch library issue report", error);
            toast.error("Failed to load book issue report");
        } finally {
            setLoading(false);
        }
    };

    const handleDueSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/library/due", {
                params: { search_type: dueSearchType, member_type: dueMemberType },
            });
            setDueList(response.data.data || []);
            setDueIsSearched(true);
            setCurrentPage(1);
            toast.success("Book due report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch book due report", error);
            toast.error("Failed to load book due report");
        } finally {
            setLoading(false);
        }
    };

    const handleInvSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/library/inventory", {
                params: { search_type: invSearchType },
            });
            setInventoryList(response.data.data || []);
            setInvIsSearched(true);
            setCurrentPage(1);
            toast.success("Book inventory report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch book inventory", error);
            toast.error("Failed to load book inventory report");
        } finally {
            setLoading(false);
        }
    };

    const handleRetSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/library/return", {
                params: { search_type: retSearchType },
            });
            setReturnList(response.data.data || []);
            setRetIsSearched(true);
            setCurrentPage(1);
            toast.success("Book issue return report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch book return report", error);
            toast.error("Failed to load book return report");
        } finally {
            setLoading(false);
        }
    };

    // ── Export helpers ────────────────────────────────────────────────────────
    const isInv = activeTab === "Book Inventory Report";
    const isDue = activeTab === "Book Due Report";
    const isRet = activeTab === "Book Issue Return Report";
    const fileName  = isInv ? "book_inventory_report" : isDue ? "book_due_report" : isRet ? "book_issue_return_report" : "book_issue_report";
    const sheetName = isInv ? "Book Inventory Report" : isDue ? "Book Due Report" : isRet ? "Book Issue Return Report" : "Book Issue Report";

    const exportToCopy = () => {
        if (activeFiltered.length === 0) { toast.error("No data to copy"); return; }
        let text = "";
        if (isInv) {
            const rows = filteredInv as BookInventory[];
            text = ["Book Title\tBook Number\tISBN Number\tPublisher\tAuthor\tSubject\tRack Number\tQty\tAvailable\tIssued\tBook Price\tPost Date",
                ...rows.map(r => `${r.bookTitle}\t${r.bookNumber}\t${r.isbnNumber}\t${r.publisher}\t${r.author}\t${r.subject}\t${r.rackNumber}\t${r.qty}\t${r.available}\t${r.issued}\t${r.bookPrice}\t${r.postDate}`)].join("\n");
        } else if (isRet) {
            const rows = filteredRet as LibraryReturn[];
            text = ["Book Title\tBook Number\tIssue Date\tReturn Date\tMember ID\tLibrary Card Number\tIssue By\tMembers Type",
                ...rows.map(r => `${r.bookTitle}\t${r.bookNumber}\t${r.issueDate}\t${r.returnDate}\t${r.memberId}\t${r.cardNo}\t${r.issueBy}\t${r.memberType}`)].join("\n");
        } else {
            const rows = activeFiltered as LibraryIssue[];
            text = ["Book Title\tBook Number\tIssue Date\tDue Return Date\tMember ID\tLibrary Card Number\tAdmission No\tIssue By\tMembers Type",
                ...rows.map(r => `${r.bookTitle}\t${r.bookNumber}\t${r.issueDate}\t${r.dueDate}\t${r.memberId}\t${r.cardNo}\t${r.admissionNo}\t${r.issueBy}\t${r.memberType}`)].join("\n");
        }
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (activeFiltered.length === 0) { toast.error("No data to export"); return; }
        let mapped: Record<string, unknown>[];
        if (isInv) {
            mapped = (filteredInv as BookInventory[]).map(r => ({ "Book Title": r.bookTitle, "Book Number": r.bookNumber, "ISBN Number": r.isbnNumber, "Publisher": r.publisher, "Author": r.author, "Subject": r.subject, "Rack Number": r.rackNumber, "Qty": r.qty, "Available": r.available, "Issued": r.issued, "Book Price": r.bookPrice, "Post Date": r.postDate }));
        } else if (isRet) {
            mapped = (filteredRet as LibraryReturn[]).map(r => ({ "Book Title": r.bookTitle, "Book Number": r.bookNumber, "Issue Date": r.issueDate, "Return Date": r.returnDate, "Member ID": r.memberId, "Library Card Number": r.cardNo, "Issue By": r.issueBy, "Members Type": r.memberType }));
        } else {
            mapped = (activeFiltered as LibraryIssue[]).map(r => ({ "Book Title": r.bookTitle, "Book Number": r.bookNumber, "Issue Date": r.issueDate, "Due Return Date": r.dueDate, "Member ID": r.memberId, "Library Card Number": r.cardNo, "Admission No": r.admissionNo, "Issue By": r.issueBy, "Members Type": r.memberType }));
        }
        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        if (isCsv) { XLSX.writeFile(wb, `${fileName}.csv`, { bookType: "csv" }); toast.success("CSV downloaded"); }
        else       { XLSX.writeFile(wb, `${fileName}.xlsx`);                       toast.success("Excel file downloaded"); }
    };

    const exportToPDF = () => {
        if (activeFiltered.length === 0) { toast.error("No data to export"); return; }
        const doc = new jsPDF("landscape");
        if (isInv) {
            const rows = filteredInv as BookInventory[];
            autoTable(doc, { head: [["Book Title","Book Number","ISBN","Publisher","Author","Subject","Rack","Qty","Available","Issued","Price","Post Date"]], body: rows.map(r => [r.bookTitle,r.bookNumber,r.isbnNumber,r.publisher,r.author,r.subject,r.rackNumber,r.qty,r.available,r.issued,r.bookPrice,r.postDate]), theme: "grid" });
        } else if (isRet) {
            const rows = filteredRet as LibraryReturn[];
            autoTable(doc, { head: [["Book Title","Book Number","Issue Date","Return Date","Member ID","Card No","Issue By","Members Type"]], body: rows.map(r => [r.bookTitle,r.bookNumber,r.issueDate,r.returnDate,r.memberId,r.cardNo,r.issueBy,r.memberType]), theme: "grid" });
        } else {
            const rows = activeFiltered as LibraryIssue[];
            autoTable(doc, { head: [["Book Title","Book Number","Issue Date","Due Return Date","Member ID","Card No","Admission No","Issue By","Members Type"]], body: rows.map(r => [r.bookTitle,r.bookNumber,r.issueDate,r.dueDate,r.memberId,r.cardNo,r.admissionNo,r.issueBy,r.memberType]), theme: "grid" });
        }
        doc.save(`${fileName}.pdf`);
        toast.success("PDF downloaded");
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20 text-xs">
            {/* ── Gradient Header + Tab Cards ──────────────────────────────────── */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <BookOpen className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800 leading-none">Library Report</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">Book issue, due, return, and inventory reports</p>
                            </div>
                        </div>
                        <Link href="/user/library/books-issued" className="flex items-center gap-1.5 h-8 px-3.5 rounded-[10px] text-white text-[11px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 shadow-sm">
                            <Monitor className="h-3.5 w-3.5" />
                            Student Portal View
                        </Link>
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
                                        "flex items-center gap-3 p-3 px-4 rounded-lg border transition-all duration-300 cursor-pointer group relative overflow-hidden",
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

            {/* ── Book Issue Report ──────────────────────────────────────────── */}
            {activeTab === "Book Issue Report" && (
                <>
                    {/* Criteria */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">
                            Select Criteria
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            {/* Search Type */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Search Type
                                </Label>
                                <Select value={searchType} onValueChange={setSearchType}>
                                    <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {searchTypes.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Members Type */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Members Type
                                </Label>
                                <Select value={memberType} onValueChange={setMemberType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="Student">Student</SelectItem>
                                        <SelectItem value="Staff">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                onClick={handleSearch}
                                disabled={loading}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                            >
                                <Search className="h-4 w-4" />
                                {loading ? "Searching…" : "Search"}
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">
                            Book Issue Report
                        </h2>

                        {/* Toolbar */}
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
                                        <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
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
                                    <Button variant="ghost" size="icon" title="Copy"  onClick={exportToCopy}            className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded"><Copy          className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel()}    className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="CSV"   onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded"><FileBox         className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="PDF"   onClick={exportToPDF}             className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded"><FileText         className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="Print" onClick={() => window.print()}     className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded"><Printer          className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        </div>

                        {/* Results Table */}
                        <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1500px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Book Title           <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Book Number          <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Issue Date           <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Due Return Date      <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Member ID            <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Library Card Number  <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Admission No         <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Issue By             <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-right">Members Type</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={9} />
                                    ) : !isSearched ? (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={9} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">
                                                        No data available in table
                                                    </p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <BookMarked className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                            <Plus className="h-3 w-3 text-indigo-300" />
                                                        </div>
                                                    </div>
                                                    <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                        <span className="text-lg">←</span> Add new record or search with different criteria.
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.length > 0 ? (
                                        paginated.map((row, idx) => (
                                            <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-700 font-medium">{row.bookTitle}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.bookNumber}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.issueDate}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.dueDate}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.memberId}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 font-bold">{row.cardNo}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-500 font-bold">{row.admissionNo}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.issueBy}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-500">{row.memberType}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={9} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                No records match the selected filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination footer */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
                            <div>
                                Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                                {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                                {searchTerm && ` (filtered from ${issueList.length} total entries)`}
                            </div>

                            {issueList.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        disabled={safePage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                        className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold",
                                                safePage === page
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95"
                                                    : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                            )}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        disabled={safePage === totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                        className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ── Book Due Report ─────────────────────────────────────────────── */}
            {activeTab === "Book Due Report" && (
                <>
                    {/* Criteria */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">
                            Select Criteria
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Search Type
                                </Label>
                                <Select value={dueSearchType} onValueChange={setDueSearchType}>
                                    <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Today" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {searchTypes.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Members Type
                                </Label>
                                <Select value={dueMemberType} onValueChange={setDueMemberType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="Student">Student</SelectItem>
                                        <SelectItem value="Staff">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                onClick={handleDueSearch}
                                disabled={loading}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                            >
                                <Search className="h-4 w-4" />
                                {loading ? "Searching…" : "Search"}
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">
                            Book Due Report
                        </h2>

                        {/* Toolbar */}
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
                                        <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
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
                                    <Button variant="ghost" size="icon" title="Copy"  onClick={exportToCopy}             className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded"><Copy          className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel()}    className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="CSV"   onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded"><FileBox         className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="PDF"   onClick={exportToPDF}              className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded"><FileText         className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="Print" onClick={() => window.print()}     className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded"><Printer          className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        </div>

                        {/* Results Table */}
                        <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1500px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Book Title          <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Book Number         <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Issue Date          <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Due Return Date     <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Member ID           <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Library Card No.    <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Admission No        <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Issue By            <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-right">Members Type</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={9} />
                                    ) : !dueIsSearched ? (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={9} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <BookMarked className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                            <Plus className="h-3 w-3 text-indigo-300" />
                                                        </div>
                                                    </div>
                                                    <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                        <span className="text-lg">←</span> Add new record or search with different criteria.
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.length > 0 ? (
                                        paginated.map((row, idx) => (
                                            <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-700 font-medium">{row.bookTitle}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.bookNumber}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.issueDate}</TableCell>
                                                <TableCell className="py-3 px-4 text-rose-500 font-bold">{row.dueDate}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.memberId}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 font-bold">{row.cardNo}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-500 font-bold">{row.admissionNo}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.issueBy}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-500">{row.memberType}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={9} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                No records match the selected filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination footer */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
                            <div>
                                Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                                {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                                {searchTerm && ` (filtered from ${dueList.length} total entries)`}
                            </div>
                            {dueList.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        disabled={safePage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                        className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold",
                                                safePage === page
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95"
                                                    : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                            )}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        disabled={safePage === totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                        className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ── Book Inventory Report ─────────────────────────────────────── */}
            {activeTab === "Book Inventory Report" && (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type</Label>
                                <Select value={invSearchType} onValueChange={setInvSearchType}>
                                    <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Today" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {searchTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleInvSearch} disabled={loading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]">
                                <Search className="h-4 w-4" />
                                {loading ? "Searching…" : "Search"}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Book Inventory Report</h2>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Input placeholder="Search" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                    <Select value={itemsPerPage} onValueChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" title="Copy"  onClick={exportToCopy}             className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded"><Copy          className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel()}    className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="CSV"   onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded"><FileBox         className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="PDF"   onClick={exportToPDF}              className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded"><FileText         className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="Print" onClick={() => window.print()}     className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded"><Printer          className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1800px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Book Title      <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Book Number     <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">ISBN Number     <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Publisher       <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Author          <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Subject         <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Rack Number     <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Qty             <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Available       <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Issued          <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Book Price      <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Post Date       <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={12} />
                                    ) : !invIsSearched ? (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={12} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner"><BookMarked className="h-8 w-8 text-gray-200" /></div>
                                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center"><Plus className="h-3 w-3 text-indigo-300" /></div>
                                                    </div>
                                                    <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1"><span className="text-lg">←</span> Select criteria and click Search to load books.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedInv.length > 0 ? (
                                        paginatedInv.map((row) => (
                                            <TableRow key={row.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-700 font-medium">{row.bookTitle}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.bookNumber}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.isbnNumber}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.publisher}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.author}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-500 font-medium">{row.subject}</TableCell>
                                                <TableCell className="py-3 px-4 text-amber-600 font-bold">{row.rackNumber}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-700 font-bold text-center">{row.qty}</TableCell>
                                                <TableCell className="py-3 px-4 text-emerald-600 font-bold text-center">{row.available}</TableCell>
                                                <TableCell className="py-3 px-4 text-rose-500 font-bold text-center">{row.issued}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-700 font-medium">${row.bookPrice}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.postDate}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent"><TableCell colSpan={12} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">No books match the search.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
                            <div>
                                Showing {filteredInv.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + sizeNum, filteredInv.length)} of {filteredInv.length} entries
                                {searchTerm && ` (filtered from ${inventoryList.length} total entries)`}
                            </div>
                            {inventoryList.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <button disabled={safePage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"><ChevronLeft className="h-4 w-4" /></button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button key={page} onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold", safePage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95" : "bg-white hover:bg-gray-50/80 text-gray-500 rounded-xl hover:shadow-md active:scale-95 border border-gray-100")}>{page}</button>
                                    ))}
                                    <button disabled={safePage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"><ChevronRight className="h-4 w-4" /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ── Book Issue Return Report ─────────────────────────────────── */}
            {activeTab === "Book Issue Return Report" && (
                <>
                    {/* Criteria */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type</Label>
                                <Select value={retSearchType} onValueChange={setRetSearchType}>
                                    <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Today" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {searchTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleRetSearch} disabled={loading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]">
                                <Search className="h-4 w-4" />
                                {loading ? "Searching…" : "Search"}
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Book Issue Return Report</h2>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Input placeholder="Search" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                    <Select value={itemsPerPage} onValueChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" title="Copy"  onClick={exportToCopy}             className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded"><Copy          className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel()}    className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="CSV"   onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded"><FileBox         className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="PDF"   onClick={exportToPDF}              className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded"><FileText         className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" title="Print" onClick={() => window.print()}     className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded"><Printer          className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Book Title          <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Book Number         <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Issue Date          <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Return Date         <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Member ID           <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Library Card No.    <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Issue By            <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-right">Member Type</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={8} />
                                    ) : !retIsSearched ? (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={8} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner"><BookMarked className="h-8 w-8 text-gray-200" /></div>
                                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center"><Plus className="h-3 w-3 text-indigo-300" /></div>
                                                    </div>
                                                    <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1"><span className="text-lg">←</span> Add new record or search with different criteria.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedRet.length > 0 ? (
                                        paginatedRet.map((row) => (
                                            <TableRow key={row.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-700 font-medium">{row.bookTitle}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.bookNumber}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.issueDate}</TableCell>
                                                <TableCell className="py-3 px-4 text-emerald-600 font-bold">{row.returnDate}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.memberId}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 font-bold">{row.cardNo}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.issueBy}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-500">{row.memberType}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent"><TableCell colSpan={8} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">No records match the selected filters.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
                            <div>
                                Showing {filteredRet.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + sizeNum, filteredRet.length)} of {filteredRet.length} entries
                                {searchTerm && ` (filtered from ${returnList.length} total entries)`}
                            </div>
                            {returnList.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <button disabled={safePage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"><ChevronLeft className="h-4 w-4" /></button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button key={page} onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold", safePage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95" : "bg-white hover:bg-gray-50/80 text-gray-500 rounded-xl hover:shadow-md active:scale-95 border border-gray-100")}>{page}</button>
                                    ))}
                                    <button disabled={safePage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"><ChevronRight className="h-4 w-4" /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
