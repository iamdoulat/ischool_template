"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
    Copy, FileSpreadsheet, FileBox, Printer, Columns, 
    ChevronLeft, ChevronRight, Search, ArrowUpDown, X, Plus, Pencil, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

export default function AnnualCalendarPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [holidayTypes, setHolidayTypes] = useState<any[]>([]);
    const [calendarData, setCalendarData] = useState<CalendarEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [totalEntries, setTotalEntries] = useState(0);

    // Form Modal state
    const [open, setOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        start_date: "",
        end_date: "",
        holiday_type_id: "",
        description: "",
        is_front_site: true
    });

    // Delete dialog state
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchHolidayTypes();
    }, []);

    useEffect(() => {
        fetchCalendarData();
    }, [currentPage, itemsPerPage, searchTerm, filterType]);

    const fetchHolidayTypes = async () => {
        try {
            const response = await api.get('/annual-calendar/holiday-types?no_paginate=true');
            setHolidayTypes(response.data || []);
        } catch (error) {
            console.error("Failed to fetch holiday types", error);
        }
    };

    const fetchCalendarData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/annual-calendar/annual-calendars', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm,
                    holiday_type_id: filterType !== "all" ? filterType : undefined
                }
            });
            if (response.data && response.data.data) {
                setCalendarData(response.data.data || []);
                setTotalEntries(response.data.total || 0);
            } else {
                setCalendarData(response.data || []);
                setTotalEntries(response.data.length || 0);
            }
        } catch (error) {
            console.error("Failed to fetch calendar data", error);
            toast.error("Failed to load calendar entries");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.start_date || !formData.end_date || !formData.holiday_type_id || !formData.description) {
            toast.error("Required fields missing");
            return;
        }

        setSubmitting(true);
        try {
            if (dialogMode === "edit" && selectedId) {
                await api.put(`/annual-calendar/annual-calendars/${selectedId}`, formData);
                toast.success("Calendar entry updated successfully");
            } else {
                await api.post('/annual-calendar/annual-calendars', formData);
                toast.success("Calendar entry scheduled successfully");
            }
            setOpen(false);
            resetForm();
            fetchCalendarData();
        } catch (error) {
            console.error("Failed to save calendar entry", error);
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
            is_front_site: !!entry.is_front_site
        });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/annual-calendar/annual-calendars/${deleteId}`);
            toast.success("Calendar entry expunged successfully");
            fetchCalendarData();
        } catch (error) {
            console.error("Failed to delete calendar entry", error);
            toast.error("Failed to expunge calendar entry");
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
            holiday_type_id: "",
            description: "",
            is_front_site: true
        });
    };

    // Date parser helper to format as MM/DD/YYYY
    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
        } catch {
            return dateStr;
        }
    };

    // Calculate pagination variables
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            
            {/* Header */}
            <div className="bg-white border border-gray-100 rounded shadow-sm p-4 flex items-center justify-between">
                <h1 className="text-sm font-semibold tracking-tight text-gray-800">Annual Calendar</h1>
                <Button 
                    onClick={() => { resetForm(); setOpen(true); }}
                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-4 h-9 text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(99,102,241,0.25)] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                </Button>
            </div>

            {/* Criteria Filter Selection Section */}
            <div className="bg-white rounded border border-gray-100 p-4 shadow-sm space-y-2">
                <Label className="text-[11px] font-medium text-gray-700">Type <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-3">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full md:w-[250px] h-9 border-gray-200 text-xs rounded text-gray-700 bg-white">
                            <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent className="rounded shadow-xl">
                            <SelectItem value="all">All Types</SelectItem>
                            {holidayTypes.map(t => (
                                <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button 
                        onClick={fetchCalendarData} 
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-5 h-9 text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(99,102,241,0.25)] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                    >
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* List Header label */}
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1 pt-2">Calendar List</div>

            {/* Table Card Panel */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[500px]">

                {/* Table Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-8 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 shadow-none rounded font-semibold text-gray-700 bg-white">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            {[Copy, FileSpreadsheet, FileBox, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Type <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Description <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Created By <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-center">Front Site <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                                            Auditing Annual Calendar...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : calendarData.length === 0 ? (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={6} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                        No annual calendar events scheduled.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                calendarData.map((item, idx) => (
                                    <TableRow key={item.id || idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 px-4 text-gray-700 font-medium">
                                            {formatDate(item.start_date)} To {formatDate(item.end_date)}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600 font-medium">{item.holiday_type?.name || "-"}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600 max-w-[300px] truncate" title={item.description}>{item.description}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600 font-medium">
                                            {item.creator ? `${item.creator.name} ${item.creator.last_name || ""} (${item.creator.staff_id || "9000"})` : "Joe Black (9000)"}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-center text-gray-700 font-semibold">{item.is_front_site ? "Yes" : "No"}</TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 ml-auto">
                                                <Button 
                                                    onClick={() => handleEdit(item)}
                                                    className="bg-[#7e57c2] hover:bg-[#7048b6] text-white p-0 h-6 w-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                                    title="Edit Entry"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button 
                                                    onClick={() => setDeleteId(item.id)}
                                                    className="bg-[#6366f1] hover:bg-[#5558e6] text-white p-0 h-6 w-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                                    title="Delete Entry"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50 mt-2">
                    <div>
                        Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                        {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                    </div>

                    {totalEntries > 0 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={safePage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold",
                                        safePage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95"
                                            : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                    )}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                disabled={safePage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {/* Add / Edit Dialog Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[650px] p-0 overflow-hidden bg-white border border-gray-200 shadow-2xl rounded text-gray-700">
                    
                    {/* Header */}
                    <div className="bg-[#7e57c2] text-white p-4 font-semibold text-sm flex justify-between items-center">
                        <DialogHeader>
                            <DialogTitle className="text-white text-sm font-semibold tracking-tight">
                                {dialogMode === "edit" ? "Edit Calendar Entry" : "Add Calendar Entry"}
                            </DialogTitle>
                        </DialogHeader>
                        <button 
                            onClick={() => setOpen(false)} 
                            className="text-white/80 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Form Fields */}
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-xs">
                        
                        <div className="grid grid-cols-2 gap-4">
                            {/* Start Date */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-700">Start Date <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                    className="h-9 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none w-full"
                                />
                            </div>

                            {/* End Date */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-700">End Date <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                    className="h-9 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none w-full"
                                />
                            </div>
                        </div>

                        {/* Holiday Type */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-gray-700">Holiday Type <span className="text-red-500">*</span></Label>
                            <Select value={formData.holiday_type_id} onValueChange={(val) => setFormData({...formData, holiday_type_id: val})}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded text-gray-700 bg-white">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="rounded shadow-xl">
                                    {holidayTypes.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description / Agenda */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-gray-700">Description <span className="text-red-500">*</span></Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Session Details"
                                className="min-h-[100px] border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none resize-none w-full p-2"
                            />
                        </div>

                        {/* Publish toggle */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-[11px] font-medium text-gray-700">Publish on front site</Label>
                                <p className="text-[10px] text-gray-400">Makes this calendar entry visible to public users</p>
                            </div>
                            <Switch 
                                checked={formData.is_front_site}
                                onCheckedChange={(val) => setFormData({...formData, is_front_site: val})}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 text-xs">
                        <Button 
                            variant="outline" 
                            onClick={() => setOpen(false)}
                            className="h-8.5 px-4 font-semibold text-gray-500 border-gray-200 hover:bg-gray-100 rounded cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave}
                            disabled={submitting}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-5 h-8.5 font-bold rounded shadow transition-all active:scale-95 border-0 cursor-pointer"
                        >
                            Save
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="max-w-[450px] p-6 bg-white border border-gray-200 shadow-2xl rounded text-gray-700 text-xs">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-800 text-sm font-semibold tracking-tight">Expunge Calendar Entry</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 text-xs leading-relaxed mt-2">
                            Are you sure you want to permanently delete this calendar entry? This action will immediately remove the holiday, event, or vacation schedule from all public and internal dashboards.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-2">
                        <AlertDialogCancel className="h-8.5 px-4 font-semibold text-gray-500 border-gray-200 hover:bg-gray-100 rounded cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 text-white h-8.5 px-4 font-bold rounded shadow transition-all active:scale-95 border-0 cursor-pointer">
                            Confirm Expunge
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
