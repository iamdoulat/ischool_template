"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, 
    Trash2, ChevronLeft, ChevronRight, Plus, CreditCard,
    Search, ClipboardList, Info, Tag, CalendarClock,
    FileEdit, X
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface ObservationRecord {
    id: string;
    name: string;
    term: string;
    code: string;
    description: string;
}

export default function AssignObservationPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [observations, setObservations] = useState<ObservationRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);

    // Form Dialog State
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        term: "",
        code: "",
        description: ""
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchObservations();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchObservations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/examination/cbse-observations', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            setObservations(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch observations", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.term) {
            toast({ title: "Validation Error", description: "Name and Term are required", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/examination/cbse-observations/${selectedId}`, formData);
                toast({ title: "Success", description: "Observation updated successfully" });
            } else {
                await api.post('/examination/cbse-observations', formData);
                toast({ title: "Success", description: "Observation created successfully" });
            }
            setOpen(false);
            resetForm();
            fetchObservations();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save observation", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (record: ObservationRecord) => {
        setEditMode(true);
        setSelectedId(record.id);
        setFormData({
            name: record.name,
            term: record.term,
            code: record.code || "",
            description: record.description || ""
        });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/examination/cbse-observations/${deleteId}`);
            toast({ title: "Success", description: "Observation deleted successfully" });
            fetchObservations();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete observation", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({ name: "", term: "", code: "", description: "" });
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <ClipboardList className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">Board Observation Registry</h1>
                        <p className="text-[11px] text-gray-500 mt-1">Manage co-scholastic observations and grading codes</p>
                    </div>
                </div>
                <Button
                    onClick={() => { resetForm(); setOpen(true); }}
                    className="btn-gradient text-white px-8 h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-2"
                >
                    <Plus className="h-4 w-4" /> Register New Observation
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Display:</span>
                        <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
                            <SelectTrigger className="w-[100px] h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                <SelectValue placeholder="100" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 Rows</SelectItem>
                                <SelectItem value="25">25 Rows</SelectItem>
                                <SelectItem value="50">50 Rows</SelectItem>
                                <SelectItem value="100">100 Rows</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 text-gray-400 ml-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Copy className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileSpreadsheet className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Printer className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-gray-50/50 text-[11px] uppercase font-bold text-gray-600">
                            <TableRow className="hover:bg-transparent border-gray-50">
                                <TableHead className="py-4 px-6 min-w-[250px]">Observation Detail</TableHead>
                                <TableHead className="py-4 px-6 min-w-[120px]">Timeline</TableHead>
                                <TableHead className="py-4 px-6 min-w-[100px]">Board Code</TableHead>
                                <TableHead className="py-4 px-6 text-right min-w-[150px]">Action Utilities</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Registry...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : observations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-gray-400 text-sm italic">
                                        No observation records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                observations.map((item) => (
                                    <TableRow key={item.id} className="text-[13px] text-gray-600 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer group border-b last:border-0 border-gray-50 transition-colors">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-indigo-600 uppercase tracking-tight">{item.name}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[300px]">{item.description || "No description provided"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold text-[10px] border border-indigo-100 flex items-center gap-1.5 w-fit">
                                                <CalendarClock className="h-3 w-3" /> {item.term}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 font-bold text-gray-500 bg-gray-50/20">{item.code || "TBA"}</TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <Button size="sm" variant="ghost" className="h-8 px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md text-[10px] font-bold uppercase tracking-widest flex gap-2">
                                                    <CreditCard className="h-3.5 w-3.5" /> Assign
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(item)} className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => setDeleteId(item.id)} className="h-8 w-8 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md">
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
                            disabled={observations.length < itemsPerPage}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded-lg border-0 shadow-2xl max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3 border-b pb-4">
                            <FileEdit className="h-6 w-6 text-indigo-500" />
                            {editMode ? "Modify Observation" : "Register Observation"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-6">
                        <div className="col-span-2 space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Observation Name <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Behavioral Analysis"
                                className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Examination Term <span className="text-red-500">*</span></Label>
                            <Select value={formData.term} onValueChange={(val) => setFormData({...formData, term: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg shadow-none">
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Term 1">Term 1</SelectItem>
                                    <SelectItem value="Term 2">Term 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Board Code</Label>
                            <Input 
                                value={formData.code}
                                onChange={(e) => setFormData({...formData, code: e.target.value})}
                                placeholder="e.g. T015"
                                className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none" 
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Technical Description</Label>
                            <Textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Administrative notes..."
                                className="min-h-[100px] border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none resize-none" 
                            />
                        </div>
                    </div>
                    <DialogFooter className="border-t pt-6">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-11 rounded-full text-[10px] font-bold uppercase tracking-widest">Discard</Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={submitting}
                            className="btn-gradient text-white px-10 h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full"
                        >
                            {submitting ? "Processing..." : editMode ? "Update Registry" : "Commit Record"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Expunge Record</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this observation record? This will permanently remove all associated co-scholastic data linked to this entry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Expunge Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
