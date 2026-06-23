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
import {
    ChevronLeft, ChevronRight, Search, Plus, Pencil, Trash2,
    CalendarRange, Calendar, Loader2, FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface HolidayTypeOption { id: string | number; name: string; }

interface CalendarEntry {
    id: string;
    start_date: string;
    end_date: string;
    holiday_type_id: string;
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
            setHolidayTypes(response.data || []);
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
            if (response.data && response.data.data) {
                setCalendarData(response.data.data || []);
                setTotalEntries(response.data.total || 0);
            } else {
                setCalendarData(response.data || []);
                setTotalEntries(response.data.length || 0);
            }
        } catch {
            toast.error("Failed to load calendar entries");
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm, filterType]);

    useEffect(() => { fetchHolidayTypes(); }, [fetchHolidayTypes]);
    useEffect(() => { fetchCalendarData(); }, [fetchCalendarData]);

    const handleSave = async () => {
        if (!formData.start_date || !formData.end_date || !formData.holiday_type_id || !formData.description) {
            toast.error("All fields are required"); return;
        }
        setSubmitting(true);
        try {
            if (dialogMode === "edit" && selectedId) {
                await api.put(`/annual-calendar/annual-calendars/${selectedId}`, formData);
                toast.success("Calendar entry updated");
            } else {
                await api.post('/annual-calendar/annual-calendars', formData);
                toast.success("Calendar entry created");
            }
            setOpen(false); resetForm(); fetchCalendarData();
        } catch {
            toast.error("Failed to save calendar entry");
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
            toast.success("Calendar entry deleted");
            fetchCalendarData();
        } catch {
            toast.error("Failed to delete calendar entry");
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setDialogMode("add");
        setSelectedId(null);
        setFormData({ start_date: "", end_date: "", holiday_type_id: "", description: "", is_front_site: true });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
    };

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20">
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarRange className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 leading-none">{t("annual_calendar")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("manage_holidays_events_and_vacation_schedules")}</p>
                        </div>
                    </div>
                    <Button onClick={() => { resetForm(); setOpen(true); }}
                        className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all shrink-0">
                        <Plus className="h-4 w-4" /> {t("add_entry")}
                    </Button>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <div className="space-y-1.5 w-full sm:w-56">
                                <Label className="text-xs font-semibold text-gray-600">{t("holiday_type")}</Label>
                                <Select value={filterType} onValueChange={v => { setFilterType(v); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {holidayTypes.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 w-full sm:w-64">
                                <Label className="text-xs font-semibold text-gray-600">Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input placeholder="Search description..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Show</span>
                            <Select value={itemsPerPage} onValueChange={v => { setItemsPerPage(v); setCurrentPage(1); }}>
                                <SelectTrigger className="h-9 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border overflow-x-auto">
                        <Table className="min-w-[900px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Type</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Description</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Created By</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">Front Site</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right w-[100px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableSkeleton cols={6} /> : calendarData.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="py-14 text-center"><div className="flex flex-col items-center gap-2 text-gray-400"><FolderOpen className="h-8 w-8 opacity-40" /><span className="text-xs">No calendar entries found.</span></div></TableCell></TableRow>
                                ) : calendarData.map((item, idx) => (
                                    <TableRow key={item.id || idx} className="text-xs hover:bg-gray-50/60 transition-colors">
                                        <TableCell className="py-3 font-medium text-gray-800">
                                            <span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar className="h-3 w-3 text-indigo-400" />{formatDate(item.start_date)} – {formatDate(item.end_date)}</span>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-semibold">{item.holiday_type?.name || "—"}</span>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-600 max-w-[280px] truncate" title={item.description}>{item.description}</TableCell>
                                        <TableCell className="py-3 text-gray-500">
                                            {item.creator ? `${item.creator.name} ${item.creator.last_name || ""}`.trim() : "—"}
                                        </TableCell>
                                        <TableCell className="py-3 text-center">
                                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold", item.is_front_site ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500")}>{item.is_front_site ? "Yes" : "No"}</span>
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button onClick={() => handleEdit(item)} size="sm" className="h-7 w-7 p-0 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95"><Pencil className="h-4 w-4" /></Button>
                                                <Button onClick={() => setDeleteId(item.id)} size="sm" className="h-7 w-7 p-0 rounded bg-red-500 hover:bg-red-600 text-white shadow-sm active:scale-95"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
                        <div>Showing {totalEntries > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries</div>
                        {totalPages > 1 && (
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, safePage - 3), safePage + 2).map(page => (
                                    <Button key={page} size="sm" onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold", safePage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{page}</Button>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm"><CalendarRange className="h-4 w-4" /></span>
                            {dialogMode === "edit" ? "Edit Calendar Entry" : "Add Calendar Entry"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Start Date <span className="text-red-500">*</span></Label>
                                <Input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">End Date <span className="text-red-500">*</span></Label>
                                <Input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="h-9 text-xs" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">Holiday Type <span className="text-red-500">*</span></Label>
                            <Select value={formData.holiday_type_id} onValueChange={v => setFormData({ ...formData, holiday_type_id: v })}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    {holidayTypes.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">Description <span className="text-red-500">*</span></Label>
                            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="text-xs resize-none" placeholder="Event details" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-xs font-semibold text-gray-700">Publish on front site</Label>
                                <p className="text-[10px] text-gray-400">Visible to students and public users</p>
                            </div>
                            <Switch checked={formData.is_front_site} onCheckedChange={v => setFormData({ ...formData, is_front_site: v })} className="data-[state=checked]:bg-emerald-500" />
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t bg-gray-50">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-9 px-5 text-xs font-bold">Cancel</Button>
                        <Button onClick={handleSave} disabled={submitting} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Entry"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Calendar Entry</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. The calendar entry will be permanently removed from all dashboards.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
