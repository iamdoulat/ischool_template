"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
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
import {
    Search, ChevronLeft, ChevronRight,
    ArrowUpDown, List, Copy, FileSpreadsheet,
    FileText, FileCode, Printer, Columns, X, Video, Users
} from "lucide-react";
import { cn, formatTime, toLocaleNumber, translateRoleName } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface MeetingReport {
    id: string;
    title: string;
    description: string;
    date_time: string;
    created_by: string;
    creator?: {
        id: number;
        name: string;
        last_name: string;
        role: string;
    };
    total_join: number;
    status: string;
    meeting_url?: string;
}

export default function LiveMeetingReportPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const { settings } = useSettings();
    const tf = settings?.time_format === "12" ? "12" : "24" as const;
    const [searchTerm, setSearchTerm] = useState("");
    const [reports, setReports] = useState<MeetingReport[]>([]);
    const [loading, setLoading] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [totalEntries, setTotalEntries] = useState(0);

    // Join List Modal State
    const [joinModalOpen, setJoinModalOpen] = useState(false);
    const [joinSearchTerm, setJoinSearchTerm] = useState("");
    const [activeJoinList, setActiveJoinList] = useState<any[]>([]);

    useEffect(() => {
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await api.get('/conference/gmeet-meetings', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            if (response.data && response.data.data) {
                setReports(response.data.data || []);
                setTotalEntries(response.data.total || 0);
            } else {
                setReports(response.data || []);
                setTotalEntries(response.data.length || 0);
            }
        } catch (error) {
            console.error("Failed to fetch reports", error);
            toast.error(t("failed_to_load_live_meeting_reports"));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenJoinList = (item: MeetingReport) => {
        const list: any[] = [];
        if (item.creator) {
            list.push({
                name: `${item.creator.name} ${item.creator.last_name ?? ''}`.trim(),
                role: item.creator.role || t("host"),
                id: item.creator.id,
                last_join: formatDisplayDateTime(item.date_time),
            });
        }
        setActiveJoinList(list);
        setJoinModalOpen(true);
    };

    // Date time parser helper to format as DD/MM/YYYY HH:MM
    const formatDisplayDateTime = (dtStr: string) => {
        try {
            const d = new Date(dtStr);
            if (isNaN(d.getTime())) return dtStr;
            const pad = (n: number) => n.toString().padStart(2, '0');
            const dd = toLocaleNumber(pad(d.getDate()), shortCode);
            const mm = toLocaleNumber(pad(d.getMonth() + 1), shortCode);
            const yyyy = toLocaleNumber(d.getFullYear().toString(), shortCode);
            const timeStr = toLocaleNumber(formatTime(d, tf), shortCode);
            return (
                <div className="flex flex-col text-slate-700 dark:text-slate-200 text-xs font-medium leading-tight">
                    <span>{`${dd}/${mm}/${yyyy}`}</span>
                    <span className="text-gray-400 dark:text-gray-400 text-[11px] mt-0.5">{timeStr}</span>
                </div>
            );
        } catch {
            return dtStr;
        }
    };

    // Export helpers
    const exportData = reports.map(item => ({
        [t("meeting_title")]: item.title || "—",
        [t("description")]: item.description || "—",
        [t("meeting_date_time")]: item.date_time || "—",
        [t("created_by")]: item.creator ? `${item.creator.name} ${item.creator.last_name || ""} (${item.creator.role})` : t("self"),
        [t("total_join")]: item.total_join || 0,
        [t("status")]: t(item.status || "awaited")
    }));

    const handleCopy = () => {
        if (reports.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const text = reports.map(i => `${i.title}\t${i.description || ""}\t${i.date_time}\t${i.creator?.name || t("self")}\t${i.total_join || 0}\t${i.status}`).join('\n');
        navigator.clipboard.writeText(text);
        toast.success(t("data_copied_to_clipboard"));
    };

    const handleExportExcel = () => {
        if (reports.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("live_meeting_report") || "MeetingReport");
        XLSX.writeFile(wb, "live_meeting_report.xlsx");
        toast.success(t("exported_to_excel"));
    };

    const handleExportCSV = () => {
        if (reports.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "live_meeting_report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t("exported_to_csv"));
    };

    const handleExportPDF = () => {
        if (reports.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const doc = new jsPDF("landscape");
        doc.text(t("live_meeting_report"), 14, 15);
        autoTable(doc, {
            head: [[t("meeting_title"), t("description"), t("meeting_date_time"), t("created_by"), t("total_join"), t("status")]],
            body: reports.map(i => [
                i.title || "—",
                i.description || "—",
                i.date_time || "—",
                i.creator?.name || t("self"),
                i.total_join || 0,
                t(i.status || "awaited")
            ]),
            startY: 20,
        });
        doc.save("live_meeting_report.pdf");
        toast.success(t("exported_to_pdf"));
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: handleExportExcel, title: t("excel") },
        { Icon: FileText, onClick: handleExportCSV, title: t("csv") },
        { Icon: FileCode, onClick: handleExportPDF, title: t("pdf") || "PDF" },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
        { Icon: Columns, onClick: () => {}, title: t("columns") },
    ];

    // Calculate pagination variables
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    const filteredJoinList = activeJoinList.filter(user =>
        user.name.toLowerCase().includes(joinSearchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(joinSearchTerm.toLowerCase()) ||
        user.id.toString().includes(joinSearchTerm)
    );

    return (
        <div className="space-y-6">

            {/* Gradient card header */}
            <div className="rounded-xl border-[0.5px] border-gray-300 dark:border-zinc-800 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-row items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 dark:border-b dark:border-zinc-800">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Video className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">{t("live_meeting_report")}</h1>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{t("view_and_track_google_meet_live_meeting_attendance")}</p>
                    </div>
                </div>
            </div>

            {/* Table Container Panel */}
            <div className="bg-white dark:bg-card/40 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-5 space-y-4 overflow-hidden min-h-[500px]">

                {/* Table Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder={t("search_placeholder") || t("search")}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9 h-9 text-xs border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-md"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{t("rows")}</span>
                            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[72px] h-9 text-xs bg-white dark:bg-card border border-gray-200 dark:border-zinc-800">
                                    <SelectValue placeholder={toLocaleNumber("50", shortCode)}>
                                        {toLocaleNumber(itemsPerPage, shortCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">{toLocaleNumber("10", shortCode)}</SelectItem>
                                    <SelectItem value="25">{toLocaleNumber("25", shortCode)}</SelectItem>
                                    <SelectItem value="50">{toLocaleNumber("50", shortCode)}</SelectItem>
                                    <SelectItem value="100">{toLocaleNumber("100", shortCode)}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center border rounded-md p-0.5 bg-white/90 dark:bg-card border-gray-200 dark:border-zinc-800 shadow-xs text-gray-500">
                            {toolbarActions.map((action, i) => (
                                <Button key={i} variant="ghost" size="icon" onClick={action.onClick} title={action.title} className="h-7 w-7 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded">
                                    <action.Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-md border border-gray-200 dark:border-zinc-800 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-gray-50 dark:bg-zinc-900/50 text-xs uppercase">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-gray-600 dark:text-gray-300">
                                <TableHead className="py-3 px-4 font-semibold">{t("meeting_title")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("description")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("meeting_date_time")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("created_by")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold text-center">{t("total_join")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold text-right">{t("action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i} className="border-b border-gray-50 dark:border-zinc-800/50">
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <TableCell key={j} className="py-3 px-4">
                                                <div className="h-3 w-full max-w-[120px] rounded bg-gray-200/70 dark:bg-zinc-800 animate-pulse" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : reports.length === 0 ? (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={6} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                        {t("no_records_found")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((item, idx) => (
                                    <TableRow key={item.id || idx} className="text-xs border-b border-gray-100 dark:border-zinc-800/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 whitespace-nowrap">
                                        <TableCell className="py-3.5 px-4 text-gray-800 dark:text-gray-200 font-semibold">{item.title}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-500 dark:text-gray-400 max-w-[250px] truncate" title={item.description}>{item.description || "—"}</TableCell>
                                        <TableCell className="py-3.5 px-4">{formatDisplayDateTime(item.date_time)}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                                            {item.creator
                                                ? `${item.creator.name} ${item.creator.last_name ?? ''} (${translateRoleName(item.creator.role || "Staff", shortCode)} : ${toLocaleNumber(item.creator.id, shortCode)})`
                                                : t("self")}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                                            {toLocaleNumber(item.total_join || 0, shortCode)}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end">
                                                <Button
                                                    onClick={() => handleOpenJoinList(item)}
                                                    className="h-7 w-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md p-0 shadow-sm active:scale-95 transition-all"
                                                    title={t("view_join_list_details")}
                                                >
                                                    <List className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <div>
                        {t("showing_x_to_y_of_z", {
                            from: toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, shortCode),
                            to: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), shortCode),
                            total: toLocaleNumber(totalEntries, shortCode)
                        })}
                        {searchTerm && ` (${t("filtered_from_total_entries", { total: toLocaleNumber(totalEntries, shortCode) })})`}
                    </div>

                    {totalEntries > 0 && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={safePage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                className="h-8 w-8 p-0 rounded-[10px] bg-white dark:bg-card border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 shadow-sm disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <Button
                                    key={page}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 p-0 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer",
                                        safePage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 border-0"
                                            : "bg-white dark:bg-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    {toLocaleNumber(page, shortCode)}
                                </Button>
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={safePage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                className="h-8 w-8 p-0 rounded-[10px] bg-white dark:bg-card border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 shadow-sm disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Join List Modal */}
            <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
                <DialogContent className="max-w-[800px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Users className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <DialogTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                    {t("join_list")}
                                </DialogTitle>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                    {t("live_meeting_report")}
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => setJoinModalOpen(false)} 
                            className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Table Toolbar */}
                    <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100 dark:border-zinc-800">
                        <div className="relative w-full md:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search_placeholder") || t("search")}
                                value={joinSearchTerm}
                                onChange={(e) => setJoinSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-md"
                            />
                        </div>
                    </div>

                    {/* Modal Grid content */}
                    <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto custom-scrollbar">
                        <div className="rounded-md border border-gray-200 dark:border-zinc-800 overflow-x-auto">
                            <Table className="min-w-[700px]">
                                <TableHeader className="bg-gray-50 dark:bg-zinc-900/50 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-gray-600 dark:text-gray-300">
                                        <TableHead className="py-3 px-4 font-semibold">{t("staff")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 font-semibold text-right">{t("last_join")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredJoinList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-10 text-gray-400 uppercase text-[10px] tracking-wider">
                                                {t("no_session_join_records_matching_search_filter")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredJoinList.map((user, uidx) => (
                                            <TableRow key={uidx} className="text-xs border-b border-gray-100 dark:border-zinc-800/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 whitespace-nowrap">
                                                <TableCell className="py-3 px-4 text-gray-800 dark:text-gray-200 font-semibold">
                                                    {user.name} <span className="text-gray-500 dark:text-gray-400 font-normal">({translateRoleName(user.role, shortCode)} : {toLocaleNumber(user.id, shortCode)})</span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-600 dark:text-gray-300 font-medium">
                                                    {user.last_join}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Modal Footer pagination */}
                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                            <div>
                                {t("showing_x_to_y_of_z", {
                                    from: toLocaleNumber(filteredJoinList.length > 0 ? 1 : 0, shortCode),
                                    to: toLocaleNumber(filteredJoinList.length, shortCode),
                                    total: toLocaleNumber(filteredJoinList.length, shortCode)
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50/80 dark:bg-zinc-900 px-5 py-3 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setJoinModalOpen(false)}
                            className="h-8 px-4 rounded-full text-xs font-semibold"
                        >
                            {t("close")}
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>

        </div>
    );
}
