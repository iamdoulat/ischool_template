"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Plus, Upload, Trash2, Search, Pencil, Eye,
    Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, BookOpen, BrainCircuit
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
import { Textarea } from "@/components/ui/textarea";

interface Question {
    id: string;
    class_name: string;
    section: string;
    subject: string;
    question_type: string;
    level: string;
    question: string;
    creator?: { first_name: string; last_name: string; staff_id: string };
}

export default function QuestionBankPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);

    // Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    // Criteria
    const [criteria, setCriteria] = useState({
        class_name: "",
        section: "",
        subject: "",
        question_type: "all",
        level: "all"
    });

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        class_name: "",
        section: "",
        subject: "",
        question_type: "Single Choice",
        level: "Low",
        question: "",
        options: ["", "", "", ""],
        correct_answer: ""
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchQuestions();
    }, [currentPage, itemsPerPage, searchTerm, criteria]);

    const fetchInitialData = async () => {
        try {
            const [classesRes, sectionsRes, subjectsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/sections?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subjects?no_paginate=true').catch(() => ({ data: [] }))
            ]);
            
            const extractData = (res: any) => {
                if (Array.isArray(res.data)) return res.data;
                if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
                return [];
            };

            setClasses(extractData(classesRes));
            setSections(extractData(sectionsRes));
            setSubjects(extractData(subjectsRes));
        } catch (error) {
            console.error("Failed to fetch initial data", error);
        }
    };

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: currentPage,
                per_page: itemsPerPage,
                search: searchTerm
            };
            if (criteria.class_name) params.class_name = criteria.class_name;
            if (criteria.section) params.section = criteria.section;
            if (criteria.subject) params.subject = criteria.subject;
            if (criteria.question_type !== "all") params.question_type = criteria.question_type;
            if (criteria.level !== "all") params.level = criteria.level;

            const response = await api.get('/online-examination/questions', { params });
            setQuestions(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch questions", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.class_name || !formData.section || !formData.subject || !formData.question) {
            toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
            return;
        }

        try {
            if (dialogMode === "edit" && selectedId) {
                await api.put(`/online-examination/questions/${selectedId}`, formData);
                toast({ title: "Success", description: "Question updated successfully" });
            } else {
                await api.post('/online-examination/questions', formData);
                toast({ title: "Success", description: "Question created successfully" });
            }
            setIsDialogOpen(false);
            fetchQuestions();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save question", variant: "destructive" });
        }
    };

    const handleEdit = (q: any) => {
        setDialogMode("edit");
        setSelectedId(q.id);
        setFormData({
            class_name: q.class_name,
            section: q.section,
            subject: q.subject,
            question_type: q.question_type,
            level: q.level,
            question: q.question,
            options: q.options || ["", "", "", ""],
            correct_answer: q.correct_answer || ""
        });
        setIsDialogOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/online-examination/questions/${deleteId}`);
            toast({ title: "Success", description: "Question deleted successfully" });
            fetchQuestions();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete question", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setIsBulkDeleting(true);
        try {
            await api.post('/online-examination/questions/bulk-delete', { ids: selectedIds });
            toast({ title: "Success", description: `${selectedIds.length} questions deleted successfully` });
            setSelectedIds([]);
            fetchQuestions();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete questions", variant: "destructive" });
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === questions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(questions.map(q => q.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const openAddDialog = () => {
        setDialogMode("add");
        setFormData({
            class_name: "",
            section: "",
            subject: "",
            question_type: "Single Choice",
            level: "Low",
            question: "",
            options: ["", "", "", ""],
            correct_answer: ""
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header Buttons */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <BrainCircuit className="h-6 w-6 text-indigo-500" />
                        Question Bank
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage examination questions and answers</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={openAddDialog} className="btn-gradient text-white gap-2 h-11 px-8 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full">
                        <Plus className="h-4 w-4" /> Add Question
                    </Button>
                    <Button variant="outline" className="h-11 px-8 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-100 flex gap-2">
                        <Upload className="h-4 w-4" /> Import
                    </Button>
                    {selectedIds.length > 0 && (
                        <Button onClick={handleBulkDelete} disabled={isBulkDeleting} variant="destructive" className="h-11 px-8 rounded-full text-[11px] font-bold uppercase tracking-widest flex gap-2 shadow-xl shadow-rose-200/50">
                            <Trash2 className="h-4 w-4" /> {isBulkDeleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
                        </Button>
                    )}
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                <h2 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3 uppercase tracking-widest">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">Class</Label>
                        <Select value={criteria.class_name} onValueChange={(val) => setCriteria({...criteria, class_name: val})}>
                            <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-xl focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">Section</Label>
                        <Select value={criteria.section} onValueChange={(val) => setCriteria({...criteria, section: val})}>
                            <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-xl focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">Subject</Label>
                        <Select value={criteria.subject} onValueChange={(val) => setCriteria({...criteria, subject: val})}>
                            <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-xl focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">Question Type</Label>
                        <Select value={criteria.question_type} onValueChange={(val) => setCriteria({...criteria, question_type: val})}>
                            <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-xl focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="Single Choice">Single Choice</SelectItem>
                                <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                                <SelectItem value="True/False">True/False</SelectItem>
                                <SelectItem value="Descriptive">Descriptive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">Level</Label>
                        <Select value={criteria.level} onValueChange={(val) => setCriteria({...criteria, level: val})}>
                            <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-xl focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={fetchQuestions} className="btn-gradient text-white px-10 h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-2">
                        <Search className="h-4 w-4" /> Search
                    </Button>
                </div>
            </div>

            {/* Question Bank Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                <h2 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3 uppercase tracking-widest">Question Bank</h2>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search questions..."
                            className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                <TableHead className="w-[60px] px-6">
                                    <Checkbox 
                                        className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" 
                                        checked={questions.length > 0 && selectedIds.length === questions.length}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="py-4 px-6 whitespace-nowrap">Q. ID</TableHead>
                                <TableHead className="py-4 px-6">Class (Section)</TableHead>
                                <TableHead className="py-4 px-6">Subject</TableHead>
                                <TableHead className="py-4 px-6">Question Type</TableHead>
                                <TableHead className="py-4 px-6">Level</TableHead>
                                <TableHead className="py-4 px-6 min-w-[300px]">Question</TableHead>
                                <TableHead className="py-4 px-6 whitespace-nowrap">Created By</TableHead>
                                <TableHead className="py-4 px-6 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Loading Questions...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : questions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center text-gray-400 text-sm italic">
                                        No questions found in the bank.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                questions.map((q) => (
                                    <TableRow key={q.id} className="text-[12px] text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                        <TableCell className="px-6 py-4">
                                            <Checkbox 
                                                className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" 
                                                checked={selectedIds.includes(q.id)}
                                                onCheckedChange={() => toggleSelect(q.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="py-4 px-6 font-bold text-gray-700 bg-gray-50/50">{q.id}</TableCell>
                                        <TableCell className="py-4 px-6">{q.class_name} ({q.section})</TableCell>
                                        <TableCell className="py-4 px-6">{q.subject}</TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[9px] uppercase tracking-wider border border-indigo-100">
                                                {q.question_type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider border",
                                                q.level === "Low" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                q.level === "Medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {q.level}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 font-medium text-gray-800 leading-relaxed max-w-md truncate">
                                            {q.question}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            {q.creator ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700">{q.creator.first_name} {q.creator.last_name}</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">ID: {q.creator.staff_id}</span>
                                                </div>
                                            ) : <span className="text-gray-300">---</span>}
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md transition-all">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(q)} className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-all">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => setDeleteId(q.id)} className="h-8 w-8 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md transition-all">
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
                            disabled={questions.length < itemsPerPage}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl rounded-3xl border-0 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 btn-gradient text-white">
                        <DialogTitle className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
                            <BookOpen className="h-6 w-6" />
                            {dialogMode === "edit" ? "Edit Question" : "Add Question"}
                        </DialogTitle>
                        <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Define academic questions for online examinations</p>
                    </DialogHeader>

                    <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto bg-white">
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Class <span className="text-red-500">*</span></Label>
                                <Select value={formData.class_name} onValueChange={(val) => setFormData({...formData, class_name: val})}>
                                    <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Section <span className="text-red-500">*</span></Label>
                                <Select value={formData.section} onValueChange={(val) => setFormData({...formData, section: val})}>
                                    <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Subject <span className="text-red-500">*</span></Label>
                                <Select value={formData.subject} onValueChange={(val) => setFormData({...formData, subject: val})}>
                                    <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Question Type <span className="text-red-500">*</span></Label>
                                <Select value={formData.question_type} onValueChange={(val) => setFormData({...formData, question_type: val})}>
                                    <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Single Choice">Single Choice</SelectItem>
                                        <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                                        <SelectItem value="True/False">True/False</SelectItem>
                                        <SelectItem value="Descriptive">Descriptive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Level <span className="text-red-500">*</span></Label>
                                <Select value={formData.level} onValueChange={(val) => setFormData({...formData, level: val})}>
                                    <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">Question <span className="text-red-500">*</span></Label>
                            <Textarea 
                                value={formData.question} 
                                onChange={(e) => setFormData({...formData, question: e.target.value})}
                                placeholder="Enter question text" 
                                className="min-h-[100px] border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-indigo-500 p-4"
                            />
                        </div>

                        {(formData.question_type === "Single Choice" || formData.question_type === "Multiple Choice") && (
                            <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Options & Answer</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    {formData.options.map((opt, idx) => (
                                        <div key={idx} className="flex gap-3 items-center">
                                            <span className="text-xs font-bold text-gray-400">{String.fromCharCode(65 + idx)}.</span>
                                            <Input 
                                                value={opt} 
                                                onChange={(e) => {
                                                    const newOpts = [...formData.options];
                                                    newOpts[idx] = e.target.value;
                                                    setFormData({...formData, options: newOpts});
                                                }}
                                                placeholder={`Option ${String.fromCharCode(65 + idx)}`} 
                                                className="h-10 border-gray-100 bg-gray-50/30 rounded-xl"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 bg-gray-50/50 flex justify-end gap-3">
                        <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="h-11 px-8 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-200">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="btn-gradient text-white h-11 px-12 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-orange-200/50">
                            {dialogMode === "edit" ? "Update Question" : "Save Question"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Question</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this question? This action cannot be undone and will remove it from any associated exams.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Question
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
