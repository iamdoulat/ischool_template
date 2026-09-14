"use client";

import { useState, useEffect } from "react";
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
    Copy,
    FileSpreadsheet,
    FileBox,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Eraser,
    Activity,
} from "lucide-react";
import { cn, toLocaleNumber, translateRoleName } from "@/lib/utils";
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
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLanguage } from "@/components/providers/language-provider";

const tabList = [
    { id: "All Users", key: "all_users", label: "All Users" },
    { id: "Staff", key: "staff", label: "Staff" },
    { id: "Students", key: "students", label: "Students" },
    { id: "Parent", key: "parent", label: "Parent" },
    { id: "Guest", key: "guest", label: "Guest" },
];

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

interface UserLogRow {
    user?: string;
    role?: string;
    class?: string;
    ipAddress?: string;
    loginTime?: string;
    userAgent?: string;
}

export default function UserLogPage() {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState("All Users");
    const [searchTerm, setSearchTerm] = useState("");

    // Report Result States
    const [reportList, setReportList] = useState<UserLogRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");

    // Fetch User logs when activeTab changes
    useEffect(() => {
        const fetchUserLogs = async () => {
            setLoading(true);
            try {
                const response = await api.get("/reports/user-log", {
                    params: { role: activeTab }
                });
                setReportList(response.data.data || []);
                setCurrentPage(1);
            } catch (error) {
                console.error("Failed to fetch user logs", error);
                toast.error(t("failed_to_load_report") || "Failed to load user logs");
            } finally {
                setLoading(false);
            }
        };
        fetchUserLogs();
    }, [activeTab, t]);

    // Clear User logs Action
    const handleClearLogs = async () => {
        try {
            await api.post("/reports/user-log/clear");
            setReportList([]);
            toast.success(t("report_loaded_successfully") || "User log cleared successfully");
        } catch (error) {
            console.error("Failed to clear user logs", error);
            toast.error(t("failed_to_load_report") || "Failed to clear user logs");
        } finally {
            setIsClearDialogOpen(false);
        }
    };

    // Filtered Report logic based on searchTerm
    const filteredReport = reportList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            (item.user || "").toLowerCase().includes(lower) ||
            (item.role || "").toLowerCase().includes(lower) ||
            (item.class || "").toLowerCase().includes(lower) ||
            (item.ipAddress || "").toLowerCase().includes(lower) ||
            (item.loginTime || "").toLowerCase().includes(lower) ||
            (item.userAgent || "").toLowerCase().includes(lower)
        );
    });

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
            "Users\tRole\tClass\tIP Address\tLogin Date Time\tUser Agent",
            ...filteredReport.map((r) => `${r.user}\t${r.role}\t${r.class || "-"}\t${r.ipAddress}\t${r.loginTime}\t${r.userAgent}`)
        ].join("\n");
        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard") || "Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (filteredReport.length === 0) { toast.error(t("no_data_available_in_table") || "No data to export"); return; }
        const mapped = filteredReport.map((r) => ({
            "Users": r.user,
            "Role": r.role,
            "Class": r.class || "-",
            "IP Address": r.ipAddress,
            "Login Date Time": r.loginTime,
            "User Agent": r.userAgent,
        }));
        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "User Log");
        if (isCsv) { XLSX.writeFile(wb, "user_log_report.csv", { bookType: "csv" }); toast.success(t("csv_downloaded") || "CSV downloaded"); }
        else { XLSX.writeFile(wb, "user_log_report.xlsx"); toast.success(t("excel_downloaded") || "Excel file downloaded"); }
    };

    const exportToPDF = () => {
        if (filteredReport.length === 0) { toast.error(t("no_data_available_in_table") || "No data to export"); return; }
        const doc = new jsPDF("landscape");
        const head = [["Users", "Role", "Class", "IP Address", "Login Date Time", "User Agent"]];
        const body = filteredReport.map((r) => [r.user, r.role, r.class || "-", r.ipAddress, r.loginTime, r.userAgent]);
        autoTable(doc, { head, body, theme: "grid" });
        doc.save(`user_log_${activeTab.toLowerCase().replace(/\s+/g, '_')}.pdf`);
        toast.success(t("pdf_downloaded") || "PDF downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-4 pb-12">
            {/* Page Header Banner */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm flex items-center justify-center shrink-0">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-gray-800">{t("user_log") || "User Log"}</h1>
                            <p className="text-[11px] text-gray-500">{t("user_log_description") || "System user activity and login records"}</p>
                        </div>
                    </div>
                    {/* Role Filter Tabs */}
                    <div className="flex flex-wrap bg-white/80 backdrop-blur-xs border border-gray-200/80 rounded-lg p-1 shadow-xs">
                        {tabList.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setCurrentPage(1);
                                    setSearchTerm("");
                                }}
                                className={cn(
                                    "px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
                                    activeTab === tab.id
                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs font-bold"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                                )}
                            >
                                {t(tab.key) || tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[500px] flex flex-col justify-between">
                <div className="space-y-4 flex-1 flex flex-col">
                    {/* Actions Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-3">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder={t("search") || "Search..."}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <Button 
                            onClick={() => setIsClearDialogOpen(true)}
                            className="bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-90 text-white px-3.5 h-8 text-[11px] font-bold transition-all rounded-lg shadow-xs flex items-center gap-1.5 w-full sm:w-auto cursor-pointer active:scale-95"
                        >
                            <Eraser className="h-3.5 w-3.5" />
                            {t("clear_userlog_record") || "Clear Userlog Record"}
                        </Button>

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
                                <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Log Table */}
                <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">{t("users") || "Users"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("role") || "Role"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("class") || "Class"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("ip_address") || "IP Address"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("login_time") || "Login Date Time"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">{t("user_agent") || "User Agent"}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableSkeleton cols={6} />
                            ) : reportList.length === 0 ? (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                            <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest whitespace-nowrap">
                                                {t("no_data_available_in_table") || "No data available in table"}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedReportList.length > 0 ? (
                                paginatedReportList.map((log, idx) => (
                                    <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                        <TableCell className="py-3 px-4 text-gray-700 font-medium">{log.user}</TableCell>
                                        <TableCell className="py-3 px-4">
                                            <span className={cn(
                                                log.role === "Super Admin" ? "text-indigo-600 font-semibold" : "text-gray-500"
                                            )}>
                                                {translateRoleName(log.role || "", language?.short_code)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{log.class || "-"}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{log.ipAddress}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{log.loginTime}</TableCell>
                                        <TableCell className="py-3 px-4 text-right text-gray-400 font-normal truncate max-w-[300px]" title={log.userAgent}>
                                            {log.userAgent}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={6} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                        {t("no_items_match_the_search") || "No items match the search."}
                                    </TableCell>
                                </TableRow>
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

                    {reportList.length > 0 && (
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

            {/* Clear Confirmation Dialog */}
            <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <AlertDialogContent className="rounded-xl bg-white border border-gray-200 shadow-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_sure") || "Are you absolutely sure?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("action_cannot_be_undone") || "This action cannot be undone. This will permanently clear all user login logs from the database."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-lg font-bold text-xs h-9 cursor-pointer">
                            {t("cancel") || "Cancel"}
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleClearLogs} 
                            className="bg-red-500 hover:bg-red-600 rounded-lg font-bold text-xs h-9 text-white cursor-pointer"
                        >
                            {t("clear_all") || "Clear All"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
