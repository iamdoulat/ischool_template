"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useSettings } from "@/components/providers/settings-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Upload, Trash2, Search, Pencil, Eye,
    Copy, FileSpreadsheet, FileText, Printer, ChevronLeft, ChevronRight, BrainCircuit, Filter, HelpCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { renderPdfHeader, renderPdfFooter } from "@/lib/pdf-utils";
import { cn, toLocaleNumber } from "@/lib/utils";
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

interface Question {
    id: string;
    class_name: string;
    section: string;
    subject: string;
    question_type: string;
    level: string;
    question: string;
    creator?: { name?: string; surname?: string; first_name?: string; last_name?: string; staff_id?: string };
}

interface ClassOption {
    id: number | string;
    name: string;
}

interface SectionOption {
    id: number | string;
    name: string;
    school_class_id?: number | string;
}

interface SubjectOption {
    id: number | string;
    name: string;
}

interface InvoicePrintSetting {
    type?: string;
    footer_content?: string;
}

const stripHtml = (html: string) => {
    if (!html) return "";
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();
};

export default function QuestionBankPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const tt = useTranslateToast();
    const { settings } = useSettings();
    const ReactQuill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), []);
    const [searchTerm, setSearchTerm] = useState("");
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [sections, setSections] = useState<SectionOption[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
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
        class_id: "",
        section_id: "",
        subject: "",
        question_type: "all",
        level: "all"
    });

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        class_id: "",
        section_id: "",
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

    const getLocalizedClassName = (name?: string) => {
        if (!name) return "";
        const match = name.match(/^Class\s+(\d+)$/i);
        if (match) {
            const key = `class_${match[1]}`;
            const trans = t(key);
            if (trans && trans !== key) return trans;
            return `${t("class")} ${toLocaleNumber(match[1], shortCode)}`;
        }
        const key = name.toLowerCase().replace(/\s+/g, "_");
        const trans = t(key);
        return trans && trans !== key ? trans : toLocaleNumber(name, shortCode);
    };

    const getLocalizedSectionName = (name?: string) => {
        if (!name) return "";
        return toLocaleNumber(name, shortCode);
    };

    const getLocalizedSubjectName = (name?: string) => {
        if (!name) return "";
        const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const trans = t(key);
        return trans && trans !== key ? trans : name;
    };

    const fetchInitialData = async () => {
        try {
            const [classesRes, subjectsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subjects?no_paginate=true').catch(() => ({ data: [] }))
            ]);

            const extractData = (res: { data?: unknown }) => {
                const resData = res?.data as { data?: unknown } | unknown[] | undefined;
                if (Array.isArray(resData)) return resData;
                if (resData && typeof resData === 'object' && 'data' in resData && Array.isArray((resData as { data: unknown[] }).data)) {
                    return (resData as { data: unknown[] }).data;
                }
                return [];
            };

            setClasses(extractData(classesRes) as ClassOption[]);
            setSubjects(extractData(subjectsRes) as SubjectOption[]);
        } catch (error) {
            console.error("Failed to fetch initial data", error);
        }
    };

    const fetchSectionsByClass = async (classId: string) => {
        if (!classId) {
            setSections([]);
            return;
        }
        try {
            const res = await api.get('/academics/sections?with_class=true&no_paginate=true');
            const all: SectionOption[] = res.data?.data || res.data || [];
            const filtered = all.filter((s: SectionOption) => String(s.school_class_id) === String(classId));
            setSections(filtered);
        } catch (error) {
            console.error("Failed to fetch sections", error);
        }
    };

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = {
                page: currentPage,
                per_page: itemsPerPage,
                search: searchTerm
            };
            if (criteria.class_id) {
                const c = classes.find(c => c.id.toString() === criteria.class_id);
                if (c) params.class_name = c.name;
            }
            if (criteria.section_id) {
                const s = sections.find(s => s.id.toString() === criteria.section_id);
                if (s) params.section = s.name;
            }
            if (criteria.subject) params.subject = criteria.subject;
            if (criteria.question_type !== "all") params.question_type = criteria.question_type;
            if (criteria.level !== "all") params.level = criteria.level;

            const response = await api.get('/online-examination/questions', { params });
            const rawData = response.data?.data || response.data || [];
            const list = Array.isArray(rawData) ? rawData : (rawData.data || []);
            setQuestions(list);
            setTotalEntries(response.data?.total || response.data?.data?.total || list.length || 0);
        } catch {
            tt.error("failed_to_fetch_questions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchQuestions();
    }, [currentPage, itemsPerPage, searchTerm, criteria]);

    const handleSave = async () => {
        if (!formData.class_id || !formData.section_id || !formData.subject || !formData.question) {
            tt.error("please_fill_all_required_fields");
            return;
        }

        const className = classes.find(c => c.id.toString() === formData.class_id)?.name || "";
        const sectionName = sections.find(s => s.id.toString() === formData.section_id)?.name || "";

        const payload = {
            ...formData,
            class_name: className,
            section: sectionName
        };

        try {
            if (dialogMode === "edit" && selectedId) {
                await api.put(`/online-examination/questions/${selectedId}`, payload);
                tt.success("question_updated_successfully");
            } else {
                await api.post('/online-examination/questions', payload);
                tt.success("question_created_successfully");
            }
            setIsDialogOpen(false);
            fetchQuestions();
        } catch {
            tt.error("failed_to_save_question");
        }
    };

    const handleEdit = async (q: Question) => {
        setDialogMode("edit");
        setSelectedId(q.id);

        const foundClass = classes.find(c => c.name === q.class_name);
        const classId = foundClass ? foundClass.id.toString() : "";

        let sectionId = "";
        if (classId) {
            try {
                const res = await api.get('/academics/sections?with_class=true&no_paginate=true');
                const all: SectionOption[] = res.data?.data || res.data || [];
                const filtered = all.filter((s: SectionOption) => String(s.school_class_id) === String(classId));
                setSections(filtered);
                const foundSection = filtered.find((s: SectionOption) => s.name === q.section);
                if (foundSection) sectionId = foundSection.id.toString();
            } catch (error) {
                console.error("Failed to fetch sections", error);
            }
        }

        setFormData({
            class_id: classId,
            section_id: sectionId,
            subject: q.subject,
            question_type: q.question_type,
            level: q.level,
            question: q.question,
            options: (q as unknown as { options?: string[] }).options || ["", "", "", ""],
            correct_answer: (q as unknown as { correct_answer?: string }).correct_answer || ""
        });
        setIsDialogOpen(true);
    };

    const handleView = async (q: Question) => {
        setDialogMode("view");
        setSelectedId(q.id);

        const foundClass = classes.find(c => c.name === q.class_name);
        const classId = foundClass ? foundClass.id.toString() : "";

        let sectionId = "";
        if (classId) {
            try {
                const res = await api.get('/academics/sections?with_class=true&no_paginate=true');
                const all: SectionOption[] = res.data?.data || res.data || [];
                const filtered = all.filter((s: SectionOption) => String(s.school_class_id) === String(classId));
                setSections(filtered);
                const foundSection = filtered.find((s: SectionOption) => s.name === q.section);
                if (foundSection) sectionId = foundSection.id.toString();
            } catch (error) {
                console.error("Failed to fetch sections", error);
            }
        }

        setFormData({
            class_id: classId,
            section_id: sectionId,
            subject: q.subject,
            question_type: q.question_type,
            level: q.level,
            question: q.question,
            options: (q as unknown as { options?: string[] }).options || ["", "", "", ""],
            correct_answer: (q as unknown as { correct_answer?: string }).correct_answer || ""
        });
        setIsDialogOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/online-examination/questions/${deleteId}`);
            tt.success("question_deleted_successfully");
            fetchQuestions();
        } catch {
            tt.error("failed_to_delete_question");
        } finally {
            setDeleteId(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setIsBulkDeleting(true);
        try {
            await api.post('/online-examination/questions/bulk-delete', { ids: selectedIds });
            tt.success("x_questions_deleted_successfully", { count: selectedIds.length });
            setSelectedIds([]);
            fetchQuestions();
        } catch {
            tt.error("failed_to_delete_questions");
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
            class_id: "",
            section_id: "",
            subject: "",
            question_type: "Single Choice",
            level: "Low",
            question: "",
            options: ["", "", "", ""],
            correct_answer: ""
        });
        setIsDialogOpen(true);
    };

    const copyToClipboard = () => {
        if (questions.length === 0) {
            tt.error("no_data_to_export");
            return;
        }
        const text = questions.map(q => `${q.id}\t${q.class_name} (${q.section})\t${q.subject}\t${q.question_type}\t${q.level}\t${stripHtml(q.question)}\t${q.creator ? (q.creator.name || q.creator.first_name || 'System') : ''}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (questions.length === 0) {
            tt.error("no_data_to_export");
            return;
        }
        const ws = XLSX.utils.json_to_sheet(questions.map(q => ({
            [t("q_id")]: q.id,
            [t("class_section")]: `${q.class_name} (${q.section})`,
            [t("subject")]: q.subject,
            [t("question_type")]: q.question_type === "Single Choice" ? t("single_choice") : q.question_type === "Multiple Choice" ? t("multiple_choice") : q.question_type === "True/False" ? t("true_false") : q.question_type === "Descriptive" ? t("descriptive") : q.question_type,
            [t("level")]: q.level === "Low" ? t("low") : q.level === "Medium" ? t("medium") : q.level === "High" ? t("high") : q.level,
            [t("question")]: stripHtml(q.question),
            [t("created_by")]: q.creator ? `${q.creator.name || q.creator.first_name || 'System'} ${q.creator.surname || q.creator.last_name || ''}`.trim() : '---'
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("question_bank"));
        XLSX.writeFile(wb, "question_bank.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = async () => {
        if (questions.length === 0) {
            tt.error("no_data_to_export");
            return;
        }
        let invoicePrintSettings: InvoicePrintSetting = {};
        try {
            const res = await api.get("system-setting/print-settings");
            if (res.data?.status === "success") {
                invoicePrintSettings = (res.data.data || []).find((s: InvoicePrintSetting) => s.type === "Question Bank" || s.type === "Online Exam") || {};
            }
        } catch (err) {
            console.error("Could not fetch print settings", err);
        }
        const baseApiUrl = api.defaults.baseURL?.replace('/api/v1', '') || "";
        const doc = new jsPDF();
        const startY = await renderPdfHeader(doc, settings, invoicePrintSettings, baseApiUrl, "QUESTION BANK LIST");
        autoTable(doc, {
            startY,
            head: [["ID", "Class/Sec", "Subject", "Type", "Level", "Question", "Created By"]],
            body: questions.map(q => [
                String(q.id),
                `${q.class_name} (${q.section})`,
                q.subject,
                q.question_type,
                q.level,
                stripHtml(q.question).substring(0, 50),
                q.creator ? (q.creator.name || q.creator.first_name || 'System') : '---'
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [99, 102, 241] },
        });
        const lastTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
        const finalY = (lastTable?.finalY || 0) + 10;
        renderPdfFooter(doc, invoicePrintSettings.footer_content || "", finalY);
        doc.save("question_bank.pdf");
        tt.success("pdf_file_downloaded");
    };

    const handlePrint = () => {
        if (questions.length === 0) {
            tt.error("no_data_to_export");
            return;
        }
        window.print();
    };

    const fromEntry = totalEntries === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1;
    const toEntry = Math.min(currentPage * itemsPerPage, totalEntries);

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <BrainCircuit className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("question_bank")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("manage_examination_questions_and_answers")}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button onClick={openAddDialog} className="btn-gradient text-white gap-2 h-11 px-8 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full cursor-pointer">
                        <Plus className="h-4 w-4" /> {t("add_question")}
                    </Button>
                    <Link href="/dashboard/online-examinations/question-bank/import">
                        <Button variant="outline" className="h-11 px-8 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-100 flex gap-2 cursor-pointer">
                            <Upload className="h-4 w-4" /> {t("import")}
                        </Button>
                    </Link>
                    {selectedIds.length > 0 && (
                        <Button onClick={handleBulkDelete} disabled={isBulkDeleting} variant="destructive" className="h-11 px-8 rounded-full text-[11px] font-bold uppercase tracking-widest flex gap-2 shadow-xl shadow-rose-200/50 cursor-pointer">
                            <Trash2 className="h-4 w-4" /> {isBulkDeleting ? t("deleting") : t("delete_selected", { count: toLocaleNumber(selectedIds.length, shortCode) })}
                        </Button>
                    )}
                </div>
            </div>

            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/60">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_questions_by_criteria") || "Filter questions by class, section, subject, type, and level"}</p>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">{t("class")}</Label>
                            <Select value={criteria.class_id} onValueChange={(val) => {
                                setCriteria({...criteria, class_id: val, section_id: ""});
                                fetchSectionsByClass(val);
                            }}>
                                <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500 shadow-none cursor-pointer">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id.toString()} className="cursor-pointer">{getLocalizedClassName(c.name)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">{t("section")}</Label>
                            <Select
                                value={criteria.section_id}
                                onValueChange={(val) => setCriteria({...criteria, section_id: val})}
                                disabled={!criteria.class_id}
                            >
                                <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500 shadow-none cursor-pointer">
                                    <SelectValue placeholder={!criteria.class_id ? t("select_class_first") : t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => <SelectItem key={s.id} value={s.id.toString()} className="cursor-pointer">{getLocalizedSectionName(s.name)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">{t("subject")}</Label>
                            <Select value={criteria.subject} onValueChange={(val) => setCriteria({...criteria, subject: val})}>
                                <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500 shadow-none cursor-pointer">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => <SelectItem key={s.id} value={s.name} className="cursor-pointer">{getLocalizedSubjectName(s.name)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">{t("question_type")}</Label>
                            <Select value={criteria.question_type} onValueChange={(val) => setCriteria({...criteria, question_type: val})}>
                                <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500 shadow-none cursor-pointer">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="cursor-pointer">{t("all_types")}</SelectItem>
                                    <SelectItem value="Single Choice" className="cursor-pointer">{t("single_choice")}</SelectItem>
                                    <SelectItem value="Multiple Choice" className="cursor-pointer">{t("multiple_choice")}</SelectItem>
                                    <SelectItem value="True/False" className="cursor-pointer">{t("true_false")}</SelectItem>
                                    <SelectItem value="Descriptive" className="cursor-pointer">{t("descriptive")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">{t("level")}</Label>
                            <Select value={criteria.level} onValueChange={(val) => setCriteria({...criteria, level: val})}>
                                <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500 shadow-none cursor-pointer">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="cursor-pointer">{t("all_levels")}</SelectItem>
                                    <SelectItem value="Low" className="cursor-pointer">{t("low")}</SelectItem>
                                    <SelectItem value="Medium" className="cursor-pointer">{t("medium")}</SelectItem>
                                    <SelectItem value="High" className="cursor-pointer">{t("high")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={fetchQuestions} className="btn-gradient text-white px-10 h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-2 cursor-pointer">
                            <Search className="h-4 w-4" /> {t("search")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Question Bank Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/60">
                    <div className="flex items-center gap-2.5 shrink-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <HelpCircle className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {t("question_bank")} ({toLocaleNumber(totalEntries, shortCode)})
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("manage_examination_questions_and_answers")}</p>
                        </div>
                    </div>

                    {/* Right Controls: Search Input + Select + Export Toolbar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto justify-end">
                        <div className="relative w-full sm:w-60 lg:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={t("search_questions")}
                                className="pl-9.5 h-9 text-xs border-gray-200 bg-white/90 rounded-lg focus:bg-white focus:ring-indigo-500 shadow-2xs w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                                <SelectTrigger className="h-9 w-[68px] bg-white border-gray-200 text-xs font-bold focus:ring-0 cursor-pointer rounded-lg shadow-2xs">
                                    <SelectValue placeholder={toLocaleNumber(itemsPerPage, shortCode)} />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 50, 100, 200, 500].map(n => (
                                        <SelectItem key={n} value={n.toString()} className="text-xs font-bold cursor-pointer">{toLocaleNumber(n, shortCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5 bg-white shadow-2xs text-gray-500">
                                <Button variant="ghost" size="icon" onClick={copyToClipboard} title={t("copy")} className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-md cursor-pointer">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={exportToExcel} title={t("export_excel")} className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 transition-all rounded-md cursor-pointer">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={exportToPDF} title={t("export_pdf")} className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600 transition-all rounded-md cursor-pointer">
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handlePrint} title={t("print")} className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-md cursor-pointer">
                                    <Printer className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-5 md:p-6 space-y-4">
                    <div className="rounded-lg border border-gray-200 overflow-x-auto custom-scrollbar shadow-xs bg-white">
                        <Table className="min-w-[1050px]">
                            <TableHeader className="!bg-[#f1f5f9] dark:!bg-slate-800 text-[11px] uppercase font-bold text-slate-700 dark:text-slate-200 border-b border-gray-200">
                                <TableRow className="hover:bg-transparent border-b border-gray-200">
                                    <TableHead className="w-[50px] px-4 py-3.5">
                                        <Checkbox
                                            className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 cursor-pointer"
                                            checked={questions.length > 0 && selectedIds.length === questions.length}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-700 w-[80px]">{t("q_id")}</TableHead>
                                    <TableHead className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-700 w-[140px]">{t("class_section")}</TableHead>
                                    <TableHead className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-700 w-[140px]">{t("subject")}</TableHead>
                                    <TableHead className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-700 w-[130px]">{t("question_type")}</TableHead>
                                    <TableHead className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-700 w-[100px]">{t("level")}</TableHead>
                                    <TableHead className="py-3.5 px-4 min-w-[280px] font-bold text-slate-700">{t("question")}</TableHead>
                                    <TableHead className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-700 w-[160px]">{t("created_by")}</TableHead>
                                    <TableHead className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-700 w-[130px]">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white divide-y divide-gray-100">
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">{t("loading_questions")}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : questions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-gray-400 text-sm italic">
                                            {t("no_questions_found")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    questions.map((q) => (
                                        <TableRow key={q.id} className="text-[12px] text-gray-700 bg-white hover:bg-indigo-50/50 hover:shadow-xs relative transition-all duration-200 group border-b last:border-0 border-gray-100">
                                            <TableCell className="px-4 py-3.5">
                                                <Checkbox
                                                    className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 cursor-pointer"
                                                    checked={selectedIds.includes(q.id)}
                                                    onCheckedChange={() => toggleSelect(q.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 font-bold text-gray-800 whitespace-nowrap">{toLocaleNumber(q.id, shortCode)}</TableCell>
                                            <TableCell className="py-3.5 px-4 whitespace-nowrap font-medium text-gray-700">{getLocalizedClassName(q.class_name)} ({getLocalizedSectionName(q.section)})</TableCell>
                                            <TableCell className="py-3.5 px-4 whitespace-nowrap font-medium text-gray-700">{getLocalizedSubjectName(q.subject)}</TableCell>
                                            <TableCell className="py-3.5 px-4 whitespace-nowrap">
                                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[9px] uppercase tracking-wider border border-indigo-100">
                                                    {q.question_type === "Single Choice" ? t("single_choice") :
                                                     q.question_type === "Multiple Choice" ? t("multiple_choice") :
                                                     q.question_type === "True/False" ? t("true_false") :
                                                     q.question_type === "Descriptive" ? t("descriptive") :
                                                     q.question_type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider border",
                                                    q.level === "Low" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                    q.level === "Medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                    "bg-rose-50 text-rose-600 border-rose-100"
                                                )}>
                                                    {q.level === "Low" ? t("low") :
                                                     q.level === "Medium" ? t("medium") :
                                                     q.level === "High" ? t("high") :
                                                     q.level}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 font-medium text-gray-800 leading-relaxed max-w-md truncate">
                                                {stripHtml(q.question)}
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 whitespace-nowrap">
                                                {q.creator ? (
                                                    <span className="text-xs font-bold text-gray-700">{q.creator.name || q.creator.first_name || 'System'} {q.creator.surname || q.creator.last_name || ''}</span>
                                                ) : <span className="text-gray-300">---</span>}
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5 transition-all duration-300">
                                                    <Button size="icon" variant="ghost" onClick={() => handleView(q)} title={t("view")} className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-xs transition-all cursor-pointer">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(q)} title={t("edit")} className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-xs transition-all cursor-pointer">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(q.id)} title={t("delete")} className="h-8 w-8 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-xs transition-all cursor-pointer">
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
                            {t("showing_x_to_y_of_z", {
                                from: toLocaleNumber(fromEntry, shortCode),
                                to: toLocaleNumber(toEntry, shortCode),
                                total: toLocaleNumber(totalEntries, shortCode)
                            })}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="default" size="sm" className="h-8 w-8 p-0 btn-gradient text-white border-0 rounded-lg shadow-md cursor-pointer">
                                {toLocaleNumber(currentPage, shortCode)}
                            </Button>
                            <Button
                                onClick={() => setCurrentPage(p => p + 1)}
                                variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                                disabled={questions.length < itemsPerPage}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[1200px] rounded-xl border-0 shadow-2xl p-0 overflow-hidden bg-white">
                    <DialogHeader className="p-5 bg-gradient-to-r from-[#F7A148] to-[#7778EC] text-white flex-row items-center gap-3 space-y-0">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <BrainCircuit className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold tracking-tight">
                                {dialogMode === "edit" ? t("edit_question") : dialogMode === "view" ? t("view_question") : t("add_question")}
                            </DialogTitle>
                            <p className="text-indigo-100 text-[11px] mt-0.5">{t("manage_question_details")}</p>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-white">
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 space-y-5">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t("general_details")}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label className="text-xs font-medium text-gray-700">{t("subject")} <span className="text-red-500">*</span></Label>
                                    <Select value={formData.subject} onValueChange={(val) => setFormData({...formData, subject: val})}>
                                        <SelectTrigger className="h-10 border-gray-200 rounded-md focus:ring-0 focus:border-indigo-500 cursor-pointer">
                                            <SelectValue placeholder={t("select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map(s => <SelectItem key={s.id} value={s.name} className="cursor-pointer">{getLocalizedSubjectName(s.name)}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-gray-700">{t("question_type")} <span className="text-red-500">*</span></Label>
                                    <Select value={formData.question_type} onValueChange={(val) => setFormData({...formData, question_type: val})}>
                                        <SelectTrigger className="h-10 border-gray-200 rounded-md focus:ring-0 focus:border-indigo-500 cursor-pointer">
                                            <SelectValue placeholder={t("select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Single Choice" className="cursor-pointer">{t("single_choice")}</SelectItem>
                                            <SelectItem value="Multiple Choice" className="cursor-pointer">{t("multiple_choice")}</SelectItem>
                                            <SelectItem value="True/False" className="cursor-pointer">{t("true_false")}</SelectItem>
                                            <SelectItem value="Descriptive" className="cursor-pointer">{t("descriptive")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-gray-700">{t("question_level")} <span className="text-red-500">*</span></Label>
                                    <Select value={formData.level} onValueChange={(val) => setFormData({...formData, level: val})}>
                                        <SelectTrigger className="h-10 border-gray-200 rounded-md focus:ring-0 focus:border-indigo-500 cursor-pointer">
                                            <SelectValue placeholder={t("select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low" className="cursor-pointer">{t("low")}</SelectItem>
                                            <SelectItem value="Medium" className="cursor-pointer">{t("medium")}</SelectItem>
                                            <SelectItem value="High" className="cursor-pointer">{t("high")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-5">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t("question_details")}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-gray-700">{t("class")} <span className="text-red-500">*</span></Label>
                                    <Select value={formData.class_id} onValueChange={(val) => {
                                        setFormData({...formData, class_id: val, section_id: ""});
                                        fetchSectionsByClass(val);
                                    }}>
                                        <SelectTrigger className="h-10 border-gray-200 rounded-md focus:ring-0 focus:border-indigo-500 cursor-pointer">
                                            <SelectValue placeholder={t("select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => <SelectItem key={c.id} value={c.id.toString()} className="cursor-pointer">{getLocalizedClassName(c.name)}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-gray-700">{t("section")} <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.section_id}
                                        onValueChange={(val) => setFormData({...formData, section_id: val})}
                                        disabled={!formData.class_id}
                                    >
                                        <SelectTrigger className="h-10 border-gray-200 rounded-md focus:ring-0 focus:border-indigo-500 cursor-pointer">
                                            <SelectValue placeholder={!formData.class_id ? t("select_class_first") : t("select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map(s => <SelectItem key={s.id} value={s.id.toString()} className="cursor-pointer">{getLocalizedSectionName(s.name)}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <Label className="text-xs font-bold text-gray-700">{t("question")} <span className="text-red-500">*</span></Label>
                            <div className="bg-white rounded-md">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.question}
                                    onChange={(content) => setFormData({...formData, question: content})}
                                    placeholder={t("enter_question_text")}
                                    className="h-[200px] pb-10"
                                />
                            </div>
                        </div>

                        {(formData.question_type === "Single Choice" || formData.question_type === "Multiple Choice") && (
                            <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("options_and_answer")}</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    {formData.options.map((opt, idx) => {
                                        const optionLetter = String.fromCharCode(65 + idx);
                                        return (
                                        <div key={idx} className="flex gap-3 items-center">
                                            <span className="text-xs font-bold text-gray-400">{optionLetter}.</span>
                                            <Input
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...formData.options];
                                                    newOpts[idx] = e.target.value;
                                                    setFormData({...formData, options: newOpts});
                                                }}
                                                placeholder={t("option_letter", { letter: optionLetter })}
                                                className="h-10 border-gray-100 bg-gray-50/30 rounded-lg"
                                            />
                                        </div>
                                    )})}
                                </div>
                                <div className="space-y-1.5 mt-4">
                                    <Label className="text-xs font-medium text-gray-700">{t("correct_answer")} <span className="text-red-500">*</span></Label>
                                    <Select value={formData.correct_answer} onValueChange={(val) => setFormData({...formData, correct_answer: val})}>
                                        <SelectTrigger className="h-10 border-gray-200 rounded-md focus:ring-0 focus:border-indigo-500 cursor-pointer">
                                            <SelectValue placeholder={t("select_correct_answer")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formData.options.map((opt, idx) => {
                                                const optionLetter = String.fromCharCode(65 + idx);
                                                return <SelectItem key={idx} value={opt || optionLetter} className="cursor-pointer">{optionLetter} - {opt || t("empty")}</SelectItem>;
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        {(formData.question_type === "True/False") && (
                            <div className="space-y-1.5 pt-4 border-t border-dashed border-gray-100">
                                <Label className="text-xs font-medium text-gray-700">{t("correct_answer")} <span className="text-red-500">*</span></Label>
                                <Select value={formData.correct_answer} onValueChange={(val) => setFormData({...formData, correct_answer: val})}>
                                    <SelectTrigger className="h-10 border-gray-200 rounded-md focus:ring-0 focus:border-indigo-500 cursor-pointer">
                                        <SelectValue placeholder={t("select_correct_answer")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="True" className="cursor-pointer">{t("true")}</SelectItem>
                                        <SelectItem value="False" className="cursor-pointer">{t("false")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-4 flex justify-end gap-3 bg-white">
                        {dialogMode !== "view" && (
                            <Button onClick={handleSave} className="bg-gradient-to-r from-[#F7A148] to-[#7778EC] hover:opacity-90 text-white border-0 h-9 px-8 rounded-md text-xs font-medium transition-opacity cursor-pointer">
                                {t("save")}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("delete_question")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("delete_question_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200 cursor-pointer">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md cursor-pointer">
                            {t("yes_delete_question")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
