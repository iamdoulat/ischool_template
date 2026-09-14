"use client";

import { useState } from "react";
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
import { cn, toLocaleNumber, translateSubjectName } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/providers/language-provider";

function formatDateDDMMYYYY(val: string | null | undefined, langCode: string = "en"): string {
    if (!val || val === "-" || val === "null") return "-";
    let day = "";
    let month = "";
    let year = "";
    if (val.includes("-")) {
        const parts = val.split("T")[0].split("-");
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                year = parts[0];
                month = parts[1].padStart(2, "0");
                day = parts[2].padStart(2, "0");
            } else {
                day = parts[0].padStart(2, "0");
                month = parts[1].padStart(2, "0");
                year = parts[2];
            }
        }
    } else if (val.includes("/")) {
        const parts = val.split("/");
        if (parts.length === 3) {
            if (parts[2].length === 4) {
                day = parts[0].padStart(2, "0");
                month = parts[1].padStart(2, "0");
                year = parts[2];
            } else if (parts[0].length === 4) {
                year = parts[0];
                month = parts[1].padStart(2, "0");
                day = parts[2].padStart(2, "0");
            }
        }
    }
    if (day && month && year) {
        return toLocaleNumber(`${day}/${month}/${year}`, langCode);
    }
    return toLocaleNumber(val, langCode);
}

