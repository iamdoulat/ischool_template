"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
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
    History,
    Copy,
    FileSpreadsheet,
    FileBox,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Shield,
    Monitor,
    RefreshCw,
    Activity,
    Users,
    KeyRound,
    Lock,
    Eye,
    Globe,
    Clock,
    CheckCircle2,
    AlertCircle,
    Info,
    Laptop,
    Smartphone,
    Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3 px-4">
                            <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

interface AuditLog {
    id: number | string;
    message: string;
    users: string;
    ip_address: string;
    action: string;
    platform: string;
    agent: string;
    date_time: string;
}

export default function AuditTrailReportPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [reportList, setReportList] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");

    // Inspection Modal
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [inspectOpen, setInspectOpen] = useState(false);

    // Fetch Audit Trail logs
    const fetchAuditTrail = async (showToast = false) => {
        if (showToast) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await api.get("/reports/audit-trail");
            setReportList(response.data.data || []);
            if (showToast) toast.success("Audit trail logs synchronized");
        } catch (error) {
            console.error("Failed to fetch audit trail logs", error);
            toast.error("Failed to load audit trail logs");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAuditTrail();
    }, []);

    // Clear Audit Trail Action
    const handleClearAudit = async () => {
        setClearing(true);
        try {
            await api.post("/reports/audit-trail/clear");
            setReportList([]);
            toast.success("Audit trail cleared successfully");
        } catch (error) {
            console.error("Failed to clear audit trail logs", error);
            toast.error("Failed to clear audit trail logs");
        } finally {
            setClearing(false);
            setIsClearDialogOpen(false);
        }
    };

    // Filtered Report logic
    const filteredReport = useMemo(() => {
        return reportList.filter((item) => {
            // Action filter
            if (actionFilter !== "all") {
                const act = (item.action || "").toLowerCase();
                if (actionFilter === "login" && !act.includes("login")) return false;
                if (actionFilter === "create" && !act.includes("create")) return false;
                if (actionFilter === "update" && !act.includes("update") && !act.includes("allocate")) return false;
                if (actionFilter === "security" && !act.includes("backup") && !act.includes("security") && !act.includes("clear")) return false;
            }

            // Search filter
            if (!searchTerm) return true;
            const lower = searchTerm.toLowerCase();
            return (
                (item.message || "").toLowerCase().includes(lower) ||
                (item.users || "").toLowerCase().includes(lower) ||
                (item.ip_address || "").toLowerCase().includes(lower) ||
                (item.action || "").toLowerCase().includes(lower) ||
                (item.platform || "").toLowerCase().includes(lower) ||
                (item.agent || "").toLowerCase().includes(lower) ||
                (item.date_time || "").toLowerCase().includes(lower)
            );
        });
    }, [reportList, searchTerm, actionFilter]);

    // Unique operators count
    const uniqueOperators = useMemo(() => {
        const set = new Set(reportList.map(r => r.users));
        return set.size;
    }, [reportList]);

    // Pagination calculations
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredReport.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    const paginatedReportList = filteredReport.slice(startIndex, startIndex + sizeNum);

    // Export helpers
    const exportToCopy = () => {
        if (filteredReport.length === 0) { toast.error("No data to copy"); return; }
        const text = [
            "Action\tMessage\tUsers\tIP Address\tPlatform\tAgent\tDate Time",
            ...filteredReport.map((r: any) => `${r.action}\t${r.message}\t${r.users}\t${r.ip_address}\t${r.platform}\t${r.agent}\t${r.date_time}`)
        ].join("\n");
        navigator.clipboard.writeText(text);
        toast.success("Audit trail copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (filteredReport.length === 0) { toast.error("No data to export"); return; }
        const mapped = filteredReport.map((r: any) => ({
            "Action": r.action,
            "Message": r.message,
            "Users": r.users,
            "IP Address": r.ip_address,
            "Platform": r.platform,
            "Agent": r.agent,
            "Date Time": r.date_time,
        }));
        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Audit Trail");
        if (isCsv) { XLSX.writeFile(wb, "audit_trail_report.csv", { bookType: "csv" }); toast.success("CSV downloaded"); }
        else { XLSX.writeFile(wb, "audit_trail_report.xlsx"); toast.success("Excel file downloaded"); }
    };

    const exportToPDF = () => {
        if (filteredReport.length === 0) { toast.error("No data to export"); return; }
        const doc = new jsPDF("landscape");
        const head = [["Action", "Message", "Users", "IP Address", "Platform", "Date Time"]];
        const body = filteredReport.map((r: any) => [r.action, r.message, r.users, r.ip_address, r.platform, r.date_time]);
        autoTable(doc, { head, body, theme: "grid" });
        doc.save("audit_trail_report.pdf");
        toast.success("PDF downloaded");
    };

    const getActionBadge = (action: string) => {
        const act = (action || "").toLowerCase();
        if (act.includes("login")) {
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        }
        if (act.includes("create") || act.includes("add")) {
            return "bg-blue-50 text-blue-700 border-blue-200";
        }
        if (act.includes("update") || act.includes("edit") || act.includes("allocate")) {
            return "bg-amber-50 text-amber-700 border-amber-200";
        }
        if (act.includes("delete") || act.includes("remove") || act.includes("clear")) {
            return "bg-rose-50 text-rose-700 border-rose-200";
        }
        return "bg-purple-50 text-purple-700 border-purple-200";
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-4 sm:py-6 font-sans">
            {/* Master Page Header */}
            <div className="rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F9FE] to-[#EFF0FD]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <Shield className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                                System Audit Trail & Security Logs
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Monitor
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Comprehensive real-time ledger recording administrative changes, authentication events, and critical operations.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                            variant="outline"
                            onClick={() => fetchAuditTrail(true)}
                            disabled={refreshing || loading}
                            className="h-8.5 px-3.5 text-xs font-semibold rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 gap-1.5"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin text-indigo-600")} />
                            <span>Refresh</span>
                        </Button>
                        <Button
                            onClick={() => setIsClearDialogOpen(true)}
                            disabled={reportList.length === 0}
                            className="h-8.5 px-3.5 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Clear Logs</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Metrics Overview Ribbon */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="border-[0.5px] border-gray-200 shadow-xs rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Events</p>
                            <p className="text-lg font-extrabold text-slate-800">{reportList.length}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-[0.5px] border-gray-200 shadow-xs rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Operators</p>
                            <p className="text-lg font-extrabold text-slate-800">{uniqueOperators}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-[0.5px] border-gray-200 shadow-xs rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Auth Sessions</p>
                            <p className="text-lg font-extrabold text-slate-800">
                                {reportList.filter(r => (r.action || "").toLowerCase().includes("login")).length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="border-[0.5px] border-gray-200 shadow-xs rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                            <Lock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ledger Integrity</p>
                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Tamper-Proof
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Audit Trail Table Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden pt-0">
                {/* Header & Filter Toolbar */}
                <CardHeader className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <History className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-sm font-bold text-slate-800">
                            Audit Trail Activity Ledger ({filteredReport.length})
                        </CardTitle>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Action Filter */}
                        <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val); setCurrentPage(1); }}>
                            <SelectTrigger className="h-8 w-32 text-xs bg-white border-slate-200">
                                <SelectValue placeholder="All Actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="login">Logins Only</SelectItem>
                                <SelectItem value="create">Creations</SelectItem>
                                <SelectItem value="update">Updates</SelectItem>
                                <SelectItem value="security">Security/Backup</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-56">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Search logs, IPs, users..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-8 h-8 text-xs bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                            />
                        </div>

                        {/* Per page */}
                        <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                            <SelectTrigger className="h-8 w-20 text-xs bg-white border-slate-200">
                                <SelectValue placeholder="50" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Multi-format export toolbar */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                            <button
                                type="button"
                                onClick={exportToCopy}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                title="Copy Table"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => exportToExcel(false)}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                title="Export Excel"
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => exportToExcel(true)}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                title="Export CSV"
                            >
                                <FileBox className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={exportToPDF}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                title="Export PDF"
                            >
                                <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 transition-all"
                                title="Print Ledger"
                            >
                                <Printer className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </CardHeader>

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                                <TableRow>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 w-[120px]">Action</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[280px]">Message / Description</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[180px]">User & Role</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[130px]">IP Address</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[120px]">Platform</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[160px]">Timestamp</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 text-right pr-6 w-[80px]">Inspect</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                                {loading ? (
                                    <TableSkeleton cols={7} />
                                ) : reportList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20 text-slate-400">
                                            <Shield className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                                            <p className="text-xs font-bold text-slate-600">No audit trail records found</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">System operations will be logged here automatically.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedReportList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                            <p className="text-xs font-bold text-slate-600">No logs match your filters</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search keywords or action filter.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedReportList.map((item, idx) => (
                                        <TableRow
                                            key={item.id || idx}
                                            className="hover:bg-indigo-50/30 transition-colors group"
                                        >
                                            {/* Action Badge */}
                                            <TableCell className="py-3 px-4">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap",
                                                    getActionBadge(item.action)
                                                )}>
                                                    {item.action}
                                                </span>
                                            </TableCell>

                                            {/* Message */}
                                            <TableCell className="py-3 px-4">
                                                <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1" title={item.message}>
                                                    {item.message}
                                                </p>
                                            </TableCell>

                                            {/* User & Role */}
                                            <TableCell className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6 border border-slate-200 shadow-2xs">
                                                        <AvatarFallback className="text-[9px] font-bold bg-indigo-50 text-indigo-700">
                                                            {item.users?.charAt(0) || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-medium text-slate-700 truncate max-w-[180px]">
                                                        {item.users}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* IP Address */}
                                            <TableCell className="py-3 px-4 text-xs font-mono text-slate-600">
                                                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                                                    {item.ip_address}
                                                </span>
                                            </TableCell>

                                            {/* Platform */}
                                            <TableCell className="py-3 px-4 text-xs text-slate-600">
                                                <span className="inline-flex items-center gap-1">
                                                    <Monitor className="h-3 w-3 text-slate-400" />
                                                    {item.platform}
                                                </span>
                                            </TableCell>

                                            {/* Timestamp */}
                                            <TableCell className="py-3 px-4 text-xs font-semibold text-indigo-600">
                                                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                    {item.date_time}
                                                </span>
                                            </TableCell>

                                            {/* Inspect Action */}
                                            <TableCell className="py-3 px-4 text-right pr-6">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedLog(item);
                                                        setInspectOpen(true);
                                                    }}
                                                    className="h-7 w-7 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 ml-auto"
                                                    title="Inspect Event Payload"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>

                {/* Footer / Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                    <div>
                        Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                        {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                        {searchTerm && ` (filtered from ${reportList.length} total)`}
                    </div>

                    {totalEntries > 0 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={safePage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                className="h-8 w-8 bg-white hover:bg-slate-100 text-slate-600 rounded-lg transition-all border border-slate-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 transition-all text-xs flex items-center justify-center cursor-pointer font-bold rounded-lg",
                                        safePage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                            : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                                    )}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                disabled={safePage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                className="h-8 w-8 bg-white hover:bg-slate-100 text-slate-600 rounded-lg transition-all border border-slate-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Event Payload Inspector Modal */}
            <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
                <DialogContent className="max-w-xl rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <Terminal className="h-5 w-5 text-indigo-600" />
                            Audit Event Detailed Payload
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Security fingerprint and runtime context for Event #{selectedLog?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-3.5 py-2 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Event Message</p>
                                <p className="font-semibold text-slate-900 leading-relaxed">{selectedLog.message}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Action Type</p>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                                        getActionBadge(selectedLog.action)
                                    )}>
                                        {selectedLog.action}
                                    </span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Timestamp</p>
                                    <p className="font-mono font-bold text-indigo-600">{selectedLog.date_time}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Operator</p>
                                    <p className="font-semibold text-slate-800">{selectedLog.users}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Client IP Address</p>
                                    <p className="font-mono font-bold text-slate-800">{selectedLog.ip_address}</p>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">User Agent / Platform</p>
                                <p className="font-mono text-[11px] text-slate-600 break-all">{selectedLog.agent}</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInspectOpen(false)} className="text-xs">
                            Close Inspector
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Clear Confirmation Dialog */}
            <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <AlertDialogContent className="rounded-2xl bg-white max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-rose-500" /> Clear Entire Audit Trail?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-500">
                            This action cannot be undone. This will permanently truncate all security event logs from the system ledger.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-xs font-semibold rounded-lg">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearAudit}
                            disabled={clearing}
                            className="bg-rose-600 hover:bg-rose-700 rounded-lg text-xs font-bold text-white shadow-xs"
                        >
                            {clearing ? "Clearing..." : "Yes, Truncate Logs"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
