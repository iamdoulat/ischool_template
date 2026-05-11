"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Pencil, Trash2, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, Search
} from "lucide-react";
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

interface HolidayType {
    id: string;
    name: string;
}

export default function HolidayTypePage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [holidayTypes, setHolidayTypes] = useState<HolidayType[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);

    // Form State
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "" });

    // Dialog State
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
            setHolidayTypes(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch holiday types", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast({ title: "Validation Error", description: "Name is required", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/annual-calendar/holiday-types/${selectedId}`, formData);
                toast({ title: "Success", description: "Holiday type updated successfully" });
            } else {
                await api.post('/annual-calendar/holiday-types', formData);
                toast({ title: "Success", description: "Holiday type created successfully" });
            }
            resetForm();
            fetchHolidayTypes();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save holiday type", variant: "destructive" });
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
            toast({ title: "Success", description: "Holiday type deleted successfully" });
            fetchHolidayTypes();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete holiday type", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({ name: "" });
        setEditMode(false);
        setSelectedId(null);
    };

    const handleAction = (action: string) => {
        toast({ title: "Info", description: `Export as ${action.toUpperCase()} requested` });
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Left Column: Add Holiday Type Form */}
            <div className="w-full lg:w-1/4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <h2 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3 mb-6 uppercase tracking-widest">
                        {editMode ? "Edit Holiday Type" : "Add Holiday Type"}
                    </h2>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="holidayTypeName" className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                id="holidayTypeName" 
                                value={formData.name}
                                onChange={(e) => setFormData({ name: e.target.value })}
                                className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500" 
                                placeholder="Enter name"
                            />
                        </div>

                        <div className="flex justify-end pt-4 gap-2">
                            {editMode && (
                                <Button onClick={resetForm} variant="outline" className="h-11 px-8 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-200">
                                    Cancel
                                </Button>
                            )}
                            <Button 
                                onClick={handleSave} 
                                disabled={submitting}
                                className="btn-gradient text-white px-10 h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full"
                            >
                                {submitting ? "Saving..." : editMode ? "Update" : "Save"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Holiday Type List */}
            <div className="w-full lg:w-3/4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                    <h2 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3 uppercase tracking-widest">Holiday Type List</h2>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-72">
                                <Input
                                    placeholder="Search holiday types..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-4 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500"
                                />
                            </div>
                            <Button className="btn-gradient h-11 px-8 rounded-full flex items-center gap-2 text-[11px] font-bold uppercase shadow-lg shadow-orange-200/50">
                                <Search className="h-4 w-4" /> Search
                            </Button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 mr-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">Rows:</span>
                                <span className="text-xs text-indigo-600 font-bold">50</span>
                                <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button onClick={() => handleAction('copy')} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleAction('excel')} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleAction('pdf')} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleAction('print')} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
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
                                    <TableHead className="py-4 px-6">Name</TableHead>
                                    <TableHead className="text-right py-4 px-6">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-32 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Loading...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : holidayTypes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-32 text-center text-gray-400 text-sm italic">
                                            No holiday types found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    holidayTypes.map((type) => (
                                        <TableRow key={type.id} className="text-sm text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                            <TableCell className="py-4 px-6 font-medium">{type.name}</TableCell>
                                            <TableCell className="text-right py-4 px-6">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(type)} className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-all">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(type.id)} className="h-8 w-8 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md transition-all">
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
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" 
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="default" size="sm" className="h-8 w-8 p-0 btn-gradient text-white border-0 rounded-lg shadow-md">
                                {currentPage}
                            </Button>
                            <Button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" 
                                disabled={holidayTypes.length < itemsPerPage}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Holiday Type</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this holiday type? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Type
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
