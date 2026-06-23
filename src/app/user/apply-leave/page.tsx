"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    ChevronLeft, ChevronRight, Plus, X, Loader2, Search,
    Copy, FileSpreadsheet, FileDown, Printer, Eye, CalendarCheck,
    Calendar, CalendarDays, Clock, MessageSquare, Trash2,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import api from "@/lib/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LeaveRecord {
    id: number;
    leaveType: string;
    applyDate: string;
    fromDate: string;
    toDate: string;
    days: number;
    halfDay: string;
    reason: string;
    status: string;
    adminRemark: string;
}

interface LeaveType {
    id: number;
    name: string;
}

const PAGE_SIZES = ["10", "25", "50", "100"];
const fmt = (d: string) => (d ? formatDate(d) : "—");

const statusBadge = (status: string) => (
    <span className={cn(
        "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
        status === "Approved"
            ? "bg-green-50 text-green-700 border-green-200"
            : status === "Disapproved"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
    )}>
        {status}
    </span>
);

export default function UserApplyLeavePage() {
    const { t } = useTranslation();
    const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Apply dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        leave_type_id: "",
        leave_from: "",
        leave_to: "",
        half_day: "",
        reason: "",
    });
    const [submitting, setSubmitting] = useState(false);

    // Detail dialog
    const [selected, setSelected] = useState<LeaveRecord | null>(null);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchData = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const perPage = parseInt(itemsPerPage, 10) || 50;
            const response = await api.get("/user/apply-leave", {
                params: { page, per_page: perPage, search: searchTerm || undefined },
            });
            const res = response.data?.data || response.data || {};
            const dataArr = Array.isArray(res) ? res : (res.data || []);
            setLeaves(dataArr);
            setTotalEntries(res.total || dataArr.length);
            setTotalPages(res.last_page || Math.ceil((res.total || dataArr.length) / perPage) || 1);
            setCurrentPage(res.current_page || page);
        } catch (error) {
            console.error("Error fetching leaves:", error);
            toast.error(t("failed_to_load_leave_requests"));
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage, searchTerm]);

    const fetchLeaveTypes = useCallback(async () => {
        try {
            const response = await api.get("/user/leave-types");
            setLeaveTypes(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching leave types:", error);
        }
    }, []);

    useEffect(() => {
        fetchLeaveTypes();
    }, [fetchLeaveTypes]);

    useEffect(() => {
        fetchData(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemsPerPage]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchData(1);
    };

    const openApplyDialog = () => {
        setFormData({ leave_type_id: "", leave_from: "", leave_to: "", half_day: "", reason: "" });
        setDialogOpen(true);
    };

    const handleSubmitLeave = async () => {
        if (!formData.leave_type_id || !formData.leave_from || !formData.leave_to) {
            toast.error(t("please_fill_in_required_fields"));
            return;
        }
        setSubmitting(true);
        try {
            await api.post("/user/apply-leave", {
                leave_type_id: parseInt(formData.leave_type_id),
                leave_from: formData.leave_from,
                leave_to: formData.leave_to,
                half_day: formData.half_day || undefined,
                reason: formData.reason,
            });
            toast.success(t("leave_request_submitted_successfully"));
            setDialogOpen(false);
            fetchData(1);
        } catch (error) {
            toast.error(t("failed_to_submit_leave_request"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/attendance/approve-leave/${deleteId}`);
            toast.success(t("leave_request_deleted"));
            setDeleteDialogOpen(false);
            setDeleteId(null);
            fetchData(currentPage);
        } catch (error) {
            toast.error(t("failed_to_delete_leave_request"));
        }
    };

    const exportRows = () =>
        leaves.map((l) => ({
            [t("leave_type")]: l.leaveType,
            [t("apply_date")]: fmt(l.applyDate),
            [t("from_date")]: fmt(l.fromDate),
            [t("to_date")]: fmt(l.toDate),
            [t("days")]: l.days,
            [t("half_day")]: l.halfDay || t("full_day"),
            [t("reason")]: l.reason,
            [t("status")]: l.status,
            [t("admin_remark")]: l.adminRemark,
        }));

    const copyToClipboard = () => {
        const text = exportRows().map((r) => Object.values(r).join("\t")).join("\n");
        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard"));
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportRows());
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("leaves"));
        XLSX.writeFile(wb, "leave-requests.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF("l");
        doc.text(t("leave_requests"), 14, 16);
        autoTable(doc, {
            head: [[t("leave_type"), t("apply"), t("from"), t("to"), t("days"), t("half_day"), t("status")]],
            body: leaves.map((l) => [
                l.leaveType, fmt(l.applyDate), fmt(l.fromDate), fmt(l.toDate),
                String(l.days), l.halfDay || t("full_day"), l.status,
            ]),
            startY: 22,
            styles: { fontSize: 8 },
        });
        doc.save("leave-requests.pdf");
    };

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    const pendingCount = leaves.filter((l) => l.status === "Pending").length;

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarCheck className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("apply_leave")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading
                                    ? t("loading")
                                    : `${totalEntries} request${totalEntries === 1 ? "" : "s"}${pendingCount ? ` · ${pendingCount} pending` : ""}`}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={openApplyDialog}
                        className="h-9 shrink-0 px-3.5 gap-1.5 rounded-[10px] text-white text-[12px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("apply_leave")}</span>
                    </Button>
                </div>

                <CardContent className="p-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 print:hidden">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                                className="pl-8 h-9 text-sm rounded-[10px]"
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                                <SelectTrigger className="h-9 w-[70px] text-[12px] border border-gray-200 bg-white rounded-[10px]">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
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
                                <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-gray-200 whitespace-nowrap">
                                    <TableHead className="py-3 px-4 font-bold text-gray-700">{t("leave_type")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700">{t("apply_date")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700">{t("from_date")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700">{t("to_date")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 text-center">{t("days")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700">{t("reason")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 text-center">{t("status")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 text-center">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={8} className="h-32 text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                <span>{t("loading")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : leaves.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={8} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                <CalendarDays className="h-8 w-8 opacity-30" />
                                                <span className="text-sm">{t("no_leave_requests_found")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    leaves.map((item, idx) => {
                                        const canDelete = item.status !== "Approved" && item.status !== "Disapproved";
                                        return (
                                            <TableRow key={item.id || idx} className="text-[13px] border-b border-gray-100 hover:bg-gray-50/60 transition-colors whitespace-nowrap text-gray-600">
                                                <TableCell className="py-3 px-4 font-medium text-gray-800">
                                                    {item.leaveType}
                                                    {item.halfDay && (
                                                        <span className="ml-1.5 text-[10px] font-medium text-indigo-600">({item.halfDay})</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-3 px-4">{fmt(item.applyDate)}</TableCell>
                                                <TableCell className="py-3 px-4">{fmt(item.fromDate)}</TableCell>
                                                <TableCell className="py-3 px-4">{fmt(item.toDate)}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">{item.days}</TableCell>
                                                <TableCell className="py-3 px-4 max-w-[200px] truncate" title={item.reason}>{item.reason || "—"}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">{statusBadge(item.status)}</TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Button
                                                            size="icon"
                                                            onClick={() => setSelected(item)}
                                                            title={t("view")}
                                                            className="h-7 w-7 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        {canDelete && (
                                                            <Button
                                                                onClick={() => { setDeleteId(item.id); setDeleteDialogOpen(true); }}
                                                                title={t("delete")}
                                                                className="h-7 w-7 rounded-[10px] bg-red-50 text-red-600 hover:bg-red-100 shadow-none transition-colors active:scale-95"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
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
                        ) : leaves.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                                <CalendarDays className="h-8 w-8 opacity-30" />
                                <span className="text-sm">{t("no_leave_requests_found")}</span>
                            </div>
                        ) : (
                            leaves.map((item, idx) => {
                                const canDelete = item.status !== "Approved" && item.status !== "Disapproved";
                                return (
                                    <div
                                        key={item.id || idx}
                                        className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10">
                                                    <CalendarCheck className="h-4 w-4 text-[#6366F1]" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-bold text-gray-800 truncate">
                                                        {item.leaveType}
                                                        {item.halfDay && (
                                                            <span className="ml-1 text-[10px] font-medium text-indigo-600">({item.halfDay})</span>
                                                        )}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">
                                                        {item.days} day{item.days === 1 ? "" : "s"} · applied {fmt(item.applyDate)}
                                                    </p>
                                                </div>
                                            </div>
                                            {statusBadge(item.status)}
                                        </div>

                                        <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 rounded-lg px-2.5 py-2">
                                            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                            <span className="font-medium text-gray-700">{fmt(item.fromDate)}</span>
                                            <ChevronRight className="h-3 w-3 text-gray-400" />
                                            <span className="font-medium text-gray-700">{fmt(item.toDate)}</span>
                                        </div>

                                        {item.reason && (
                                            <p className="mt-2 text-[12px] text-gray-600 line-clamp-2">{item.reason}</p>
                                        )}

                                        {item.adminRemark && (
                                            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-gray-500 bg-indigo-50/50 rounded-lg px-2.5 py-2">
                                                <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-indigo-400 shrink-0" />
                                                <span><span className="font-semibold text-gray-600">{t("admin")}:</span> {item.adminRemark}</span>
                                            </div>
                                        )}

                                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => setSelected(item)}
                                                className="h-7 px-3 gap-1 text-[11px] rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> {t("view")}
                                            </Button>
                                            {canDelete && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => { setDeleteId(item.id); setDeleteDialogOpen(true); }}
                                                    className="h-7 px-3 gap-1 text-[11px] rounded-[10px] bg-red-50 text-red-600 hover:bg-red-100 shadow-none"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer Pagination */}
                    {!loading && (
                        <div className="flex items-center justify-between mt-4 gap-3 flex-wrap print:hidden">
                            <span className="text-[12px] text-gray-500">
                                {totalEntries === 0
                                    ? t("no_entries")
                                    : `${t("showing")} ${startIndex + 1} ${t("to")} ${Math.min(startIndex + sizeNum, totalEntries)} ${t("of")} ${totalEntries} ${t("entries")}`}
                            </span>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        size="icon"
                                        disabled={safePage === 1}
                                        onClick={() => fetchData(safePage - 1)}
                                        className="h-8 w-8 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                                        .reduce<(number | "…")[]>((acc, p, i, arr) => {
                                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((p, i) =>
                                            p === "…" ? (
                                                <span key={`e-${i}`} className="text-gray-400 text-[12px] px-1">…</span>
                                            ) : (
                                                <Button
                                                    key={p}
                                                    size="icon"
                                                    onClick={() => fetchData(p as number)}
                                                    className={cn(
                                                        "h-8 w-8 rounded-[10px] text-[12px] font-medium transition-opacity",
                                                        safePage === p
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
                                        disabled={safePage === totalPages}
                                        onClick={() => fetchData(safePage + 1)}
                                        className="h-8 w-8 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity disabled:opacity-40"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
                <DialogContent className="sm:max-w-[480px]">
                    {selected && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10">
                                        <CalendarCheck className="h-5 w-5 text-[#6366F1]" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-[15px] font-bold text-gray-800">{selected.leaveType}</DialogTitle>
                                        <DialogDescription className="text-[12px] text-gray-500">
                                            {selected.days} day{selected.days === 1 ? "" : "s"}
                                            {selected.halfDay ? ` · ${selected.halfDay}` : ` · ${t("full_day")}`}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="grid grid-cols-2 gap-3 text-[12px] text-gray-500 pt-1">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{t("apply")}: <span className="font-medium text-gray-700">{fmt(selected.applyDate)}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{t("status")}: {statusBadge(selected.status)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{t("from")}: <span className="font-medium text-gray-700">{fmt(selected.fromDate)}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{t("to")}: <span className="font-medium text-gray-700">{fmt(selected.toDate)}</span></span>
                                </div>
                            </div>

                            <div className="pt-1">
                                <p className="text-[12px] font-semibold text-gray-500 mb-1">{t("reason")}</p>
                                {selected.reason ? (
                                    <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.reason}</p>
                                ) : (
                                    <p className="text-[13px] text-gray-400 italic">{t("no_reason_provided")}</p>
                                )}
                            </div>

                            {selected.adminRemark && (
                                <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 px-3 py-2.5">
                                    <p className="text-[12px] font-semibold text-indigo-700 mb-0.5 flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5" /> {t("admin_remark")}
                                    </p>
                                    <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.adminRemark}</p>
                                </div>
                            )}

                            <div className="flex justify-end pt-1">
                                <Button
                                    onClick={() => setSelected(null)}
                                    className="h-9 px-4 text-[13px] rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity"
                                >
                                    {t("close")}
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Apply Leave Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-gray-800 text-base font-bold">{t("apply_leave")}</DialogTitle>
                        <DialogDescription className="text-gray-500 text-xs">
                            {t("fill_in_the_details_to_submit_a_leave_request")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-600">{t("leave_type")} <span className="text-red-500">*</span></Label>
                            <Select
                                value={formData.leave_type_id}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, leave_type_id: val }))}
                            >
                                <SelectTrigger className="h-9 text-xs border-gray-200 rounded-[10px]">
                                    <SelectValue placeholder={t("select_leave_type")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {leaveTypes.map(lt => (
                                        <SelectItem key={lt.id} value={String(lt.id)}>{lt.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600">{t("from_date")} <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    value={formData.leave_from}
                                    onChange={(e) => setFormData(prev => ({ ...prev, leave_from: e.target.value }))}
                                    className="h-9 text-xs border-gray-200 rounded-[10px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600">{t("to_date")} <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    value={formData.leave_to}
                                    min={formData.leave_from || undefined}
                                    onChange={(e) => setFormData(prev => ({ ...prev, leave_to: e.target.value }))}
                                    className="h-9 text-xs border-gray-200 rounded-[10px]"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-600">{t("half_day")}</Label>
                            <Select
                                value={formData.half_day || "none"}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, half_day: val === "none" ? "" : val }))}
                            >
                                <SelectTrigger className="h-9 text-xs border-gray-200 rounded-[10px]">
                                    <SelectValue placeholder={t("none_full_day")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t("none_full_day")}</SelectItem>
                                    <SelectItem value="First Half">{t("first_half")}</SelectItem>
                                    <SelectItem value="Second Half">{t("second_half")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-600">{t("reason")}</Label>
                            <Textarea
                                value={formData.reason}
                                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder={t("enter_reason_for_leave")}
                                className="min-h-[80px] text-xs border-gray-200 rounded-[10px]"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                className="h-9 px-4 text-xs border-gray-200 text-gray-600 rounded-[10px]"
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                onClick={handleSubmitLeave}
                                disabled={submitting || !formData.leave_type_id || !formData.leave_from || !formData.leave_to}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white h-9 px-5 text-xs font-medium rounded-[10px] shadow-sm transition-opacity disabled:opacity-50"
                            >
                                {submitting ? (
                                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{t("submitting")}</>
                                ) : t("submit")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-800 text-base">{t("delete_leave_request")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 text-xs">
                            {t("are_you_sure_you_want_to_delete_this_leave_request_this_action_cannot_be_undone")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="h-9 px-4 text-xs border-gray-200 rounded-[10px]">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="h-9 px-4 text-xs bg-red-600 hover:bg-red-700 text-white rounded-[10px]"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
