"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Copy, FileSpreadsheet, FileBox, Printer, Columns, 
    ChevronLeft, ChevronRight, Search, ArrowUpDown, X, Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface HolidayType {
    id: string;
    name: string;
}

export default function HolidayTypePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [holidayTypes, setHolidayTypes] = useState<HolidayType[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [totalEntries, setTotalEntries] = useState(0);

    // Form State
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "" });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchHolidayTypes();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchHolidayTypes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/annual-calendar/holiday-types', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            if (response.data && response.data.data) {
                setHolidayTypes(response.data.data || []);
                setTotalEntries(response.data.total || 0);
            } else {
                setHolidayTypes(response.data || []);
                setTotalEntries(response.data.length || 0);
            }
        } catch (error) {
            console.error("Failed to fetch holiday types", error);
            toast.error("Failed to load holiday types");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.error("Name is required");
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/annual-calendar/holiday-types/${selectedId}`, formData);
                toast.success("Holiday type updated successfully");
            } else {
                await api.post('/annual-calendar/holiday-types', formData);
                toast.success("Holiday type created successfully");
            }
            resetForm();
            fetchHolidayTypes();
        } catch (error) {
            console.error("Failed to save holiday type", error);
            toast.error("Failed to save holiday type");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (type: HolidayType) => {
        setFormData({ name: type.name });
        setSelectedId(type.id);
        setEditMode(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/annual-calendar/holiday-types/${deleteId}`);
            toast.success("Holiday type expunged successfully");
            fetchHolidayTypes();
        } catch (error) {
            console.error("Failed to delete holiday type", error);
            toast.error("Failed to expunge holiday type");
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({ name: "" });
        setEditMode(false);
        setSelectedId(null);
    };

    // Calculate pagination variables
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Left Column: Form Panel (1/3 size) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded border border-gray-100 p-4 shadow-sm space-y-4 min-h-[250px]">
                        <h2 className="text-sm font-semibold tracking-tight text-gray-800 border-b border-gray-50 pb-2">
                            {editMode ? "Edit Holiday Type" : "Add Holiday Type"}
                        </h2>
                        
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-700">Name <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ name: e.target.value })}
                                    placeholder="Enter holiday type name"
                                    className="h-9 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none w-full"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            {editMode && (
                                <Button 
                                    variant="outline" 
                                    onClick={resetForm}
                                    className="h-8.5 px-4 font-semibold text-gray-500 border-gray-200 hover:bg-gray-100 rounded cursor-pointer"
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button 
                                onClick={handleSave}
                                disabled={submitting}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-5 h-8.5 font-bold rounded shadow transition-all active:scale-95 border-0 cursor-pointer"
                            >
                                {editMode ? "Update" : "Save"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Table Panel (2/3 size) */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="bg-white rounded border border-gray-100 p-4 shadow-sm space-y-4 min-h-[500px]">
                        <h2 className="text-sm font-semibold tracking-tight text-gray-800 border-b border-gray-50 pb-2">
                            Holiday Type
                        </h2>

                        {/* Table Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-1">
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
                            <Table className="min-w-[600px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-12">
                                                <div className="flex items-center justify-center gap-2 text-gray-400">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                                                    Auditing Holiday Types...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : holidayTypes.length === 0 ? (
                                        <TableRow className="hover:bg-transparent h-48">
                                            <TableCell colSpan={2} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                                No holiday types found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        holidayTypes.map((item, idx) => (
                                            <TableRow key={item.id || idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap">
                                                <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.name}</TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 ml-auto">
                                                        <Button 
                                                            onClick={() => handleEdit(item)}
                                                            className="bg-[#7e57c2] hover:bg-[#7048b6] text-white p-0 h-6 w-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                                            title="Edit Type"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button 
                                                            onClick={() => setDeleteId(item.id)}
                                                            className="bg-[#6366f1] hover:bg-[#5558e6] text-white p-0 h-6 w-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                                            title="Delete Type"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
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
                </div>

            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="max-w-[450px] p-6 bg-white border border-gray-200 shadow-2xl rounded text-gray-700 text-xs">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-800 text-sm font-semibold tracking-tight">Expunge Holiday Type</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 text-xs leading-relaxed mt-2">
                            Are you sure you want to permanently delete this holiday type? This action will invalidate all associated calendar dates and event schedules across active semesters.
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
