"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO, isValid } from "date-fns";
import {
    ChevronLeft, ChevronRight, Search, Plus, Pencil, Trash2,
    CalendarRange, Calendar, Loader2, FolderOpen,
    Copy, FileSpreadsheet, FileDown, Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface HolidayTypeOption { id: string | number; name: string; }

interface CalendarEntry {
    id: string;
    start_date: string;
    end_date: string;
    holiday_type_id: string | number;
    holiday_type?: { name: string };
    description: string;
    creator?: { name: string; last_name: string; staff_id: string };
    is_front_site: boolean;
}

const PAGE_SIZES = ["10", "25", "50", "100"];

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

export default function AnnualCalendarPage() {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [holidayTypes, setHolidayTypes] = useState<HolidayTypeOption[]>([]);
    const [calendarData, setCalendarData] = useState<CalendarEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [totalEntries, setTotalEntries] = useState(0);

    const [open, setOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        start_date: "", end_date: "", holiday_type_id: "", description: "", is_front_site: true,
    });
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchHolidayTypes = useCallback(async () => {
        try {
            const response = await api.get('/annual-calendar/holiday-types?no_paginate=true');
            const payload = response.data?.data ?? response.data ?? [];
            setHolidayTypes(Array.isArray(payload) ? payload : []);
        } catch {
            console.error("Failed to fetch holiday types");
        }
    }, []);

    const fetchCalendarData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/annual-calendar/annual-calendars', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm,
                    holiday_type_id: filterType !== "all" ? filterType : undefined,
                },
            });
            const resData = response.data;
            if (resData?.data && Array.isArray(resData.data)) {
                setCalendarData(resData.data);
                setTotalEntries(resData.total ?? resData.data.length);
            } else if (resData?.data?.data && Array.isArray(resData.data.data)) {
                setCalendarData(resData.data.data);
                setTotalEntries(resData.data.total ?? resData.data.data.length);
            } else if (Array.isArray(resData)) {
                setCalendarData(resData);
                setTotalEntries(resData.length);
            } else {
                setCalendarData([]);
                setTotalEntries(0);
            }
        } catch {
            toast.error(t("failed_to_load_calendar_entries") || "Failed to load calendar entries");
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm, filterType, t]);

    useEffect(() => { fetchHolidayTypes(); }, [fetchHolidayTypes]);
    useEffect(() => { fetchCalendarData(); }, [fetchCalendarData]);

    const handleSave = async () => {
        if (!formData.start_date || !formData.end_date || !formData.holiday_type_id || !formData.description) {
            toast.error(t("all_fields_required") || "All fields are required");
            return;
        }
        setSubmitting(true);
        try {
            if (dialogMode === "edit" && selectedId) {
                await api.put(`/annual-calendar/annual-calendars/${selectedId}`, formData);
                toast.success(t("calendar_entry_updated") || "Calendar entry updated");
            } else {
                await api.post('/annual-calendar/annual-calendars', formData);
                toast.success(t("calendar_entry_created") || "Calendar entry created");
            }
            setOpen(false);
            resetForm();
            fetchCalendarData();
        } catch {
            toast.error(t("failed_to_save_calendar_entry") || "Failed to save calendar entry");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (entry: CalendarEntry) => {
        setDialogMode("edit");
        setSelectedId(entry.id);
        setFormData({
            start_date: entry.start_date,
            end_date: entry.end_date,
            holiday_type_id: entry.holiday_type_id.toString(),
            description: entry.description,
            is_front_site: !!entry.is_front_site,
        });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/annual-calendar/annual-calendars/${deleteId}`);
            toast.success(t("calendar_entry_deleted") || "Calendar entry deleted");
            fetchCalendarData();
        } catch {
            toast.error(t("failed_to_delete_calendar_entry") || "Failed to delete calendar entry");
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setDialogMode("add");
        setSelectedId(null);
        setFormData({
            start_date: "",
            end_date: "",
            holiday_type_id: holidayTypes[0]?.id ? holidayTypes[0].id.toString() : "",
            description: "",
            is_front_site: true,
        });
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        const d = parseISO(dateStr);
        if (isValid(d)) {
            return format(d, "dd/MM/yyyy");
        }
        return dateStr;
    };

    // ── Export Handlers ──
    const handleCopy = () => {
        if (calendarData.length === 0) return;
        const text = calendarData.map(c => [
            `${formatDate(c.start_date)} - ${formatDate(c.end_date)}`,
            c.holiday_type?.name || "—",
            c.description || "",
            c.creator ? `${c.creator.name} ${c.creator.last_name || ""}`.trim() : "—",
            c.is_front_site ? "Yes" : "No"
        ].join("\t")).join("\n");
        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard") || "Copied to clipboard");
    };

    const handleExcel = () => {
        if (calendarData.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(calendarData.map(c => ({
            "Start Date": formatDate(c.start_date),
            "End Date": formatDate(c.end_date),
            "Holiday Type": c.holiday_type?.name || "—",
            "Description": c.description || "",
            "Created By": c.creator ? `${c.creator.name} ${c.creator.last_name || ""}`.trim() : "—",
            "Front Site": c.is_front_site ? "Yes" : "No",
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Annual Calendar");
        XLSX.writeFile(wb, "annual-calendar.xlsx");
    };

    const handlePDF = () => {
        if (calendarData.length === 0) return;
        const doc = new jsPDF("l");
        doc.text("Annual Calendar", 14, 16);
        autoTable(doc, {
            head: [["Date Range", "Holiday Type", "Description", "Created By", "Front Site"]],
            body: calendarData.map(c => [
                `${formatDate(c.start_date)} - ${formatDate(c.end_date)}`,
                c.holiday_type?.name || "—",
                c.description || "",
                c.creator ? `${c.creator.name} ${c.creator.last_name || ""}`.trim() : "—",
                c.is_front_site ? "Yes" : "No",
            ]),
            startY: 22,
            styles: { fontSize: 8 },
        });
        doc.save("annual-calendar.pdf");
    };

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20">
            <Card className="border-[0.5px] border-gray-200 dark:border-gray-800 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0 bg-white dark:bg-slate-900">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-slate-800 dark:to-slate-850">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarRange className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 dark:text-gray-100 leading-none">{t("annual_calendar")}</CardTitle>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{t("manage_holidays_events_and_vacation_schedules")}</p>
                        </div>
                    </div>
                    <Button onClick={() => { resetForm(); setOpen(true); }}
                        className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all shrink-0">
                        <Plus className="h-4 w-4" /> {t("add_entry")}
                    </Button>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                    {/* Filters & Export Toolbar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <div className="space-y-1.5 w-full sm:w-56">
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("holiday_type")}</Label>
                                <Select value={filterType} onValueChange={v => { setFilterType(v); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700"><SelectValue placeholder={t("all_types") || "All Types"} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("all_types") || "All Types"}</SelectItem>
                                        {holidayTypes.map(typ => (
                                            <SelectItem key={typ.id} value={typ.id.toString()}>{typ.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 w-full sm:w-64">
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("search") || "Search"}</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input placeholder={t("search_description") || "Search description..."} value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700" />
                                </div>
                            </div>
                        </div>

                        {/* Export & page size */}
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white dark:bg-slate-900">
                                <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy" className="h-7 w-7 text-gray-500 hover:text-indigo-600">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleExcel} title="Excel" className="h-7 w-7 text-gray-500 hover:text-green-600">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handlePDF} title="PDF" className="h-7 w-7 text-gray-500 hover:text-red-600">
                                    <FileDown className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => window.print()} title="Print" className="h-7 w-7 text-gray-500 hover:text-indigo-600">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{t("show") || "Show"}</span>
                                <Select value={itemsPerPage} onValueChange={v => { setItemsPerPage(v); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-9 w-[70px] text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PAGE_SIZES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border border-gray-200 dark:border-gray-800 overflow-x-auto">
                        <Table className="min-w-[900px]">
                            <TableHeader className="bg-gray-50 dark:bg-slate-800/80 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300">{t("date") || "Date"}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300">{t("type") || "Type"}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300">{t("description") || "Description"}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300">{t("created_by") || "Created By"}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 text-center">{t("front_site") || "Front Site"}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 text-right w-[100px]">{t("action") || "Action"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableSkeleton cols={6} /> : calendarData.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="py-14 text-center"><div className="flex flex-col items-center gap-2 text-gray-400"><FolderOpen className="h-8 w-8 opacity-40" /><span className="text-xs">{t("no_calendar_entries_found") || "No calendar entries found."}</span></div></TableCell></TableRow>
                                ) : calendarData.map((item, idx) => (
                                    <TableRow key={item.id || idx} className="text-xs hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 hover:shadow-sm hover:z-10 relative transition-all duration-300">
                                        <TableCell className="py-3 font-medium text-gray-800 dark:text-gray-200">
                                            <span className="flex items-center gap-1.5 whitespace-nowrap">
                                                <Calendar className="h-3 w-3 text-indigo-400" />
                                                {formatDate(item.start_date)}{item.start_date !== item.end_date ? ` – ${formatDate(item.end_date)}` : ""}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-[10px] font-semibold">
                                                {item.holiday_type?.name || "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-600 dark:text-gray-300 max-w-[280px] truncate" title={item.description}>
                                            {item.description}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                                            {item.creator ? `${item.creator.name} ${item.creator.last_name || ""}`.trim() : "—"}
                                        </TableCell>
                                        <TableCell className="py-3 text-center">
                                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold", item.is_front_site ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300" : "bg-gray-100 dark:bg-slate-800 text-gray-500")}>
                                                {item.is_front_site ? (t("yes") || "Yes") : (t("no") || "No")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button onClick={() => handleEdit(item)} size="sm" className="h-7 w-7 p-0 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95" title={t("edit") || "Edit"}><Pencil className="h-4 w-4" /></Button>
                                                <Button onClick={() => setDeleteId(item.id)} size="sm" className="h-7 w-7 p-0 rounded bg-red-500 hover:bg-red-600 text-white shadow-sm active:scale-95" title={t("delete") || "Delete"}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        <div>{t("showing") || "Showing"} {totalEntries > 0 ? startIndex + 1 : 0} {t("to") || "to"} {Math.min(startIndex + sizeNum, totalEntries)} {t("of") || "of"} {totalEntries} {t("entries") || "entries"}</div>
                        {totalPages > 1 && (
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="h-8 w-8 p-0 rounded-[10px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, safePage - 3), safePage + 2).map(page => (
                                    <Button key={page} size="sm" onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold", safePage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md" : "bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700")}>{page}</Button>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="h-8 w-8 p-0 rounded-[10px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900">
                    <DialogHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-slate-800 dark:to-slate-850 border-b border-gray-100 dark:border-gray-800">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-gray-100">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm"><CalendarRange className="h-4 w-4" /></span>
                            {dialogMode === "edit" ? (t("edit_calendar_entry") || "Edit Calendar Entry") : (t("add_calendar_entry") || "Add Calendar Entry")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("start_date") || "Start Date"} <span className="text-red-500">*</span></Label>
                                <DatePicker
                                    value={formData.start_date}
                                    onChange={d => setFormData({ ...formData, start_date: d })}
                                    placeholder="DD/MM/YYYY"
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("end_date") || "End Date"} <span className="text-red-500">*</span></Label>
                                <DatePicker
                                    value={formData.end_date}
                                    onChange={d => setFormData({ ...formData, end_date: d })}
                                    placeholder="DD/MM/YYYY"
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("holiday_type") || "Holiday Type"} <span className="text-red-500">*</span></Label>
                            <Select value={formData.holiday_type_id} onValueChange={v => setFormData({ ...formData, holiday_type_id: v })}>
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700"><SelectValue placeholder={t("select_type") || "Select type"} /></SelectTrigger>
                                <SelectContent>
                                    {holidayTypes.map(typ => (
                                        <SelectItem key={typ.id} value={typ.id.toString()}>{typ.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("description") || "Description"} <span className="text-red-500">*</span></Label>
                            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="text-xs resize-none bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700" placeholder={t("event_details") || "Event details"} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t("publish_on_front_site") || "Publish on front site"}</Label>
                                <p className="text-[10px] text-gray-400">{t("visible_to_students_and_public_users") || "Visible to students and public users"}</p>
                            </div>
                            <Switch checked={formData.is_front_site} onCheckedChange={v => setFormData({ ...formData, is_front_site: v })} className="data-[state=checked]:bg-emerald-500" />
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/40">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-9 px-5 text-xs font-bold">{t("cancel") || "Cancel"}</Button>
                        <Button onClick={handleSave} disabled={submitting} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (dialogMode === "edit" ? (t("update_entry") || "Update Entry") : (t("save_entry") || "Save Entry"))}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
                <AlertDialogContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_calendar_entry") || "Delete Calendar Entry"}</AlertDialogTitle>
                        <AlertDialogDescription>{t("delete_calendar_entry_confirm") || "This action cannot be undone. The calendar entry will be permanently removed from all dashboards."}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600 text-white">{t("delete") || "Delete"}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
