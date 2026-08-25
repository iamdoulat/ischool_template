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
    Pencil, Trash2, Plus,
    ChevronLeft, ChevronRight, FolderKanban,
    Search, LayoutList, FileStack,
    BarChart, CheckCircle2, ArrowLeft, Users, BookOpen, FileDigit, MessageSquare, Trophy, X, Send, Check,
    Link2, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/image-url";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
    school_class_id?: number | string | null;
    school_class?: { id: number; name: string } | null;
    section_id?: number | string | null;
    section?: { id: number; name: string } | null;
    roll_no_type?: string;
    session?: string;
    description?: string;
    is_published?: boolean;
    is_result_published?: boolean;
    subjects_count?: number;
    exam_schedules_count?: number;
    students_count?: number;
    exam_group?: { id: number; name: string } | null;
}

interface ExamGroup {
    id: string;
    name: string;
    exams_count: number;
    published_exams_count?: number;
    result_published_count?: number;
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
    photo?: string | null;
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
    const [studentFilterQuery, setStudentFilterQuery] = useState("");

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
interface ExamScheduleItem {
    id: number | string;
    subject_id?: number | string;
    subject?: { name: string };
    date_from?: string;
    start_time?: string;
    duration?: string | number;
    credit_hours?: string | number;
    room_no?: string;
    max_marks?: string | number;
    min_marks?: string | number;
}

interface ExamMarkStudentItem {
    id: number | string;
    admission_no?: string;
    name?: string;
    photo?: string | null;
    student_photo?: string | null;
    avatar?: string | null;
    image?: string | null;
    theory_marks?: string | number | null;
    practical_marks?: string | number | null;
    is_absent?: boolean;
}

interface ExamRemarkStudentItem {
    id: number | string;
    admission_no?: string;
    name?: string;
    photo?: string | null;
    student_photo?: string | null;
    avatar?: string | null;
    image?: string | null;
    note?: string;
    remarks?: string;
}

    const [managingGroup, setManagingGroup] = useState<ExamGroup | null>(null);

