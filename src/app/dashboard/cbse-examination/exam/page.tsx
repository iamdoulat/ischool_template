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
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, 
    Trash2, ChevronLeft, ChevronRight, Plus, FileCode, 
    CheckSquare, Search, GraduationCap, ShieldCheck, 
    CalendarCheck2, Layers, BookOpen, FileEdit, X, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
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

interface ExamRecord {
    id: string;
    name: string;
    term: string;
    is_published: boolean;
    is_result_published: boolean;
    cbse_exam_category_id: string;
    category?: {
        name: string;
    };
    description: string;
    created_at: string;
}

export default function ExamListPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [exams, setExams] = useState<ExamRecord[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
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
        cbse_exam_category_id: "",
        description: "",
        is_published: false,
        is_result_published: false
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchCriteria();
        fetchExams();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/examination/cbse-exams/criteria');
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error("Failed to load criteria");
        }
    };

    const fetchExams = async () => {
        setLoading(true);
        try {
            const response = await api.get('/examination/cbse-exams', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            setExams(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch exams", variant: "destructive" });
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
                await api.put(`/examination/cbse-exams/${selectedId}`, formData);
                toast({ title: "Success", description: "Exam updated successfully" });
            } else {
                await api.post('/examination/cbse-exams', formData);
                toast({ title: "Success", description: "Exam created successfully" });
            }
            setOpen(false);
            resetForm();
            fetchExams();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save exam", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (record: ExamRecord) => {
        setEditMode(true);
        setSelectedId(record.id);
        setFormData({
            name: record.name,
            term: record.term,
            cbse_exam_category_id: record.cbse_exam_category_id || "",
            description: record.description || "",
            is_published: record.is_published,
            is_result_published: record.is_result_published
        });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/examination/cbse-exams/${deleteId}`);
            toast({ title: "Success", description: "Exam deleted successfully" });
            fetchExams();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete exam", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({
            name: "",
            term: "",
            cbse_exam_category_id: "",
            description: "",
            is_published: false,
            is_result_published: false
        });
    };

    const togglePublication = async (record: ExamRecord, field: 'is_published' | 'is_result_published') => {
        try {
            await api.put(`/examination/cbse-exams/${record.id}`, {
                ...record,
                [field]: !record[field]
            });
            toast({ title: "Success", description: "Publication status updated" });
            fetchExams();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <GraduationCap className="h-6 w-6 text-indigo-500" />
                        Board Examination Registry
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Management of official board examinations & publication cycles</p>
                </div>
                <Button 
                    onClick={() => { resetForm(); setOpen(true); }}
                    className="btn-gradient text-white px-8 h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-2"
                >
                    <Plus className="h-4 w-4" /> Create Board Exam
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by exam name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Rows:</span>
                        <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
                            <SelectTrigger className="w-[100px] h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                <SelectValue placeholder="50" />
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

                <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-600">
                            <TableRow className="hover:bg-transparent border-gray-50">
                                <TableHead className="py-4 px-6 min-w-[250px]">Examination Cycle</TableHead>
                                <TableHead className="py-4 px-6 min-w-[100px]">Board Term</TableHead>
                                <TableHead className="py-4 px-6 text-center">Exam Live</TableHead>
                                <TableHead className="py-4 px-6 text-center">Result Live</TableHead>
                                <TableHead className="py-4 px-6 min-w-[150px]">Board Category</TableHead>
                                <TableHead className="py-4 px-6 min-w-[120px]">Timeline</TableHead>
                                <TableHead className="py-4 px-6 text-right min-w-[150px]">Action Utilities</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing Registry...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : exams.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-sm italic">
                                        No board exams found in the registry.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                exams.map((item) => (
                                    <TableRow key={item.id} className="text-[13px] text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-indigo-600 uppercase tracking-tight">{item.name}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[300px]">{item.description || "Official board examination cycle"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold text-[10px] border border-indigo-100 flex items-center gap-1.5 w-fit">
                                                <Layers className="h-3 w-3" /> {item.term}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center">
                                            <Checkbox 
                                                checked={item.is_published} 
                                                onCheckedChange={() => togglePublication(item, 'is_published')}
                                                className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 border-gray-300 h-5 w-5 rounded-md" 
                                            />
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center">
                                            <Checkbox 
                                                checked={item.is_result_published} 
                                                onCheckedChange={() => togglePublication(item, 'is_result_published')}
                                                className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 border-gray-300 h-5 w-5 rounded-md" 
                                            />
                                        </TableCell>
                                        <TableCell className="py-4 px-6 font-bold text-gray-400 uppercase tracking-tighter text-[11px]">
                                            {item.category?.name || "Uncategorized"}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="text-[11px] font-bold text-gray-500 flex items-center gap-2">
                                                    <CalendarCheck2 className="h-3.5 w-3.5 text-indigo-500" /> {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md" title="Assign Students">
                                                    <BookOpen className="h-4 w-4" />
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
                            disabled={exams.length < itemsPerPage}
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
                            {editMode ? "Modify Board Exam" : "Initiate Board Exam"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-6">
                        <div className="col-span-2 space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Exam Cycle Name <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Assessment Practice Test 2026"
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
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Board Category</Label>
                            <Select value={formData.cbse_exam_category_id} onValueChange={(val) => setFormData({...formData, cbse_exam_category_id: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg shadow-none">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                            <Checkbox 
                                id="publish-exam" 
                                checked={formData.is_published}
                                onCheckedChange={(val) => setFormData({...formData, is_published: !!val})}
                                className="data-[state=checked]:bg-indigo-500" 
                            />
                            <Label htmlFor="publish-exam" className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 cursor-pointer">Publish Exam</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                            <Checkbox 
                                id="publish-result" 
                                checked={formData.is_result_published}
                                onCheckedChange={(val) => setFormData({...formData, is_result_published: !!val})}
                                className="data-[state=checked]:bg-emerald-500" 
                            />
                            <Label htmlFor="publish-result" className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 cursor-pointer">Publish Result</Label>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Technical Description</Label>
                            <Textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Internal administrative notes..."
                                className="min-h-[80px] border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none resize-none" 
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
                            {submitting ? "Processing..." : editMode ? "Update Registry" : "Commit Exam"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Expunge Exam Cycle</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this board examination cycle? This action is permanent and will remove all associated schedules and analytical results linked to this exam.
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
