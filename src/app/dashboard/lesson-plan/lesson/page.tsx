"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
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
    Pencil,
    Trash2,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
    Phone
} from "lucide-react";

interface LessonEntry {
    id: string; // Used for identifying the group (first lesson ID)
    className: string;
    section: string;
    subjectGroup: string;
    subject: string;
    lessons: string[];
    lesson_ids: string[];
}

export default function LessonPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [lessonsInputs, setLessonsInputs] = useState([{ id: Date.now(), value: "" }]);
    const [lessonsList, setLessonsList] = useState<LessonEntry[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination & Export
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    
    // Form State
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        class_name: "",
        section: "",
        subject_group: "",
        subject: ""
    });

    // Dialog State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [classesRes, groupsRes, subjectsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subject-groups?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subjects?no_paginate=true').catch(() => ({ data: [] }))
            ]);
            
            const extractData = (res: any) => {
                if (Array.isArray(res.data)) return res.data;
                if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
                return [];
            };

            setClasses(extractData(classesRes));
            setSubjectGroups(extractData(groupsRes));
            setSubjects(extractData(subjectsRes));
        } catch (error) {
            console.error("Failed to load initial dropdowns", error);
        }
        fetchLessons();
    };

    // Fetch sections filtered by selected class ID
    const fetchSectionsByClass = async (classId: string) => {
        if (!classId) { setSections([]); return; }
        try {
            const res = await api.get('/academics/sections?with_class=true&no_paginate=true');
            const all: any[] = res.data?.data || res.data || [];
            const filtered = all.filter((s: any) => String(s.school_class_id) === String(classId));
            setSections(filtered);
        } catch {
            setSections([]);
        }
    };

    const fetchLessons = async () => {
        setLoading(true);
        try {
            const response = await api.get('/lesson-plan/lessons');
            setLessonsList(response.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch lessons", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.class_name || !formData.section || !formData.subject_group || !formData.subject) {
            toast({ title: "Validation Error", description: "Please select all required fields", variant: "destructive" });
            return;
        }

        const validLessons = lessonsInputs.map(l => l.value).filter(v => v.trim() !== "");
        if (validLessons.length === 0) {
            toast({ title: "Validation Error", description: "Please enter at least one lesson", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                lessons: validLessons
            };

            if (editMode && selectedId) {
                await api.put(`/lesson-plan/lessons/${selectedId}`, payload);
                toast({ title: "Success", description: "Lessons updated successfully" });
            } else {
                await api.post('/lesson-plan/lessons', payload);
                toast({ title: "Success", description: "Lessons created successfully" });
            }

            resetForm();
            fetchLessons();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save lessons", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (entry: LessonEntry) => {
        const cls = classes.find((c: any) => c.name === entry.className);
        if (cls) fetchSectionsByClass(cls.id.toString());
        setFormData({
            class_name: entry.className,
            section: entry.section,
            subject_group: entry.subjectGroup,
            subject: entry.subject
        });
        setLessonsInputs(entry.lessons.length > 0 ? entry.lessons.map((l, i) => ({ id: Date.now() + i, value: l })) : [{ id: Date.now(), value: "" }]);
        setSelectedId(entry.id);
        setEditMode(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/lesson-plan/lessons/${deleteId}`);
            toast({ title: "Success", description: "Lessons deleted successfully" });
            fetchLessons();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete lessons", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({
            class_name: "",
            section: "",
            subject_group: "",
            subject: ""
        });
        setLessonsInputs([{ id: Date.now(), value: "" }]);
        setEditMode(false);
        setSelectedId(null);
    };

    const addMoreLesson = () => {
        setLessonsInputs([...lessonsInputs, { id: Date.now(), value: "" }]);
    };

    const updateLessonInput = (id: number, value: string) => {
        setLessonsInputs(lessonsInputs.map(l => l.id === id ? { ...l, value } : l));
    };

    const removeLessonInput = (id: number) => {
        const newInputs = lessonsInputs.filter(l => l.id !== id);
        if (newInputs.length === 0) {
            setLessonsInputs([{ id: Date.now(), value: "" }]);
        } else {
            setLessonsInputs(newInputs);
        }
    };

    // Filter & Pagination logic
    const filteredLessons = lessonsList.filter(entry => 
        entry.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredLessons.length / itemsPerPage);
    const paginatedLessons = filteredLessons.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleAction = (action: string) => {
        if (action === 'print') {
            window.print();
        } else if (action === 'copy') {
            navigator.clipboard.writeText(JSON.stringify(filteredLessons, null, 2));
            toast({ title: "Success", description: "Copied to clipboard" });
        } else {
            toast({ title: "Success", description: `Data exported as ${action.toUpperCase()}` });
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 font-sans bg-gray-50/10 min-h-screen">
            {/* Left Column: Add Lesson Form */}
            <div className="w-full lg:w-1/4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <h2 className="text-sm font-medium text-gray-800 border-b pb-2 mb-4">
                        {editMode ? "Edit Lesson" : "Add Lesson"}
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.class_name}
                                onValueChange={(val) => {
                                    const cls = classes.find((c: any) => c.name === val);
                                    setFormData({ ...formData, class_name: val, section: '' });
                                    fetchSectionsByClass(cls?.id?.toString() ?? '');
                                }}
                            >
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Section <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.section}
                                onValueChange={(val) => setFormData({ ...formData, section: val })}
                                disabled={!formData.class_name}
                            >
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => (
                                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Subject Group <span className="text-red-500">*</span>
                            </Label>
                            <Select value={formData.subject_group} onValueChange={(val) => setFormData({...formData, subject_group: val})}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjectGroups.map(g => (
                                        <SelectItem key={g.id} value={g.name || g.group_name}>{g.name || g.group_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Subject <span className="text-red-500">*</span>
                            </Label>
                            <Select value={formData.subject} onValueChange={(val) => setFormData({...formData, subject: val})}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                    Lesson Name <span className="text-red-500">*</span>
                                </Label>
                                <Button
                                    onClick={addMoreLesson}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-4 text-[11px] font-bold uppercase btn-gradient flex items-center gap-2 rounded-full shadow-lg shadow-orange-200/50"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add
                                </Button>
                            </div>

                            {lessonsInputs.map((input) => (
                                <div key={input.id} className="flex gap-2 items-center group">
                                    <Input 
                                        value={input.value}
                                        onChange={(e) => updateLessonInput(input.id, e.target.value)}
                                        className="h-10 border-gray-100 bg-gray-50/30 text-xs shadow-none focus-visible:ring-indigo-500 rounded-lg" 
                                    />
                                    <button onClick={() => removeLessonInput(input.id)} className="text-rose-400 hover:text-rose-600 transition-colors p-1">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4 gap-2">
                            {editMode && (
                                <Button onClick={resetForm} variant="outline" className="h-9 text-xs shadow-sm rounded border-gray-200">
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

            {/* Right Column: Lesson List */}
            <div className="w-full lg:w-3/4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-x-auto">
                    <h2 className="text-sm font-medium text-gray-800 border-b pb-2">Lesson List</h2>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-10 text-xs border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg"
                                />
                            </div>
                            <Button className="btn-gradient h-10 px-6 rounded-full flex items-center gap-2 text-[11px] font-bold uppercase shadow-lg shadow-orange-200/50">
                                <Search className="h-4 w-4" /> Search
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <Select value={String(itemsPerPage)} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                                <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button onClick={() => handleAction('copy')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 cursor-pointer">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={() => handleAction('excel')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 cursor-pointer">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={() => handleAction('pdf')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 cursor-pointer">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={() => handleAction('print')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 cursor-pointer">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 cursor-pointer">
                                    <Columns className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-600">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-3 px-3">Class</TableHead>
                                    <TableHead className="py-3 px-3">Section</TableHead>
                                    <TableHead className="py-3 px-3">Subject Group</TableHead>
                                    <TableHead className="py-3 px-3">Subject</TableHead>
                                    <TableHead className="py-3 px-3 text-right pr-6">Lesson</TableHead>
                                    <TableHead className="py-3 px-3 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                                                <p className="text-[10px] font-medium uppercase tracking-widest">Loading...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLessons.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-gray-400 text-sm">
                                            No lessons found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedLessons.map((entry) => (
                                        <TableRow key={entry.id} className="text-[11px] text-gray-600 hover:bg-gray-50/50 group border-b border-gray-50 transition-colors">
                                            <TableCell className="py-4 px-3 align-top font-medium">{entry.className}</TableCell>
                                            <TableCell className="py-4 px-3 align-top">{entry.section}</TableCell>
                                            <TableCell className="py-4 px-3 align-top">{entry.subjectGroup}</TableCell>
                                            <TableCell className="py-4 px-3 align-top">{entry.subject}</TableCell>
                                            <TableCell className="py-4 px-3 align-top text-right pr-6">
                                                <div className="flex flex-col gap-1.5 items-end">
                                                    {entry.lessons.map((lesson, idx) => (
                                                        <div key={idx} className="leading-tight bg-gray-100/50 px-2 py-0.5 rounded text-[10px]">{lesson}</div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-3 align-top text-right">
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 bg-green-500 hover:bg-green-600 text-white rounded-md transition-all shadow-sm">
                                                        <Phone className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(entry)} className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-all shadow-sm">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(entry.id)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all shadow-sm">
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

                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-2">
                        <div>
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLessons.length)} of {filteredLessons.length} entries
                        </div>
                        <div className="flex gap-1">
                            <Button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                variant="outline" size="sm" className="h-7 border-gray-200 px-2" 
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="default" size="sm" className="h-8 btn-gradient border-0 text-white min-w-[32px] rounded-lg transition-all shadow-lg shadow-orange-200/50">
                                {currentPage}
                            </Button>
                            <Button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                variant="outline" size="sm" className="h-7 border-gray-200 px-2" 
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Lessons</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete all lessons associated with this group? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600 h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Lessons
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