    // Exam Marks Modal State
    const [examMarksOpen, setExamMarksOpen] = useState(false);
    const [examMarksData, setExamMarksData] = useState<{ exam: Exam | null }>({ exam: null });
    const [examMarksSubjects, setExamMarksSubjects] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedMarksSubject, setSelectedMarksSubject] = useState<string>("");
    const [examMarksStudents, setExamMarksStudents] = useState<ExamMarkStudentItem[]>([]);
    const [marksLoading, setMarksLoading] = useState(false);
    const [marksSearchQuery, setMarksSearchQuery] = useState("");

    // Teacher Remarks Modal State
    const [teacherRemarksOpen, setTeacherRemarksOpen] = useState(false);
    const [remarksData, setRemarksData] = useState<{ exam: Exam | null }>({ exam: null });
    const [remarksStudents, setRemarksStudents] = useState<ExamRemarkStudentItem[]>([]);
    const [remarksLoading, setRemarksLoading] = useState(false);

    // Add Exam modal state
    const [addExamOpen, setAddExamOpen] = useState(false);
    const [editingExamId, setEditingExamId] = useState<number | null>(null);
    const [deleteExamId, setDeleteExamId] = useState<number | null>(null);
    const [addExamForm, setAddExamForm] = useState({
      name: "",
      school_class_id: "",
      section_id: "",
      session: "2026-27",
      is_published: false,
      is_result_published: false,
      roll_no_type: "admit_card",
      marksheet_template: "",
      description: "",
    });
    const [addExamSections, setAddExamSections] = useState<SectionItem[]>([]);

    // Link Exam modal state
    const [linkExamOpen, setLinkExamOpen] = useState(false);
    const [availableExams, setAvailableExams] = useState<Exam[]>([]);
    const [availableExamsLoading, setAvailableExamsLoading] = useState(false);
    const [linkExamSearch, setLinkExamSearch] = useState("");
    const [linkedExamSearch, setLinkedExamSearch] = useState("");
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

    // Fetch sections for Add/Edit Exam modal when school_class_id changes
    useEffect(() => {
        const fetchAddExamSections = async () => {
            if (!addExamForm.school_class_id || addExamForm.school_class_id === "all") {
                setAddExamSections([]);
                return;
            }
            try {
                const res = await api.get(`/academics/sections?school_class_id=${addExamForm.school_class_id}&no_paginate=true`);
                setAddExamSections(res.data?.data || res.data || []);
            } catch (error) {
                console.error("Failed to fetch sections for add exam", error);
            }
        };
        fetchAddExamSections();
    }, [addExamForm.school_class_id]);

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

    const handleOpenAddExam = () => {
        setEditingExamId(null);
        setAddExamForm({
            name: "",
            school_class_id: "",
            section_id: "",
            session: "2026-27",
            is_published: false,
            is_result_published: false,
            roll_no_type: "admit_card",
            marksheet_template: "",
            description: "",
        });
        setAddExamOpen(true);
    };

    const handleEditExam = (exam: Exam) => {
        setEditingExamId(exam.id);
        setAddExamForm({
            name: exam.name || "",
            school_class_id: exam.school_class_id ? String(exam.school_class_id) : "",
            section_id: exam.section_id ? String(exam.section_id) : "",
            session: exam.session || "2026-27",
            is_published: !!exam.is_published,
            is_result_published: !!exam.is_result_published,
            roll_no_type: exam.roll_no_type || "admit_card",
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
            const payload = {
                name: addExamForm.name,
                session: addExamForm.session,
                school_class_id: addExamForm.school_class_id && addExamForm.school_class_id !== "all" ? parseInt(addExamForm.school_class_id) : null,
                section_id: addExamForm.section_id && addExamForm.section_id !== "all" ? parseInt(addExamForm.section_id) : null,
                roll_no_type: addExamForm.roll_no_type,
                is_published: addExamForm.is_published,
                is_result_published: addExamForm.is_result_published,
                exam_group_id: managingGroup.id,
                marksheet_template_id: addExamForm.marksheet_template ? parseInt(addExamForm.marksheet_template) : null,
                description: addExamForm.description || "",
            };

            if (editingExamId) {
                await api.put(`/examination/exams/${editingExamId}`, payload);
                tt.success("exam_updated_successfully");
            } else {
                await api.post("/examination/exams", payload);
                tt.success("exam_created_successfully");
            }
            setAddExamOpen(false);
            setEditingExamId(null);
            handleManageExams(managingGroup); // refresh
        } catch {
            tt.error(editingExamId ? "failed_to_update_exam" : "failed_to_create_exam");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleExamPublish = async (exam: Exam, field: 'is_published' | 'is_result_published') => {
        try {
            const nextVal = !exam[field];
            await api.put(`/examination/exams/${exam.id}`, {
                name: exam.name,
                session: exam.session,
                exam_group_id: managingGroup?.id,
                marksheet_template_id: exam.marksheet_template_id || null,
                is_published: field === 'is_published' ? nextVal : !!exam.is_published,
                is_result_published: field === 'is_result_published' ? nextVal : !!exam.is_result_published,
                description: exam.description || "",
            });
            tt.success(nextVal ? "published_successfully" : "unpublished_successfully");
            if (managingGroup) handleManageExams(managingGroup);
        } catch {
            tt.error("failed_to_update_exam");
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

    const fetchAvailableExams = useCallback(async () => {
        setAvailableExamsLoading(true);
        try {
            const res = await api.get('/examination/exams', { params: { per_page: 200 } });
            const list = res.data?.data?.data || res.data?.data || res.data || [];
            const allExams: Exam[] = Array.isArray(list) ? list : [];
            // Filter out exams that are already assigned to the current managingGroup
            const unassignedOrOther = allExams.filter(
                (e: Exam) => !managingGroup || e.exam_group_id !== managingGroup.id
            );
            setAvailableExams(unassignedOrOther);
        } catch (error) {
            console.error(error);
            setAvailableExams([]);
        } finally {
            setAvailableExamsLoading(false);
        }
    }, [managingGroup]);

    const handleOpenLinkExam = () => {
        setExamWeightages({});
        setLinkExamSearch("");
        setLinkExamOpen(true);
        fetchAvailableExams();
    };

    const handleLinkExams = async () => {
        if (!managingGroup) return;
        const selectedExams = Object.keys(examWeightages).map(Number);
        if (selectedExams.length === 0) {
            tt.error("please_select_at_least_one_exam");
            return;
        }

        setSubmitting(true);
        try {
            await api.post("/examination/exams/link", {
                exam_group_id: managingGroup.id,
                exam_ids: selectedExams,
            });
            tt.success("exams_linked_successfully");
            setLinkExamOpen(false);
            setExamWeightages({});
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
            if (isSelected) {
                newWeightages[examId] = newWeightages[examId] || "100.00";
            } else {
                delete newWeightages[examId];
            }
            return newWeightages;
        });
    };

    const updateExamWeightage = (examId: number, weightage: string) => {
        setExamWeightages(prev => ({ ...prev, [examId]: weightage }));
    };

    const filteredAvailableExams = availableExams.filter((exam) => {
        if (!linkExamSearch.trim()) return true;
        const q = linkExamSearch.toLowerCase().trim();
        return (
            exam.name.toLowerCase().includes(q) ||
            (exam.session && exam.session.toLowerCase().includes(q)) ||
            (exam.exam_group?.name && exam.exam_group.name.toLowerCase().includes(q)) ||
            (exam.description && exam.description.toLowerCase().includes(q))
        );
    });

    const handleToggleSelectAllAvailable = () => {
        const filteredIds = filteredAvailableExams.map(e => e.id);
        const allSelected = filteredIds.length > 0 && filteredIds.every(id => examWeightages[id] !== undefined);

        if (allSelected) {
            setExamWeightages(prev => {
                const next = { ...prev };
                filteredIds.forEach(id => delete next[id]);
                return next;
            });
        } else {
            setExamWeightages(prev => {
                const next = { ...prev };
                filteredIds.forEach(id => {
                    if (next[id] === undefined) next[id] = "100.00";
                });
                return next;
            });
        }
    };

    const handleOpenAssignStudent = async (examId: number) => {
        setAssignExamId(examId);
        setAssignFilters({ class_id: "", section_id: "" });
        setAssignStudents([]);
        setStudentFilterQuery("");
        
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
                student_photo?: string;
                photo?: string;
                avatar?: string;
                image?: string;
            }) => ({
                id: s.id,
                admission_no: s.admission_no || "-",
                name: `${s.first_name || ""} ${s.last_name || ""}`.trim(),
                father_name: s.father_name || "-",
                category: s.category
                    ? (studentCategories[Number(s.category)] || String(s.category))
                    : "-",
                gender: s.gender || "-",
                photo: s.student_photo || s.photo || s.avatar || s.image || null,
                assigned: selectedStudents.includes(s.id)
            }));

            setAssignStudents(mappedStudents);
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

    const filteredAssignStudents = assignStudents.filter(student => {
        if (!studentFilterQuery.trim()) return true;
        const q = studentFilterQuery.toLowerCase().trim();
        return (
            student.name.toLowerCase().includes(q) ||
            student.admission_no.toLowerCase().includes(q) ||
            student.father_name.toLowerCase().includes(q) ||
            student.category.toLowerCase().includes(q) ||
            student.gender.toLowerCase().includes(q)
        );
    });

    const isAllFilteredSelected = filteredAssignStudents.length > 0 && filteredAssignStudents.every(s => selectedStudents.includes(s.id));

    const handleToggleAllStudents = () => {
        if (selectedStudents.length === assignStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(assignStudents.map(s => s.id));
        }
    };

    const handleToggleAllFilteredStudents = () => {
        const targetIds = filteredAssignStudents.map(s => s.id);
        if (targetIds.length === 0) return;
        if (isAllFilteredSelected) {
            setSelectedStudents(prev => prev.filter(id => !targetIds.includes(id)));
        } else {
            setSelectedStudents(prev => Array.from(new Set([...prev, ...targetIds])));
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

        if (academicSubjects.length === 0) {
            try {
                const subRes = await api.get('/academics/subjects?no_paginate=true');
                setAcademicSubjects(subRes.data?.data || subRes.data || []);
            } catch {
                // Ignore
            }
        }

        try {
            const res = await api.post(`/examination/exam-schedules/search`, { exam_id: exam.id });
            const schedules: ExamScheduleItem[] = res.data || [];
            const todayStr = new Date().toISOString().split("T")[0];

            if (schedules.length > 0) {
                setExamSubjectRows(schedules.map((s: ExamScheduleItem) => ({
                    id: s.id.toString(),
                    subject: s.subject_id?.toString() || "",
                    date: s.date_from ? s.date_from.split('T')[0] : todayStr,
                    start_time: s.start_time || "10:00:00",
                    duration: s.duration?.toString() || "60",
                    credit_hours: s.credit_hours?.toString() || "1.00",
                    room_no: s.room_no || "101",
                    marks_max: s.max_marks?.toString() || "100.00",
                    marks_min: s.min_marks?.toString() || "33.00"
                })));
            } else {
                setExamSubjectRows([
                    { id: Date.now().toString(), subject: "", date: todayStr, start_time: "10:00:00", duration: "60", credit_hours: "1.00", room_no: "101", marks_max: "100.00", marks_min: "33.00" }
                ]);
            }
        } catch (error) {
            console.error(error);
            const todayStr = new Date().toISOString().split("T")[0];
            setExamSubjectRows([
                { id: Date.now().toString(), subject: "", date: todayStr, start_time: "10:00:00", duration: "60", credit_hours: "1.00", room_no: "101", marks_max: "100.00", marks_min: "33.00" }
            ]);
        }
    };

    const handleAddExamSubjectRow = () => {
        const todayStr = new Date().toISOString().split("T")[0];
        setExamSubjectRows([...examSubjectRows, { id: Date.now().toString(), subject: "", date: todayStr, start_time: "10:00:00", duration: "60", credit_hours: "1.00", room_no: "101", marks_max: "100.00", marks_min: "33.00" }]);
    };

    const handleRemoveExamSubjectRow = (id: string) => {
        setExamSubjectRows(examSubjectRows.filter(r => r.id !== id));
    };

    const handleUpdateExamSubjectRow = (id: string, field: keyof ExamSubjectRow, value: string) => {
        setExamSubjectRows(examSubjectRows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSaveExamSubjects = async () => {
        if (!examSubjectData.exam) return;
        const validRows = examSubjectRows.filter(r => r.subject && r.subject !== "none");
        if (validRows.length === 0) {
            tt.error("please_select_at_least_one_subject");
            return;
        }

        setSubmitting(true);
        try {
            const payload = validRows.map(r => ({
                subject_id: parseInt(r.subject),
                date_from: r.date || null,
                start_time: r.start_time || null,
                duration: r.duration || null,
                credit_hours: r.credit_hours || null,
                room_no: r.room_no || null,
                max_marks: r.marks_max ? parseFloat(r.marks_max) : 100,
                min_marks: r.marks_min ? parseFloat(r.marks_min) : 33,
            }));

            await api.post(`/examination/exam-schedules`, {
                exam_id: examSubjectData.exam.id,
                schedules: payload
            });
            
            tt.success("exam_subjects_saved_successfully");
            setExamSubjectOpen(false);
            if (managingGroup) handleManageExams(managingGroup);
        } catch {
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
        setMarksSearchQuery("");
        setExamMarksOpen(true);

        try {
            const res = await api.post(`/examination/exam-schedules/search`, { exam_id: exam.id });
            const schedules: ExamScheduleItem[] = res.data || [];
            // Map schedules to include subject details
            const subjectsList = schedules.map((s: ExamScheduleItem) => ({
                id: s.subject_id?.toString() || "",
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

    const handleUpdateStudentMark = (studentId: number | string, field: 'theory_marks' | 'practical_marks' | 'is_absent', value: string | boolean) => {
        setExamMarksStudents(prev => prev.map(s => s.id === studentId ? { ...s, [field]: value } : s));
    };

    const filteredMarksStudents = examMarksStudents.filter(s => {
        if (!marksSearchQuery.trim()) return true;
        const q = marksSearchQuery.toLowerCase().trim();
        return (
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.admission_no && s.admission_no.toLowerCase().includes(q))
        );
    });

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
        const filteredLinkedExams = (managingGroup.exams || []).filter(exam =>
            exam.name.toLowerCase().includes(linkedExamSearch.toLowerCase()) ||
            (exam.session && exam.session.toLowerCase().includes(linkedExamSearch.toLowerCase())) ||
            (exam.description && exam.description.toLowerCase().includes(linkedExamSearch.toLowerCase()))
        );

        return (
            <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
                {/* Back navigation */}
                <Button variant="ghost" onClick={() => { setManagingGroup(null); fetchGroups(); }} className="-ml-3 text-gray-500 hover:text-indigo-600 gap-2 font-bold text-[11px] uppercase tracking-widest cursor-pointer">
                    <ArrowLeft className="h-4 w-4" /> {t("back_to_groups")}
                </Button>

                {/* Header Section */}
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden py-0 gap-0 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F4FF] to-[#EFF0FD] w-full border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                <FolderKanban className="h-4 w-4" />
                            </span>
                            <div>
                                <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">
                                    {t("exam_group")}: {managingGroup.name}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1 font-normal">
                                    <span className="font-semibold text-slate-700">{managingGroup.exam_type}</span>
                                    {managingGroup.description ? ` · ${managingGroup.description}` : ""}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                onClick={handleOpenLinkExam} 
                                className="h-9 px-3.5 rounded-lg border-gray-200 bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 font-semibold text-xs tracking-tight gap-1.5 shadow-2xs transition-all cursor-pointer"
                            >
                                <Link2 className="h-3.5 w-3.5" /> {t("link_exam")}
                            </Button>
                            <Button 
                                onClick={handleOpenAddExam} 
                                className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white font-semibold text-xs tracking-tight gap-1.5 shadow-md shadow-indigo-100 transition-all active:scale-95 cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5" /> {t("add_exam")}
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Sub-table */}
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden py-0 gap-0 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F4FF] to-[#EFF0FD] w-full border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                <FileStack className="h-4 w-4" />
                            </span>
                            <div>
                                <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">
                                    {t("linked_exams")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1 font-normal">
                                    {filteredLinkedExams.length} {t("exams_in_this_group", { defaultValue: "exams in this group" })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative w-48 sm:w-60">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    placeholder={t("search_exams", { defaultValue: "Search exams..." })}
                                    value={linkedExamSearch}
                                    onChange={(e) => setLinkedExamSearch(e.target.value)}
                                    className="pl-8.5 h-8.5 text-xs rounded-lg border-slate-200 bg-white focus:bg-white focus:ring-indigo-500 transition-all shadow-2xs"
                                />
                                {linkedExamSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setLinkedExamSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="!bg-[#f8fafc]">
                                <TableRow className="border-b border-gray-200 shadow-2xs">
                                    <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-3 px-4">{t("name")}</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-3 px-4">{t("class_section", { defaultValue: "Class (Section)" })}</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-3 px-4">{t("session")}</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-3 px-4 text-center">{t("subjects_included")}</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-3 px-4 text-center">{t("publish_exam")}</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-3 px-4 text-center">{t("publish_result")}</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-3 px-4">{t("description")}</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-700 uppercase tracking-wider py-3 px-4 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100">
                                {loading ? (
                                    <TableSkeleton rows={4} cols={8} />
                                ) : filteredLinkedExams.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="px-4 py-12 text-center text-xs font-semibold text-gray-400">
                                            {linkedExamSearch ? t("no_matching_exams_found", { defaultValue: "No exams match your search" }) : t("no_data_found")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLinkedExams.map(exam => (
                                        <TableRow key={exam.id} className="text-xs text-gray-600 hover:bg-indigo-50/30 transition-colors">
                                            <TableCell className="font-semibold text-gray-800 py-3.5 px-4">
                                                <div className="flex flex-col">
                                                    <span>{exam.name}</span>
                                                    {exam.marksheet_template?.name && (
                                                        <span className="text-[10px] text-gray-400 font-normal">
                                                            {t("template")}: {exam.marksheet_template.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 font-medium">
                                                {exam.school_class?.name ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                        {exam.school_class.name}
                                                        {exam.section?.name ? ` (${exam.section.name})` : ""}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-[11px] italic">
                                                        {t("all_classes", { defaultValue: "All Classes" })}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4">{exam.session || "-"}</TableCell>
                                            <TableCell className="py-3.5 px-4 text-center">
                                                <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                                                    {exam.subjects_count || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleExamPublish(exam, 'is_published')}
                                                    title={exam.is_published ? t("click_to_unpublish_exam") : t("click_to_publish_exam")}
                                                    className="inline-flex items-center justify-center p-1 rounded-full hover:bg-emerald-50 transition-all cursor-pointer"
                                                >
                                                    {exam.is_published ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                    ) : (
                                                        <span className="h-4 w-4 rounded-full border-2 border-gray-300 inline-block hover:border-emerald-400" />
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleExamPublish(exam, 'is_result_published')}
                                                    title={exam.is_result_published ? t("click_to_unpublish_result") : t("click_to_publish_result")}
                                                    className="inline-flex items-center justify-center p-1 rounded-full hover:bg-emerald-50 transition-all cursor-pointer"
                                                >
                                                    {exam.is_result_published ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                    ) : (
                                                        <span className="h-4 w-4 rounded-full border-2 border-gray-300 inline-block hover:border-emerald-400" />
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 max-w-[180px] truncate text-gray-500">{exam.description || "-"}</TableCell>
                                            <TableCell className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="icon" variant="ghost" title={t("assign_view_student")} onClick={() => handleOpenAssignStudent(exam.id)} className="h-8 w-8 text-blue-500 hover:text-white hover:bg-blue-500 rounded-lg cursor-pointer transition-colors">
                                                        <Users className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("exam_subject")} onClick={() => handleOpenExamSubject(exam)} className="h-8 w-8 text-indigo-500 hover:text-white hover:bg-indigo-500 rounded-lg cursor-pointer transition-colors">
                                                        <BookOpen className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("exam_marks")} onClick={() => handleOpenExamMarks(exam)} className="h-8 w-8 text-purple-500 hover:text-white hover:bg-purple-500 rounded-lg cursor-pointer transition-colors">
                                                        <FileDigit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("teacher_remarks")} onClick={() => handleOpenTeacherRemarks(exam)} className="h-8 w-8 text-pink-500 hover:text-white hover:bg-pink-500 rounded-lg cursor-pointer transition-colors">
                                                        <MessageSquare className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("generate_rank")} onClick={() => handleGenerateRank(exam)} disabled={submitting} className="h-8 w-8 text-amber-500 hover:text-white hover:bg-amber-500 rounded-lg disabled:opacity-50 cursor-pointer transition-colors">
                                                        <Trophy className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("edit_exam")} onClick={() => handleEditExam(exam)} className="h-8 w-8 text-amber-600 hover:text-white hover:bg-amber-500 rounded-lg cursor-pointer transition-colors">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("delete_exam")} onClick={() => setDeleteExamId(exam.id)} className="h-8 w-8 text-red-500 hover:text-white hover:bg-red-500 rounded-lg cursor-pointer transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" />
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

                {/* Add / Edit Exam Modal */}
                <Dialog open={addExamOpen} onOpenChange={setAddExamOpen}>
                    <DialogContent showCloseButton={false} className="sm:max-w-[700px] w-[95vw] max-h-[92vh] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white flex flex-col focus:outline-none">
                        {/* Modal Header */}
                        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex flex-row items-center justify-between relative shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white shadow-xs flex items-center justify-center">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <DialogTitle className="text-base font-bold tracking-tight text-white leading-none">
                                            {editingExamId ? t("edit_exam") : t("add_exam")}
                                        </DialogTitle>
                                        {managingGroup && (
                                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-xs">
                                                {managingGroup.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-white/85 mt-1 font-normal">
                                        {editingExamId 
                                            ? t("update_exam_details_description", { defaultValue: "Update examination configurations, class, section, and publication rules" })
                                            : t("create_exam_description", { defaultValue: "Configure a new examination with class, section, and marksheet templates" })
                                        }
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAddExamOpen(false)}
                                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </DialogHeader>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto bg-slate-50/40">
                            {/* Exam Name & Session */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-xs font-bold text-gray-700">
                                        {t("exam_name", { defaultValue: "Exam Name" })} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={addExamForm.name}
                                        onChange={(e) => setAddExamForm({ ...addExamForm, name: e.target.value })}
                                        placeholder="e.g. Mid-Term Examination 2026"
                                        className="h-10 text-xs border-gray-200 bg-white rounded-lg focus:ring-indigo-500 shadow-2xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">
                                        {t("session")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={addExamForm.session} onValueChange={(val) => setAddExamForm({ ...addExamForm, session: val })}>
                                        <SelectTrigger className="h-10 text-xs border-gray-200 bg-white rounded-lg focus:ring-indigo-500 shadow-2xs w-full">
                                            <SelectValue placeholder="2026-27" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2024-25">2024-25</SelectItem>
                                            <SelectItem value="2025-26">2025-26</SelectItem>
                                            <SelectItem value="2026-27">2026-27</SelectItem>
                                            <SelectItem value="2027-28">2027-28</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Class & Section Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">
                                        {t("class")}
                                    </Label>
                                    <Select 
                                        value={addExamForm.school_class_id || "all"} 
                                        onValueChange={(val) => setAddExamForm({ ...addExamForm, school_class_id: val === "all" ? "" : val, section_id: "" })}
                                    >
                                        <SelectTrigger className="h-10 text-xs border-gray-200 bg-white rounded-lg focus:ring-indigo-500 shadow-2xs w-full">
                                            <SelectValue placeholder={t("all_classes", { defaultValue: "All Classes / General" })} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t("all_classes", { defaultValue: "All Classes (General)" })}</SelectItem>
                                            {classes.map((cls) => (
                                                <SelectItem key={cls.id} value={String(cls.id)}>
                                                    {cls.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">
                                        {t("section")}
                                    </Label>
                                    <Select 
                                        value={addExamForm.section_id || "all"} 
                                        onValueChange={(val) => setAddExamForm({ ...addExamForm, section_id: val === "all" ? "" : val })}
                                        disabled={!addExamForm.school_class_id || addExamForm.school_class_id === "all"}
                                    >
                                        <SelectTrigger className="h-10 text-xs border-gray-200 bg-white rounded-lg focus:ring-indigo-500 shadow-2xs w-full disabled:bg-gray-100 disabled:opacity-60">
                                            <SelectValue placeholder={!addExamForm.school_class_id || addExamForm.school_class_id === "all" ? t("select_class_first", { defaultValue: "Select Class First" }) : t("all_sections", { defaultValue: "All Sections" })} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t("all_sections", { defaultValue: "All Sections" })}</SelectItem>
                                            {addExamSections.map((sec) => (
                                                <SelectItem key={sec.id} value={String(sec.id)}>
                                                    {sec.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Marksheet Template */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-gray-700">
                                        {t("marksheet_template")} <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        {addExamForm.marksheet_template && (() => {
                                            const tpl = marksheetTemplates.find(t => String(t.id) === addExamForm.marksheet_template);
                                            return tpl ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenRenameTemplate(tpl)}
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                                                >
                                                    {t("rename")}
                                                </button>
                                            ) : null;
                                        })()}
                                        <button
                                            type="button"
                                            onClick={handleOpenAddTemplate}
                                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                                        >
                                            <Plus className="h-3 w-3" />{t("add_new")}
                                        </button>
                                    </div>
                                </div>
                                <Select value={addExamForm.marksheet_template} onValueChange={(val) => setAddExamForm({ ...addExamForm, marksheet_template: val })}>
                                    <SelectTrigger className="h-10 text-xs border-gray-200 bg-white rounded-lg focus:ring-indigo-500 shadow-2xs w-full">
                                        <SelectValue placeholder={t("select_marksheet_template", { defaultValue: "Select Marksheet Template" })} />
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

                            {/* Publishing & Roll No Settings Card */}
                            <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs space-y-3.5">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    {t("exam_settings_and_publishing", { defaultValue: "Exam Settings & Publication" })}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Publish Exam */}
                                    <label className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                        addExamForm.is_published ? "border-emerald-200 bg-emerald-50/40 text-emerald-950" : "border-gray-200 bg-gray-50/40 text-gray-700"
                                    )}>
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold">{t("publish_exam")}</div>
                                            <div className="text-[10px] text-gray-500">{t("visible_to_students_teachers", { defaultValue: "Exam schedule visible in portal" })}</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={addExamForm.is_published}
                                            onChange={(e) => setAddExamForm({ ...addExamForm, is_published: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        />
                                    </label>

                                    {/* Publish Result */}
                                    <label className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                        addExamForm.is_result_published ? "border-emerald-200 bg-emerald-50/40 text-emerald-950" : "border-gray-200 bg-gray-50/40 text-gray-700"
                                    )}>
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold">{t("publish_result")}</div>
                                            <div className="text-[10px] text-gray-500">{t("marksheet_visible_in_portal", { defaultValue: "Results and ranks visible to students" })}</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={addExamForm.is_result_published}
                                            onChange={(e) => setAddExamForm({ ...addExamForm, is_result_published: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        />
                                    </label>
                                </div>

                                {/* Roll No Type */}
                                <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-gray-700">{t("roll_number_type", { defaultValue: "Roll Number Type" })}:</span>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                                            <input
                                                type="radio"
                                                name="roll_no_type"
                                                value="admit_card"
                                                checked={addExamForm.roll_no_type === 'admit_card'}
                                                onChange={(e) => setAddExamForm({ ...addExamForm, roll_no_type: e.target.value })}
                                                className="border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span>{t("admit_card_roll_no")}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                                            <input
                                                type="radio"
                                                name="roll_no_type"
                                                value="profile"
                                                checked={addExamForm.roll_no_type === 'profile'}
                                                onChange={(e) => setAddExamForm({ ...addExamForm, roll_no_type: e.target.value })}
                                                className="border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span>{t("profile_roll_no")}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">{t("description")}</Label>
                                <Textarea 
                                    value={addExamForm.description} 
                                    onChange={(e) => setAddExamForm({ ...addExamForm, description: e.target.value })} 
                                    placeholder={t("optional_exam_notes_or_guidelines", { defaultValue: "Enter any exam notes, room guidelines, or instructions..." })}
                                    className="min-h-[80px] text-xs border-gray-200 bg-white rounded-lg focus:ring-indigo-500 shadow-2xs resize-none p-3" 
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <DialogFooter className="px-6 py-3.5 border-t border-gray-200 flex flex-row items-center justify-end gap-2 bg-white shrink-0">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setAddExamOpen(false)} 
                                className="h-9 px-4 rounded-lg text-xs font-bold border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                                {t("cancel")}
                            </Button>
                            <Button 
                                onClick={handleSaveExam} 
                                disabled={submitting} 
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-all text-white h-9 px-6 rounded-lg font-bold text-xs shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            >
                                {submitting ? t("saving") : t("save")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Link Exam Modal */}
                <Dialog open={linkExamOpen} onOpenChange={setLinkExamOpen}>
                    <DialogContent showCloseButton={false} className="sm:max-w-[780px] w-[95vw] max-h-[90vh] h-[85vh] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white flex flex-col focus:outline-none">
                        {/* Header */}
                        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex flex-row items-center justify-between relative shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white shadow-xs flex items-center justify-center">
                                    <Link2 className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <DialogTitle className="text-base font-bold tracking-tight text-white leading-none">
                                            {t("link_exam")}
                                        </DialogTitle>
                                        {managingGroup && (
                                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-xs">
                                                {t("target_group")}: {managingGroup.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-white/85 mt-1 font-normal">
                                        {t("link_exams_description", { defaultValue: "Select available examinations from other groups or sessions to link into this group and assign weightages" })}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setLinkExamOpen(false)}
                                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </DialogHeader>

                        {/* Top Filters & Controls Bar */}
                        <div className="p-5 pb-3 space-y-3 shrink-0 bg-slate-50/60 border-b border-gray-200/70">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder={t("search_exams_to_link", { defaultValue: "Search by exam name, session, or group..." })}
                                        value={linkExamSearch}
                                        onChange={(e) => setLinkExamSearch(e.target.value)}
                                        className="pl-9 h-9 text-xs border-gray-200 bg-white rounded-lg focus:ring-indigo-500 shadow-2xs"
                                    />
                                    {linkExamSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setLinkExamSearch("")}
                                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleToggleSelectAllAvailable}
                                        disabled={filteredAvailableExams.length === 0}
                                        className="h-9 px-3 text-xs rounded-lg border-gray-200 bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-2xs font-semibold cursor-pointer"
                                    >
                                        {filteredAvailableExams.length > 0 && filteredAvailableExams.every(e => examWeightages[e.id] !== undefined)
                                            ? t("deselect_all", { defaultValue: "Deselect All" })
                                            : t("select_all", { defaultValue: "Select All" })}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchAvailableExams}
                                        disabled={availableExamsLoading}
                                        title={t("refresh")}
                                        className="h-9 w-9 p-0 rounded-lg border-gray-200 bg-white text-gray-600 hover:bg-gray-100 shadow-2xs cursor-pointer"
                                    >
                                        <RefreshCw className={cn("h-3.5 w-3.5", availableExamsLoading && "animate-spin text-indigo-600")} />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                        {filteredAvailableExams.length} {t("available_exams", { defaultValue: "Available Exams" })}
                                    </span>
                                    {Object.keys(examWeightages).length > 0 && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                            {Object.keys(examWeightages).length} {t("selected", { defaultValue: "Selected" })}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] text-gray-400">
                                    {t("click_row_or_checkbox_to_select", { defaultValue: "Click row or checkbox to select exam" })}
                                </span>
                            </div>
                        </div>

                        {/* Scrollable Table Area */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-5 bg-slate-50/30">
                            <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-[#f8fafc] sticky top-0 z-10 border-b border-gray-200 shadow-2xs">
                                        <tr>
                                            <th className="py-3 px-4 w-12 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={filteredAvailableExams.length > 0 && filteredAvailableExams.every(e => examWeightages[e.id] !== undefined)}
                                                    onChange={handleToggleSelectAllAvailable}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px]">{t("exam")}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px]">{t("current_group", { defaultValue: "Current Group" })}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px] w-36">{t("weightage", { defaultValue: "Weightage (%)" })}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {availableExamsLoading ? (
                                            <TableSkeleton rows={5} cols={4} />
                                        ) : filteredAvailableExams.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-16">
                                                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
                                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-inner">
                                                            <Link2 className="h-6 w-6 opacity-80" />
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-700">
                                                            {availableExams.length === 0 
                                                                ? t("no_available_exams_to_link", { defaultValue: "No other examinations found to link" })
                                                                : t("no_matching_exams_found", { defaultValue: "No examinations match your search query" })}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 max-w-sm text-center">
                                                            {availableExams.length === 0
                                                                ? t("all_existing_exams_already_in_group", { defaultValue: "All created exams are already assigned to this group, or create new exams first." })
                                                                : t("try_searching_different_keyword", { defaultValue: "Try adjusting your search keyword." })}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAvailableExams.map((exam) => {
                                                const isSelected = examWeightages[exam.id] !== undefined;
                                                return (
                                                    <tr
                                                        key={exam.id}
                                                        onClick={() => toggleExamSelection(exam.id, !isSelected)}
                                                        className={cn(
                                                            "transition-all duration-150 cursor-pointer select-none",
                                                            isSelected
                                                                ? "bg-indigo-50/70 hover:bg-indigo-50/90 font-medium"
                                                                : "hover:bg-gray-50/80 text-gray-700"
                                                        )}
                                                    >
                                                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => toggleExamSelection(exam.id, e.target.checked)}
                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                                                                    {exam.name}
                                                                    {exam.session && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                                            {exam.session}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                {exam.description && (
                                                                    <span className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                                                                        {exam.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {exam.exam_group?.name ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                                                                    <FolderKanban className="h-3 w-3" />
                                                                    {exam.exam_group.name}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                                                    {t("unlinked", { defaultValue: "Unassigned" })}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                            <div className="relative flex items-center">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max="100"
                                                                    value={examWeightages[exam.id] ?? ""}
                                                                    placeholder="100.00"
                                                                    disabled={!isSelected}
                                                                    onChange={(e) => updateExamWeightage(exam.id, e.target.value)}
                                                                    className={cn(
                                                                        "h-8.5 text-xs pr-7 rounded-lg border-gray-200 bg-white font-mono shadow-2xs focus:ring-indigo-500",
                                                                        !isSelected && "bg-gray-100/60 opacity-50 cursor-not-allowed"
                                                                    )}
                                                                />
                                                                <span className="absolute right-2.5 text-xs text-gray-400 pointer-events-none font-semibold">
                                                                    %
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <DialogFooter className="px-6 py-3.5 border-t border-gray-200 flex flex-row items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                    <span>
                                        {Object.keys(examWeightages).length} {t("exams_selected_to_link", { defaultValue: "Exams Selected" })}
                                    </span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setExamWeightages({})}
                                    disabled={Object.keys(examWeightages).length === 0}
                                    className="h-9 px-3.5 rounded-lg text-xs font-bold border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer shadow-2xs"
                                >
                                    {t("reset_link_exam")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setLinkExamOpen(false)}
                                    className="h-9 px-4 rounded-lg text-xs font-bold border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer shadow-2xs"
                                >
                                    {t("cancel")}
                                </Button>
                                <Button
                                    onClick={handleLinkExams}
                                    disabled={submitting || Object.keys(examWeightages).length === 0}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white h-9 px-6 rounded-lg font-bold text-xs shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                                >
                                    {submitting ? (
                                        <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full mr-1" />
                                    ) : (
                                        <Link2 className="h-3.5 w-3.5" />
                                    )}
                                    {submitting ? t("linking", { defaultValue: "Linking..." }) : t("link_selected_exams", { defaultValue: "Link Selected Exams" })}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assign / View Student Modal */}
                <Dialog open={assignStudentOpen} onOpenChange={setAssignStudentOpen}>
                    <DialogContent showCloseButton={false} className="sm:max-w-[1300px] w-[95vw] max-h-[92vh] h-[86vh] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white flex flex-col focus:outline-none">
                        {/* Header */}
                        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex flex-row items-center justify-between relative shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white shadow-xs flex items-center justify-center">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-base font-bold tracking-tight text-white leading-none">
                                            {t("exam_students")}
                                        </DialogTitle>
                                        {(() => {
                                            const activeExam = managingGroup?.exams?.find(e => e.id === assignExamId);
                                            return activeExam ? (
                                                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-xs">
                                                    {activeExam.name}
                                                </span>
                                            ) : null;
                                        })()}
                                    </div>
                                    <p className="text-[11px] text-white/85 mt-1 font-normal">
                                        {t("filter_and_assign_students_description", { defaultValue: "Select class and section to filter, assign or unassign students to this exam" })}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAssignStudentOpen(false)}
                                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </DialogHeader>

                        {/* Content Area */}
                        <div className="p-5 space-y-4 flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-50/40">
                            {/* Filter Bar */}
                            <div className="p-4 rounded-xl bg-white border border-gray-200/80 shadow-xs space-y-3 shrink-0">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                    <div className="sm:col-span-4 space-y-1.5">
                                        <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                            {t("class")} <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={assignFilters.class_id} onValueChange={(v) => setAssignFilters({...assignFilters, class_id: v, section_id: ""})}>
                                            <SelectTrigger className="h-10 border-gray-200 bg-gray-50/50 rounded-lg text-xs font-medium focus:ring-indigo-500 shadow-none">
                                                <SelectValue placeholder={t("select_class")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map(c => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>{c.class || c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="sm:col-span-4 space-y-1.5">
                                        <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                            {t("section")} <span className="text-red-500">*</span>
                                        </Label>
                                        <Select disabled={!assignFilters.class_id} value={assignFilters.section_id} onValueChange={(v) => setAssignFilters({...assignFilters, section_id: v})}>
                                            <SelectTrigger className="h-10 border-gray-200 bg-gray-50/50 rounded-lg text-xs font-medium focus:ring-indigo-500 shadow-none disabled:opacity-50">
                                                <SelectValue placeholder={t("select_section")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sections.map(s => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.section || s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="sm:col-span-4 flex items-center gap-2">
                                        <Button 
                                            onClick={handleSearchStudents} 
                                            disabled={assignLoading || !assignFilters.class_id || !assignFilters.section_id} 
                                            className="h-10 px-5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white rounded-lg text-xs font-bold gap-2 shadow-sm transition-all active:scale-95 flex-1 cursor-pointer"
                                        >
                                            <Search className="h-4 w-4" />
                                            {assignLoading ? t("searching") : t("search_students", { defaultValue: "Search Students" })}
                                        </Button>
                                    </div>
                                </div>

                                {/* Search inside loaded students & quick action toolbar */}
                                {assignStudents.length > 0 && (
                                    <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="relative flex-1 max-w-md">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder={t("filter_students_by_name_or_admission_no", { defaultValue: "Filter students by name, admission no..." })}
                                                value={studentFilterQuery}
                                                onChange={(e) => setStudentFilterQuery(e.target.value)}
                                                className="pl-9 h-9 text-xs border-gray-200 bg-gray-50/50 rounded-lg focus:ring-indigo-500 shadow-none"
                                            />
                                            {studentFilterQuery && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => setStudentFilterQuery("")}
                                                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleToggleAllFilteredStudents}
                                                className="h-8 text-xs font-medium border-gray-200 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer"
                                            >
                                                <Check className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                                                {isAllFilteredSelected ? t("deselect_all_filtered", { defaultValue: "Deselect Filtered" }) : t("select_all_filtered", { defaultValue: "Select All Filtered" })}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedStudents([])}
                                                disabled={selectedStudents.length === 0}
                                                className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                {t("clear_selection", { defaultValue: "Clear All" })}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modern Vertical Scrolling Students Table */}
                            <div className="flex-1 overflow-y-auto min-h-0 rounded-xl border border-gray-200/90 bg-white shadow-xs">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-[#f8fafc] sticky top-0 z-10 border-b border-gray-200 shadow-xs">
                                        <tr>
                                            <th className="py-3 px-4 font-bold text-gray-700 w-16 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={assignStudents.length > 0 && filteredAssignStudents.length > 0 && isAllFilteredSelected}
                                                    onChange={handleToggleAllFilteredStudents}
                                                    disabled={assignStudents.length === 0}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px]">{t("admission_no")}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px]">{t("student_name")}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px]">{t("father_name")}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px]">{t("category")}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px]">{t("gender")}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px] text-center">{t("status", { defaultValue: "Status" })}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {assignLoading ? (
                                            <TableSkeleton rows={8} cols={7} />
                                        ) : assignStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-16">
                                                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
                                                        <Users className="h-10 w-10 text-gray-300 stroke-[1.5]" />
                                                        <p className="text-xs font-semibold text-gray-500">
                                                            {t("please_select_class_and_section_to_search_students")}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400">
                                                            {t("select_class_section_hint", { defaultValue: "Choose class and section above, then click Search to view and manage students" })}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredAssignStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-12 text-gray-400 text-xs italic">
                                                    {t("no_matching_students_found", { defaultValue: "No students match your filter criteria" })}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAssignStudents.map((student) => {
                                                const isSelected = selectedStudents.includes(student.id);
                                                return (
                                                    <tr
                                                        key={student.id}
                                                        onClick={() => handleToggleStudent(student.id)}
                                                        className={cn(
                                                            "transition-colors duration-150 cursor-pointer select-none",
                                                            isSelected 
                                                                ? "bg-indigo-50/60 hover:bg-indigo-50/85 font-medium" 
                                                                : "hover:bg-gray-50/80 text-gray-600"
                                                        )}
                                                    >
                                                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleToggleStudent(student.id)}
                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 font-mono font-semibold text-indigo-600">
                                                            {student.admission_no}
                                                        </td>
                                                        <td className="py-3 px-4 font-semibold text-gray-800">
                                                            <div className="flex items-center gap-2.5">
                                                                <Avatar className="h-8 w-8 rounded-full border border-indigo-100 shrink-0 shadow-2xs">
                                                                    <AvatarImage
                                                                        src={getImageUrl(student.photo || student.student_photo || student.avatar || student.image)}
                                                                        alt={student.name}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                    <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">
                                                                        {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-semibold text-gray-800 leading-tight">
                                                                    {student.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-500">
                                                            {student.father_name || "-"}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-500">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                                {student.category || "-"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-500">
                                                            <span className={cn(
                                                                "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize",
                                                                student.gender?.toLowerCase() === 'female' 
                                                                    ? "bg-pink-50 text-pink-700 border border-pink-200" 
                                                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                                            )}>
                                                                {student.gender || "-"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {isSelected ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                    {t("assigned", { defaultValue: "Assigned" })}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                                                    {t("not_assigned", { defaultValue: "Not Assigned" })}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <DialogFooter className="px-6 py-3.5 border-t border-gray-200 flex flex-row items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                    <span>
                                        {assignStudents.length > 0
                                            ? t("x_of_y_students_selected", { selected: selectedStudents.length, total: assignStudents.length })
                                            : `${selectedStudents.length} ${t("selected", { defaultValue: "Selected" })}`
                                        }
                                    </span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setAssignStudentOpen(false)} 
                                    className="h-9 px-4 rounded-lg text-xs font-bold border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    {t("cancel")}
                                </Button>
                                <Button 
                                    onClick={handleSaveAssignStudents} 
                                    disabled={submitting} 
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-all text-white h-9 px-6 rounded-lg font-bold text-xs shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                >
                                    {submitting ? t("saving") : t("save")}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Exam Subject Modal */}
                <Dialog open={examSubjectOpen} onOpenChange={setExamSubjectOpen}>
                    <DialogContent showCloseButton={false} className="sm:max-w-[1450px] w-[96vw] max-h-[92vh] h-[86vh] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white flex flex-col focus:outline-none">
                        {/* Header */}
                        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex flex-row items-center justify-between relative shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white shadow-xs flex items-center justify-center">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-base font-bold tracking-tight text-white leading-none">
                                            {t("add_exam_subject")}
                                        </DialogTitle>
                                        {examSubjectData.exam && (
                                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-xs">
                                                {examSubjectData.exam.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-white/85 mt-1 font-normal">
                                        {t("configure_exam_schedule_description", { defaultValue: "Configure subjects, exam dates, timings, duration and grading marks for this examination" })}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setExamSubjectOpen(false)}
                                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </DialogHeader>

                        {/* Content Area */}
                        <div className="p-5 space-y-4 flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-50/40">
                            {/* Top Info & Action Card */}
                            <div className="p-4 rounded-xl bg-white border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                                        <BookOpen className="h-4 w-4 text-indigo-600" />
                                        <div className="text-xs">
                                            <span className="text-gray-500 font-medium">{t("exam")}: </span>
                                            <span className="font-bold text-gray-800">{examSubjectData.exam?.name || "-"}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50/60 border border-orange-100 rounded-lg">
                                        <FolderKanban className="h-4 w-4 text-orange-600" />
                                        <div className="text-xs">
                                            <span className="text-gray-500 font-medium">{t("exam_group")}: </span>
                                            <span className="font-bold text-gray-800">{examSubjectData.group?.name || "-"}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleAddExamSubjectRow} 
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white h-9 px-4 rounded-lg text-xs font-bold gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" />
                                    {t("add_exam_subject")}
                                </Button>
                            </div>

                            {/* Scrollable Table Container */}
                            <div className="flex-1 overflow-y-auto min-h-0 rounded-xl border border-gray-200/90 bg-white shadow-xs overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                                    <thead className="bg-[#f8fafc] sticky top-0 z-10 border-b border-gray-200 shadow-xs">
                                        <tr>
                                            <th className="py-3 px-3 font-bold text-gray-700 uppercase tracking-wider text-[11px]" style={{ minWidth: '180px' }}>
                                                {t("subject")} <span className="text-red-500">*</span>
                                            </th>
                                            <th className="py-3 px-3 font-bold text-gray-700 uppercase tracking-wider text-[11px]" style={{ minWidth: '140px' }}>
                                                {t("date")} <span className="text-red-500">*</span>
                                            </th>
                                            <th className="py-3 px-3 font-bold text-gray-700 uppercase tracking-wider text-[11px]" style={{ minWidth: '130px' }}>
                                                {t("start_time")} <span className="text-red-500">*</span>
                                            </th>
                                            <th className="py-3 px-3 font-bold text-gray-700 uppercase tracking-wider text-[11px]" style={{ minWidth: '100px' }}>
                                                {t("duration")} <span className="text-red-500">*</span>
                                            </th>
                                            <th className="py-3 px-3 font-bold text-gray-700 uppercase tracking-wider text-[11px]" style={{ minWidth: '100px' }}>
                                                {t("credit_hours")} <span className="text-red-500">*</span>
                                            </th>
                                            <th className="py-3 px-3 font-bold text-gray-700 uppercase tracking-wider text-[11px]" style={{ minWidth: '100px' }}>
                                                {t("room_no")} <span className="text-red-500">*</span>
                                            </th>
                                            <th className="py-3 px-3 font-bold text-gray-700 uppercase tracking-wider text-[11px]" style={{ minWidth: '110px' }}>
                                                {t("marks_max")} <span className="text-red-500">*</span>
                                            </th>
                                            <th className="py-3 px-3 font-bold text-gray-700 uppercase tracking-wider text-[11px]" style={{ minWidth: '110px' }}>
                                                {t("marks_min")} <span className="text-red-500">*</span>
                                            </th>
                                            <th className="py-3 px-3 font-bold text-gray-700 uppercase tracking-wider text-[11px] w-12 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {examSubjectRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="text-center py-16">
                                                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
                                                        <BookOpen className="h-10 w-10 text-gray-300 stroke-[1.5]" />
                                                        <p className="text-xs font-semibold text-gray-500">
                                                            {t("no_exam_subjects_added", { defaultValue: "No exam subjects added yet" })}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400">
                                                            {t("click_add_subject_hint", { defaultValue: "Click the '+ Add Exam Subject' button above to add subjects to this exam" })}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            examSubjectRows.map((row) => (
                                                <tr key={row.id} className="hover:bg-indigo-50/40 transition-colors">
                                                    <td className="py-2.5 px-3">
                                                        <Select value={row.subject} onValueChange={(val) => handleUpdateExamSubjectRow(row.id, "subject", val)}>
                                                            <SelectTrigger className="h-9 border-gray-200 bg-gray-50/50 focus:bg-white text-xs w-full rounded-lg shadow-none focus:ring-indigo-500">
                                                                <SelectValue placeholder={t("select_subject", { defaultValue: "Select Subject" })} />
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
                                                    <td className="py-2.5 px-3">
                                                        <Input type="date" value={row.date} onChange={(e) => handleUpdateExamSubjectRow(row.id, "date", e.target.value)} className="h-9 border-gray-200 bg-gray-50/50 focus:bg-white text-xs w-full rounded-lg shadow-none focus:ring-indigo-500" />
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <Input type="time" step="1" value={row.start_time} onChange={(e) => handleUpdateExamSubjectRow(row.id, "start_time", e.target.value)} className="h-9 border-gray-200 bg-gray-50/50 focus:bg-white text-xs w-full rounded-lg shadow-none focus:ring-indigo-500" />
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <Input type="number" placeholder="60" value={row.duration} onChange={(e) => handleUpdateExamSubjectRow(row.id, "duration", e.target.value)} className="h-9 border-gray-200 bg-gray-50/50 focus:bg-white text-xs w-full rounded-lg shadow-none focus:ring-indigo-500" />
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <Input type="number" step="0.01" placeholder="1.00" value={row.credit_hours} onChange={(e) => handleUpdateExamSubjectRow(row.id, "credit_hours", e.target.value)} className="h-9 border-gray-200 bg-gray-50/50 focus:bg-white text-xs w-full rounded-lg shadow-none focus:ring-indigo-500" />
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <Input placeholder="100" value={row.room_no} onChange={(e) => handleUpdateExamSubjectRow(row.id, "room_no", e.target.value)} className="h-9 border-gray-200 bg-gray-50/50 focus:bg-white text-xs w-full rounded-lg shadow-none focus:ring-indigo-500" />
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <Input type="number" step="0.01" placeholder="100.00" value={row.marks_max} onChange={(e) => handleUpdateExamSubjectRow(row.id, "marks_max", e.target.value)} className="h-9 border-gray-200 bg-gray-50/50 focus:bg-white text-xs w-full rounded-lg shadow-none focus:ring-indigo-500" />
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <Input type="number" step="0.01" placeholder="33.00" value={row.marks_min} onChange={(e) => handleUpdateExamSubjectRow(row.id, "marks_min", e.target.value)} className="h-9 border-gray-200 bg-gray-50/50 focus:bg-white text-xs w-full rounded-lg shadow-none focus:ring-indigo-500" />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveExamSubjectRow(row.id)} 
                                                            title={t("remove_row", { defaultValue: "Remove" })}
                                                            className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer mx-auto"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <DialogFooter className="px-6 py-3.5 border-t border-gray-200 flex flex-row items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                    <span>
                                        {examSubjectRows.length} {t("subjects_configured", { defaultValue: "Subjects Configured" })}
                                    </span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setExamSubjectOpen(false)} 
                                    className="h-9 px-4 rounded-lg text-xs font-bold border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    {t("cancel")}
                                </Button>
                                <Button 
                                    onClick={handleSaveExamSubjects} 
                                    disabled={submitting || examSubjectRows.length === 0} 
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-all text-white h-9 px-6 rounded-lg font-bold text-xs shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                >
                                    {submitting ? t("saving") : t("save")}
                                </Button>
                            </div>
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
                    <DialogContent showCloseButton={false} className="sm:max-w-[1400px] w-[96vw] max-h-[92vh] h-[86vh] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white flex flex-col focus:outline-none">
                        {/* Header */}
                        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex flex-row items-center justify-between relative shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white shadow-xs flex items-center justify-center">
                                    <FileDigit className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-base font-bold tracking-tight text-white leading-none">
                                            {t("exam_marks")}
                                        </DialogTitle>
                                        {examMarksData.exam && (
                                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-xs">
                                                {examMarksData.exam.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-white/85 mt-1 font-normal">
                                        {t("enter_exam_marks_description", { defaultValue: "Select a subject to enter and record student marks or mark attendance status" })}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setExamMarksOpen(false)}
                                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </DialogHeader>

                        {/* Content Area */}
                        <div className="p-5 space-y-4 flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-50/40">
                            {/* Top Subject Selector & Search Bar */}
                            <div className="p-4 rounded-xl bg-white border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
                                <div className="w-full sm:w-80 space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                        <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                                        {t("subject")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={selectedMarksSubject} onValueChange={(val) => handleMarksSubjectChange(val, examMarksData.exam!.id)}>
                                        <SelectTrigger className="h-10 border-gray-200 bg-gray-50/50 rounded-lg text-xs font-medium focus:ring-indigo-500 shadow-none">
                                            <SelectValue placeholder={t("select_subject", { defaultValue: "Select Subject" })} />
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

                                {examMarksStudents.length > 0 && (
                                    <div className="relative flex-1 max-w-sm">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder={t("search_by_name_or_admission_no", { defaultValue: "Search student by name, admission no..." })}
                                            value={marksSearchQuery}
                                            onChange={(e) => setMarksSearchQuery(e.target.value)}
                                            className="pl-9 h-10 text-xs border-gray-200 bg-gray-50/50 rounded-lg focus:ring-indigo-500 shadow-none"
                                        />
                                        {marksSearchQuery && (
                                            <button 
                                                type="button" 
                                                onClick={() => setMarksSearchQuery("")}
                                                className="absolute right-2.5 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Scrollable Marks Table Container */}
                            <div className="flex-1 overflow-y-auto min-h-0 rounded-xl border border-gray-200/90 bg-white shadow-xs">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-[#f8fafc] sticky top-0 z-10 border-b border-gray-200 shadow-xs">
                                        <tr>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px] w-36">{t("admission_no")}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px]">{t("student_name")}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px] w-44">{t("theory_marks", { defaultValue: "Theory Marks" })}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px] w-44">{t("practical_marks", { defaultValue: "Practical Marks" })}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px] text-center w-28">{t("absent")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {marksLoading ? (
                                            <TableSkeleton rows={8} cols={5} />
                                        ) : !selectedMarksSubject ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-16">
                                                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
                                                        <BookOpen className="h-10 w-10 text-gray-300 stroke-[1.5]" />
                                                        <p className="text-xs font-semibold text-gray-500">
                                                            {t("please_select_subject_to_enter_marks", { defaultValue: "Please select a subject to enter student marks" })}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : examMarksStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-16">
                                                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
                                                        <Users className="h-10 w-10 text-gray-300 stroke-[1.5]" />
                                                        <p className="text-xs font-semibold text-gray-500">{t("no_students_assigned_to_this_exam")}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredMarksStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-12 text-gray-400 text-xs italic">
                                                    {t("no_matching_students_found", { defaultValue: "No students match your search criteria" })}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMarksStudents.map((s) => (
                                                <tr key={s.id} className={cn("hover:bg-indigo-50/40 transition-colors", s.is_absent && "bg-red-50/30")}>
                                                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600">
                                                        {s.admission_no || "-"}
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-gray-800">
                                                        <div className="flex items-center gap-2.5">
                                                            <Avatar className="h-8 w-8 rounded-full border border-indigo-100 shrink-0 shadow-2xs">
                                                                <AvatarImage
                                                                    src={getImageUrl(s.photo || s.student_photo || s.avatar || s.image)}
                                                                    alt={s.name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                                <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">
                                                                    {s.name ? s.name.charAt(0).toUpperCase() : "S"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-semibold text-gray-800 leading-tight">
                                                                {s.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            disabled={!!s.is_absent}
                                                            value={s.theory_marks ?? ""}
                                                            onChange={(e) => handleUpdateStudentMark(s.id, 'theory_marks', e.target.value)}
                                                            className="h-9 text-xs px-3 text-gray-800 border-gray-200 bg-gray-50/50 focus:bg-white rounded-lg focus:ring-indigo-500 shadow-none disabled:opacity-40"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            disabled={!!s.is_absent}
                                                            value={s.practical_marks ?? ""}
                                                            onChange={(e) => handleUpdateStudentMark(s.id, 'practical_marks', e.target.value)}
                                                            className="h-9 text-xs px-3 text-gray-800 border-gray-200 bg-gray-50/50 focus:bg-white rounded-lg focus:ring-indigo-500 shadow-none disabled:opacity-40"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!s.is_absent}
                                                                onChange={(e) => handleUpdateStudentMark(s.id, 'is_absent', e.target.checked)}
                                                                className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                                            />
                                                            {s.is_absent && (
                                                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">
                                                                    {t("absent")}
                                                                </span>
                                                            )}
                                                        </label>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <DialogFooter className="px-6 py-3.5 border-t border-gray-200 flex flex-row items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                    <span>
                                        {examMarksStudents.length} {t("students", { defaultValue: "Students" })}
                                    </span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setExamMarksOpen(false)} 
                                    className="h-9 px-4 rounded-lg text-xs font-bold border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    {t("cancel")}
                                </Button>
                                <Button 
                                    onClick={handleSaveExamMarks} 
                                    disabled={submitting || !selectedMarksSubject || examMarksStudents.length === 0} 
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-all text-white h-9 px-6 rounded-lg font-bold text-xs shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                >
                                    {submitting ? t("saving") : t("save")}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Teacher Remarks Modal */}
                <Dialog open={teacherRemarksOpen} onOpenChange={setTeacherRemarksOpen}>
                    <DialogContent showCloseButton={false} className="sm:max-w-[1300px] w-[96vw] max-h-[92vh] h-[86vh] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white flex flex-col focus:outline-none">
                        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white flex flex-row items-center justify-between relative shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white shadow-xs flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-base font-bold tracking-tight text-white leading-none">
                                            {t("teacher_remarks")}
                                        </DialogTitle>
                                        {remarksData.exam && (
                                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-xs">
                                                {remarksData.exam.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-white/85 mt-1 font-normal">
                                        {t("teacher_remarks_description", { defaultValue: "Add or update personalized teacher remarks for students in this exam" })}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTeacherRemarksOpen(false)}
                                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </DialogHeader>

                        <div className="p-5 space-y-4 flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-50/40">
                            <div className="flex-1 overflow-y-auto min-h-0 rounded-xl border border-gray-200/90 bg-white shadow-xs">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-[#f8fafc] sticky top-0 z-10 border-b border-gray-200 shadow-xs">
                                        <tr className="border-b border-gray-200">
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px] w-36">{t("admission_no")}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px] w-1/3">{t("student_name")}</th>
                                            <th className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px]">{t("remarks")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {remarksLoading ? (
                                            <TableSkeleton rows={8} cols={3} />
                                        ) : remarksStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="text-center py-16">
                                                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
                                                        <Users className="h-10 w-10 text-gray-300 stroke-[1.5]" />
                                                        <p className="text-xs font-semibold text-gray-500">{t("no_students_assigned_to_this_exam")}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            remarksStudents.map((s, idx) => (
                                                <tr key={s.id} className="hover:bg-indigo-50/40 transition-colors">
                                                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600">{s.admission_no || "-"}</td>
                                                    <td className="py-3 px-4 font-semibold text-gray-800">
                                                        <div className="flex items-center gap-2.5">
                                                            <Avatar className="h-8 w-8 rounded-full border border-indigo-100 shrink-0 shadow-2xs">
                                                                <AvatarImage
                                                                    src={getImageUrl(s.photo || s.student_photo || s.avatar || s.image)}
                                                                    alt={s.name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                                <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">
                                                                    {s.name ? s.name.charAt(0).toUpperCase() : "S"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-semibold text-gray-800 leading-tight">
                                                                {s.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Input 
                                                            value={s.note ?? ""} 
                                                            onChange={(e) => {
                                                                const newStudents = [...remarksStudents];
                                                                newStudents[idx].note = e.target.value;
                                                                setRemarksStudents(newStudents);
                                                            }} 
                                                            className="h-9 text-xs px-3 text-gray-800 border-gray-200 bg-gray-50/50 focus:bg-white rounded-lg focus:ring-indigo-500 shadow-none" 
                                                            placeholder={t("enter_remarks_here", { defaultValue: "Enter teacher remarks..." })} 
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-3.5 border-t border-gray-200 flex flex-row items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                    <span>
                                        {remarksStudents.length} {t("students", { defaultValue: "Students" })}
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setTeacherRemarksOpen(false)} 
                                    className="h-9 px-4 rounded-lg text-xs font-bold border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    {t("cancel")}
                                </Button>
                                <Button 
                                    onClick={handleSaveTeacherRemarks} 
                                    disabled={submitting || remarksStudents.length === 0} 
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-all text-white h-9 px-6 rounded-lg font-bold text-xs shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                >
                                    {submitting ? t("saving") : t("save")}
                                </Button>
                            </div>
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
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden py-0 gap-0 rounded-2xl flex flex-col h-fit sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F4FF] to-[#EFF0FD] w-full border-b border-gray-100">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                <FolderKanban className="h-4 w-4" />
                            </span>
                            <div>
                                <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">
                                    {editMode ? t("edit_exam_group") : t("add_exam_group")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1 font-normal">{editMode ? t("update_group_details") : t("create_new_exam_group")}</p>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 space-y-4 flex-1">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("name")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Annual Exams 2026"
                                    className="h-10 text-xs border-gray-200 bg-white rounded-lg focus:ring-indigo-500 shadow-2xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("exam_type")} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.exam_type} onValueChange={(val) => setFormData({...formData, exam_type: val})}>
                                    <SelectTrigger className="h-10 text-xs border-gray-200 bg-white rounded-lg focus:ring-indigo-500 shadow-2xs">
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
                                <Label className="text-xs font-bold text-gray-700">{t("description")}</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder={t("provide_additional_details")}
                                    className="min-h-[100px] text-xs border-gray-200 bg-white rounded-lg focus:ring-indigo-500 shadow-2xs resize-none"
                                />
                            </div>
                        </CardContent>

                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex gap-2 justify-end">
                            {editMode && (
                                <Button onClick={resetForm} variant="outline" className="h-9 rounded-lg text-xs font-semibold border-gray-200 px-4 cursor-pointer">
                                    {t("cancel")}
                                </Button>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={submitting}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white h-9 text-xs font-bold rounded-lg px-5 transition-all active:scale-95 shadow-md shadow-indigo-100 cursor-pointer"
                            >
                                {submitting ? t("processing") : editMode ? t("update_group") : t("save_group")}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Exam Group List */}
                <div className="lg:col-span-3">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden py-0 gap-0 rounded-2xl">
                        <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F4FF] to-[#EFF0FD] w-full border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                    <LayoutList className="h-4 w-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">{t("exam_group_registry")}</CardTitle>
                                    <p className="text-[11px] text-gray-500 mt-1 font-normal">{t("x_groups", { count: totalEntries })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <div className="relative w-48 sm:w-60">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        placeholder={t("search_groups")}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8.5 h-8.5 text-xs rounded-lg border-slate-200 bg-white focus:bg-white focus:ring-indigo-500 transition-all shadow-2xs"
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                                <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                    <SelectTrigger className="w-[65px] h-8.5 text-xs border-gray-200 rounded-lg bg-white shadow-2xs">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="500">500</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-hidden">
                                <Table>
                                    <TableHeader className="!bg-[#f8fafc]">
                                        <TableRow className="border-b border-gray-200 shadow-2xs">
                                            <TableHead className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px]">{t("group_name")}</TableHead>
                                            <TableHead className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px] text-center">{t("exams")}</TableHead>
                                            <TableHead className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px]">{t("grading_system")}</TableHead>
                                            <TableHead className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px] text-center">{t("status")}</TableHead>
                                            <TableHead className="py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[11px] text-right">{t("action")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={5} />
                                        ) : groups.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="px-4 py-12 text-center text-xs font-semibold text-gray-400">
                                                    {t("no_data_found")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            groups.map((group) => (
                                                <TableRow key={group.id} className="text-xs text-gray-600 hover:bg-indigo-50/40 transition-colors">
                                                    <TableCell className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-indigo-600 uppercase tracking-tight">{group.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">{group.description || t("no_description_provided")}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-indigo-100/70 inline-flex items-center gap-1">
                                                            <FileStack className="h-3 w-3" /> {group.exams_count} {t("exams")}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            <BarChart className="h-3.5 w-3.5 text-gray-400" />
                                                            {group.exam_type}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-center">
                                                        {(group.result_published_count || 0) > 0 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                {t("result_published")}
                                                            </span>
                                                        ) : (group.published_exams_count || 0) > 0 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                                {t("exam_published")}
                                                            </span>
                                                        ) : (group.exams_count || 0) > 0 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                                {t("draft")}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                                                {t("no_exams")}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button size="icon" variant="ghost" title={t("manage_publish_exams")} onClick={() => handleManageExams(group)} className="h-8 w-8 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-colors cursor-pointer">
                                                                <Send className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(group)} className="h-8 w-8 bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white rounded-lg transition-colors cursor-pointer">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => setDeleteId(group.id)} className="h-8 w-8 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg transition-colors cursor-pointer">
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

                            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold p-4 border-t border-gray-100">
                                <div>
                                    {t("showing_x_to_y_of_z", { from: ((currentPage - 1) * itemsPerPage) + 1, to: Math.min(currentPage * itemsPerPage, totalEntries), total: totalEntries })}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        size="sm" className="h-8 w-8 p-0 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer shadow-2xs"
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" className="h-8 px-3 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-lg shadow-sm font-bold text-xs">
                                        {currentPage}
                                    </Button>
                                    <Button
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        size="sm" className="h-8 w-8 p-0 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer shadow-2xs"
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
