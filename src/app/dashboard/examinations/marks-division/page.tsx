"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Pencil, Trash2, Search, ChevronLeft, ChevronRight, GraduationCap, 
    Percent, Award, Copy, FileSpreadsheet, FileText, Printer, Columns 
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

interface Division {
    id: string;
    name: string;
    percent_from: string;
    percent_upto: string;
}

export default function MarksDivisionPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);

    // Form State
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        percent_from: "",
        percent_upto: ""
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchDivisions();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchDivisions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/examination/marks-divisions', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            setDivisions(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch divisions", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.percent_from || !formData.percent_upto) {
            toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/examination/marks-divisions/${selectedId}`, formData);
                toast({ title: "Success", description: "Division updated successfully" });
            } else {
                await api.post('/examination/marks-divisions', formData);
                toast({ title: "Success", description: "Division created successfully" });
            }
            resetForm();
            fetchDivisions();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save division", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (division: Division) => {
        setFormData({
            name: division.name,
            percent_from: division.percent_from,
            percent_upto: division.percent_upto
        });
        setSelectedId(division.id);
        setEditMode(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/examination/marks-divisions/${deleteId}`);
            toast({ title: "Success", description: "Division deleted successfully" });
            fetchDivisions();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete division", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({ name: "", percent_from: "", percent_upto: "" });
        setEditMode(false);
        setSelectedId(null);
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Add Marks Division Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6 sticky top-4">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                            <div className="bg-indigo-50 p-2 rounded-lg">
                                <Award className="h-5 w-5 text-indigo-500" />
                            </div>
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
                                {editMode ? "Edit Division" : "Add Division"}
                            </h2>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Division Name <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. First"
                                    className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500 shadow-none" 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Percent From <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input 
                                        type="number"
                                        value={formData.percent_from}
                                        onChange={(e) => setFormData({...formData, percent_from: e.target.value})}
                                        placeholder="0.00"
                                        className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500 pl-4 pr-10" 
                                    />
                                    <Percent className="absolute right-3.5 top-3.5 h-4 w-4 text-gray-300" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Percent Upto <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input 
                                        type="number"
                                        value={formData.percent_upto}
                                        onChange={(e) => setFormData({...formData, percent_upto: e.target.value})}
                                        placeholder="0.00"
                                        className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500 pl-4 pr-10" 
                                    />
                                    <Percent className="absolute right-3.5 top-3.5 h-4 w-4 text-gray-300" />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                {editMode && (
                                    <Button onClick={resetForm} variant="outline" className="flex-1 h-11 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-200">
                                        Cancel
                                    </Button>
                                )}
                                <Button 
                                    onClick={handleSave} 
                                    disabled={submitting}
                                    className="btn-gradient flex-[2] text-white h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full"
                                >
                                    {submitting ? "Saving..." : editMode ? "Update" : "Save"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Division List */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                                <GraduationCap className="h-5 w-5 text-indigo-500" />
                                Division List
                            </h2>
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

                        <div className="flex justify-end">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search divisions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                                />
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-gray-50/50 text-[11px] uppercase font-bold text-gray-600">
                                    <TableRow className="hover:bg-transparent border-gray-50">
                                        <TableHead className="py-4 px-6">Division Name</TableHead>
                                        <TableHead className="py-4 px-6">Percentage From</TableHead>
                                        <TableHead className="py-4 px-6">Percentage Upto</TableHead>
                                        <TableHead className="py-4 px-6 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">Loading...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : divisions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-gray-400 text-sm italic">
                                                No divisions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        divisions.map((division) => (
                                            <TableRow key={division.id} className="text-sm text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                                <TableCell className="py-4 px-6 font-bold text-indigo-600 tracking-tight">{division.name}</TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold text-[11px] border border-emerald-100">
                                                        {division.percent_from}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-bold text-[11px] border border-rose-100">
                                                        {division.percent_upto}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        <Button size="icon" variant="ghost" onClick={() => handleEdit(division)} className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-all">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(division.id)} className="h-8 w-8 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md transition-all">
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
                                    disabled={divisions.length < itemsPerPage}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Division</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this marks division? This action cannot be undone and will affect how exam results are categorized.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Division
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
