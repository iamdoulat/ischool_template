"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { cn, toLocaleNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
    Card,
    CardContent,
} from "@/components/ui/card";
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
import {
    Copy,
    FileSpreadsheet,
    FileBox,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Pencil,
    Trash2,
    Info,
    CalendarRange,
    Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";

interface SessionEntry {
    id: number;
    session: string;
    is_active: boolean;
}

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
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

function FormSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-8 w-24 rounded-full" />
        </div>
    );
}

export default function SessionSettingPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";

    const [searchTerm, setSearchTerm] = useState("");
    const [sessions, setSessions] = useState<SessionEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("desc");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Delete dialog
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Form state
    const [editId, setEditId] = useState<number | null>(null);
    const [sessionName, setSessionName] = useState("");
    const [isActive, setIsActive] = useState(false);

    const { toast } = useToast();

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await api.get("/system-setting/sessions");
            if (response.data.success) {
                setSessions(response.data.data);
            }
        } catch (err: unknown) {
            console.error("Failed to fetch sessions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const resetForm = () => {
        setEditId(null);
        setSessionName("");
        setIsActive(false);
    };

    const handleEdit = (session: SessionEntry) => {
        setEditId(session.id);
        setSessionName(session.session);
        setIsActive(session.is_active);
    };

    const handleSave = async () => {
        if (!sessionName.trim()) {
            toast({
                title: t("error") || "Error",
                description: t("session_name_is_required") || "Session name is required",
                variant: "destructive",
            });
            return;
        }

        try {
            setSaving(true);

            const payload = {
                session: sessionName,
                is_active: isActive
            };

            if (editId) {
                await api.put(`/system-setting/sessions/${editId}`, payload);
                toast({
                    title: t("success_title") || "Success",
                    description: t("session_updated_successfully") || "Session updated successfully",
                });
            } else {
                await api.post("/system-setting/sessions", payload);
                toast({
                    title: t("success_title") || "Success",
                    description: t("session_added_successfully") || "Session added successfully",
                });
            }

            fetchSessions();
            resetForm();

        } catch (err: unknown) {
            const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast({
                title: t("error") || "Error",
                description: errorMsg || t("an_error_occurred") || "An error occurred",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await api.delete(`/system-setting/sessions/${deleteId}`);
            toast({
                title: t("success_title") || "Success",
                description: t("session_deleted_successfully") || "Session deleted successfully",
            });
            fetchSessions();
        } catch (err: unknown) {
            const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast({
                title: t("error") || "Error",
                description: errorMsg || t("failed_to_delete_session") || "Failed to delete session",
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const handleToggleActive = async (session: SessionEntry) => {
        if (session.is_active) return;

        try {
            await api.put(`/system-setting/sessions/${session.id}`, {
                session: session.session,
                is_active: true
            });
            toast({
                title: t("success_title") || "Success",
                description: `${t("session") || "Session"} ${toLocaleNumber(session.session, shortCode)} ${t("set_as_active") || "set as active"}`,
            });
            fetchSessions();
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_update_session_status") || "Failed to update session status",
                variant: "destructive",
            });
        }
    };

    const filteredSessions = useMemo(() => {
        return sessions.filter(s =>
            s.session.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => {
            if (!sortOrder) return 0;
            if (sortOrder === "asc") return a.session.localeCompare(b.session);
            return b.session.localeCompare(a.session);
        });
    }, [sessions, searchTerm, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(filteredSessions.length / itemsPerPage));

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    const paginatedSessions = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredSessions.slice(start, start + itemsPerPage);
    }, [filteredSessions, currentPage, itemsPerPage]);

    const toggleSort = () => {
        setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    };

    const handleCopy = () => {
        if (filteredSessions.length === 0) return;
        const headers = [t("session") || "Session", t("status") || "Status"];
        const rows = filteredSessions.map(s => [s.session, s.is_active ? (t("active") || "Active") : (t("inactive") || "Inactive")]);
        const tsv = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
        navigator.clipboard.writeText(tsv).then(() => {
            toast({ title: t("copied") || "Copied", description: t("data_copied_to_clipboard") || "Data copied to clipboard" });
        });
    };

    const handleExportExcel = () => {
        if (filteredSessions.length === 0) return;
        const headers = [t("session") || "Session", t("status") || "Status"];
        const rows = filteredSessions.map(s => [s.session, s.is_active ? (t("active") || "Active") : (t("inactive") || "Inactive")]);
        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "sessions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        if (filteredSessions.length === 0) return;
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        const headers = [t("session") || "Session", t("status") || "Status"];
        const rows = filteredSessions.map(s => [toLocaleNumber(s.session, shortCode), s.is_active ? (t("active") || "Active") : (t("inactive") || "Inactive")]);

        const html = `
            <html><head><title>${t("session_list") || "Session List"}</title>
            <style>
                body { font-family: sans-serif; padding: 20px; color: #333; }
                h2 { margin-bottom: 20px; font-size: 18px; color: #111; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
                th { background-color: #f9fafb; font-weight: bold; text-transform: uppercase; }
                tr:nth-child(even) { background-color: #fdfdfd; }
            </style></head><body>
                <h2>${t("session_list") || "Session List"}</h2>
                <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>
            </body></html>`;

        doc.open();
        doc.write(html);
        doc.close();

        iframe.contentWindow?.focus();
        setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => {
                if (document.body.contains(iframe)) document.body.removeChild(iframe);
            }, 1000);
        }, 250);
    };

    const startIndex = filteredSessions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredSessions.length);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            {/* Standalone Edge-to-Edge Page Header Banner */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <CalendarRange className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">
                            {t("session_setting") || t("session_settings") || "Session Setting"}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("manage_academic_sessions") || "Manage academic sessions"}
                        </p>
                    </div>
                </div>
            </div>

            <Card className="border border-gray-100 shadow-sm overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Side: Add/Edit Session */}
                        <div className="w-full md:w-1/3 md:max-w-sm space-y-4">
                            <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-4 shadow-sm">
                                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">
                                    {editId ? (t("edit_session") || "Edit Session") : (t("add_session") || "Add Session")}
                                </h2>

                                {loading ? (
                                    <FormSkeleton />
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                                {t("session") || "Session"} <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                value={sessionName}
                                                onChange={(e) => setSessionName(e.target.value)}
                                                placeholder={t("e_g_2026_27") || `e.g. ${toLocaleNumber("2026-27", shortCode)}`}
                                                className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="isActive"
                                                checked={isActive}
                                                onCheckedChange={(checked) => setIsActive(checked as boolean)}
                                            />
                                            <label htmlFor="isActive" className="text-[11px] font-medium leading-none cursor-pointer">
                                                {t("set_as_active_session") || "Set as active session"}
                                            </label>
                                        </div>

                                        <div className="flex justify-between pt-2">
                                            {editId ? (
                                                <Button
                                                    variant="outline"
                                                    onClick={resetForm}
                                                    className="h-7 text-[10px] font-bold uppercase"
                                                >
                                                    {t("cancel") || "Cancel"}
                                                </Button>
                                            ) : <div />}
                                            <Button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-8 text-[11px] font-bold transition-all rounded-full shadow-md border-none"
                                            >
                                                {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                                                {t("save") || "Save"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Session List */}
                        <div className="flex-1 space-y-4">
                            <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-4 shadow-sm">
                                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">
                                    {t("session_list") || "Session List"}
                                </h2>

                                {/* Warning Note */}
                                <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-md flex gap-2.5 items-start">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Info className="h-2.5 w-2.5 text-blue-500" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-blue-600/80 leading-relaxed font-medium">
                                        {t("note_changing_the_session_name_format_may_cause_issues") || "Note: Changing the session name format may cause issues with existing data."}
                                    </p>
                                </div>

                                {/* Table Header / Actions */}
                                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                                    <div className="relative w-full sm:w-64">
                                        <Input
                                            placeholder={t("search") || "Search..."}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <Select value={String(itemsPerPage)} onValueChange={(val) => setItemsPerPage(Number(val))}>
                                                <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none ring-0">
                                                    <SelectValue>
                                                        {toLocaleNumber(itemsPerPage, shortCode)}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">{toLocaleNumber(10, shortCode)}</SelectItem>
                                                    <SelectItem value="25">{toLocaleNumber(25, shortCode)}</SelectItem>
                                                    <SelectItem value="50">{toLocaleNumber(50, shortCode)}</SelectItem>
                                                    <SelectItem value="100">{toLocaleNumber(100, shortCode)}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400">
                                            <Button onClick={handleCopy} variant="ghost" size="icon" title={t("copy") || "Copy"} className="h-7 w-7 hover:bg-gray-100 rounded">
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button onClick={handleExportExcel} variant="ghost" size="icon" title={t("excel") || "Excel"} className="h-7 w-7 hover:bg-gray-100 rounded">
                                                <FileSpreadsheet className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button onClick={handleExportExcel} variant="ghost" size="icon" title={t("csv") || "CSV"} className="h-7 w-7 hover:bg-gray-100 rounded">
                                                <FileBox className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button onClick={handlePrint} variant="ghost" size="icon" title={t("pdf") || "PDF"} className="h-7 w-7 hover:bg-gray-100 rounded">
                                                <FileText className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button onClick={handlePrint} variant="ghost" size="icon" title={t("print") || "Print"} className="h-7 w-7 hover:bg-gray-100 rounded">
                                                <Printer className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Session Table */}
                                <div className="rounded border border-gray-100 overflow-hidden relative">
                                    {loading && (
                                        <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                                        </div>
                                    )}
                                    <Table>
                                        <TableHeader className="bg-gray-50/80 border-b border-gray-100">
                                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                                <TableHead className="py-3 px-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={toggleSort}>
                                                    <div className="flex items-center gap-1">
                                                        {t("session") || "Session"} <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="py-3 px-4">{t("status") || "Status"}</TableHead>
                                                <TableHead className="py-3 px-4 text-right">{t("action") || "Action"}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableSkeleton cols={3} />
                                            ) : paginatedSessions.length > 0 ? (
                                                paginatedSessions.map((item) => (
                                                    <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 transition-colors">
                                                        <TableCell className="py-3 px-4 text-gray-800 font-semibold tracking-wide">
                                                            {toLocaleNumber(item.session, shortCode)}
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4">
                                                            <button
                                                                onClick={() => handleToggleActive(item)}
                                                                className={cn(
                                                                    "text-[9px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider transition-all shadow-2xs",
                                                                    item.is_active
                                                                        ? "bg-emerald-500 text-white cursor-default"
                                                                        : "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                                                                )}
                                                            >
                                                                {item.is_active ? (t("active") || "Active") : (t("set_active") || "Set Active")}
                                                            </button>
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4 text-right">
                                                            <div className="flex justify-end items-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleEdit(item)}
                                                                    title={t("edit") || "Edit"}
                                                                    className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs active:scale-95 transition-all flex items-center justify-center hover:opacity-95"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => confirmDelete(item.id)}
                                                                    title={t("delete") || "Delete"}
                                                                    className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xs active:scale-95 transition-all flex items-center justify-center hover:opacity-95"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-8 text-gray-400">
                                                        {t("no_records_found") || "No records found"}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Table Footer with Localized Pagination */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                                    <div>
                                        {loading ? (
                                            <Skeleton className="h-4 w-40 rounded" />
                                        ) : (
                                            <span>
                                                {t("showing") || "Showing"}{" "}
                                                <span className="font-bold text-gray-700">{toLocaleNumber(startIndex, shortCode)}</span>{" "}
                                                {t("to") || "to"}{" "}
                                                <span className="font-bold text-gray-700">{toLocaleNumber(endIndex, shortCode)}</span>{" "}
                                                {t("of") || "of"}{" "}
                                                <span className="font-bold text-gray-700">{toLocaleNumber(filteredSessions.length, shortCode)}</span>{" "}
                                                {t("entries") || "entries"}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            disabled={currentPage <= 1 || loading}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            variant="outline"
                                            className="h-7 w-7 p-0 border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-100 transition-all shadow-xs disabled:opacity-40"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="h-7 min-w-[28px] px-2 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-[11px] font-bold rounded-lg shadow-sm flex items-center justify-center">
                                            {toLocaleNumber(currentPage, shortCode)}
                                        </span>
                                        <Button
                                            disabled={currentPage >= totalPages || loading}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            variant="outline"
                                            className="h-7 w-7 p-0 border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-100 transition-all shadow-xs disabled:opacity-40"
                                        >
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Accessible Confirmation AlertDialog for Delete */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_session") || "Delete Session"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_session_confirm_msg") || "Are you sure you want to delete this session? This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteId(null)}>
                            {t("cancel") || "Cancel"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-gradient-to-r from-rose-500 to-red-600 text-white hover:opacity-95"
                        >
                            {t("delete") || "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
