"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Search, ChevronLeft, ChevronRight, ArrowUpDown,
    Copy, FileSpreadsheet, FileDown, Printer, Loader2, BookOpen,
    BookMarked, Calendar, CalendarCheck, User, Hash, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type BookIssued = {
    id: number;
    title: string;
    bookNumber: string;
    author: string;
    issueDate: string;
    dueReturnDate: string;
    returnDate: string;
};

const PAGE_SIZES = [10, 25, 50, 100];
const fmt = (d: string) => (d ? formatDate(d) : "—");

type SortKey = keyof Omit<BookIssued, "id">;

export default function UserBooksIssuedPage() {
    const { t } = useTranslation();
    const [books, setBooks] = useState<BookIssued[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortKey, setSortKey] = useState<SortKey>("issueDate");
    const [sortAsc, setSortAsc] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await api.get("/user/library/books-issued");
                if (res.data.success) {
                    setBooks(res.data.data ?? []);
                } else {
                    toast({ variant: "destructive", title: t("error"), description: res.data.message || t("failed_to_load_books") });
                }
            } catch {
                toast({ variant: "destructive", title: t("error"), description: t("failed_to_load_issued_books") });
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
    }, [toast]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc((a) => !a);
        else { setSortKey(key); setSortAsc(true); }
        setCurrentPage(1);
    };

    const filtered = useMemo(() => {
        const s = searchTerm.toLowerCase();
        return books.filter((b) =>
            b.title.toLowerCase().includes(s) ||
            b.bookNumber.toLowerCase().includes(s) ||
            b.author.toLowerCase().includes(s)
        );
    }, [books, searchTerm]);

    // ISO date strings sort correctly with localeCompare (lexicographic = chronological)
    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const av = a[sortKey] ?? "";
            const bv = b[sortKey] ?? "";
            return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
        });
    }, [filtered, sortKey, sortAsc]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const start = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, sorted.length);

    const isOverdue = (b: BookIssued) =>
        !b.returnDate && !!b.dueReturnDate &&
        new Date(b.dueReturnDate + "T23:59:59") < new Date();

    const overdueCount = useMemo(() => books.filter(isOverdue).length, [books]);
    const outstandingCount = useMemo(() => books.filter((b) => !b.returnDate).length, [books]);

    const getStatusBadge = (b: BookIssued) => {
        if (b.returnDate)
            return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">{t("returned")}</Badge>;
        if (isOverdue(b))
            return <Badge className="bg-red-100 text-red-600 border-red-200 hover:bg-red-100 gap-1"><AlertTriangle className="h-3 w-3" />{t("overdue")}</Badge>;
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">{t("issued")}</Badge>;
    };

    const copyToClipboard = useCallback(() => {
        const text = filtered.map(b =>
            [b.title, b.bookNumber, b.author, fmt(b.issueDate), fmt(b.dueReturnDate), b.returnDate ? fmt(b.returnDate) : "—"].join("\t")
        ).join("\n");
        navigator.clipboard.writeText(text);
        toast({ title: t("copied_to_clipboard") });
    }, [filtered, toast]);

    const exportToExcel = useCallback(() => {
        const ws = XLSX.utils.json_to_sheet(filtered.map(b => ({
            [t("book_title")]: b.title,
            [t("book_number")]: b.bookNumber,
            [t("author")]: b.author,
            [t("issue_date")]: fmt(b.issueDate),
            [t("due_return_date")]: fmt(b.dueReturnDate),
            [t("return_date")]: b.returnDate ? fmt(b.returnDate) : "",
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("books_issued"));
        XLSX.writeFile(wb, "books-issued.xlsx");
    }, [filtered]);

    const exportToPDF = useCallback(() => {
        const doc = new jsPDF();
        doc.text(t("books_issued"), 14, 16);
        autoTable(doc, {
            head: [[t("book_title"), t("book_no"), t("author"), t("issue_date"), t("due_date"), t("return_date")]],
            body: filtered.map(b => [b.title, b.bookNumber, b.author, fmt(b.issueDate), fmt(b.dueReturnDate), b.returnDate ? fmt(b.returnDate) : "—"]),
            startY: 22,
        });
        doc.save("books-issued.pdf");
    }, [filtered]);

    const SortHead = ({ label, field, className }: { label: string; field: SortKey; className?: string }) => (
        <TableHead
            className={cn("font-bold text-gray-700 cursor-pointer select-none py-3 px-4", className)}
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center gap-1">
                {label}
                <ArrowUpDown className={cn("h-3 w-3 opacity-40", sortKey === field && "opacity-100 text-[#6366F1]")} />
            </div>
        </TableHead>
    );

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header (Print button on the right) ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BookMarked className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("books_issued")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading
                                    ? t("loading")
                                    : `${books.length} ${t("record").toLowerCase()}${books.length === 1 ? "" : "s"} · ${outstandingCount} ${t("outstanding").toLowerCase()}${overdueCount ? ` · ${overdueCount} ${t("overdue").toLowerCase()}` : ""}`}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => window.print()}
                        title={t("print")}
                        className="h-9 shrink-0 px-3.5 gap-1.5 rounded-[10px] text-white text-[12px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 print:hidden"
                    >
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("print")}</span>
                    </Button>
                </div>

                <CardContent className="p-4">
                    {/* Overdue alert */}
                    {!loading && overdueCount > 0 && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-[12px] text-red-700 print:hidden">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>
                                {t("you_have")} <span className="font-bold">{overdueCount}</span> {t("overdue_book").toLowerCase()}{overdueCount === 1 ? "" : "s"}. {t("please_return_to_library")}
                            </span>
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 print:hidden">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search_title_book_no_author")}
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-8 h-9 text-sm rounded-[10px]"
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                                <SelectTrigger className="h-9 w-[70px] text-[12px] border border-gray-200 bg-white rounded-[10px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map((s) => (
                                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center border border-gray-200 rounded-[10px] overflow-hidden">
                                {[
                                    { icon: Copy, label: t("copy"), action: copyToClipboard },
                                    { icon: FileSpreadsheet, label: t("excel"), action: exportToExcel },
                                    { icon: FileDown, label: t("pdf"), action: exportToPDF },
                                    { icon: Printer, label: t("print"), action: () => window.print() },
                                ].map(({ icon: Icon, label, action }, i, arr) => (
                                    <Button
                                        key={label}
                                        variant="ghost"
                                        size="icon"
                                        title={label}
                                        onClick={action}
                                        className={cn(
                                            "h-9 w-9 rounded-none hover:bg-gray-100",
                                            i < arr.length - 1 && "border-r border-gray-200"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 text-gray-500" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Desktop table ── */}
                    <div className="hidden md:block rounded-md border border-gray-200 overflow-x-auto print:hidden">
                        <Table className="min-w-[860px]">
                            <TableHeader>
                                <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-gray-200">
                                    <SortHead label={t("book_title")} field="title" className="w-[28%]" />
                                    <SortHead label={t("book_number")} field="bookNumber" className="w-[14%]" />
                                    <SortHead label={t("author")} field="author" className="w-[18%]" />
                                    <SortHead label={t("issue_date")} field="issueDate" className="w-[13%]" />
                                    <SortHead label={t("due_return_date")} field="dueReturnDate" className="w-[13%]" />
                                    <TableHead className="font-bold text-gray-700 py-3 px-4 w-[8%]">{t("return_date")}</TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3 px-4 text-center w-[9%]">{t("status")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                <span>{t("loading")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                <BookOpen className="h-8 w-8 opacity-30" />
                                                <span className="text-sm">{t("no_books_issued")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginated.map((b) => (
                                        <TableRow
                                            key={b.id}
                                            className={cn(
                                                "text-[13px] border-b border-gray-100 transition-colors",
                                                b.returnDate
                                                    ? "bg-green-50/60 hover:bg-green-50"
                                                    : isOverdue(b)
                                                        ? "bg-red-50/60 hover:bg-red-50"
                                                        : "hover:bg-gray-50/60"
                                            )}
                                        >
                                            <TableCell className="py-3 px-4 font-medium text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[#6366F1]">
                                                        <BookOpen className="h-3.5 w-3.5" />
                                                    </span>
                                                    <span className="truncate max-w-[240px]">{b.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{b.bookNumber || "—"}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{b.author || "—"}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{fmt(b.issueDate)}</TableCell>
                                            <TableCell className={cn(
                                                "py-3 px-4 font-medium",
                                                isOverdue(b) ? "text-red-600" : "text-gray-600"
                                            )}>
                                                {fmt(b.dueReturnDate)}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{b.returnDate ? fmt(b.returnDate) : "—"}</TableCell>
                                            <TableCell className="py-3 px-4 text-center">{getStatusBadge(b)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* ── Mobile cards ── */}
                    <div className="md:hidden space-y-3 print:hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>{t("loading")}</span>
                            </div>
                        ) : paginated.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                                <BookOpen className="h-8 w-8 opacity-30" />
                                <span className="text-sm">{t("no_books_issued")}</span>
                            </div>
                        ) : (
                            paginated.map((b) => (
                                <div
                                    key={b.id}
                                    className={cn(
                                        "rounded-xl border p-3.5 shadow-sm",
                                        b.returnDate
                                            ? "border-green-200 bg-green-50/50"
                                            : isOverdue(b)
                                                ? "border-red-200 bg-red-50/50"
                                                : "border-gray-200 bg-white"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10">
                                                <BookOpen className="h-4.5 w-4.5 text-[#6366F1]" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-bold text-gray-800 leading-snug line-clamp-2">{b.title}</p>
                                                {b.bookNumber && (
                                                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Hash className="h-3 w-3" /> {b.bookNumber}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {getStatusBadge(b)}
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                                        {b.author && (
                                            <span className="flex items-center gap-1.5 col-span-2 min-w-0">
                                                <User className="h-3 w-3 text-gray-400 shrink-0" />
                                                <span className="truncate">{b.author}</span>
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3 text-gray-400" />
                                            {t("issued")}: <span className="font-medium text-gray-700">{fmt(b.issueDate)}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className={cn("h-3 w-3", isOverdue(b) ? "text-red-400" : "text-gray-400")} />
                                            {t("due")}: <span className={cn("font-medium", isOverdue(b) ? "text-red-600" : "text-gray-700")}>{fmt(b.dueReturnDate)}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5 col-span-2">
                                            <CalendarCheck className="h-3 w-3 text-gray-400" />
                                            {t("returned")}: <span className="font-medium text-gray-700">{b.returnDate ? fmt(b.returnDate) : "—"}</span>
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && (
                        <div className="flex items-center justify-between mt-4 gap-3 flex-wrap print:hidden">
                            <span className="text-[12px] text-gray-500">
                                {sorted.length === 0
                                    ? t("no_entries")
                                    : `${t("showing")} ${start} ${t("to")} ${end} ${t("of")} ${sorted.length} ${t("entries")}`}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    size="icon"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                    className="h-8 w-8 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                    .reduce<(number | "…")[]>((acc, p, i, arr) => {
                                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, i) =>
                                        p === "…" ? (
                                            <span key={`ellipsis-${i}`} className="text-gray-400 text-[12px] px-1">…</span>
                                        ) : (
                                            <Button
                                                key={p}
                                                size="icon"
                                                onClick={() => setCurrentPage(p as number)}
                                                className={cn(
                                                    "h-8 w-8 rounded-[10px] text-[12px] font-medium transition-opacity",
                                                    currentPage === p
                                                        ? "text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90"
                                                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                                )}
                                            >
                                                {p}
                                            </Button>
                                        )
                                    )}

                                <Button
                                    size="icon"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                    className="h-8 w-8 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity disabled:opacity-40"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
