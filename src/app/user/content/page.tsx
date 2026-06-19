"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
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
    Search, ChevronLeft, ChevronRight, Copy,
    FileSpreadsheet, FileDown, Printer, Eye,
    Loader2, FileText, X, Calendar, User, Users,
    FolderOpen,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type SharedContent = {
    id: number;
    title: string;
    send_to: string;
    share_date: string;
    valid_upto: string | null;
    description: string | null;
    sender?: { name: string };
};

const PAGE_SIZES = [10, 25, 50, 100];

export default function UserContentPage() {
    const [items, setItems] = useState<SharedContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);
    const [selected, setSelected] = useState<SharedContent | null>(null);
    const { toast } = useToast();

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            try {
                const res = await api.get("/download-center/shared-contents", {
                    params: { page, limit, search: debouncedSearch },
                });
                const raw = res.data;
                setItems(raw?.data ?? []);
                setLastPage(raw?.last_page ?? 1);
                setTotal(raw?.total ?? 0);
                setFrom(raw?.from ?? 0);
                setTo(raw?.to ?? 0);
            } catch {
                toast({ variant: "destructive", title: "Error", description: "Failed to load content." });
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [page, limit, debouncedSearch, toast]);

    const formatDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) : "—";

    const isExpired = (valid_upto: string | null) =>
        valid_upto ? new Date(valid_upto) < new Date() : false;

    const exportRows = () =>
        items.map((c) => ({
            "Title": c.title,
            "Share Date": formatDate(c.share_date),
            "Valid Upto": formatDate(c.valid_upto),
            "Shared By": c.sender?.name || "",
            "Send To": c.send_to,
        }));

    const copyToClipboard = useCallback(() => {
        const text = exportRows().map((r) => Object.values(r).join("\t")).join("\n");
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, toast]);

    const exportToExcel = useCallback(() => {
        const ws = XLSX.utils.json_to_sheet(exportRows());
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Content");
        XLSX.writeFile(wb, "content-list.xlsx");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    const exportToPDF = useCallback(() => {
        const doc = new jsPDF();
        doc.text("Content List", 14, 16);
        autoTable(doc, {
            head: [["Title", "Share Date", "Valid Upto", "Shared By", "Send To"]],
            body: items.map((c) => [
                c.title, formatDate(c.share_date), formatDate(c.valid_upto),
                c.sender?.name || "", c.send_to,
            ]),
            startY: 22,
            styles: { fontSize: 8 },
        });
        doc.save("content-list.pdf");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    const pageNumbers = Array.from({ length: lastPage }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
        .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
        }, []);

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <FolderOpen className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">Content List</h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {loading ? "Loading shared content…" : `${total} shared item${total === 1 ? "" : "s"}`}
                        </p>
                    </div>
                </div>
                <CardContent className="p-4 lg:p-5">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder="Search title or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 h-9 text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                                <SelectTrigger className="h-9 w-[70px] text-[12px] border border-gray-200 bg-white rounded">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map((s) => (
                                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                                {[
                                    { icon: Copy, label: "Copy", action: copyToClipboard },
                                    { icon: FileSpreadsheet, label: "Excel", action: exportToExcel },
                                    { icon: FileDown, label: "PDF", action: exportToPDF },
                                    { icon: Printer, label: "Print", action: () => window.print() },
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

                    {/* Desktop Table (sm+) */}
                    <div className="hidden sm:block rounded-md border border-gray-200 overflow-x-auto">
                        <Table className="min-w-[700px]">
                            <TableHeader>
                                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-200">
                                    <TableHead className="py-3 px-4 font-bold text-gray-600 text-[10px] uppercase">Title</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-600 text-[10px] uppercase">Share Date</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-600 text-[10px] uppercase">Valid Upto</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-600 text-[10px] uppercase">Shared By</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-600 text-[10px] uppercase text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                <span>Loading...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                <FileText className="h-8 w-8 opacity-30" />
                                                <span className="text-sm">No content available.</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => {
                                        const expired = isExpired(item.valid_upto);
                                        return (
                                            <TableRow
                                                key={item.id}
                                                className="text-[13px] border-b border-gray-100 hover:bg-indigo-50/30 transition-colors"
                                            >
                                                <TableCell className="py-3 px-4 font-medium text-gray-800">{item.title}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-600">{formatDate(item.share_date)}</TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <span className={cn(
                                                        "text-[12px] font-medium",
                                                        expired ? "text-red-500" : "text-gray-600"
                                                    )}>
                                                        {formatDate(item.valid_upto)}
                                                    </span>
                                                    {expired && (
                                                        <Badge className="ml-2 bg-red-100 text-red-600 border-red-200 hover:bg-red-100 text-[10px]">Expired</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-600">{item.sender?.name || "—"}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <Button
                                                        size="icon"
                                                        onClick={() => setSelected(item)}
                                                        title="View"
                                                        className="h-7 w-7 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile cards (<sm) */}
                    <div className="sm:hidden">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 text-gray-400 py-12">
                                <Loader2 className="h-5 w-5 animate-spin" /> Loading...
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400 py-12">
                                <FileText className="h-8 w-8 opacity-30" />
                                <span className="text-sm">No content available.</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item) => {
                                    const expired = isExpired(item.valid_upto);
                                    return (
                                        <div key={item.id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-2.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-[13px] font-bold text-gray-800 leading-snug">{item.title}</h3>
                                                {expired && (
                                                    <Badge className="shrink-0 bg-red-100 text-red-600 border-red-200 hover:bg-red-100 text-[10px]">Expired</Badge>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 gap-1.5 text-[11px] text-gray-600 border-t border-gray-100 pt-2.5">
                                                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />Shared: {formatDate(item.share_date)}</span>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                                    Valid upto: <span className={cn(expired ? "text-red-500 font-medium" : "")}>{formatDate(item.valid_upto)}</span>
                                                </span>
                                                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{item.sender?.name || "—"}</span>
                                            </div>
                                            <Button
                                                onClick={() => setSelected(item)}
                                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white h-8 text-[11px] font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 border-0 w-full mt-1"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> View Details
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && (
                        <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
                            <span className="text-[12px] text-gray-500">
                                {total === 0 ? "No entries" : `Showing ${from} to ${to} of ${total} entries`}
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

            {/* Detail Modal */}
            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10">
                                    <FileText className="h-5 w-5 text-[#6366F1]" />
                                </div>
                                <h2 className="text-[15px] font-bold text-gray-800 leading-snug">{selected.title}</h2>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-4 px-5 pt-4 pb-2 text-[12px] text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Shared: <span className="font-medium text-gray-700">{formatDate(selected.share_date)}</span></span>
                            </div>
                            {selected.valid_upto && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Valid upto: <span className={cn("font-medium", isExpired(selected.valid_upto) ? "text-red-500" : "text-gray-700")}>
                                        {formatDate(selected.valid_upto)}
                                    </span></span>
                                </div>
                            )}
                            {selected.sender?.name && (
                                <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    <span>By: <span className="font-medium text-gray-700">{selected.sender.name}</span></span>
                                </div>
                            )}
                            {selected.send_to && (
                                <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>To: <span className="font-medium text-gray-700">{selected.send_to}</span></span>
                                </div>
                            )}
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {selected.description ? (
                                <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
                            ) : (
                                <p className="text-[13px] text-gray-400 italic">No description provided.</p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                            <Button
                                onClick={() => setSelected(null)}
                                className="px-4 py-1.5 h-auto text-[13px] rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