function translateMemberType(type: string | null | undefined, t: (k: string) => string): string {
    if (!type || type === "-") return "-";
    const lower = type.toLowerCase();
    if (lower === "student") return t("student") || "Student";
    if (lower === "staff") return t("staff") || "Staff";
    if (lower === "all") return t("all") || "All";
    return type;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const reportLinks = [
    { id: "Book Issue Report", key: "book_issue_report", icon: FileText },
    { id: "Book Due Report", key: "book_due_report", icon: CalendarClock },
    { id: "Book Inventory Report", key: "book_inventory_report", icon: Archive },
    { id: "Book Issue Return Report", key: "book_issue_return_report", icon: RefreshCcw },
];

const searchTypes = [
    { key: "today",       label: "Today",       value: "today"      },
    { key: "this_week",   label: "This Week",   value: "this_week"  },
    { key: "this_month",  label: "This Month",  value: "this_month" },
    { key: "last_month",  label: "Last Month",  value: "last_month" },
    { key: "this_year",   label: "This Year",   value: "this_year"  },
    { key: "all_time",    label: "All Time",    value: "all"         },
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
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
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
        <div className="space-y-6 pb-20 text-xs">
            {/* Standalone Edge-to-Edge Gradient Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <BookOpen className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("library_report")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("library_report_description")}
                        </p>
                    </div>
                </div>
                <Link
                    href="/user/library/books-issued"
                    className="flex items-center gap-1.5 h-8 px-4 rounded-full text-white text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] transition-all active:scale-95 shadow-md shrink-0"
                >
                    <Monitor className="h-3.5 w-3.5" />
                    {t("student_portal_view")}
                </Link>
            </div>

            {/* Navigation Grid of 4 Report Tabs */}
            <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {reportLinks.map((link) => {
                        const isActive = activeTab === link.id;
                        return (
                            <div
                                key={link.id}
                                onClick={() => {
                                    setActiveTab(link.id);
                                    setSearchTerm("");
                                    setCurrentPage(1);
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
                                    <link.icon className="h-4 w-4" />
                                </div>
                                <span className={cn(
                                    "text-xs font-bold tracking-tight transition-colors duration-300",
                                    isActive ? "text-[#6366f1]" : "text-gray-700"
                                )}>
                                    {t(link.key)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Book Issue Report ──────────────────────────────────────────── */}
            {activeTab === "Book Issue Report" && (
                <>
                    {/* Criteria */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">{t("select_criteria") || "Select Criteria"}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                            {/* Search Type */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("search_type") || "Search Type"}</Label>
                                <Select value={searchType} onValueChange={setSearchType}>
                                    <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue>{searchTypes.find(st => st.value === searchType) ? (t(searchTypes.find(st => st.value === searchType)!.key) || searchTypes.find(st => st.value === searchType)!.label) : searchType}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {searchTypes.map(st => <SelectItem key={st.value} value={st.value}>{t(st.key) || st.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Members Type */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("member_type") || "Members Type"}</Label>
                                <Select value={memberType} onValueChange={setMemberType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue>{memberType === "all" ? (t("all") || "All") : memberType === "Student" ? (t("student") || "Student") : memberType === "Staff" ? (t("staff") || "Staff") : memberType}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("all") || "All"}</SelectItem>
                                        <SelectItem value="Student">{t("student") || "Student"}</SelectItem>
                                        <SelectItem value="Staff">{t("staff") || "Staff"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Search Button Inline */}
                            <div className="flex items-end">
                                <Button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold h-8 flex items-center justify-center gap-2 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    <Search className="h-3.5 w-3.5" />
                                    {loading ? (t("searching") || "Searching…") : (t("search") || "Search")}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[420px] flex flex-col justify-between transition-all animate-fadeIn">
                        <div className="space-y-4 flex-1 flex flex-col">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("book_issue_report") || "Book Issue Report"}
                            </h2>

                            {/* Toolbar */}
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
                                        <Button variant="ghost" size="icon" title={t("copy") || "Copy"}  onClick={exportToCopy}            className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded"><Copy          className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel()}    className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("csv") || "CSV"}   onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded"><FileBox         className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("pdf") || "PDF"}   onClick={exportToPDF}             className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded"><FileText         className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={() => window.print()}     className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded"><Printer          className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </div>

                            {/* Results Table */}
                            <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar flex-1">
                                <Table className="min-w-[1500px]">
                                    <TableHeader className="bg-transparent border-b border-gray-100">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                            <TableHead className="py-3 px-4">{t("book_title") || "Book Title"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("book_number") || "Book Number"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("issue_date") || "Issue Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("due_date") || "Due Return Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("member_id") || "Member ID"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("library_card_no") || t("card_no") || "Library Card Number"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("admission_no") || "Admission No"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("issued_by") || "Issue By"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-right">{t("member_type") || "Members Type"}</TableHead>
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
                                                            {t("no_data_available_in_table") || "No data available in table"}
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
                                                            <span className="text-lg">←</span> {t("add_record_or_search_criteria") || "Add new record or search with different criteria."}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : paginated.length > 0 ? (
                                            paginated.map((row, idx) => (
                                                <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{row.bookTitle}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(row.bookNumber, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(row.issueDate, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(row.dueDate, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(row.memberId, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-600 font-bold">{toLocaleNumber(row.cardNo, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-500 font-bold">{toLocaleNumber(row.admissionNo, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.issueBy}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-500">{translateMemberType(row.memberType, t)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell colSpan={9} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                    {t("no_records_match_filters") || "No records match the selected filters."}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Pagination footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100 mt-auto">
                            <div>
                                {t("showing") || "Showing"} {toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, langCode)} {t("to") || "to"}{" "}
                                {toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode)} {t("of") || "of"} {toLocaleNumber(totalEntries, langCode)} {t("entries") || "entries"}
                                {searchTerm && ` (${t("filtered_from") || "filtered from"} ${toLocaleNumber(issueList.length, langCode)} ${t("total_entries") || "total entries"})`}
                            </div>

                            {issueList.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        disabled={safePage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                        className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "h-8 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-all rounded-lg",
                                                safePage === page
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs font-bold"
                                                    : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200"
                                            )}
                                        >
                                            {toLocaleNumber(page, langCode)}
                                        </button>
                                    ))}

                                    <button
                                        disabled={safePage === totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                        className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
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
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">{t("select_criteria") || "Select Criteria"}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("search_type") || "Search Type"}</Label>
                                <Select value={dueSearchType} onValueChange={setDueSearchType}>
                                    <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue>{searchTypes.find(st => st.value === dueSearchType) ? (t(searchTypes.find(st => st.value === dueSearchType)!.key) || searchTypes.find(st => st.value === dueSearchType)!.label) : dueSearchType}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {searchTypes.map(st => <SelectItem key={st.value} value={st.value}>{t(st.key) || st.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("member_type") || "Members Type"}</Label>
                                <Select value={dueMemberType} onValueChange={setDueMemberType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue>{dueMemberType === "all" ? (t("all") || "All") : dueMemberType === "Student" ? (t("student") || "Student") : dueMemberType === "Staff" ? (t("staff") || "Staff") : dueMemberType}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("all") || "All"}</SelectItem>
                                        <SelectItem value="Student">{t("student") || "Student"}</SelectItem>
                                        <SelectItem value="Staff">{t("staff") || "Staff"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleDueSearch}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold h-8 flex items-center justify-center gap-2 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    <Search className="h-3.5 w-3.5" />
                                    {loading ? (t("searching") || "Searching…") : (t("search") || "Search")}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[420px] flex flex-col justify-between transition-all animate-fadeIn">
                        <div className="space-y-4 flex-1 flex flex-col">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("book_due_report") || "Book Due Report"}
                            </h2>

                            {/* Toolbar */}
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
                                        <Button variant="ghost" size="icon" title={t("copy") || "Copy"}  onClick={exportToCopy}             className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded"><Copy          className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel()}    className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("csv") || "CSV"}   onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded"><FileBox         className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("pdf") || "PDF"}   onClick={exportToPDF}              className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded"><FileText         className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={() => window.print()}     className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded"><Printer          className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </div>

                            {/* Results Table */}
                            <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar flex-1">
                                <Table className="min-w-[1500px]">
                                    <TableHeader className="bg-transparent border-b border-gray-100">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                            <TableHead className="py-3 px-4">{t("book_title") || "Book Title"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("book_number") || "Book Number"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("issue_date") || "Issue Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("due_date") || "Due Return Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("member_id") || "Member ID"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("library_card_no") || t("card_no") || "Library Card Number"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("admission_no") || "Admission No"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("issued_by") || "Issue By"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-right">{t("member_type") || "Members Type"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableSkeleton cols={9} />
                                        ) : !dueIsSearched ? (
                                            <TableRow className="hover:bg-transparent h-64">
                                                <TableCell colSpan={9} className="text-center py-12">
                                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                        <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">{t("no_data_available_in_table") || "No data available in table"}</p>
                                                        <div className="relative">
                                                            <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                                <BookMarked className="h-8 w-8 text-gray-200" />
                                                            </div>
                                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                                <Plus className="h-3 w-3 text-indigo-300" />
                                                            </div>
                                                        </div>
                                                        <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                            <span className="text-lg">←</span> {t("add_record_or_search_criteria") || "Add new record or search with different criteria."}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : paginated.length > 0 ? (
                                            paginated.map((row, idx) => (
                                                <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{row.bookTitle}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(row.bookNumber, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(row.issueDate, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-rose-500 font-bold">{formatDateDDMMYYYY(row.dueDate, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(row.memberId, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-600 font-bold">{toLocaleNumber(row.cardNo, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-500 font-bold">{toLocaleNumber(row.admissionNo, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.issueBy}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-500">{translateMemberType(row.memberType, t)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell colSpan={9} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                    {t("no_records_match_filters") || "No records match the selected filters."}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Pagination footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100 mt-auto">
                            <div>
                                {t("showing") || "Showing"} {toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, langCode)} {t("to") || "to"}{" "}
                                {toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode)} {t("of") || "of"} {toLocaleNumber(totalEntries, langCode)} {t("entries") || "entries"}
                                {searchTerm && ` (${t("filtered_from") || "filtered from"} ${toLocaleNumber(dueList.length, langCode)} ${t("total_entries") || "total entries"})`}
                            </div>
                            {dueList.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        disabled={safePage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                        className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "h-8 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-all rounded-lg",
                                                safePage === page
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs font-bold"
                                                    : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200"
                                            )}
                                        >
                                            {toLocaleNumber(page, langCode)}
                                        </button>
                                    ))}
                                    <button
                                        disabled={safePage === totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                        className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
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
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">{t("select_criteria") || "Select Criteria"}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("search_type") || "Search Type"}</Label>
                                <Select value={invSearchType} onValueChange={setInvSearchType}>
                                    <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue>{searchTypes.find(st => st.value === invSearchType) ? (t(searchTypes.find(st => st.value === invSearchType)!.key) || searchTypes.find(st => st.value === invSearchType)!.label) : invSearchType}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {searchTypes.map(st => <SelectItem key={st.value} value={st.value}>{t(st.key) || st.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleInvSearch}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold h-8 flex items-center justify-center gap-2 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    <Search className="h-3.5 w-3.5" />
                                    {loading ? (t("searching") || "Searching…") : (t("search") || "Search")}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[420px] flex flex-col justify-between transition-all animate-fadeIn">
                        <div className="space-y-4 flex-1 flex flex-col">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("book_inventory_report") || "Book Inventory Report"}
                            </h2>
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
                                            <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">{toLocaleNumber(10, langCode)}</SelectItem>
                                                <SelectItem value="25">{toLocaleNumber(25, langCode)}</SelectItem>
                                                <SelectItem value="50">{toLocaleNumber(50, langCode)}</SelectItem>
                                                <SelectItem value="100">{toLocaleNumber(100, langCode)}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Button variant="ghost" size="icon" title={t("copy") || "Copy"}  onClick={exportToCopy}             className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded"><Copy          className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel()}    className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("csv") || "CSV"}   onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded"><FileBox         className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("pdf") || "PDF"}   onClick={exportToPDF}              className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded"><FileText         className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={() => window.print()}     className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded"><Printer          className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar flex-1">
                                <Table className="min-w-[1800px]">
                                    <TableHeader className="bg-transparent border-b border-gray-100">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                            <TableHead className="py-3 px-4">{t("book_title") || "Book Title"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("book_number") || "Book Number"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("isbn_no") || "ISBN Number"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("publisher") || "Publisher"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("author") || "Author"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("subject") || "Subject"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("rack_number") || "Rack Number"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-center">{t("qty") || "Qty"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-center">{t("available") || "Available"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-center">{t("issued") || "Issued"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("book_price") || "Book Price"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("post_date") || "Post Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableSkeleton cols={12} />
                                        ) : !invIsSearched ? (
                                            <TableRow className="hover:bg-transparent h-64">
                                                <TableCell colSpan={12} className="text-center py-12">
                                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                        <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">{t("no_data_available_in_table") || "No data available in table"}</p>
                                                        <div className="relative">
                                                            <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner"><BookMarked className="h-8 w-8 text-gray-200" /></div>
                                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center"><Plus className="h-3 w-3 text-indigo-300" /></div>
                                                        </div>
                                                        <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1"><span className="text-lg">←</span> {t("select_criteria_to_load_books") || "Select criteria and click Search to load books."}</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedInv.length > 0 ? (
                                            paginatedInv.map((row) => (
                                                <TableRow key={row.id} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{row.bookTitle}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(row.bookNumber, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(row.isbnNumber, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{row.publisher}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.author}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-500 font-medium">{translateSubjectName(row.subject, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-amber-600 font-bold">{toLocaleNumber(row.rackNumber, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-700 font-bold text-center">{toLocaleNumber(row.qty, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-emerald-600 font-bold text-center">{toLocaleNumber(row.available, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-rose-500 font-bold text-center">{toLocaleNumber(row.issued, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{toLocaleNumber(row.bookPrice, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(row.postDate, langCode)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow className="hover:bg-transparent"><TableCell colSpan={12} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">{t("no_books_match_search") || "No books match the search."}</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100 mt-auto">
                            <div>
                                {t("showing") || "Showing"} {toLocaleNumber(filteredInv.length > 0 ? startIndex + 1 : 0, langCode)} {t("to") || "to"} {toLocaleNumber(Math.min(startIndex + sizeNum, filteredInv.length), langCode)} {t("of") || "of"} {toLocaleNumber(filteredInv.length, langCode)} {t("entries") || "entries"}
                                {searchTerm && ` (${t("filtered_from") || "filtered from"} ${toLocaleNumber(inventoryList.length, langCode)} ${t("total_entries") || "total entries"})`}
                            </div>
                            {inventoryList.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <button disabled={safePage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"><ChevronLeft className="h-4 w-4" /></button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button key={page} onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-all rounded-lg", safePage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs font-bold" : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200")}>{toLocaleNumber(page, langCode)}</button>
                                    ))}
                                    <button disabled={safePage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"><ChevronRight className="h-4 w-4" /></button>
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
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">{t("select_criteria") || "Select Criteria"}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("search_type") || "Search Type"}</Label>
                                <Select value={retSearchType} onValueChange={setRetSearchType}>
                                    <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue>{searchTypes.find(st => st.value === retSearchType) ? (t(searchTypes.find(st => st.value === retSearchType)!.key) || searchTypes.find(st => st.value === retSearchType)!.label) : retSearchType}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {searchTypes.map(st => <SelectItem key={st.value} value={st.value}>{t(st.key) || st.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleRetSearch}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold h-8 flex items-center justify-center gap-2 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    <Search className="h-3.5 w-3.5" />
                                    {loading ? (t("searching") || "Searching…") : (t("search") || "Search")}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[420px] flex flex-col justify-between transition-all animate-fadeIn">
                        <div className="space-y-4 flex-1 flex flex-col">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("book_issue_return_report") || "Book Issue Return Report"}
                            </h2>
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
                                            <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">{toLocaleNumber(10, langCode)}</SelectItem>
                                                <SelectItem value="25">{toLocaleNumber(25, langCode)}</SelectItem>
                                                <SelectItem value="50">{toLocaleNumber(50, langCode)}</SelectItem>
                                                <SelectItem value="100">{toLocaleNumber(100, langCode)}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Button variant="ghost" size="icon" title={t("copy") || "Copy"}  onClick={exportToCopy}             className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded"><Copy          className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel()}    className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("csv") || "CSV"}   onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded"><FileBox         className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("pdf") || "PDF"}   onClick={exportToPDF}              className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded"><FileText         className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={() => window.print()}     className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded"><Printer          className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar flex-1">
                                <Table className="min-w-[1200px]">
                                    <TableHeader className="bg-transparent border-b border-gray-100">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                            <TableHead className="py-3 px-4">{t("book_title") || "Book Title"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("book_number") || "Book Number"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("issue_date") || "Issue Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("return_date") || "Return Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("member_id") || "Member ID"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("library_card_no") || t("card_no") || "Library Card Number"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4">{t("issued_by") || "Issue By"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-right">{t("member_type") || "Member Type"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableSkeleton cols={8} />
                                        ) : !retIsSearched ? (
                                            <TableRow className="hover:bg-transparent h-64">
                                                <TableCell colSpan={8} className="text-center py-12">
                                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                        <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">{t("no_data_available_in_table") || "No data available in table"}</p>
                                                        <div className="relative">
                                                            <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner"><BookMarked className="h-8 w-8 text-gray-200" /></div>
                                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center"><Plus className="h-3 w-3 text-indigo-300" /></div>
                                                        </div>
                                                        <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1"><span className="text-lg">←</span> {t("add_record_or_search_criteria") || "Add new record or search with different criteria."}</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedRet.length > 0 ? (
                                            paginatedRet.map((row) => (
                                                <TableRow key={row.id} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{row.bookTitle}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(row.bookNumber, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(row.issueDate, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-emerald-600 font-bold">{formatDateDDMMYYYY(row.returnDate, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(row.memberId, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-600 font-bold">{toLocaleNumber(row.cardNo, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.issueBy}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-500">{translateMemberType(row.memberType, t)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow className="hover:bg-transparent"><TableCell colSpan={8} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">{t("no_records_match_filters") || "No records match the selected filters."}</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100 mt-auto">
                            <div>
                                {t("showing") || "Showing"} {toLocaleNumber(filteredRet.length > 0 ? startIndex + 1 : 0, langCode)} {t("to") || "to"} {toLocaleNumber(Math.min(startIndex + sizeNum, filteredRet.length), langCode)} {t("of") || "of"} {toLocaleNumber(filteredRet.length, langCode)} {t("entries") || "entries"}
                                {searchTerm && ` (${t("filtered_from") || "filtered from"} ${toLocaleNumber(returnList.length, langCode)} ${t("total_entries") || "total entries"})`}
                            </div>
                            {returnList.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <button disabled={safePage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"><ChevronLeft className="h-4 w-4" /></button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button key={page} onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-all rounded-lg", safePage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs font-bold" : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200")}>{toLocaleNumber(page, langCode)}</button>
                                    ))}
                                    <button disabled={safePage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"><ChevronRight className="h-4 w-4" /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
