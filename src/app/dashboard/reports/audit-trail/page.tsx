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
    Copy,
    FileSpreadsheet,
    FileBox,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Shield,
    RefreshCw,
    Activity,
    Users,
    KeyRound,
    Lock,
    Eye,
    Clock,
    CheckCircle2,
    AlertCircle,
    Monitor,
    Terminal,
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLanguage } from "@/components/providers/language-provider";

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
    const { t, language } = useLanguage();
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
            if (showToast) toast.success(t("report_loaded_successfully") || "Audit trail logs synchronized");
        } catch (error) {
            console.error("Failed to fetch audit trail logs", error);
            toast.error(t("failed_to_load_report") || "Failed to load audit trail logs");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAuditTrail();
    }, []);

    // Clear entire audit trail logs
    const handleClearAudit = async () => {
        setClearing(true);
        try {
            await api.post("/reports/audit-trail/clear");
            setReportList([]);
            toast.success(t("report_loaded_successfully") || "Audit trail logs cleared successfully");
        } catch (error) {
            console.error("Failed to clear audit trail", error);
            toast.error(t("failed_to_load_report") || "Failed to clear audit trail");
        } finally {
            setClearing(false);
            setIsClearDialogOpen(false);
        }
    };

    // Metrics derivations
    const uniqueOperators = useMemo(() => {
        const set = new Set(reportList.map(r => r.users).filter(Boolean));
        return set.size;
    }, [reportList]);

    // Filtering logic
    const filteredReport = useMemo(() => {
        return reportList.filter((item) => {
            const matchesSearch = !searchTerm || (
                (item.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.message || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.users || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.ip_address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.platform || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.date_time || "").toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (!matchesSearch) return false;

            if (actionFilter === "all") return true;
            if (actionFilter === "login") return (item.action || "").toLowerCase().includes("login");
            if (actionFilter === "create") return (item.action || "").toLowerCase().includes("create") || (item.action || "").toLowerCase().includes("add");
            if (actionFilter === "update") return (item.action || "").toLowerCase().includes("update") || (item.action || "").toLowerCase().includes("edit");
            if (actionFilter === "security") return (item.action || "").toLowerCase().includes("backup") || (item.action || "").toLowerCase().includes("delete") || (item.action || "").toLowerCase().includes("clear");

            return true;
        });
    }, [reportList, searchTerm, actionFilter]);

    // Pagination calculations
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredReport.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    const paginatedReportList = filteredReport.slice(startIndex, startIndex + sizeNum);

    // Export helpers
    const exportToCopy = () => {
        if (filteredReport.length === 0) { toast.error(t("no_data_available_in_table") || "No data to copy"); return; }
        const text = [
            "Action\tMessage\tUsers\tIP Address\tPlatform\tAgent\tDate Time",
            ...filteredReport.map((r) => `${r.action}\t${r.message}\t${r.users}\t${r.ip_address}\t${r.platform}\t${r.agent}\t${r.date_time}`)
        ].join("\n");
        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard") || "Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (filteredReport.length === 0) { toast.error(t("no_data_available_in_table") || "No data to export"); return; }
        const mapped = filteredReport.map((r) => ({
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
        if (isCsv) { XLSX.writeFile(wb, "audit_trail_report.csv", { bookType: "csv" }); toast.success(t("csv_downloaded") || "CSV downloaded"); }
        else { XLSX.writeFile(wb, "audit_trail_report.xlsx"); toast.success(t("excel_downloaded") || "Excel file downloaded"); }
    };

    const exportToPDF = () => {
        if (filteredReport.length === 0) { toast.error(t("no_data_available_in_table") || "No data to export"); return; }
        const doc = new jsPDF("landscape");
        const head = [["Action", "Message", "Users", "IP Address", "Platform", "Date Time"]];
        const body = filteredReport.map((r) => [r.action, r.message, r.users, r.ip_address, r.platform, r.date_time]);
        autoTable(doc, { head, body, theme: "grid" });
        doc.save("audit_trail_report.pdf");
        toast.success(t("pdf_downloaded") || "PDF downloaded");
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
        <div className="space-y-4 pb-12">
            {/* Master Page Header Banner */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Shield className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-base font-bold tracking-tight text-gray-800 leading-none flex items-center gap-2 flex-wrap">
                                {t("system_audit_trail_security_logs") || "System Audit Trail & Security Logs"}
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {t("active_monitor") || "Active Monitor"}
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("system_audit_trail_description") || "Comprehensive real-time ledger recording administrative changes, authentication events, and critical operations."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                            variant="outline"
                            onClick={() => fetchAuditTrail(true)}
                            disabled={refreshing || loading}
                            className="h-8 px-3 text-xs font-semibold rounded-lg border-gray-200 bg-white hover:bg-gray-50 text-gray-700 gap-1.5 cursor-pointer shadow-xs"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin text-indigo-600")} />
                            <span>{t("refresh") || "Refresh"}</span>
                        </Button>
                        <Button
                            onClick={() => setIsClearDialogOpen(true)}
                            disabled={reportList.length === 0}
                            className="h-8 px-3 text-xs font-bold rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-90 text-white shadow-xs gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{t("clear_logs") || "Clear Logs"}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Metrics Overview Ribbon */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="border border-gray-100 shadow-sm rounded-lg bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t("total_events") || "Total Events"}</p>
                            <p className="text-base font-extrabold text-gray-800">{toLocaleNumber(reportList.length, language?.short_code)}</p>
                        </div>
                    </div>
                </div>

                <div className="border border-gray-100 shadow-sm rounded-lg bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t("active_operators") || "Active Operators"}</p>
                            <p className="text-base font-extrabold text-gray-800">{toLocaleNumber(uniqueOperators, language?.short_code)}</p>
                        </div>
                    </div>
                </div>

                <div className="border border-gray-100 shadow-sm rounded-lg bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t("auth_sessions") || "Auth Sessions"}</p>
                            <p className="text-base font-extrabold text-gray-800">
                                {toLocaleNumber(reportList.filter(r => (r.action || "").toLowerCase().includes("login")).length, language?.short_code)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border border-gray-100 shadow-sm rounded-lg bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                            <Lock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t("ledger_integrity") || "Ledger Integrity"}</p>
                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="h-3.5 w-3.5" /> {t("tamper_proof") || "100% Tamper-Proof"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Trail Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[500px] flex flex-col justify-between">
                <div className="space-y-4 flex-1 flex flex-col">
                    {/* Actions Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-3">
                    <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                        {/* Search Input */}
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder={t("search") || "Search..."}
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        {/* Action Filter */}
                        <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val); setCurrentPage(1); }}>
                            <SelectTrigger className="h-8 w-32 text-[11px] border-gray-200 bg-transparent shadow-none rounded">
                                <SelectValue placeholder={t("all") || "All Actions"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("all") || "All Actions"}</SelectItem>
                                <SelectItem value="login">Logins</SelectItem>
                                <SelectItem value="create">Creations</SelectItem>
                                <SelectItem value="update">Updates</SelectItem>
                                <SelectItem value="security">Security</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{t("show") || "Show"}</span>
                            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">{toLocaleNumber(10, language?.short_code)}</SelectItem>
                                    <SelectItem value="25">{toLocaleNumber(25, language?.short_code)}</SelectItem>
                                    <SelectItem value="50">{toLocaleNumber(50, language?.short_code)}</SelectItem>
                                    <SelectItem value="100">{toLocaleNumber(100, language?.short_code)}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            <Button variant="ghost" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title={t("csv") || "CSV"} onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                <FileBox className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={() => window.print()} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4 w-[120px]">{t("action") || "Action"}</TableHead>
                                <TableHead className="py-3 px-4 min-w-[280px]">{t("message") || "Message"}</TableHead>
                                <TableHead className="py-3 px-4 min-w-[180px]">{t("users") || "Users"}</TableHead>
                                <TableHead className="py-3 px-4 min-w-[130px]">{t("ip_address") || "IP Address"}</TableHead>
                                <TableHead className="py-3 px-4 min-w-[120px]">{t("platform") || "Platform"}</TableHead>
                                <TableHead className="py-3 px-4 min-w-[160px]">{t("date_time") || "Date Time"}</TableHead>
                                <TableHead className="py-3 px-4 text-right pr-6 w-[80px]">{t("view") || "Inspect"}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableSkeleton cols={7} />
                            ) : reportList.length === 0 ? (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                            <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest whitespace-nowrap">
                                                {t("no_data_available_in_table") || "No data available in table"}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedReportList.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                        {t("no_items_match_the_search") || "No items match the search."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedReportList.map((item, idx) => (
                                    <TableRow
                                        key={item.id || idx}
                                        className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap"
                                    >
                                        <TableCell className="py-3 px-4">
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap",
                                                getActionBadge(item.action)
                                            )}>
                                                {item.action}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 font-semibold text-gray-800">
                                            {item.message}
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 border border-gray-200">
                                                    <AvatarFallback className="text-[9px] font-bold bg-indigo-50 text-indigo-700">
                                                        {item.users?.charAt(0) || "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-medium text-gray-700 truncate max-w-[180px]">
                                                    {item.users}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 font-mono text-gray-600">
                                            <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[11px]">
                                                {item.ip_address}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600">
                                            <span className="inline-flex items-center gap-1">
                                                <Monitor className="h-3.5 w-3.5 text-gray-400" />
                                                {item.platform}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-indigo-600 font-medium">
                                            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                {item.date_time}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right pr-6">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedLog(item);
                                                    setInspectOpen(true);
                                                }}
                                                className="h-7 w-7 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 ml-auto"
                                                title={t("view") || "Inspect"}
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
            </div>

                {/* Footer Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100 mt-auto gap-3">
                    <div>
                        {t("showing_x_to_y_of_z", {
                            x: toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, language?.short_code),
                            y: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), language?.short_code),
                            z: toLocaleNumber(totalEntries, language?.short_code),
                        }) || `Showing ${totalEntries > 0 ? startIndex + 1 : 0} to ${Math.min(startIndex + sizeNum, totalEntries)} of ${totalEntries} entries`}
                        {searchTerm && ` (${t("filtered_from") || "filtered from"} ${toLocaleNumber(reportList.length, language?.short_code)} ${t("total_entries") || "total entries"})`}
                    </div>

                    {totalEntries > 0 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={safePage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-400 rounded-lg hover:shadow-xs active:scale-95 transition-all border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
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
                                            : "bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200"
                                    )}
                                >
                                    {toLocaleNumber(page, language?.short_code)}
                                </button>
                            ))}

                            <button
                                disabled={safePage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-400 rounded-lg hover:shadow-xs active:scale-95 transition-all border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Payload Inspector Modal */}
            <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
                <DialogContent className="max-w-xl rounded-2xl p-6 bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                            <Terminal className="h-5 w-5 text-indigo-600" />
                            {t("view") || "Inspect"} Event #{selectedLog?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Security fingerprint and runtime context
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-3.5 py-2 text-xs">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">{t("message") || "Message"}</p>
                                <p className="font-semibold text-gray-900 leading-relaxed">{selectedLog.message}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{t("action") || "Action"}</p>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                                        getActionBadge(selectedLog.action)
                                    )}>
                                        {selectedLog.action}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{t("date_time") || "Timestamp"}</p>
                                    <p className="font-mono font-bold text-indigo-600">{selectedLog.date_time}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{t("users") || "Operator"}</p>
                                    <p className="font-semibold text-gray-800">{selectedLog.users}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{t("ip_address") || "IP Address"}</p>
                                    <p className="font-mono font-bold text-gray-800">{selectedLog.ip_address}</p>
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">{t("user_agent") || "User Agent"}</p>
                                <p className="font-mono text-[11px] text-gray-600 break-all">{selectedLog.agent}</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInspectOpen(false)} className="text-xs">
                            {t("close") || "Close"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Clear Confirmation Dialog */}
            <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <AlertDialogContent className="rounded-2xl bg-white max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-rose-500" /> {t("are_you_sure") || "Are you sure?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500">
                            {t("action_cannot_be_undone") || "This action cannot be undone. This will permanently truncate all security event logs from the system ledger."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-xs font-semibold rounded-lg cursor-pointer">{t("cancel") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearAudit}
                            disabled={clearing}
                            className="bg-rose-600 hover:bg-rose-700 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer"
                        >
                            {clearing ? (t("clearing") || "Clearing...") : (t("clear_all") || "Clear All")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
