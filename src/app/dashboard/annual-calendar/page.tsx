"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    FileEdit
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
    AlertDialogBody,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface CalendarEntry {
    id: string;
    start_date: string;
    end_date: string;
    holiday_type_id: string;
    holiday_type: { name: string };
    description: string;
    creator?: { first_name: string; last_name: string; staff_id: string };
    is_front_site: boolean;
}

export default function AnnualCalendarPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [holidayTypes, setHolidayTypes] = useState<any[]>([]);
    const [calendarData, setCalendarData] = useState<CalendarEntry[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        start_date: "",
        end_date: "",
        holiday_type_id: "",
        description: "",
        is_front_site: false
    });

    // Delete State
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
            setCalendarData(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch calendar data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.start_date || !formData.end_date || !formData.holiday_type_id || !formData.description) {
            toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
            return;
        }

        try {
            if (dialogMode === "edit" && selectedId) {
                await api.put(`/annual-calendar/annual-calendars/${selectedId}`, formData);
                toast({ title: "Success", description: "Calendar entry updated successfully" });
            } else {
                await api.post('/annual-calendar/annual-calendars', formData);
                toast({ title: "Success", description: "Calendar entry created successfully" });
            }
            setIsDialogOpen(false);
            fetchCalendarData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save calendar entry", variant: "destructive" });
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
        setIsDialogOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/annual-calendar/annual-calendars/${deleteId}`);
            toast({ title: "Success", description: "Calendar entry deleted successfully" });
            fetchCalendarData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete calendar entry", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const openAddDialog = () => {
        setDialogMode("add");
        setFormData({
            start_date: "",
            end_date: "",
            holiday_type_id: "",
            description: "",
            is_front_site: false
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="p-2 space-y-2 bg-transparent min-h-screen font-sans">
            {/* Header Section */}
            <div className="flex justify-between items-center bg-transparent p-4 rounded-md border border-slate-200/60 shadow-none">
                <div>
                    <h1 className="text-lg font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <CalendarIcon className="h-5 w-5 text-indigo-500" />
                        Annual Calendar
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage school holidays, activities, and events</p>
                </div>
                <Button onClick={openAddDialog} className="btn-gradient text-white gap-2 h-9 px-6 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-md">
                    <Plus className="h-4 w-4" /> Add Entry
                </Button>
            </div>

            {/* Filter Section */}
            <div className="bg-transparent p-4 rounded-md border border-slate-200/60 shadow-none space-y-4">
                <div className="space-y-2 max-w-2xl">
                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        Filter By Type
                    </Label>
                    <div className="flex gap-2 items-center">
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full md:w-[250px] h-9 border-slate-200 bg-white/50 text-xs rounded-md focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {holidayTypes.map(t => (
                                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={fetchCalendarData} className="btn-gradient h-9 px-6 rounded-md flex items-center gap-2 text-[11px] font-bold uppercase shadow-lg shadow-orange-200/50">
                            <Search className="h-4 w-4" /> Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Calendar List Section */}
            <div className="bg-transparent rounded-md border border-slate-200/60 shadow-none overflow-hidden p-4 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder="Search description..."
                            className="pl-9 h-9 text-xs border-slate-200 bg-white/50 rounded-md focus:ring-indigo-500 shadow-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={itemsPerPage.toString()} onValueChange={(val) => {
                            setItemsPerPage(Number(val));
                            setCurrentPage(1);
                        }}>
                            <SelectTrigger className="h-8 px-2 bg-white/50 border-slate-200 rounded-md focus:ring-0 focus:ring-offset-0 shadow-none min-w-[100px]">
                                <SelectValue>
                                    <div className="flex items-center gap-1.5 w-full">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Rows:</span>
                                        <span className="text-xs text-indigo-600 font-bold">{itemsPerPage}</span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-md">
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1 text-gray-400">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                <Columns className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-gray-50/50 text-[11px] uppercase font-bold text-gray-600">
                            <TableRow className="hover:bg-transparent border-gray-50">
                                <TableHead className="py-4 px-6">Date Range</TableHead>
                                <TableHead className="py-4 px-6">Type</TableHead>
                                <TableHead className="py-4 px-6 min-w-[350px]">Description</TableHead>
                                <TableHead className="py-4 px-6 whitespace-nowrap">Created By</TableHead>
                                <TableHead className="py-4 px-6 text-center">Front Site</TableHead>
                                <TableHead className="py-4 px-6 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Loading...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : calendarData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-400 text-sm italic">
                                        No calendar entries found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                calendarData.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-gray-50/30 transition-colors group border-b last:border-0 border-gray-50">
                                        <TableCell className="py-4 px-6">
                                            <div className="text-xs font-bold text-gray-700 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md border border-gray-100 inline-block tracking-tighter">
                                                {item.start_date} <span className="text-indigo-400 mx-1">To</span> {item.end_date}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                                                {item.holiday_type?.name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-[12px] text-gray-600 leading-relaxed italic line-clamp-2 max-w-md">
                                            "{item.description}"
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            {item.creator ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700">{item.creator.first_name} {item.creator.last_name}</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase">ID: {item.creator.staff_id}</span>
                                                </div>
                                            ) : <span className="text-gray-300">---</span>}
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${item.is_front_site ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-gray-100 text-gray-400"
                                                } shadow-sm transition-all duration-300`}>
                                                {item.is_front_site ? "Published" : "Private"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(item)} className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-all">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => setDeleteId(item.id)} className="h-8 w-8 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md transition-all">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-4 uppercase tracking-tight">
                    <div>
                        Showing {totalEntries === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" 
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {/* Dynamic Pagination Buttons */}
                        {Array.from({ length: Math.min(5, Math.ceil(totalEntries / itemsPerPage)) }, (_, i) => {
                            const totalPages = Math.ceil(totalEntries / itemsPerPage);
                            let pageNum = 1;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            const isActive = currentPage === pageNum;

                            return (
                                <Button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    variant={isActive ? "pagination-active" : "pagination-inactive"}
                                    className="h-8 w-8 p-0 text-[10px]"
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}

                        <Button 
                            onClick={() => setCurrentPage(p => p + 1)}
                            variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" 
                            disabled={currentPage >= Math.ceil(totalEntries / itemsPerPage) || totalEntries === 0}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl rounded-lg border-0 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 btn-gradient text-white">
                        <DialogTitle className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
                            <FileEdit className="h-6 w-6" />
                            {dialogMode === "add" ? "Add Calendar Entry" : "Edit Calendar Entry"}
                        </DialogTitle>
                        <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Define school holidays, events, or activities</p>
                    </DialogHeader>

                    <div className="p-8 space-y-6 bg-white">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Start Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date"
                                    value={formData.start_date} 
                                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">End Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date"
                                    value={formData.end_date} 
                                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Holiday Type <span className="text-red-500">*</span></Label>
                            <Select value={formData.holiday_type_id} onValueChange={(val) => setFormData({...formData, holiday_type_id: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {holidayTypes.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Description <span className="text-red-500">*</span></Label>
                            <Textarea 
                                value={formData.description} 
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Enter detailed description" 
                                className="min-h-[120px] border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 p-4"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-50">
                            <div className="space-y-1">
                                <Label className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">Publish to Front Site</Label>
                                <p className="text-[10px] text-gray-400 font-medium italic">Enable to show this entry on the public school website</p>
                            </div>
                            <Switch 
                                checked={formData.is_front_site} 
                                onCheckedChange={(val) => setFormData({...formData, is_front_site: val})}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-gray-50/50 flex justify-end gap-3">
                        <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="h-11 px-8 rounded-lg text-[11px] font-bold uppercase tracking-widest border-gray-200">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="btn-gradient text-white h-11 px-12 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-orange-200/50">
                            {dialogMode === "add" ? "Save Entry" : "Update Entry"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Calendar Entry</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this calendar entry? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-lg text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Entry
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
