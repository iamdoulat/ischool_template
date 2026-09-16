"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Star,
    Trash2,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    CheckCircle
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn, toLocaleNumber } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface Rating {
    id: number;
    staff_id: string;
    staff_name: string;
    rating: number;
    comment: string;
    status: "Pending" | "Approved";
    student_name: string;
}

export default function TeachersRatingPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/hr/teacher-ratings");
            setRatings(response.data.data);
        } catch (error) {
            console.error("Error fetching ratings:", error);
            tt.error("failed_to_load_teacher_ratings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            await api.put(`/hr/teacher-ratings/${id}/approve`);
            tt.success("rating_approved_successfully");
            fetchData();
        } catch (error) {
            tt.error("failed_to_approve_rating");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t("are_you_sure_delete_rating"))) return;
        try {
            await api.delete(`/hr/teacher-ratings/${id}`);
            tt.success("rating_deleted_successfully");
            fetchData();
        } catch (error) {
            tt.error("failed_to_delete_rating");
        }
    };

    const filteredRatings = ratings.filter(item =>
        item.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.staff_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredRatings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredRatings.slice(startIndex, startIndex + itemsPerPage);

    const StarRating = ({ count }: { count: number }) => (
        <div className="flex gap-0.5 items-center">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={cn(
                        "h-3 w-3",
                        s <= count ? "fill-amber-400 text-amber-400" : "text-gray-200"
                    )}
                />
            ))}
            <span className="ml-1 text-[10px] text-gray-500 font-bold">{toLocaleNumber(count, shortCode)}</span>
        </div>
    );

    // Export Functions
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(ratings.map(r => ({
            [t("staff_id")]: toLocaleNumber(r.staff_id, shortCode),
            [t("staff_name")]: r.staff_name,
            [t("rating")]: toLocaleNumber(r.rating, shortCode),
            [t("comment")]: r.comment,
            [t("status")]: r.status === "Pending" ? t("pending") : t("approved"),
            [t("student_name")]: r.student_name
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("teacher_ratings"));
        XLSX.writeFile(wb, "teacher_ratings.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text(t("teacher_ratings_list"), 14, 15);
        autoTable(doc, {
            head: [[t("staff_id"), t("staff_name"), t("rating"), t("status"), t("student_name")]],
            body: ratings.map(r => [
                toLocaleNumber(r.staff_id, shortCode),
                r.staff_name,
                toLocaleNumber(r.rating, shortCode),
                r.status === "Pending" ? t("pending") : t("approved"),
                r.student_name
            ]),
            startY: 20,
        });
        doc.save("teacher_ratings.pdf");
    };

    const copyToClipboard = () => {
        const text = ratings.map(r => `${toLocaleNumber(r.staff_id, shortCode)} - ${r.staff_name} (${toLocaleNumber(r.rating, shortCode)}*): ${r.status === "Pending" ? t("pending") : t("approved")}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Star className="h-4 w-4" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("teachers_rating")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{toLocaleNumber(filteredRatings.length, shortCode)} {t("ratings")}</p>
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder={t("search") + "..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <Select
                                    value={itemsPerPage.toString()}
                                    onValueChange={(val) => {
                                        setItemsPerPage(parseInt(val));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-16 text-[11px] font-bold border-gray-200 bg-white rounded-lg focus:ring-indigo-500 cursor-pointer">
                                        <SelectValue placeholder={toLocaleNumber(itemsPerPage, shortCode)}>
                                            {toLocaleNumber(itemsPerPage, shortCode)}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-gray-100">
                                        {[10, 25, 50, 100].map(n => (
                                            <SelectItem key={n} value={String(n)} className="cursor-pointer text-xs font-bold">
                                                {toLocaleNumber(n, shortCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" title={t("copy")} onClick={copyToClipboard}>
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" title={t("excel")} onClick={exportToExcel}>
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" title={t("pdf")} onClick={exportToPDF}>
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" title={t("print")} onClick={() => window.print()}>
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" title={t("columns")}>
                                    <Columns className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 overflow-x-auto custom-scrollbar shadow-xs bg-white">
                        <Table className="min-w-[900px]">
                            <TableHeader className="!bg-[#f1f5f9] dark:!bg-slate-800 text-[11px] uppercase font-bold text-slate-700 dark:text-slate-200 border-b border-gray-200">
                                <TableRow className="hover:bg-transparent border-b border-gray-200">
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-700 py-3.5 px-4 whitespace-nowrap">{t("staff_id")}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-700 py-3.5 px-4 whitespace-nowrap">{t("staff_name")}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-700 py-3.5 px-4 whitespace-nowrap">{t("rating")}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-700 py-3.5 px-4 whitespace-nowrap">{t("comment")}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-700 py-3.5 px-4 whitespace-nowrap">{t("status")}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-700 py-3.5 px-4 whitespace-nowrap">{t("student_name")}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-700 py-3.5 px-4 text-right whitespace-nowrap">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white divide-y divide-gray-100">
                                {loading ? (
                                    <TableSkeleton rows={5} cols={7} />
                                ) : paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((item) => (
                                        <TableRow key={item.id} className="border-b border-gray-100 hover:bg-indigo-50/40 hover:shadow-xs transition-all duration-200 text-[11px] bg-white">
                                            <TableCell className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{toLocaleNumber(item.staff_id, shortCode)}</TableCell>
                                            <TableCell className="py-3.5 px-4 text-indigo-600 font-medium whitespace-nowrap">{item.staff_name}</TableCell>
                                            <TableCell className="py-3.5 px-4 whitespace-nowrap"><StarRating count={item.rating} /></TableCell>
                                            <TableCell className="py-3.5 px-4 text-gray-500 italic max-w-[200px] truncate" title={item.comment}>{item.comment || "—"}</TableCell>
                                            <TableCell className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={cn(
                                                    "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm",
                                                    item.status === "Pending" ? "bg-orange-500 text-white" : "bg-green-600 text-white"
                                                )}>
                                                    {item.status === "Pending" ? t("pending") : t("approved")}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{item.student_name || "—"}</TableCell>
                                            <TableCell className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {item.status === "Pending" && (
                                                        <Button
                                                            onClick={() => handleApprove(item.id)}
                                                            className="h-7 px-3 text-[10px] font-bold uppercase rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer border-0"
                                                            title={t("approve")}
                                                        >
                                                            <CheckCircle className="h-3 w-3" />
                                                            {t("approve")}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => handleDelete(item.id)}
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                                                        title={t("delete")}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end items-center gap-2 py-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 disabled:opacity-30 cursor-pointer"
                        >
                            <ChevronLeft className="h-4 w-4 text-white" />
                        </Button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                    "h-8 w-8 rounded-[10px] text-[10px] font-bold p-0 transition-all cursor-pointer",
                                    currentPage === page
                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md scale-105"
                                        : "bg-white border border-gray-200 text-gray-600 hover:text-indigo-600"
                                )}
                            >
                                {toLocaleNumber(page, shortCode)}
                            </Button>
                        ))}

                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 disabled:opacity-30 cursor-pointer"
                        >
                            <ChevronRight className="h-4 w-4 text-white" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
