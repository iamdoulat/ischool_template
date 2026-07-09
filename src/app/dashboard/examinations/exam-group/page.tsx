"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
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
    marksheet_template_id?: number | null;
    marksheet_template?: { id: number; name: string } | null;
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
    const { t } = useTranslation();
    const tt = useTranslateToast();
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

    // Exam Types (dynamic from API)
    const [examTypes, setExamTypes] = useState<{ id: number; name: string }[]>([]);

    const fetchExamTypes = useCallback(async () => {
        try {
            const response = await api.get('/examination/exam-types');
            const result = response.data;
            const list = result?.data?.data || result?.data || result || [];
            setExamTypes(Array.isArray(list) ? list : []);
        } catch {
            setExamTypes([]);
        }
    }, []);

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
    const [studentCategories, setStudentCategories] = useState<Record<number, string>>({}); // id → name

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

    // Exam Marks Modal State
    const [examMarksOpen, setExamMarksOpen] = useState(false);
    const [examMarksData, setExamMarksData] = useState<{ exam: Exam | null }>({ exam: null });
    const [examMarksSubjects, setExamMarksSubjects] = useState<any[]>([]);
    const [selectedMarksSubject, setSelectedMarksSubject] = useState<string>("");
    const [examMarksStudents, setExamMarksStudents] = useState<any[]>([]);
    const [marksLoading, setMarksLoading] = useState(false);

    // Teacher Remarks Modal State
    const [teacherRemarksOpen, setTeacherRemarksOpen] = useState(false);
    const [remarksData, setRemarksData] = useState<{ exam: Exam | null }>({ exam: null });
    const [remarksStudents, setRemarksStudents] = useState<any[]>([]);
    const [remarksLoading, setRemarksLoading] = useState(false);

    // Add Exam modal state
    const [addExamOpen, setAddExamOpen] = useState(false);
    const [editingExamId, setEditingExamId] = useState<number | null>(null);
    const [deleteExamId, setDeleteExamId] = useState<number | null>(null);
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

    // Marksheet Templates state
    const [marksheetTemplates, setMarksheetTemplates] = useState<{ id: number; name: string }[]>([]);
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [templateEditId, setTemplateEditId] = useState<number | null>(null);
    const [templateName, setTemplateName] = useState("");
    const [templateSaving, setTemplateSaving] = useState(false);

    const fetchMarksheetTemplates = useCallback(async () => {
        try {
            const res = await api.get('/examination/marksheet-templates', { params: { per_page: 200 } });
            const list = res.data?.data || res.data || [];
            setMarksheetTemplates(Array.isArray(list) ? list : []);
        } catch {
            setMarksheetTemplates([]);
        }
    }, []);

    const handleOpenAddTemplate = () => {
        setTemplateEditId(null);
        setTemplateName("");
        setTemplateDialogOpen(true);
    };

    const handleOpenRenameTemplate = (tpl: { id: number; name: string }) => {
        setTemplateEditId(tpl.id);
        setTemplateName(tpl.name);
        setTemplateDialogOpen(true);
    };

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) return;
        setTemplateSaving(true);
        try {
            if (templateEditId) {
                await api.put(`/examination/marksheet-templates/${templateEditId}`, { name: templateName.trim() });
                tt.success("template_updated_successfully");
            } else {
                const res = await api.post('/examination/marksheet-templates', { name: templateName.trim() });
                const newTpl = res.data?.data || res.data;
                if (newTpl?.id) {
                    setAddExamForm(prev => ({ ...prev, marksheet_template: String(newTpl.id) }));
                }
                tt.success("template_created_successfully");
            }
            await fetchMarksheetTemplates();
            setTemplateDialogOpen(false);
        } catch {
            tt.error("failed_to_save_template");
        } finally {
            setTemplateSaving(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [currentPage, itemsPerPage, searchTerm]);

    useEffect(() => {
        fetchGroups();
        fetchExamTypes();
        fetchMarksheetTemplates();

        // Fetch classes, subjects & student categories
        const fetchClassesAndSubjects = async () => {
            try {
                const [classRes, subRes, catRes] = await Promise.all([
                    api.get('/academics/classes?no_paginate=true'),
                    api.get('/academics/subjects?no_paginate=true'),
                    api.get('/student-categories'),
                ]);
                setClasses(classRes.data?.data || classRes.data || []);
                setAcademicSubjects(subRes.data?.data || subRes.data || []);
                // Build id→name map for categories
                const catList: { id: number; category_name: string }[] = catRes.data?.data?.data || catRes.data?.data || catRes.data || [];
                const catMap: Record<number, string> = {};
                catList.forEach((c) => { catMap[c.id] = c.category_name; });
                setStudentCategories(catMap);
            } catch (error) {
                console.error("Failed to fetch classes, subjects or categories", error);
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

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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
            tt.error("failed_to_fetch_exam_groups");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.exam_type) {
            tt.error("name_and_exam_type_required");
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/examination/exam-groups/${selectedId}`, formData);
                tt.success("exam_group_updated_successfully");
            } else {
                await api.post('/examination/exam-groups', formData);
                tt.success("exam_group_created_successfully");
            }
            resetForm();
            fetchGroups();
        } catch (error) {
            tt.error("failed_to_save_exam_group");
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
            tt.success("exam_group_deleted_successfully");
            fetchGroups();
        } catch (error) {
            tt.error("failed_to_delete_exam_group");
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
            tt.error("failed_to_fetch_exam_group_details");
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
        setEditingExamId(null);
        setAddExamForm({
            name: "", session: "2026-27", is_published: false, is_result_published: false,
            roll_no_type: "admit_card", marksheet_template: "", description: "",
        });
        setAddExamOpen(true);
    };

    const handleEditExam = (exam: Exam) => {
        setEditingExamId(exam.id);
        setAddExamForm({
            name: exam.name || "",
            session: exam.session || "2026-27",
            is_published: !!exam.is_published,
            is_result_published: !!exam.is_result_published,
            roll_no_type: "admit_card",
            marksheet_template: exam.marksheet_template_id ? String(exam.marksheet_template_id) : "",
            description: exam.description || "",
        });
        setAddExamOpen(true);
    };

    const handleSaveExam = async () => {
        if (!addExamForm.name || !managingGroup) {
            tt.error("name_is_required");
            return;
        }
        if (!addExamForm.session) {
            tt.error("session_is_required");
            return;
        }

        setSubmitting(true);
        try {
            if (editingExamId) {
                await api.put(`/examination/exams/${editingExamId}`, {
                    ...addExamForm,
                    exam_group_id: managingGroup.id,
                    marksheet_template_id: addExamForm.marksheet_template || null,
                });
                tt.success("exam_updated_successfully");
            } else {
                await api.post("/examination/exams", {
                    ...addExamForm,
                    exam_group_id: managingGroup.id,
                    marksheet_template_id: addExamForm.marksheet_template || null,
                });
                tt.success("exam_created_successfully");
            }
            setAddExamOpen(false);
            setEditingExamId(null);
            handleManageExams(managingGroup); // refresh
        } catch (error) {
            tt.error(editingExamId ? "failed_to_update_exam" : "failed_to_create_exam");
        } finally {
            setSubmitting(false);
        }
    };

    const executeDeleteExam = async () => {
        if (!deleteExamId || !managingGroup) return;
        try {
            await api.delete(`/examination/exams/${deleteExamId}`);
            tt.success("exam_deleted_successfully");
            handleManageExams(managingGroup); // refresh
        } catch (error) {
            tt.error("failed_to_delete_exam");
        } finally {
            setDeleteExamId(null);
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
            tt.success("exams_linked_successfully");
            setLinkExamOpen(false);
            handleManageExams(managingGroup); // refresh
        } catch (error) {
            tt.error("failed_to_link_exams");
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

    const handleOpenAssignStudent = async (examId: number) => {
        setAssignExamId(examId);
        setAssignFilters({ class_id: "", section_id: "" });
        setAssignStudents([]);
        
        try {
            // Fetch currently assigned students
            const res = await api.get(`/examination/exams/${examId}/students`);
            setSelectedStudents(res.data?.data || []);
        } catch (error) {
            console.error(error);
            setSelectedStudents([]);
        }
        
        setAssignStudentOpen(true);
    };

    const handleSearchStudents = async () => {
        if (!assignFilters.class_id || !assignFilters.section_id) {
            tt.error("please_select_class_and_section");
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
                category?: string | number;
                gender?: string;
            }) => ({
                id: s.id,
                admission_no: s.admission_no || "-",
                name: `${s.first_name || ""} ${s.last_name || ""}`.trim(),
                father_name: s.father_name || "-",
                category: s.category
                    ? (studentCategories[Number(s.category)] || String(s.category))
                    : "-",
                gender: s.gender || "-",
                assigned: selectedStudents.includes(s.id)
            }));

            setAssignStudents(mappedStudents);
            // Don't overwrite selectedStudents here, let the initial fetch or user selection govern it.
        } catch (error) {
            console.error("Failed to fetch students", error);
            tt.error("failed_to_fetch_students");
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
        if (!assignExamId) return;
        setSubmitting(true);
        try {
            await api.post(`/examination/exams/${assignExamId}/students`, {
                student_ids: selectedStudents
            });
            tt.success("students_assigned_to_exam_successfully");
            setAssignStudentOpen(false);
        } catch (error) {
            tt.error("failed_to_assign_students");
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenExamSubject = async (exam: Exam) => {
        setExamSubjectData({ exam, group: managingGroup });
        setExamSubjectRows([]);
        setExamSubjectOpen(true);

        try {
            const res = await api.post(`/examination/exam-schedules/search`, { exam_id: exam.id });
            const schedules = res.data || [];
            if (schedules.length > 0) {
                setExamSubjectRows(schedules.map((s: any) => ({
                    id: s.id.toString(),
                    subject: s.subject_id?.toString() || "",
                    date: s.date_from ? s.date_from.split('T')[0] : "",
                    start_time: s.start_time || "",
                    duration: s.duration || "",
                    credit_hours: s.credit_hours || "",
                    room_no: s.room_no || "",
                    marks_max: s.max_marks || "",
                    marks_min: s.min_marks || ""
                })));
            } else {
                setExamSubjectRows([
                    { id: Date.now().toString(), subject: "", date: "", start_time: "", duration: "", credit_hours: "", room_no: "", marks_max: "", marks_min: "" }
                ]);
            }
        } catch (error) {
            console.error(error);
            setExamSubjectRows([
                { id: Date.now().toString(), subject: "", date: "", start_time: "", duration: "", credit_hours: "", room_no: "", marks_max: "", marks_min: "" }
            ]);
        }
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
        if (!examSubjectData.exam) return;
        setSubmitting(true);
        try {
            const payload = examSubjectRows.filter(r => r.subject).map(r => ({
                subject_id: parseInt(r.subject),
                date_from: r.date || null,
                start_time: r.start_time || null,
                duration: r.duration || null,
                room_no: r.room_no || null,
                max_marks: r.marks_max ? parseFloat(r.marks_max) : null,
                min_marks: r.marks_min ? parseFloat(r.marks_min) : null,
            }));

            await api.post(`/examination/exam-schedules`, {
                exam_id: examSubjectData.exam.id,
                schedules: payload
            });
            
            tt.success("exam_subjects_saved_successfully");
            setExamSubjectOpen(false);
            if (managingGroup) handleManageExams(managingGroup);
        } catch (error) {
            tt.error("failed_to_save_exam_subjects");
        } finally {
            setSubmitting(false);
        }
    };

    // Exam Marks Handlers
    const handleOpenExamMarks = async (exam: Exam) => {
        setExamMarksData({ exam });
        setExamMarksSubjects([]);
        setSelectedMarksSubject("");
        setExamMarksStudents([]);
        setExamMarksOpen(true);

        try {
            const res = await api.post(`/examination/exam-schedules/search`, { exam_id: exam.id });
            const schedules = res.data || [];
            // Map schedules to include subject details
            const subjectsList = schedules.map((s: any) => ({
                id: s.subject_id?.toString(),
                name: s.subject?.name || `Subject ${s.subject_id}`
            }));
            setExamMarksSubjects(subjectsList);
            if (subjectsList.length > 0) {
                handleMarksSubjectChange(subjectsList[0].id, exam.id);
            }
        } catch (error) {
            console.error(error);
            tt.error("failed_to_fetch_exam_subjects");
        }
    };

    const handleMarksSubjectChange = async (subjectId: string, examId: number) => {
        setSelectedMarksSubject(subjectId);
        setMarksLoading(true);
        try {
            const res = await api.get(`/examination/exams/${examId}/marks?subject_id=${subjectId}`);
            setExamMarksStudents(res.data?.data || []);
        } catch (error) {
            console.error(error);
            setExamMarksStudents([]);
            tt.error("failed_to_fetch_marks");
        } finally {
            setMarksLoading(false);
        }
    };

    const handleSaveExamMarks = async () => {
        if (!examMarksData.exam || !selectedMarksSubject) return;
        setSubmitting(true);
        try {
            await api.post(`/examination/exams/${examMarksData.exam.id}/marks`, {
                subject_id: parseInt(selectedMarksSubject),
                marks: examMarksStudents.map(s => ({
                    student_id: s.id,
                    theory_marks: s.theory_marks !== "" ? s.theory_marks : null,
                    practical_marks: s.practical_marks !== "" ? s.practical_marks : null,
                    is_absent: !!s.is_absent
                }))
            });
            tt.success("exam_marks_saved_successfully");
            setExamMarksOpen(false);
        } catch (error) {
            tt.error("failed_to_save_exam_marks");
        } finally {
            setSubmitting(false);
        }
    };

    // Teacher Remarks Handlers
    const handleOpenTeacherRemarks = async (exam: Exam) => {
        setRemarksData({ exam });
        setRemarksStudents([]);
        setTeacherRemarksOpen(true);
        setRemarksLoading(true);

        try {
            const res = await api.get(`/examination/exams/${exam.id}/remarks`);
            setRemarksStudents(res.data?.data || []);
        } catch (error) {
            console.error(error);
            tt.error("failed_to_fetch_remarks");
        } finally {
            setRemarksLoading(false);
        }
    };

    const handleSaveTeacherRemarks = async () => {
        if (!remarksData.exam) return;
        setSubmitting(true);
        try {
            await api.post(`/examination/exams/${remarksData.exam.id}/remarks`, {
                remarks: remarksStudents.map(s => ({
                    student_id: s.id,
                    note: s.note || ""
                }))
            });
            tt.success("teacher_remarks_saved_successfully");
            setTeacherRemarksOpen(false);
        } catch (error) {
            tt.error("failed_to_save_teacher_remarks");
        } finally {
            setSubmitting(false);
        }
    };

    // Rank Generation
    const handleGenerateRank = async (exam: Exam) => {
        setSubmitting(true);
        try {
            await api.post(`/examination/exams/${exam.id}/generate-rank`);
            tt.success("ranks_generated_successfully");
            if (managingGroup) handleManageExams(managingGroup);
        } catch (error) {
            tt.error("failed_to_generate_ranks");
        } finally {
            setSubmitting(false);
        }
    };


    if (managingGroup) {
        return (
            <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
                {/* Back navigation */}
                <Button variant="ghost" onClick={() => { setManagingGroup(null); fetchGroups(); }} className="-ml-3 text-gray-500 hover:text-indigo-600 gap-2 font-bold text-[11px] uppercase tracking-widest">
                    <ArrowLeft className="h-4 w-4" /> {t("back_to_groups")}
                </Button>

                {/* Header Section */}
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <FolderKanban className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("exam_group")}: {managingGroup.name}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{managingGroup.exam_type}{managingGroup.description ? ` · ${managingGroup.description}` : ""}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleOpenLinkExam} className="font-bold text-[11px] uppercase tracking-widest gap-2">
                                <Link className="h-4 w-4" /> {t("link_exam")}
                            </Button>
                            <Button variant="default" onClick={handleOpenAddExam} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] font-bold text-[11px] uppercase tracking-widest gap-2 text-white border-0 shadow-md">
                                <Plus className="h-4 w-4" /> {t("add_exam")}
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
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("linked_exams")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{managingGroup.exams?.length || 0} {t("exams_in_this_group")}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("name")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("session")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">{t("subjects_included")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">{t("publish_exam")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">{t("publish_result")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("description")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton rows={4} cols={7} />
                                ) : !managingGroup.exams || managingGroup.exams.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            {t("no_data_found")}
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
                                                    <Button size="icon" variant="ghost" title={t("assign_view_student")} onClick={() => handleOpenAssignStudent(exam.id)} className="h-8 w-8 text-blue-500 hover:text-white hover:bg-blue-500 rounded-lg">
                                                        <Users className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("exam_subject")} onClick={() => handleOpenExamSubject(exam)} className="h-8 w-8 text-indigo-500 hover:text-white hover:bg-indigo-500 rounded-lg">
                                                        <BookOpen className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("exam_marks")} onClick={() => handleOpenExamMarks(exam)} className="h-8 w-8 text-purple-500 hover:text-white hover:bg-purple-500 rounded-lg">
                                                        <FileDigit className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("teacher_remarks")} onClick={() => handleOpenTeacherRemarks(exam)} className="h-8 w-8 text-pink-500 hover:text-white hover:bg-pink-500 rounded-lg">
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("generate_rank")} onClick={() => handleGenerateRank(exam)} disabled={submitting} className="h-8 w-8 text-amber-500 hover:text-white hover:bg-amber-500 rounded-lg disabled:opacity-50">
                                                        <Trophy className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("edit_exam")} onClick={() => handleEditExam(exam)} className="h-8 w-8 text-amber-500 hover:text-white hover:bg-amber-500 rounded-lg">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("delete_exam")} onClick={() => setDeleteExamId(exam.id)} className="h-8 w-8 text-red-500 hover:text-white hover:bg-red-500 rounded-lg">
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
                            <DialogTitle className="text-lg font-normal">{editingExamId ? t("edit_exam") : t("add_exam")}</DialogTitle>
                        </DialogHeader>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className="text-sm font-normal text-gray-600">{t("exam")} <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={addExamForm.name}
                                        onChange={(e) => setAddExamForm({ ...addExamForm, name: e.target.value })}
                                        className="h-9 border-gray-300 rounded shadow-sm focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-normal text-gray-600">{t("session")} <span className="text-red-500">*</span></Label>
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
                                    <Label htmlFor="publish" className="text-sm font-normal text-gray-600 cursor-pointer">{t("publish")}</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="publish_result" checked={addExamForm.is_result_published} onChange={(e) => setAddExamForm({ ...addExamForm, is_result_published: e.target.checked })} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <Label htmlFor="publish_result" className="text-sm font-normal text-gray-600 cursor-pointer">{t("publish_result")}</Label>
                                </div>
                                <div className="flex items-center gap-4 ml-2">
                                    <div className="flex items-center gap-2">
                                        <input type="radio" id="admit_card" name="roll_no_type" value="admit_card" checked={addExamForm.roll_no_type === 'admit_card'} onChange={(e) => setAddExamForm({ ...addExamForm, roll_no_type: e.target.value })} className="border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <Label htmlFor="admit_card" className="text-sm font-normal text-gray-600 cursor-pointer">{t("admit_card_roll_no")}</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="radio" id="profile" name="roll_no_type" value="profile" checked={addExamForm.roll_no_type === 'profile'} onChange={(e) => setAddExamForm({ ...addExamForm, roll_no_type: e.target.value })} className="border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <Label htmlFor="profile" className="text-sm font-normal text-gray-600 cursor-pointer">{t("profile_roll_no")}</Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-normal text-gray-600">{t("marksheet_template")} <span className="text-red-500">*</span></Label>
                                    <div className="flex items-center gap-1.5">
                                        {addExamForm.marksheet_template && (() => {
                                            const tpl = marksheetTemplates.find(t => String(t.id) === addExamForm.marksheet_template);
                                            return tpl ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenRenameTemplate(tpl)}
                                                    className="text-[10px] text-indigo-600 hover:underline font-semibold"
                                                >
                                                    {t("rename")}
                                                </button>
                                            ) : null;
                                        })()}
                                        <button
                                            type="button"
                                            onClick={handleOpenAddTemplate}
                                            className="flex items-center gap-0.5 text-[10px] text-indigo-600 hover:underline font-semibold"
                                        >
                                            <Plus className="h-3 w-3" />{t("add_new")}
                                        </button>
                                    </div>
                                </div>
                                <Select value={addExamForm.marksheet_template} onValueChange={(val) => setAddExamForm({ ...addExamForm, marksheet_template: val })}>
                                    <SelectTrigger className="h-9 border-gray-300 rounded shadow-sm focus:ring-indigo-500 w-full">
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {marksheetTemplates.length === 0 ? (
                                            <div className="px-3 py-2 text-xs text-gray-400 italic">{t("no_templates_found")}</div>
                                        ) : (
                                            marksheetTemplates.map((tpl) => (
                                                <SelectItem key={tpl.id} value={String(tpl.id)}>
                                                    {tpl.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-normal text-gray-600">{t("description")}</Label>
                                <Textarea value={addExamForm.description} onChange={(e) => setAddExamForm({ ...addExamForm, description: e.target.value })} className="min-h-[80px] border-gray-300 rounded shadow-sm focus:ring-indigo-500 p-3" />
                            </div>
                        </div>

                        <DialogFooter className="p-4 border-t border-gray-200 flex justify-end">
                            <Button onClick={handleSaveExam} disabled={submitting} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity text-white h-9 px-6 rounded shadow">
                                {submitting ? t("saving") : t("save")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Link Exam Modal */}
                <Dialog open={linkExamOpen} onOpenChange={setLinkExamOpen}>
                    <DialogContent className="max-w-[500px] rounded-lg border-0 shadow-2xl p-0 overflow-hidden bg-white">
                        <DialogHeader className="p-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex justify-between items-center relative">
                            <DialogTitle className="text-lg font-normal">{t("link_exam")}</DialogTitle>
                        </DialogHeader>

                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="rounded border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#f3f4f6]">
                                        <tr className="border-b border-gray-200">
                                            <th className="py-2.5 px-3 w-10"></th>
                                            <th className="py-2.5 px-3 text-left font-semibold text-gray-700">{t("exam")}</th>
                                            <th className="py-2.5 px-3 text-left font-semibold text-gray-700 w-32">{t("weightage")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availableExams.length === 0 ? (
                                            <tr><td colSpan={3} className="text-center py-6 text-gray-400 italic">{t("no_available_exams_found")}</td></tr>
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
                            <Button onClick={() => setExamWeightages({})} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity text-white h-9 px-4 rounded shadow">{t("reset_link_exam")}</Button>
                            <Button onClick={handleLinkExams} disabled={submitting} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity text-white h-9 px-6 rounded shadow">
                                {submitting ? t("saving") : t("save")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assign / View Student Modal */}
                <Dialog open={assignStudentOpen} onOpenChange={setAssignStudentOpen}>
                    <DialogContent className="max-w-[1000px] rounded border-0 shadow-2xl p-0 overflow-hidden bg-white">
                        <DialogHeader className="p-3 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex justify-between items-center relative">
                            <DialogTitle className="text-sm font-medium">{t("exam_students")}</DialogTitle>
                        </DialogHeader>

                        <div className="p-4 space-y-4">
                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-gray-700">{t("class")} <span className="text-red-500">*</span></Label>
                                    <Select value={assignFilters.class_id} onValueChange={(v) => setAssignFilters({...assignFilters, class_id: v, section_id: ""})}>
                                        <SelectTrigger className="h-9 border-gray-200 shadow-none">
                                            <SelectValue placeholder={t("select_class")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.class || c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-gray-700">{t("section")} <span className="text-red-500">*</span></Label>
                                    <Select disabled={!assignFilters.class_id} value={assignFilters.section_id} onValueChange={(v) => setAssignFilters({...assignFilters, section_id: v})}>
                                        <SelectTrigger className="h-9 border-gray-200 shadow-none">
                                            <SelectValue placeholder={t("select_section")} />
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
                                    {assignLoading ? t("searching") : t("search")}
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
                                                    <span>{t("all")}</span>
                                                </div>
                                            </th>
                                            <th className="py-2.5 px-3 font-semibold text-gray-700">{t("admission_no")}</th>
                                            <th className="py-2.5 px-3 font-semibold text-gray-700">{t("student_name")}</th>
                                            <th className="py-2.5 px-3 font-semibold text-gray-700">{t("father_name")}</th>
                                            <th className="py-2.5 px-3 font-semibold text-gray-700">{t("category")}</th>
                                            <th className="py-2.5 px-3 font-semibold text-gray-700">{t("gender")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignLoading ? (
                                            <TableSkeleton rows={5} cols={6} />
                                        ) : assignStudents.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-8 text-gray-400 italic border-b border-gray-50">{t("please_select_class_and_section_to_search_students")}</td></tr>
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
                                {submitting ? t("saving") : t("save")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Exam Subject Modal */}
                <Dialog open={examSubjectOpen} onOpenChange={setExamSubjectOpen}>
                    <DialogContent showCloseButton={false} className="sm:max-w-[1600px] w-[98vw] max-h-[90vh] rounded border-0 shadow-2xl p-0 gap-0 overflow-hidden bg-white">
                        <DialogHeader className="p-3 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex justify-between items-center relative">
                            <DialogTitle className="text-sm font-medium">{t("add_exam_subject")}</DialogTitle>
                            <button onClick={() => setExamSubjectOpen(false)} className="absolute top-2.5 right-3 text-white/80 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </DialogHeader>

                        <div className="p-5 space-y-4 overflow-y-auto">
                            {/* Top Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-800">{t("exam")}</h4>
                                    <p className="text-xs text-gray-600 mt-1">{examSubjectData.exam?.name}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-800">{t("exam_group")}</h4>
                                    <p className="text-xs text-gray-600 mt-1">{examSubjectData.group?.name}</p>
                                </div>
                            </div>

                            {/* Add Button */}
                            <div className="flex justify-end">
                                <Button onClick={handleAddExamSubjectRow} className="bg-[#6366F1] hover:bg-indigo-600 text-white h-8 px-4 rounded text-xs gap-1.5 shadow-none font-normal">
                                    <Plus className="h-3.5 w-3.5" />
                                    {t("add_exam_subject")}
                                </Button>
                            </div>

                            {/* Subjects Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-[11px] text-left">
                                    <thead className="bg-white border-b border-gray-200">
                                        <tr>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '130px'}}>{t("subject")} <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '130px'}}>{t("date")} <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '120px'}}>{t("start_time")} <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '90px'}}>{t("duration")} <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '100px'}}>{t("credit_hours")} <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '90px'}}>{t("room_no")} <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '110px'}}>{t("marks_max")} <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 font-bold text-gray-700" style={{minWidth: '110px'}}>{t("marks_min")} <span className="text-red-500">*</span></th>
                                            <th className="py-2.5 px-2 w-10 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {examSubjectRows.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50/50">
                                                <td className="py-2 px-1.5">
                                                    <Select value={row.subject} onValueChange={(val) => handleUpdateExamSubjectRow(row.id, "subject", val)}>
                                                        <SelectTrigger className="h-9 border-gray-200 shadow-none text-xs w-full bg-white rounded-sm">
                                                            <SelectValue placeholder={t("select")} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {academicSubjects.length === 0 ? (
                                                                <SelectItem value="none" disabled>{t("no_subjects_available")}</SelectItem>
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
                                {submitting ? t("saving") : t("save")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Exam Confirmation Dialog */}
                <AlertDialog open={!!deleteExamId} onOpenChange={(open) => !open && setDeleteExamId(null)}>
                    <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("delete_exam")}</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                                {t("are_you_sure_you_want_to_delete_this_exam_this_action_cannot_be_undone")}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6">
                            <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction onClick={executeDeleteExam} className="bg-red-500 hover:bg-red-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                                {t("yes_delete")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Add / Rename Marksheet Template Dialog */}
                <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                    <DialogContent className="max-w-sm rounded-lg border-0 shadow-2xl p-0 overflow-hidden bg-white">
                        <DialogHeader className="p-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white">
                            <DialogTitle className="text-sm font-semibold">
                                {templateEditId ? t("rename_template") : t("add_marksheet_template")}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-normal text-gray-600">{t("template_name")} <span className="text-red-500">*</span></Label>
                                <Input
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                                    placeholder={t("enter_template_name")}
                                    className="h-9 border-gray-300 rounded shadow-sm"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter className="p-4 border-t border-gray-100 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)} className="h-9 px-5 rounded text-xs">
                                {t("cancel")}
                            </Button>
                            <Button
                                onClick={handleSaveTemplate}
                                disabled={templateSaving || !templateName.trim()}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white h-9 px-6 rounded text-xs shadow"
                            >
                                {templateSaving ? t("saving") : templateEditId ? t("rename") : t("add")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Exam Marks Modal */}
                <Dialog open={examMarksOpen} onOpenChange={setExamMarksOpen}>
                    <DialogContent className="max-w-4xl rounded-lg border-0 shadow-2xl p-0 overflow-hidden bg-white">
                        <DialogHeader className="p-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex justify-between items-center relative">
                            <DialogTitle className="text-lg font-normal">{t("exam_marks")}</DialogTitle>
                        </DialogHeader>

                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="w-1/3">
                                <Label className="text-sm font-normal text-gray-600">{t("subject")} <span className="text-red-500">*</span></Label>
                                <Select value={selectedMarksSubject} onValueChange={(val) => handleMarksSubjectChange(val, examMarksData.exam!.id)}>
                                    <SelectTrigger className="h-9 border-gray-300 rounded shadow-sm focus:ring-indigo-500 w-full mt-1">
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {examMarksSubjects.length === 0 ? (
                                            <div className="px-3 py-2 text-xs text-gray-400 italic">{t("no_subjects_found")}</div>
                                        ) : (
                                            examMarksSubjects.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {marksLoading ? (
                                <div className="py-10 text-center text-gray-500">{t("loading")}...</div>
                            ) : examMarksStudents.length === 0 ? (
                                <div className="py-10 text-center text-gray-500 italic">{t("no_students_assigned_to_this_exam")}</div>
                            ) : (
                                <div className="rounded border border-gray-200 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-[#f3f4f6]">
                                            <tr className="border-b border-gray-200">
                                                <th className="py-2.5 px-3 text-left font-semibold text-gray-700">{t("admission_no")}</th>
                                                <th className="py-2.5 px-3 text-left font-semibold text-gray-700">{t("student_name")}</th>
                                                <th className="py-2.5 px-3 text-left font-semibold text-gray-700 w-24">{t("theory")}</th>
                                                <th className="py-2.5 px-3 text-left font-semibold text-gray-700 w-24">{t("practical")}</th>
                                                <th className="py-2.5 px-3 text-center font-semibold text-gray-700 w-24">{t("absent")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {examMarksStudents.map((s, idx) => (
                                                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                                    <td className="py-2.5 px-3 text-gray-700">{s.admission_no}</td>
                                                    <td className="py-2.5 px-3 text-gray-700">{s.name}</td>
                                                    <td className="py-2.5 px-3">
                                                        <Input type="number" value={s.theory_marks ?? ""} onChange={(e) => {
                                                            const newStudents = [...examMarksStudents];
                                                            newStudents[idx].theory_marks = e.target.value;
                                                            setExamMarksStudents(newStudents);
                                                        }} className="h-8 text-sm px-2 text-gray-700 border-gray-300" />
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <Input type="number" value={s.practical_marks ?? ""} onChange={(e) => {
                                                            const newStudents = [...examMarksStudents];
                                                            newStudents[idx].practical_marks = e.target.value;
                                                            setExamMarksStudents(newStudents);
                                                        }} className="h-8 text-sm px-2 text-gray-700 border-gray-300" />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <input type="checkbox" checked={!!s.is_absent} onChange={(e) => {
                                                            const newStudents = [...examMarksStudents];
                                                            newStudents[idx].is_absent = e.target.checked;
                                                            setExamMarksStudents(newStudents);
                                                        }} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="p-4 border-t border-gray-200 flex justify-end">
                            <Button onClick={handleSaveExamMarks} disabled={submitting || !selectedMarksSubject} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity text-white h-9 px-6 rounded shadow">
                                {submitting ? t("saving") : t("save")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Teacher Remarks Modal */}
                <Dialog open={teacherRemarksOpen} onOpenChange={setTeacherRemarksOpen}>
                    <DialogContent className="max-w-4xl rounded-lg border-0 shadow-2xl p-0 overflow-hidden bg-white">
                        <DialogHeader className="p-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex justify-between items-center relative">
                            <DialogTitle className="text-lg font-normal">{t("teacher_remarks")}</DialogTitle>
                        </DialogHeader>

                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            {remarksLoading ? (
                                <div className="py-10 text-center text-gray-500">{t("loading")}...</div>
                            ) : remarksStudents.length === 0 ? (
                                <div className="py-10 text-center text-gray-500 italic">{t("no_students_assigned_to_this_exam")}</div>
                            ) : (
                                <div className="rounded border border-gray-200 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-[#f3f4f6]">
                                            <tr className="border-b border-gray-200">
                                                <th className="py-2.5 px-3 text-left font-semibold text-gray-700 w-32">{t("admission_no")}</th>
                                                <th className="py-2.5 px-3 text-left font-semibold text-gray-700 w-1/4">{t("student_name")}</th>
                                                <th className="py-2.5 px-3 text-left font-semibold text-gray-700">{t("remarks")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {remarksStudents.map((s, idx) => (
                                                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                                    <td className="py-2.5 px-3 text-gray-700">{s.admission_no}</td>
                                                    <td className="py-2.5 px-3 text-gray-700">{s.name}</td>
                                                    <td className="py-2.5 px-3">
                                                        <Input value={s.note ?? ""} onChange={(e) => {
                                                            const newStudents = [...remarksStudents];
                                                            newStudents[idx].note = e.target.value;
                                                            setRemarksStudents(newStudents);
                                                        }} className="h-8 text-sm px-2 text-gray-700 border-gray-300" placeholder={t("enter_remarks_here")} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="p-4 border-t border-gray-200 flex justify-end">
                            <Button onClick={handleSaveTeacherRemarks} disabled={submitting} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity text-white h-9 px-6 rounded shadow">
                                {submitting ? t("saving") : t("save")}
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
                                    {editMode ? t("edit_exam_group") : t("add_exam_group")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{editMode ? t("update_group_details") : t("create_new_exam_group")}</p>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6 flex-1">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    {t("name")} <span className="text-red-500">*</span>
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
                                    {t("exam_type")} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.exam_type} onValueChange={(val) => setFormData({...formData, exam_type: val})}>
                                    <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                        <SelectValue placeholder={t("select_exam_type")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {examTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("description")}</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder={t("provide_additional_details")}
                                    className="min-h-[120px] border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none resize-none"
                                />
                            </div>
                        </CardContent>

                        <div className="p-6 border-t border-gray-50 bg-gray-50/30 rounded-b-2xl flex gap-2 justify-end">
                            {editMode && (
                                <Button onClick={resetForm} variant="outline" className="h-10 rounded-full text-[10px] font-bold uppercase tracking-widest border-gray-200 px-5">
                                    {t("cancel")}
                                </Button>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={submitting}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white h-9 text-[10px] font-bold uppercase tracking-wider rounded-full px-6 transition-all active:scale-95"
                            >
                                {submitting ? t("processing") : editMode ? t("update_group") : t("save_group")}
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
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("exam_group_registry")}</CardTitle>
                                    <p className="text-[11px] text-gray-500 mt-1">{t("x_groups", { count: totalEntries })}</p>
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
                            <div className="flex flex-col md:flex-row justify-end items-center gap-6">
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder={t("search_groups")}
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
                                            <TableHead className="py-4 px-6">{t("group_name")}</TableHead>
                                            <TableHead className="py-4 px-6 text-center">{t("exams")}</TableHead>
                                            <TableHead className="py-4 px-6">{t("grading_system")}</TableHead>
                                            <TableHead className="py-4 px-6 text-right">{t("action")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={4} />
                                        ) : groups.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                    {t("no_data_found")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            groups.map((group) => (
                                                <TableRow key={group.id} className="text-[13px] text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                                    <TableCell className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-indigo-600 uppercase tracking-tight">{group.name}</span>
                                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[200px]">{group.description || t("no_description_provided")}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-center">
                                                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold text-[10px] border border-indigo-100 flex items-center gap-1.5 w-fit mx-auto">
                                                            <FileStack className="h-3 w-3" /> {group.exams_count} {t("exams")}
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
                                    {t("showing_x_to_y_of_z", { from: ((currentPage - 1) * itemsPerPage) + 1, to: Math.min(currentPage * itemsPerPage, totalEntries), total: totalEntries })}
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
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("delete_exam_group")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("delete_exam_group_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            {t("yes_delete_group")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
