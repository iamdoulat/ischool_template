"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Search, Copy, FileSpreadsheet, FileText, Printer, Columns,
    ChevronLeft, ChevronRight, CheckCircle2, XCircle, Eye, Pencil, Trash2,
    ListOrdered, LayoutGrid, FileSearch, UserCheck, ShieldClose, Calendar, Clock, Laptop, Trophy
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
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface OnlineExam {
    id: string;
    title: string;
    is_quiz: boolean;
    questions_count: number;
    descriptive_questions_count: number;
    attempt: number;
    exam_from: string;
    exam_to: string;
    duration: string;
    is_published: boolean;
    is_result_published: boolean;
    description: string;
}

export default function OnlineExamPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusTab, setStatusTab] = useState("upcoming");
    const [exams, setExams] = useState<OnlineExam[]>([]);
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
        title: "",
        is_quiz: false,
        exam_from: "",
        exam_to: "",
        duration: "01:00:00",
        attempt: 1,
        passing_percentage: 33,
        is_published: false,
        is_result_published: false,
        description: ""
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchExams();
    }, [currentPage, itemsPerPage, searchTerm, statusTab]);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const response = await api.get('/online-examination/online-exams', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm,
                    status: statusTab
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
        if (!formData.title || !formData.exam_from || !formData.exam_to) {
            toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
            return;
        }

        try {
            if (dialogMode === "edit" && selectedId) {
                await api.put(`/online-examination/online-exams/${selectedId}`, formData);
                toast({ title: "Success", description: "Exam updated successfully" });
            } else {
                await api.post('/online-examination/online-exams', formData);
                toast({ title: "Success", description: "Exam created successfully" });
            }
            setIsDialogOpen(false);
            fetchExams();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save exam", variant: "destructive" });
        }
    };

    const handleEdit = (exam: OnlineExam) => {
        setDialogMode("edit");
        setSelectedId(exam.id);
        setFormData({
            title: exam.title,
            is_quiz: !!exam.is_quiz,
            exam_from: exam.exam_from.replace(" ", "T").substring(0, 16),
            exam_to: exam.exam_to.replace(" ", "T").substring(0, 16),
            duration: exam.duration,
            attempt: exam.attempt,
            passing_percentage: 33, // Default for now
            is_published: !!exam.is_published,
            is_result_published: !!exam.is_result_published,
            description: exam.description || ""
        });
        setIsDialogOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/online-examination/online-exams/${deleteId}`);
            toast({ title: "Success", description: "Exam deleted successfully" });
            fetchExams();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete exam", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const openAddDialog = () => {
        setDialogMode("add");
        setFormData({
            title: "",
            is_quiz: false,
            exam_from: "",
            exam_to: "",
            duration: "01:00:00",
            attempt: 1,
            passing_percentage: 33,
            is_published: false,
            is_result_published: false,
            description: ""
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <Laptop className="h-6 w-6 text-indigo-500" />
                        Online Examinations
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage digital tests, quizzes, and results</p>
                </div>
                <Button onClick={openAddDialog} className="btn-gradient text-white gap-2 h-11 px-8 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full">
                    <Plus className="h-4 w-4" /> Add Exam
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 pt-5 bg-gray-50/30">
                    <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full">
                        <TabsList className="bg-transparent border-b border-gray-100 rounded-none w-full justify-start h-auto p-0 gap-8">
                            <TabsTrigger
                                value="upcoming"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 pb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 data-[state=active]:text-indigo-600 transition-all"
                            >
                                Upcoming Exams
                            </TabsTrigger>
                            <TabsTrigger
                                value="closed"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 pb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 data-[state=active]:text-indigo-600 transition-all"
                            >
                                Closed Exams
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search exams..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 mr-3 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">Rows:</span>
                                <span className="text-xs text-indigo-600 font-bold">50</span>
                                <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                            </div>
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

                    <div className="rounded-2xl border border-gray-50 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-gray-50/50 text-[11px] uppercase font-bold text-gray-600">
                                <TableRow className="hover:bg-transparent border-gray-50">
                                    <TableHead className="py-4 px-6">Exam Title</TableHead>
                                    <TableHead className="py-4 px-6 text-center">Quiz</TableHead>
                                    <TableHead className="py-4 px-6">Questions</TableHead>
                                    <TableHead className="py-4 px-6 text-center">Attempt</TableHead>
                                    <TableHead className="py-4 px-6">Exam Period</TableHead>
                                    <TableHead className="py-4 px-6">Duration</TableHead>
                                    <TableHead className="py-4 px-6 text-center">Published</TableHead>
                                    <TableHead className="py-4 px-6 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Syncing Exams...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : exams.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center text-gray-400 text-sm italic">
                                            No {statusTab} exams found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    exams.map((exam) => (
                                        <TableRow key={exam.id} className="text-[12px] text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                            <TableCell className="py-4 px-6 font-bold text-gray-800 uppercase tracking-tight">{exam.title}</TableCell>
                                            <TableCell className="text-center">
                                                {exam.is_quiz ? (
                                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 border-0">YES</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-gray-300 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 border-gray-100">NO</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-indigo-600 flex items-center gap-1.5"><ListOrdered className="h-3 w-3" /> {exam.questions_count} Total</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase flex items-center gap-1.5"><FileSearch className="h-3 w-3" /> {exam.descriptive_questions_count} Descriptive</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-4 px-6">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-bold">{exam.attempt}</span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col gap-1 text-[10px] font-bold">
                                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1.5 w-fit"><Calendar className="h-3 w-3" /> {exam.exam_from}</span>
                                                    <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1.5 w-fit"><Calendar className="h-3 w-3" /> {exam.exam_to}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <span className="flex items-center gap-1.5 font-bold text-gray-700"><Clock className="h-3.5 w-3.5 text-indigo-400" /> {exam.duration}</span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Exam:</span>
                                                        {exam.is_published ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-300" />}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Result:</span>
                                                        {exam.is_result_published ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-300" />}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5 flex-wrap max-w-[200px] ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                    <Button size="icon" variant="ghost" title="Assign Questions" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title="Edit" onClick={() => handleEdit(exam)} className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title="View" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title="Delete" onClick={() => setDeleteId(exam.id)} className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md">
                                                        <Trash2 className="h-3.5 w-3.5" />
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
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl rounded-3xl border-0 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 btn-gradient text-white">
                        <DialogTitle className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
                            <Laptop className="h-6 w-6" />
                            {dialogMode === "edit" ? "Edit Online Exam" : "Add Online Exam"}
                        </DialogTitle>
                        <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Configure exam settings and publication parameters</p>
                    </DialogHeader>

                    <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto bg-white">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Exam Title <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formData.title} 
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g. Final Revision Test" 
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                                <div className="space-y-1">
                                    <Label className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">Quiz Mode</Label>
                                    <p className="text-[10px] text-gray-400 font-medium italic">Enable for rapid evaluation</p>
                                </div>
                                <Switch 
                                    checked={formData.is_quiz} 
                                    onCheckedChange={(val) => setFormData({...formData, is_quiz: val})}
                                    className="data-[state=checked]:bg-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Exam From <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="datetime-local"
                                    value={formData.exam_from} 
                                    onChange={(e) => setFormData({...formData, exam_from: e.target.value})}
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Exam To <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="datetime-local"
                                    value={formData.exam_to} 
                                    onChange={(e) => setFormData({...formData, exam_to: e.target.value})}
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Duration (HH:MM:SS)</Label>
                                <Input 
                                    value={formData.duration} 
                                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Max Attempts</Label>
                                <Input 
                                    type="number"
                                    value={formData.attempt} 
                                    onChange={(e) => setFormData({...formData, attempt: parseInt(e.target.value)})}
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Passing %</Label>
                                <Input 
                                    type="number"
                                    value={formData.passing_percentage} 
                                    onChange={(e) => setFormData({...formData, passing_percentage: parseInt(e.target.value)})}
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-2xl border border-emerald-50">
                                <div className="space-y-1">
                                    <Label className="text-[12px] font-bold text-emerald-700 uppercase tracking-tight flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Publish Exam</Label>
                                    <p className="text-[10px] text-emerald-600/70 font-medium italic">Make exam visible to students</p>
                                </div>
                                <Switch 
                                    checked={formData.is_published} 
                                    onCheckedChange={(val) => setFormData({...formData, is_published: val})}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-indigo-50/30 rounded-2xl border border-indigo-50">
                                <div className="space-y-1">
                                    <Label className="text-[12px] font-bold text-indigo-700 uppercase tracking-tight flex items-center gap-2"><Trophy className="h-3 w-3" /> Publish Result</Label>
                                    <p className="text-[10px] text-indigo-600/70 font-medium italic">Show marks after completion</p>
                                </div>
                                <Switch 
                                    checked={formData.is_result_published} 
                                    onCheckedChange={(val) => setFormData({...formData, is_result_published: val})}
                                    className="data-[state=checked]:bg-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Description</Label>
                            <Textarea 
                                value={formData.description} 
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Enter exam instructions or details" 
                                className="min-h-[100px] border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-indigo-500 p-4"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-gray-50/50 flex justify-end gap-3">
                        <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="h-11 px-8 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-200">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="btn-gradient text-white h-11 px-12 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-orange-200/50">
                            {dialogMode === "edit" ? "Update Exam" : "Save Exam"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Online Exam</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this online exam? This action cannot be undone and will remove all student attempts associated with it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Exam
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
