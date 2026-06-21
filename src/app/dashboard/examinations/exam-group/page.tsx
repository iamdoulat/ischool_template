"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Pencil, Trash2, Plus, Copy, FileSpreadsheet, FileText,
    Printer, ChevronLeft, ChevronRight, FolderKanban,
    Search, LayoutList, FileStack,
    BarChart, Link, CheckCircle2, ArrowLeft, Users, BookOpen, FileDigit, MessageSquare, Trophy, X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

interface Exam {
    id: number;
    name: string;
    exam_group_id: number;
    session?: string;
    description?: string;
    is_published?: boolean;
    is_result_published?: boolean;
    subjects_count?: number;
}

interface ExamGroup {
    id: string;
    name: string;
    exams_count: number;
    exam_type: string;
    description: string;
    exams?: Exam[];
}

interface ClassItem {
    id: number;
    class?: string;
    name?: string;
}

interface SectionItem {
    id: number;
    section?: string;
    name?: string;
}

interface SubjectItem {
    id: number;
    name: string;
    code?: string;
}

interface StudentRow {
    id: number;
    admission_no: string;
    name: string;
    father_name: string;
    category: string;
    gender: string;
    assigned: boolean;
}

export default function ExamGroupPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState("50");
    const itemsPerPage = parseInt(rowsPerPage);
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

    // Assign Student Modal State
    const [assignStudentOpen, setAssignStudentOpen] = useState(false);
    const [assignExamId, setAssignExamId] = useState<number | null>(null);
    const [assignFilters, setAssignFilters] = useState({ class_id: "", section_id: "" });
    const [assignStudents, setAssignStudents] = useState<StudentRow[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [assignLoading, setAssignLoading] = useState(false);

    // Database Data State
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [academicSubjects, setAcademicSubjects] = useState<SubjectItem[]>([]);

    // Exam Subject Modal State
    const [examSubjectOpen, setExamSubjectOpen] = useState(false);
    const [examSubjectData, setExamSubjectData] = useState<{ exam: Exam | null, group: ExamGroup | null }>({ exam: null, group: null });

    interface ExamSubjectRow {
        id: string;
        subject: string;
        date: string;
        start_time: string;
        duration: string;
        credit_hours: string;
        room_no: string;
        marks_max: string;
        marks_min: string;
    }
    const [examSubjectRows, setExamSubjectRows] = useState<ExamSubjectRow[]>([]);

    // Managing Exam Group State (View 2)
    const [managingGroup, setManagingGroup] = useState<ExamGroup | null>(null);

    // Add Exam modal state
    const [addExamOpen, setAddExamOpen] = useState(false);
    const [addExamForm, setAddExamForm] = useState({
      name: "",
      session: "2026-27",
      is_published: false,
      is_result_published: false,
      roll_no_type: "admit_card",
      marksheet_template: "",
      description: "",
    });

    // Link Exam modal state
    const [linkExamOpen, setLinkExamOpen] = useState(false);
    const [availableExams, setAvailableExams] = useState<Exam[]>([]);
    const [examWeightages, setExamWeightages] = useState<Record<number, string>>({});

    useEffect(() => {
        fetchGroups();
    }, [currentPage, itemsPerPage, searchTerm]);

    useEffect(() => {
        fetchGroups();

        // Fetch classes & subjects
        const fetchClassesAndSubjects = async () => {
            try {
                const [classRes, subRes] = await Promise.all([
                    api.get('/academics/classes?no_paginate=true'),
                    api.get('/academics/subjects?no_paginate=true')
                ]);
                setClasses(classRes.data?.data || classRes.data || []);
                setAcademicSubjects(subRes.data?.data || subRes.data || []);
            } catch (error) {
                console.error("Failed to fetch classes or subjects", error);
            }
        };
        fetchClassesAndSubjects();
    }, []);

    // Fetch sections when class changes
    useEffect(() => {
        const fetchSections = async () => {
            if (!assignFilters.class_id) {
                setSections([]);
                return;
            }
            try {
                const res = await api.get(`/academics/sections?school_class_id=${assignFilters.class_id}&no_paginate=true`);
                setSections(res.data?.data || res.data || []);
            } catch (error) {
                console.error("Failed to fetch sections", error);
            }
        };
        fetchSections();
    }, [assignFilters.class_id]);

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage]);

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

    const handleManageExams = async (group: ExamGroup) => {
        setLoading(true);
        try {
            const response = await api.get(`/examination/exam-groups/${group.id}`);
            setManagingGroup(response.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch exam group details", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableExams = async () => {
        try {
            const response = await api.get("/examination/exams", {
                params: { per_page: 100, unlinked: "true" },
            });
            setAvailableExams(response.data?.data ?? []);
        } catch (error) {
            console.error("Error fetching available exams", error);
        }
    };

    const handleOpenAddExam = () => {
        setAddExamForm({
            name: "", session: "2026-27", is_published: false, is_result_published: false,
            roll_no_type: "admit_card", marksheet_template: "", description: "",
        });
        setAddExamOpen(true);
    };

    const handleSaveExam = async () => {
        if (!addExamForm.name || !managingGroup) {
            toast({ title: "Validation Error", description: "Name is required", variant: "destructive" });
            return;
        }
        if (!addExamForm.session) {
            toast({ title: "Validation Error", description: "Session is required", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            await api.post("/examination/exams", { ...addExamForm, exam_group_id: managingGroup.id });
            toast({ title: "Success", description: "Exam created successfully" });
            setAddExamOpen(false);
            handleManageExams(managingGroup); // refresh
        } catch (error) {
            toast({ title: "Error", description: "Failed to create exam", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenLinkExam = () => {
        setExamWeightages({});
        fetchAvailableExams();
        setLinkExamOpen(true);
    };

    const handleLinkExams = async () => {
        if (!managingGroup) return;
        const selectedExams = Object.keys(examWeightages).map(Number);
        if (selectedExams.length === 0) return;

        setSubmitting(true);
        try {
            await api.post("/examination/exams/link", {
                exam_group_id: managingGroup.id,
                exam_ids: selectedExams,
            });
            toast({ title: "Success", description: "Exams linked successfully" });
            setLinkExamOpen(false);
            handleManageExams(managingGroup); // refresh
        } catch (error) {
            toast({ title: "Error", description: "Failed to link exams", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const toggleExamSelection = (examId: number, isSelected: boolean) => {
        setExamWeightages(prev => {
            const newWeightages = { ...prev };
            if (isSelected) newWeightages[examId] = "0.00";
            else delete newWeightages[examId];
            return newWeightages;
        });
    };

    const updateExamWeightage = (examId: number, weightage: string) => {
        setExamWeightages(prev => ({ ...prev, [examId]: weightage }));
    };

    const handleOpenAssignStudent = (examId: number) => {
        setAssignExamId(examId);
        setAssignFilters({ class_id: "", section_id: "" });
        setAssignStudents([]);
        setSelectedStudents([]);
        setAssignStudentOpen(true);
    };

    const handleSearchStudents = async () => {
        if (!assignFilters.class_id || !assignFilters.section_id) {
            toast({ title: "Error", description: "Please select Class and Section", variant: "destructive" });
            return;
        }

        setAssignLoading(true);
        try {
            const res = await api.get('/students', {
                params: {
                    school_class_id: assignFilters.class_id,
                    section_id: assignFilters.section_id
                }
            });
            const studentsData = res.data?.data?.data || res.data?.data || res.data || [];

            // Map the API data to the format we need
            const mappedStudents: StudentRow[] = studentsData.map((s: {
                id: number;
                admission_no?: string;
                first_name?: string;
                last_name?: string;
                father_name?: string;
                category?: string;
                gender?: string;
            }) => ({
                id: s.id,
                admission_no: s.admission_no || "-",
                name: `${s.first_name || ""} ${s.last_name || ""}`.trim(),
                father_name: s.father_name || "-",
                category: s.category || "-",
                gender: s.gender || "-",
                assigned: false // Default to false since there's no exam-student API yet
            }));

            setAssignStudents(mappedStudents);
            setSelectedStudents(mappedStudents.filter((s) => s.assigned).map((s) => s.id));
        } catch (error) {
            console.error("Failed to fetch students", error);
            toast({ title: "Error", description: "Failed to fetch students", variant: "destructive" });
        } finally {
            setAssignLoading(false);
        }
    };

    const handleToggleStudent = (studentId: number) => {
        setSelectedStudents(prev =>
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        );
    };

    const handleToggleAllStudents = () => {
        if (selectedStudents.length === assignStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(assignStudents.map(s => s.id));
        }
    };

    const handleSaveAssignStudents = async () => {
        setSubmitting(true);
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 500));
            toast({ title: "Success", description: "Students assigned to exam successfully" });
            setAssignStudentOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "Failed to assign students", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenExamSubject = (exam: Exam) => {
        setExamSubjectData({ exam, group: managingGroup });
        setExamSubjectRows([
            { id: Date.now().toString(), subject: "", date: "", start_time: "", duration: "", credit_hours: "", room_no: "", marks_max: "", marks_min: "" }
        ]);
        setExamSubjectOpen(true);
    };

    const handleAddExamSubjectRow = () => {
        setExamSubjectRows([...examSubjectRows, { id: Date.now().toString(), subject: "", date: "", start_time: "", duration: "", credit_hours: "", room_no: "", marks_max: "", marks_min: "" }]);
    };

    const handleRemoveExamSubjectRow = (id: string) => {
        setExamSubjectRows(examSubjectRows.filter(r => r.id !== id));
    };

    const handleUpdateExamSubjectRow = (id: string, field: keyof ExamSubjectRow, value: string) => {
        setExamSubjectRows(examSubjectRows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSaveExamSubjects = async () => {
        setSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            toast({ title: "Success", description: "Exam subjects saved successfully" });
            setExamSubjectOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "Failed to save exam subjects", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (managingGroup) {
        return (
            <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
                {/* Back navigation */}
                <Button variant="ghost" onClick={() => setManagingGroup(null)} className="-ml-3 text-gray-500 hover:text-indigo-600 gap-2 font-bold text-[11px] uppercase tracking-widest">
                    <ArrowLeft className="h-4 w-4" /> Back to Groups
                </Button>

                {/* Header Section */}
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <FolderKanban className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Exam Group: {managingGroup.name}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{managingGroup.exam_type}{managingGroup.description ? ` · ${managingGroup.description}` : ""}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleOpenLinkExam} className="font-bold text-[11px] uppercase tracking-widest gap-2">
                                <Link className="h-4 w-4" /> Link Exam
                            </Button>
                            <Button variant="default" onClick={handleOpenAddExam} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] font-bold text-[11px] uppercase tracking-widest gap-2 text-white border-0 shadow-md">
                                <Plus className="h-4 w-4" /> Add Exam
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Sub-table */}
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileStack className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Linked Exams</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{managingGroup.exams?.length || 0} exams in this group</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Name</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Session</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Subjects Included</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Publish Exam</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Publish Result</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Description</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton rows={4} cols={7} />
                                ) : !managingGroup.exams || managingGroup.exams.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            No data found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    managingGroup.exams.map(exam => (
                                        <TableRow key={exam.id} className="text-[13px] text-gray-600">
                                            <TableCell className="font-medium text-gray-800">{exam.name}</TableCell>
                                            <TableCell>{exam.session || "-"}</TableCell>
                                            <TableCell className="text-center">{exam.subjects_count || 0}</TableCell>
                                            <TableCell className="text-center">
                                                {exam.is_published ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : "-"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {exam.is_result_published ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : "-"}
                                            </TableCell>
                                            <TableCell>{exam.description || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="icon" variant="ghost" title="Assign / View Student" onClick={() => handleOpenAssignStudent(exam.id)} className="h-8 w-8 text-blue-500 hover:text-white hover:bg-blue-500 rounded-lg">
                                                        <Users className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title="Exam Subject" onClick={() => handleOpenExamSubject(exam)} className="h-8 w-8 text-indigo-500 hover:text-white hover:bg-indigo-500 rounded-lg">
                                                        <BookOpen className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title="Exam Marks" className="h-8 w-8 text-purple-500 hover:text-white hover:bg-purple-500 rounded-lg">
                                                        <FileDigit className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title="Teacher Remarks" className="h-8 w-8 text-pink-500 hover:text-white hover:bg-pink-500 rounded-lg">
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title="Generate Rank" className="h-8 w-8 text-amber-500 hover:text-white hover:bg-amber-500 rounded-lg">
                                                        <Trophy className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title="Edit Exam" className="h-8 w-8 text-amber-500 hover:text-white hover:bg-amber-500 rounded-lg">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title="Delete Exam" className="h-8 w-8 text-red-500 hover:text-white hover:bg-red-500 rounded-lg">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Add Exam Modal */}
                <Dialog open={addExamOpen} onOpenChange={setAddExamOpen}>
                    <DialogContent className="max-w-3xl rounded-lg border-0 shadow-2xl p-0 overflow-hidden bg-white">
                        <DialogHeader className="p-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex justify-between items-center relative">
                            <DialogTitle className="text-lg font-normal">Exam</DialogTitle>
                        </DialogHeader>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className="text-sm font-normal text-gray-600">Exam <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={addExamForm.name}
                                        onChange={(e) => setAddExamForm({ ...addExamForm, name: e.target.value })}
                                        className="h-9 border-gray-300 rounded shadow-sm focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-normal text-gray-600">Session <span className="text-red-500">*</span></Label>
                                    <Select value={addExamForm.session} onValueChange={(val) => setAddExamForm({ ...addExamForm, session: val })}>
                                        <SelectTrigger className="h-9 border-gray-300 rounded shadow-sm focus:ring-indigo-500">
                                            <SelectValue placeholder="2026-27" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2025-26">2025-26</SelectItem>
                                            <SelectItem value="2026-27">2026-27</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="publish" checked={addExamForm.is_published} onChange={(e) => setAddExamForm({ ...addExamForm, is_published: e.target.checked })} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <Label htmlFor="publish" className="text-sm font-normal text-gray-600 cursor-pointer">Publish</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="publish_result" checked={addExamForm.is_result_published} onChange={(e) => setAddExamForm({ ...addExamForm, is_result_published: e.target.checked })} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <Label htmlFor="publish_result" className="text-sm font-normal text-gray-600 cursor-pointer">Publish Result</Label>
                                </div>
                                <div className="flex items-center gap-4 ml-2">
                                    <div className="flex items-center gap-2">
                                        <input type="radio" id="admit_card" name="roll_no_type" value="admit_card" checked={addExamForm.roll_no_type === 'admit_card'} onChange={(e) => setAddExamForm({ ...addExamForm, roll_no_type: e.target.value })} className="border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <Label htmlFor="admit_card" className="text-sm font-normal text-gray-600 cursor-pointer">Admit Card Roll No.</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="radio" id="profile" name="roll_no_type" value="profile" checked={addExamForm.roll_no_type === 'profile'} onChange={(e) => setAddExamForm({ ...addExamForm, roll_no_type: e.target.value })} className="border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <Label htmlFor="profile" className="text-sm font-normal text-gray-600 cursor-pointer">Profile Roll No</Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-normal text-gray-600">Marksheet Template <span className="text-red-500">*</span></Label>
                                <Select value={addExamForm.marksheet_template} onValueChange={(val) => setAddExamForm({ ...addExamForm, marksheet_template: val })}>
                                    <SelectTrigger className="h-9 border-gray-300 rounded shadow-sm focus:ring-indigo-500 w-full">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="template1">Template 1</SelectItem>
                                        <SelectItem value="template2">Template 2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-normal text-gray-600">Description</Label>
                                <Textarea value={addExamForm.description} onChange={(e) => setAddExamForm({ ...addExamForm, description: e.target.value })} className="min-h-[80px] border-gray-300 rounded shadow-sm focus:ring-indigo-500 p-3" />
                            </div>
                        </div>

                        <DialogFooter className="p-4 border-t border-gray-200 flex justify-end">
                            <Button onClick={handleSaveExam} disabled={submitting} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity text-white h-9 px-6 rounded shadow">
                                {submitting ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Link Exam Modal */}
                <Dialog open={linkExamOpen} onOpenChange={setLinkExamOpen}>
                    <DialogContent className="max-w-[500px] rounded-lg border-0 shadow-2xl p-0 overflow-hidden bg-white">
                        <DialogHeader className="p-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex justify-between items-center relative">
                            <DialogTitle className="text-lg font-normal">Link Exam</DialogTitle>
                        </DialogHeader>

                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="rounded border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#f3f4f6]">
                                        <tr className="border-b border-gray-200">
                                            <th className="py-2.5 px-3 w-10"></th>
                                            <th className="py-2.5 px-3 text-left font-semibold text-gray-700">Exam</th>
                                            <th className="py-2.5 px-3 text-left font-semibold text-gray-700 w-32">Weightage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availableExams.length === 0 ? (
                                            <tr><td colSpan={3} className="text-center py-6 text-gray-400 italic">No available exams found</td></tr>
                                        ) : (
                                            availableExams.map((exam) => (
                                                <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                                    <td className="py-2.5 px-3 text-center">
                                                        <input type="checkbox" checked={examWeightages[exam.id] !== undefined} onChange={(e) => toggleExamSelection(exam.id, e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-gray-700">{exam.name} {exam.session ? `(${exam.session})` : ''}</td>
                                                    <td className="py-2.5 px-3">
                                                        <Input value={examWeightages[exam.id] ?? "0.00"} onChange={(e) => updateExamWeightage(exam.id, e.target.value)} disabled={examWeightages[exam.id] === undefined} className="h-8 text-sm px-2 text-gray-700 disabled:opacity-50 border-gray-300" />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <DialogFooter className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-white">
                            <Button onClick={() => setExamWeightages({})} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity text-white h-9 px-4 rounded shadow">Reset Link Exam</Button>
                            <Button onClick={handleLinkExams} disabled={submitting} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity text-white h-9 px-6 rounded shadow">
                                {submitting ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assign / View Student Modal */}
                <Dialog open={assignStudentOpen} onOpenChange={setAssignStudentOpen}>
                    <DialogContent className="max-w-[1000px] rounded border-0 shadow-2xl p-0 overflow-hidden bg-white">
                        <DialogHeader className="p-3 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex justify-between items-center relative">
                            <DialogTitle className="text-sm font-medium">Exam Students</DialogTitle>
                        </DialogHeader>

                        <div className="p-4 space-y-4">
                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-gray-700">Class <span className="text-red-500">*</span></Label>
                                    <Select value={assignFilters.class_id} onValueChange={(v) => setAssignFilters({...assignFilters, class_id: v, section_id: ""})}>
                                        <SelectTrigger className="h-9 border-gray-200 shadow-none">
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.class || c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-gray-700">Section <span className="text-red-500">*</span></Label>
                                    <Select disabled={!assignFilters.class_id} value={assignFilters.section_id} onValueChange={(v) => setAssignFilters({...assignFilters, section_id: v})}>
                                        <SelectTrigger className="h-9 border-gray-200 shadow-none">
                                            <SelectValue placeholder="Select Section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.section || s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end border-b border-gray-100 pb-4">
                                <Button onClick={handleSearchStudents} disabled={assignLoading} className="h-8 px-4 bg-[#6366F1] hover:bg-indigo-600 text-white rounded text-xs gap-1.5 shadow-none">
                                    <Search className="h-3.5 w-3.5" />
                                    {assignLoading ? "Searching..." : "Search"}
                                </Button>
                            </div>

                            {/* Students Table */}
                            <div className="max-h-[50vh] overflow-y-auto">
                                <table className="w-full text-xs text-left text-gray-600">
                                    <thead className="bg-white sticky top-0 border-b border-gray-100">
                                        <tr>
                                            <th className="py-2.5 px-3 font-semibold text-gray-700 w-16">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={assignStudents.length > 0 && selectedStudents.length === assignStudents.length}
                                                        onChange={handleToggleAllStudents}
                                                        disabled={assignStudents.length === 0}
                                                        className="rounded border-gray-300 text-[#6366F1] focus:ring-[#6366F1]"
                                                    />
                                                    <span>All</span>
                                                </div>
                                            </th>
                                            <th className="py-2.5 px-3 font-semibold text-gray-700">Admission No</th>
                                            <th className="py-2.5 px-3 font-semibold text-gray-700">Student Name</th>
                                            <th className="py-2.5 px-3 font-semibold text-gray-700">Father Name</th>
                                            <th className="py-2.5 px-3 font-semibold text-gray-700">Category</th>
                                            <th className="py-2.5 px-3 font-semibold text-gray-700">Gender</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignLoading ? (
                                            <TableSkeleton rows={5} cols={6} />
                                        ) : assignStudents.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-8 text-gray-400 italic border-b border-gray-50">Please select class and section to search students</td></tr>
                                        ) : (
                                            assignStudents.map((student) => (
                                                <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                    <td className="py-2.5 px-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedStudents.includes(student.id)}
                                                            onChange={() => handleToggleStudent(student.id)}
                                                            className="rounded border-gray-300 text-[#6366F1] focus:ring-[#6366F1]"
                                                        />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-gray-500">{student.admission_no}</td>
                                                    <td className="py-2.5 px-3 text-gray-700 font-medium">{student.name}</td>
                                                    <td className="py-2.5 px-3 text-gray-500">{student.father_name || "-"}</td>
                                                    <td className="py-2.5 px-3 text-gray-500">{student.category || "-"}</td>
                                                    <td className="py-2.5 px-3 text-gray-500">{student.gender}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <DialogFooter className="p-4 border-t border-gray-100 flex justify-end bg-white">
                            <Button onClick={handleSaveAssignStudents} disabled={submitting || assignStudents.length === 0} className="bg-[#6366F1] hover:bg-indigo-600 text-white h-8 px-6 rounded text-xs shadow-none">
                                {submitting ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Exam Subject Modal */}
                <Dialog open={examSubjectOpen} onOpenChange={setExamSubjectOpen}>
                    <DialogContent showCloseButton={false} className="sm:max-w-[1600px] w-[98vw] max-h-[90vh] rounded border-0 shadow-2xl p-0 gap-0 overflow-hidden bg-white">
                        <DialogHeader className="p-3 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex justify-between items-center relative">
                            <DialogTitle className="text-sm font-medium">Add Exam Subject</DialogTitle>
                            <button onClick={() => setExamSubjectOpen(false)} className="absolute top-2.5 right-3 text-white/80 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </DialogHeader>

                        <div className="p-5 space-y-4 overflow-y-auto">
                            {/* Top Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-800">Exam</h4>
                                    <p className="text-xs text-gray-600 mt-1">{examSubjectData.exam?.name}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-800">Exam Group</h4>
                                    <p className="text-xs text-gray-600 mt-1">{examSubjectData.group?.name}</p>
                                </div>
                            </div>

                            {/* Add Button */}
                            <div className="flex justify-end">
                                <Button onClick={handleAddExamSubjectRow} className="bg-[#6366F1] hover:bg-indigo-600 text-white h-8 px-4 rounded text-xs gap-1.5 shadow-none font-normal">
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Exam Subject
                                </Button>
                            </div>

                            {/* Subjects Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-[11px] text-left">
                                    <thead className="bg-white border-b border-gray-200">
                                        <tr>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '130px'}}>Subject <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '130px'}}>Date <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '120px'}}>Start Time <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '90px'}}>Duration <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '100px'}}>Credit Hours <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '90px'}}>Room No. <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '110px'}}>Marks (Max..) <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '110px'}}>Marks (Min..) <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 w-10 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {examSubjectRows.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50/50">
                                                <td className="py-2 px-1.5">
                                                    <Select value={row.subject} onValueChange={(val) => handleUpdateExamSubjectRow(row.id, "subject", val)}>
                                                        <SelectTrigger className="h-9 border-gray-200 shadow-none text-xs w-full bg-white rounded-sm">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {academicSubjects.length === 0 ? (
                                                                <SelectItem value="none" disabled>No subjects available</SelectItem>
                                                            ) : (
                                                                academicSubjects.map((sub) => (
                                                                    <SelectItem key={sub.id} value={sub.id.toString()}>
                                                                        {sub.name} {sub.code ? `(${sub.code})` : ''}
                                                                    </SelectItem>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="py-2 px-1.5">
                                                    <Input type="date" value={row.date} onChange={(e) => handleUpdateExamSubjectRow(row.id, "date", e.target.value)} className="h-9 border-gray-200 shadow-none text-xs w-full bg-white rounded-sm" />
                                                </td>
                                                <td className="py-2 px-1.5">
                                                    <Input type="time" step="1" value={row.start_time} onChange={(e) => handleUpdateExamSubjectRow(row.id, "start_time", e.target.value)} className="h-9 border-gray-200 shadow-none text-xs w-full bg-white rounded-sm" />
                                                </td>
                                                <td className="py-2 px-1.5">
                                                    <Input type="number" placeholder="60" value={row.duration} onChange={(e) => handleUpdateExamSubjectRow(row.id, "duration", e.target.value)} className="h-9 border-gray-200 shadow-none text-xs w-full bg-white rounded-sm" />
                                                </td>
                                                <td className="py-2 px-1.5">
                                                    <Input type="number" step="0.01" placeholder="1.00" value={row.credit_hours} onChange={(e) => handleUpdateExamSubjectRow(row.id, "credit_hours", e.target.value)} className="h-9 border-gray-200 shadow-none text-xs w-full bg-white rounded-sm" />
                                                </td>
                                                <td className="py-2 px-1.5">
                                                    <Input placeholder="100" value={row.room_no} onChange={(e) => handleUpdateExamSubjectRow(row.id, "room_no", e.target.value)} className="h-9 border-gray-200 shadow-none text-xs w-full bg-white rounded-sm" />
                                                </td>
                                                <td className="py-2 px-1.5">
                                                    <Input type="number" step="0.01" placeholder="100.00" value={row.marks_max} onChange={(e) => handleUpdateExamSubjectRow(row.id, "marks_max", e.target.value)} className="h-9 border-gray-200 shadow-none text-xs w-full bg-white rounded-sm" />
                                                </td>
                                                <td className="py-2 px-1.5">
                                                    <Input type="number" step="0.01" placeholder="33.00" value={row.marks_min} onChange={(e) => handleUpdateExamSubjectRow(row.id, "marks_min", e.target.value)} className="h-9 border-gray-200 shadow-none text-xs w-full bg-white rounded-sm" />
                                                </td>
                                                <td className="py-2 px-1.5 text-center">
                                                    <Button size="icon" onClick={() => handleRemoveExamSubjectRow(row.id)} className="h-[30px] w-[30px] bg-[#6366F1] hover:bg-indigo-600 text-white rounded-sm shadow-none">
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <DialogFooter className="p-4 border-t border-gray-100 flex justify-end bg-white">
                            <Button onClick={handleSaveExamSubjects} disabled={submitting || examSubjectRows.length === 0} className="bg-[#6366F1] hover:bg-indigo-600 text-white h-8 px-6 rounded text-xs shadow-none">
                                {submitting ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Add Exam Group Form */}
                <div className="lg:col-span-1">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 flex flex-col h-fit sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <FolderKanban className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {editMode ? "Edit Exam Group" : "Add Exam Group"}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{editMode ? "Update group details" : "Create a new exam group"}</p>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6 flex-1">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Annual Exams 2026"
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Exam Type <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.exam_type} onValueChange={(val) => setFormData({...formData, exam_type: val})}>
                                    <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
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
                                    className="min-h-[120px] border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none resize-none"
                                />
                            </div>
                        </CardContent>

                        <div className="p-6 border-t border-gray-50 bg-gray-50/30 rounded-b-2xl flex gap-2 justify-end">
                            {editMode && (
                                <Button onClick={resetForm} variant="outline" className="h-10 rounded-full text-[10px] font-bold uppercase tracking-widest border-gray-200 px-5">
                                    Cancel
                                </Button>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={submitting}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white h-9 text-[10px] font-bold uppercase tracking-wider rounded-full px-6 transition-all active:scale-95"
                            >
                                {submitting ? "Processing..." : editMode ? "Update Group" : "Save Group"}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Exam Group List */}
                <div className="lg:col-span-3">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <LayoutList className="h-5 w-5" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Exam Group Registry</CardTitle>
                                    <p className="text-[11px] text-gray-500 mt-1">{totalEntries} groups</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                    <SelectTrigger className="w-[65px] h-8 text-xs border-gray-200 rounded-lg bg-white">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="500">500</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Copy className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileSpreadsheet className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileText className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Printer className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search groups..."
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
                                            <TableHead className="py-4 px-6">Group Name</TableHead>
                                            <TableHead className="py-4 px-6 text-center">Exams</TableHead>
                                            <TableHead className="py-4 px-6">Grading System</TableHead>
                                            <TableHead className="py-4 px-6 text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={4} />
                                        ) : groups.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                    No data found
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
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button size="icon" variant="ghost" onClick={() => handleManageExams(group)} className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(group)} className="h-8 w-8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => setDeleteId(group.id)} className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md">
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
                                        size="sm" className="h-8 w-8 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px] hover:bg-indigo-50 hover:text-indigo-600"
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-md">
                                        {currentPage}
                                    </Button>
                                    <Button
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        size="sm" className="h-8 w-8 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px] hover:bg-indigo-50 hover:text-indigo-600"
                                        disabled={groups.length < itemsPerPage}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Exam Group</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this exam group? This will permanently remove all associated exams and examination data linked to this group.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Group
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
