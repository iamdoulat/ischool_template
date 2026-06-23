"use client";

import { useState, useEffect, useCallback } from "react";
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
    Copy, FileSpreadsheet, FileDown, Printer,
    ChevronLeft, ChevronRight, Search, Loader2, BookOpen,
    Library, User, Building2, Hash, MapPin,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Book = {
    id: number;
    title: string;
    book_number: string | null;
    isbn_number: string | null;
    publisher: string | null;
    author: string | null;
    subject: string | null;
    rack_number: string | null;
    qty: number;
    available: number;
    price: string | number;
    post_date: string | null;
    created_at: string | null;
};

const PAGE_SIZES = [10, 25, 50, 100];

export default function UserLibraryBooksPage() {
    const { t } = useTranslation();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [limit, setLimit] = useState(50);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);
    const { toast } = useToast();

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        const fetchBooks = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/library/books`, {
                    params: { page, limit, search: debouncedSearch },
                });
                const raw = res.data;
                setBooks(raw?.data ?? []);
                setLastPage(raw?.last_page ?? 1);
                setTotal(raw?.total ?? 0);
                setFrom(raw?.from ?? 0);
                setTo(raw?.to ?? 0);
            } catch {
                toast({ variant: "destructive", title: t("error"), description: t("failed_to_load_books") });
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
    }, [page, limit, debouncedSearch, toast]);

    const formatPrice = (p: string | number) => {
        const n = typeof p === "string" ? parseFloat(p) : p;
        return isNaN(n) ? "$0.00" : `$${n.toFixed(2)}`;
    };

    const formatDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) : "";

    const exportRows = () =>
        books.map((b) => ({
            [t("book_title")]: b.title,
            [t("book_number")]: b.book_number || "",
            [t("isbn")]: b.isbn_number || "",
            [t("publisher")]: b.publisher || "",
            [t("author")]: b.author || "",
            [t("subject")]: b.subject || "",
            [t("rack_number")]: b.rack_number || "",
            [t("qty")]: b.qty,
            [t("available")]: b.available,
            [t("book_price")]: formatPrice(b.price),
            [t("post_date")]: formatDate(b.post_date || b.created_at),
        }));

    const copyToClipboard = useCallback(() => {
        const rows = exportRows();
        const text = rows.map((r) => Object.values(r).join("\t")).join("\n");
        navigator.clipboard.writeText(text);
        toast({ title: t("copied_to_clipboard") });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [books, toast]);

    const exportToExcel = useCallback(() => {
        const ws = XLSX.utils.json_to_sheet(exportRows());
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Books");
        XLSX.writeFile(wb, "library-books.xlsx");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [books]);

    const exportToPDF = useCallback(() => {
        const doc = new jsPDF("l");
        doc.text(t("library_books"), 14, 16);
        autoTable(doc, {
            head: [[t("book_title"), t("book_no"), t("publisher"), t("author"), t("subject"), t("rack"), t("avail_qty"), t("price")]],
            body: books.map((b) => [
                b.title, b.book_number || "", b.publisher || "", b.author || "", b.subject || "",
                b.rack_number || "", `${b.available}/${b.qty}`, formatPrice(b.price),
            ]),
            startY: 22,
            styles: { fontSize: 8 },
        });
        doc.save("library-books.pdf");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [books]);

    const pageNumbers = Array.from({ length: lastPage }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
        .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
        }, []);

    const availBadge = (b: Book) => (
        <Badge
            className={cn(
                "border font-medium",
                b.available > 0
                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                    : "bg-red-100 text-red-600 border-red-200 hover:bg-red-100"
            )}
        >
            {b.available > 0 ? `${b.available}/${b.qty} ${t("available").toLowerCase()}` : t("out_of_stock")}
        </Badge>
    );

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Library className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("library_books")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading ? t("loading") : `${total} book${total === 1 ? "" : "s"} in catalogue`}
                            </p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 print:hidden">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search_title_author_publisher_subject")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 h-9 text-sm rounded-[10px]"
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
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
                        <Table className="min-w-[1000px]">
                            <TableHeader>
                                <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-gray-200 text-[12px] font-bold text-gray-700">
                                    <TableHead className="py-3 px-4 font-bold text-gray-700">{t("book_title")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700">{t("book_no")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700">{t("author")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700">{t("publisher")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700">{t("subject")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700">{t("rack")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 text-center">{t("availability")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 text-right">{t("price")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                <span>{t("loading")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : books.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                <BookOpen className="h-8 w-8 opacity-30" />
                                                <span className="text-sm">{t("no_books_available")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    books.map((b) => (
                                        <TableRow
                                            key={b.id}
                                            className="text-[13px] border-b border-gray-100 hover:bg-gray-50/60 transition-colors whitespace-nowrap text-gray-600"
                                        >
                                            <TableCell className="py-3 px-4 font-medium text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[#6366F1]">
                                                        <BookOpen className="h-3.5 w-3.5" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="truncate max-w-[220px]">{b.title}</div>
                                                        {b.isbn_number && (
                                                            <div className="text-[10px] text-gray-400 font-normal">{t("isbn")}: {b.isbn_number}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">{b.book_number || "—"}</TableCell>
                                            <TableCell className="py-3 px-4">{b.author || "—"}</TableCell>
                                            <TableCell className="py-3 px-4">{b.publisher || "—"}</TableCell>
                                            <TableCell className="py-3 px-4">{b.subject || "—"}</TableCell>
                                            <TableCell className="py-3 px-4">{b.rack_number || "—"}</TableCell>
                                            <TableCell className="py-3 px-4 text-center">{availBadge(b)}</TableCell>
                                            <TableCell className="py-3 px-4 text-right font-medium">{formatPrice(b.price)}</TableCell>
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
                        ) : books.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                                <BookOpen className="h-8 w-8 opacity-30" />
                                <span className="text-sm">{t("no_books_available")}</span>
                            </div>
                        ) : (
                            books.map((b) => (
                                <div key={b.id} className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10">
                                                <BookOpen className="h-4.5 w-4.5 text-[#6366F1]" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-bold text-gray-800 leading-snug line-clamp-2">{b.title}</p>
                                                {b.book_number && (
                                                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Hash className="h-3 w-3" /> {b.book_number}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-[12px] font-semibold text-gray-700">{formatPrice(b.price)}</span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                                        {b.author && (
                                            <span className="flex items-center gap-1.5 min-w-0">
                                                <User className="h-3 w-3 text-gray-400 shrink-0" />
                                                <span className="truncate">{b.author}</span>
                                            </span>
                                        )}
                                        {b.publisher && (
                                            <span className="flex items-center gap-1.5 min-w-0">
                                                <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                                                <span className="truncate">{b.publisher}</span>
                                            </span>
                                        )}
                                        {b.subject && (
                                            <span className="flex items-center gap-1.5 min-w-0">
                                                <BookOpen className="h-3 w-3 text-gray-400 shrink-0" />
                                                <span className="truncate">{b.subject}</span>
                                            </span>
                                        )}
                                        {b.rack_number && (
                                            <span className="flex items-center gap-1.5 min-w-0">
                                                <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                                                <span className="truncate">{t("rack")} {b.rack_number}</span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-3 pt-2.5 border-t border-gray-100">
                                        {availBadge(b)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && (
                        <div className="flex items-center justify-between mt-4 gap-3 flex-wrap print:hidden">
                            <span className="text-[12px] text-gray-500">
                                {total === 0 ? t("no_entries") : `${t("showing")} ${from} ${t("to")} ${to} ${t("of")} ${total} ${t("entries")}`}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    size="icon"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="h-8 w-8 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {pageNumbers.map((p, i) =>
                                    p === "…" ? (
                                        <span key={`e-${i}`} className="text-gray-400 text-[12px] px-1">…</span>
                                    ) : (
                                        <Button
                                            key={p}
                                            size="icon"
                                            onClick={() => setPage(p as number)}
                                            className={cn(
                                                "h-8 w-8 rounded-[10px] text-[12px] font-medium transition-opacity",
                                                page === p
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
                                    disabled={page >= lastPage}
                                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
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
