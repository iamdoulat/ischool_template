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
    Pencil, Trash2, Plus, Copy, FileSpreadsheet, FileText, 
    Printer, Columns, ChevronLeft, ChevronRight, Layers, 
    Search, LayoutList, ClipboardCheck, Info, FileStack,
    BarChart
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

interface ExamGroup {
    id: string;
    name: string;
    exams_count: number;
    exam_type: string;
    description: string;
}

export default function ExamGroupPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [groups, setGroups] = useState<ExamGroup[]>([]);
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
        exam_type: "",
        description: ""
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchGroups();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const response = await api.get('/examination/exam-groups', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            setGroups(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch exam groups", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.exam_type) {
            toast({ title: "Validation Error", description: "Name and Exam Type are required", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/examination/exam-groups/${selectedId}`, formData);
                toast({ title: "Success", description: "Exam group updated successfully" });
            } else {
                await api.post('/examination/exam-groups', formData);
                toast({ title: "Success", description: "Exam group created successfully" });
            }
            resetForm();
            fetchGroups();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save exam group", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (group: ExamGroup) => {
        setEditMode(true);
        setSelectedId(group.id);
        setFormData({
            name: group.name,
            exam_type: group.exam_type,
            description: group.description || ""
        });
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/examination/exam-groups/${deleteId}`);
            toast({ title: "Success", description: "Exam group deleted successfully" });
            fetchGroups();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete exam group", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({ name: "", exam_type: "", description: "" });
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Add Exam Group Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-fit sticky top-4">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30 rounded-t-2xl flex items-center gap-3">
                            <Layers className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
                                {editMode ? "Edit Exam Group" : "Add Exam Group"}
                            </h2>
                        </div>

                        <div className="p-6 space-y-6 flex-1">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Annual Exams 2026"
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none" 
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Exam Type <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.exam_type} onValueChange={(val) => setFormData({...formData, exam_type: val})}>
                                    <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none">
                                        <SelectValue placeholder="Select Exam Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General Purpose (Pass/Fail)">General Purpose (Pass/Fail)</SelectItem>
                                        <SelectItem value="School Based Grading System">School Based Grading System</SelectItem>
                                        <SelectItem value="College Based Grading System">College Based Grading System</SelectItem>
                                        <SelectItem value="GPA Grading System">GPA Grading System</SelectItem>
                                        <SelectItem value="Average Passing">Average Passing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Description</Label>
                                <Textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Provide additional details..."
                                    className="min-h-[120px] border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none resize-none" 
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-50 bg-gray-50/30 rounded-b-2xl flex gap-2">
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
                                {submitting ? "Processing..." : editMode ? "Update Group" : "Save Group"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Exam Group List */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                                <LayoutList className="h-5 w-5 text-indigo-500" />
                                Exam Group Registry
                            </h2>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Copy className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileSpreadsheet className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileText className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Printer className="h-4 w-4" /></Button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search groups..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Rows:</span>
                                <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
                                    <SelectTrigger className="w-[100px] h-10 border-gray-100 bg-gray-50/30 text-xs rounded-xl shadow-none">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10 Rows</SelectItem>
                                        <SelectItem value="25">25 Rows</SelectItem>
                                        <SelectItem value="50">50 Rows</SelectItem>
                                        <SelectItem value="100">100 Rows</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-50 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-gray-50/50 text-[11px] uppercase font-bold text-gray-600">
                                    <TableRow className="hover:bg-transparent border-gray-50">
                                        <TableHead className="py-4 px-6">Group Name</TableHead>
                                        <TableHead className="py-4 px-6 text-center">Exams</TableHead>
                                        <TableHead className="py-4 px-6">Grading System</TableHead>
                                        <TableHead className="py-4 px-6 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">Synchronizing Exam Data...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : groups.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-gray-400 text-sm italic">
                                                No exam groups found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        groups.map((group) => (
                                            <TableRow key={group.id} className="text-[13px] text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-indigo-600 uppercase tracking-tight">{group.name}</span>
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[200px]">{group.description || "No description provided"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-center">
                                                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold text-[10px] border border-indigo-100 flex items-center gap-1.5 w-fit mx-auto">
                                                        <FileStack className="h-3 w-3" /> {group.exams_count} EXAMS
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <BarChart className="h-3.5 w-3.5 text-gray-300" />
                                                        {group.exam_type}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => handleEdit(group)} className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(group.id)} className="h-8 w-8 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md">
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
                                    disabled={groups.length < itemsPerPage}
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
                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Exam Group</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this exam group? This will permanently remove all associated exams and examination data linked to this group.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Group
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
