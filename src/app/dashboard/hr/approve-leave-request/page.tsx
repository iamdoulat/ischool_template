"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    List,
    History,
    Loader2,
    CheckCircle,
    XCircle,
    CalendarCheck
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, toLocaleNumber } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from 'xlsx';

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

interface LeaveRequest {
    id: number;
    staff: string;
    staffId: string;
    leaveType: string;
    halfDay: string;
    leaveDate: string;
    days: string;
    applyDate: string;
    status: "Pending" | "Approved" | "Disapproved";
    reason?: string;
    adminRemark?: string;
}

interface Meta {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
}

export default function ApproveLeaveRequestPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const tt = useTranslateToast();
    const [keyword, setKeyword] = useState("");
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(50);
    const [loading, setLoading] = useState(false);

    // View Details state
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [adminRemark, setAdminRemark] = useState("");
    const [updateLoading, setUpdateLoading] = useState(false);

    // Modal state for Adding (as backup)
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [staffList, setStaffList] = useState<unknown[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<unknown[]>([]);
    const [roles, setRoles] = useState<unknown[]>([]);

    const fetchInitialData = async () => {
        try {
            const [staffRes, typeRes, roleRes] = await Promise.all([
                api.get("/hr/staff-directory"),
                api.get("/hr/leave-type"),
                api.get("/hr/staff-roles")
            ]);
            setStaffList(staffRes.data?.data || []);
            setLeaveTypes(typeRes.data?.data || []);
            setRoles(roleRes.data?.data || []);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchRequests = async (p = page, limit = perPage, q = keyword) => {
        setLoading(true);
        try {
            const res = await api.get("/hr/leave-request", {
                params: {
                    page: p,
                    per_page: limit,
                    search: q || undefined
                }
            });
            if (res.data?.success) {
                setRequests(res.data.data);
                setMeta(res.data.meta);
            }
        } catch (error) {
            console.error(error);
            tt.error("failed_to_load_leave_requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [page, perPage]);

    const handleUpdateStatus = async (id: number, status: "Approved" | "Disapproved") => {
        setUpdateLoading(true);
        try {
            const res = await api.put(`/hr/leave-request/${id}`, {
                status,
                admin_remark: adminRemark
            });
            if (res.data?.success) {
                tt.success(status === "Approved" ? "leave_request_approved" : "leave_request_disapproved");
                setIsViewOpen(false);
                fetchRequests();
                setAdminRemark("");
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_update_status");
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchRequests(1, perPage, keyword);
    };

    const handleCopy = () => {
        if (!requests.length) return;
        const text = requests.map(r => `${r.staff}\t${r.leaveType}\t${r.leaveDate}\t${r.days}\t${r.status}`).join('\n');
        navigator.clipboard.writeText("Staff\tLeave Type\tLeave Date\tDays\tStatus\n" + text);
        tt.success("copied_to_clipboard");
    };

    const handleExportCSV = () => {
        const ws = XLSX.utils.json_to_sheet(requests.map(r => ({
            "Staff": r.staff,
            "Type": r.leaveType,
            "Dates": r.leaveDate,
            "Days": r.days,
            "Status": r.status
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("leave_approvals"));
        XLSX.writeFile(wb, "leave_approvals.xlsx");
    };

    const handlePrint = () => window.print();

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* ── Page Header Card with Gradient Colors ──────────────────────── */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] overflow-hidden py-0 gap-0">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0 px-4 py-2.5 bg-transparent border-0">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarCheck className="h-4.5 w-4.5" />
                        </span>
                        <div>
                            <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">
                                {t("approve_leave_request")}
                            </CardTitle>
                            <p className="text-[10.5px] text-gray-500 mt-0.5">
                                {shortCode === "bn" ? "স্টাফদের ছুটির আবেদন পর্যালোচনা ও অনুমোদন করুন" : "Review and approve staff leave applications"}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => window.history.back()}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white gap-2 h-8 px-5 text-[10.5px] font-bold uppercase rounded-full shadow-md active:scale-95 transition-all cursor-pointer border-0"
                    >
                        <History className="h-3.5 w-3.5" /> {t("back")}
                    </Button>
                </CardHeader>
            </Card>

            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <CalendarCheck className="h-4 w-4" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("approve_leave_request")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{toLocaleNumber(meta?.total ?? requests.length, shortCode)} {t("requests")}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Input
                                placeholder={t("search") + "..."}
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSearch()}
                                className="h-8 w-64 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg"
                            />
                            <Button
                                onClick={handleSearch}
                                disabled={loading}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] gap-2 h-8 px-6 text-[11px] font-bold uppercase rounded-full shadow-sm flex items-center text-white"
                            >
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                {t("search")}
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                                    <SelectTrigger className="h-8 w-16 text-[11px] font-bold border-gray-200 bg-white rounded-lg focus:ring-indigo-500 cursor-pointer">
                                        <SelectValue placeholder={toLocaleNumber(perPage, shortCode)}>
                                            {toLocaleNumber(perPage, shortCode)}
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
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={handleCopy}>
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={handleExportCSV}>
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={handlePrint}>
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors">
                                    <Columns className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 overflow-x-auto custom-scrollbar shadow-xs bg-white">
                        <Table className="min-w-[900px]">
                            <TableHeader className="!bg-[#f1f5f9] dark:!bg-slate-800 text-[11px] uppercase font-bold text-slate-700 dark:text-slate-200 border-b border-gray-200">
                                <TableRow className="hover:bg-transparent border-b border-gray-200">
                                    {["staff", "leave_type", "half_day", "leave_date", "days", "apply_date", "status", "action"].map(h => (
                                        <TableHead key={h} className={`text-[11px] font-bold uppercase text-slate-700 py-3.5 px-4 whitespace-nowrap ${h === "action" ? "text-right" : ""}`}>{t(h)}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white divide-y divide-gray-100">
                                {loading ? (
                                    <TableSkeleton rows={5} cols={8} />
                                ) : requests.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</TableCell></TableRow>
                                ) : requests.map((req) => (
                                    <TableRow key={req.id} className="border-b border-gray-100 hover:bg-indigo-50/40 hover:shadow-xs transition-all duration-200 text-[11px] bg-white">
                                        <TableCell className="py-3.5 px-4 text-gray-800 font-medium whitespace-nowrap">{req.staff}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-600 whitespace-nowrap">{req.leaveType}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-600 whitespace-nowrap">{req.halfDay}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-600 whitespace-nowrap">{req.leaveDate}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-600 whitespace-nowrap">{toLocaleNumber(req.days, shortCode)}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-600 whitespace-nowrap">{req.applyDate}</TableCell>
                                        <TableCell className="py-3.5 px-4 whitespace-nowrap">
                                            <span className={cn(
                                                "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm",
                                                req.status === "Pending" && "bg-orange-500 text-white",
                                                req.status === "Approved" && "bg-green-600 text-white",
                                                req.status === "Disapproved" && "bg-red-600 text-white"
                                            )}>
                                                {req.status === "Pending" ? t("pending") : req.status === "Approved" ? t("approved") : t("disapproved")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors shadow-sm"
                                                    title={t("view_and_approve")}
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setAdminRemark(req.adminRemark || "");
                                                        setIsViewOpen(true);
                                                    }}
                                                >
                                                    <List className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end items-center gap-2 py-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 disabled:opacity-30"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {Array.from({ length: meta?.last_page || 1 }).map((_, i) => (
                            <Button
                                key={i + 1}
                                onClick={() => setPage(i + 1)}
                                className={cn(
                                    "h-8 w-8 rounded-[10px] text-[10px] font-bold p-0 transition-all",
                                    page === i + 1
                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md scale-105"
                                        : "bg-white border border-gray-200 text-gray-600 hover:text-indigo-600"
                                )}
                            >
                                {toLocaleNumber(i + 1, shortCode)}
                            </Button>
                        ))}

                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={page === (meta?.last_page || 1) || !meta}
                            onClick={() => setPage(page + 1)}
                            className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 disabled:opacity-30"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* View Details & Approve Modal */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 font-sans border-0 shadow-2xl overflow-hidden gap-0 rounded-lg">
                    <DialogHeader className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-4 text-white">
                        <DialogTitle className="text-sm font-bold uppercase tracking-wider">{t("review_leave_request")}</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div className="space-y-1">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">{t("staff")}</span>
                                    <span className="text-gray-800 font-semibold">{selectedRequest.staff}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">{t("leave_type")}</span>
                                    <span className="text-gray-800 font-semibold">{selectedRequest.leaveType}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">{t("leave_date")}</span>
                                    <span className="text-gray-800 font-medium">{selectedRequest.leaveDate}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">{t("days")}</span>
                                    <span className="text-gray-800 font-bold text-indigo-600">{selectedRequest.days}</span>
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">{t("current_status")}</span>
                                    <span className={cn(
                                        "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter inline-block shadow-sm",
                                        selectedRequest.status === "Pending" && "bg-orange-500 text-white",
                                        selectedRequest.status === "Approved" && "bg-green-600 text-white",
                                        selectedRequest.status === "Disapproved" && "bg-red-600 text-white"
                                    )}>
                                        {selectedRequest.status === "Pending" ? t("pending") : selectedRequest.status === "Approved" ? t("approved") : t("disapproved")}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest mb-2">{t("reason_for_leave")}</span>
                                <div className="text-[12px] text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 leading-relaxed italic shadow-inner">
                                    {selectedRequest.reason || t("no_reason_provided")}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("admin_remark_feedback")}</Label>
                                <Textarea
                                    value={adminRemark}
                                    onChange={(e) => setAdminRemark(e.target.value)}
                                    className="text-xs resize-none h-24 border-gray-200 rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder={t("add_notes_about_decision")}
                                />
                            </div>

                            {selectedRequest.status === "Pending" ? (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Button
                                        onClick={() => handleUpdateStatus(selectedRequest.id, "Disapproved")}
                                        disabled={updateLoading}
                                        variant="outline"
                                        className="h-10 text-[11px] font-bold uppercase tracking-widest rounded-lg border-red-200 text-red-600 hover:bg-red-50 gap-2"
                                    >
                                        <XCircle className="h-4 w-4" /> {t("disapprove")}
                                    </Button>
                                    <Button
                                        onClick={() => handleUpdateStatus(selectedRequest.id, "Approved")}
                                        disabled={updateLoading}
                                        variant="gradient"
                                        className="h-10 text-[11px] font-bold uppercase tracking-widest rounded-lg gap-2 shadow-md"
                                    >
                                        <CheckCircle className="h-4 w-4" /> {t("approve")}
                                    </Button>
                                </div>
                            ) : (
                                <div className="pt-2">
                                    <Button
                                        onClick={() => setIsViewOpen(false)}
                                        variant="outline"
                                        className="w-full h-10 text-[11px] font-bold uppercase tracking-widest rounded-lg"
                                    >
                                        {t("close")}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
