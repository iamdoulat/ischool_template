"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { renderPdfHeader, renderPdfFooter } from "@/lib/pdf-utils";
import { useSettings } from "@/components/providers/settings-provider";
import { formatDate, cn } from "@/lib/utils";
import {
    Plus, Search, Copy, FileSpreadsheet, FileText, Printer, Columns,
    ChevronLeft, ChevronRight, CheckCircle2, XCircle, Eye, Pencil, Trash2,
    ListOrdered, LayoutGrid, FileSearch, UserCheck, ShieldClose, Calendar, Clock, Laptop, Trophy,
    Minus, BookOpen, Layers, CheckSquare, Square
} from "lucide-react";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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

const stripHtml = (html: string) => {
    if (!html) return "";
    return html
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .replace(/&nbsp;/g, ' ') // Strip non-breaking spaces
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();
};

export default function OnlineExamPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const { toast } = useToast();
    const { settings } = useSettings();
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
    const [formData, setFormData] = useState<{
        title: string;
        is_quiz: boolean;
        exam_from: string;
        exam_to: string;
        duration: string;
        attempt: number;
        passing_percentage: number;
        is_published: boolean;
        is_result_published: boolean;
        description: string;
        questions: { id: number; marks: number }[];
    }>({
        title: "",
        is_quiz: false,
        exam_from: "",
        exam_to: "",
        duration: "01:00:00",
        attempt: 1,
        passing_percentage: 33,
        is_published: false,
        is_result_published: false,
        description: "",
        questions: []
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Questions states
    const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
    const [questionSearch, setQuestionSearch] = useState("");
    
    // Assign Questions Dialog state
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [assignExam, setAssignExam] = useState<OnlineExam | null>(null);
    const [assignExamId, setAssignExamId] = useState<string | null>(null);
    const [assignQuestions, setAssignQuestions] = useState<{ id: number; marks: number }[]>([]);
    const [assignSearch, setAssignSearch] = useState("");
    const [assignSubjectFilter, setAssignSubjectFilter] = useState("all");
    const [assignTypeFilter, setAssignTypeFilter] = useState("all");
    const [assignLevelFilter, setAssignLevelFilter] = useState("all");
    const [assignBulkMarks, setAssignBulkMarks] = useState<string>("1");
    const [savingAssign, setSavingAssign] = useState(false);

    // Distinct metadata for questions
    const distinctSubjects = useMemo(() => {
        const set = new Set<string>();
        availableQuestions.forEach(q => { if (q.subject) set.add(q.subject); });
        return Array.from(set).sort();
    }, [availableQuestions]);

    const distinctTypes = useMemo(() => {
        const set = new Set<string>();
        availableQuestions.forEach(q => { if (q.question_type) set.add(q.question_type); });
        return Array.from(set).sort();
    }, [availableQuestions]);

    const filteredAssignQuestions = useMemo(() => {
        return availableQuestions.filter(q => {
            if (assignSearch.trim()) {
                const term = assignSearch.toLowerCase();
                const matchesQuestion = q.question?.toLowerCase().includes(term);
                const matchesSubject = q.subject?.toLowerCase().includes(term);
                const matchesType = q.question_type?.toLowerCase().includes(term);
                if (!matchesQuestion && !matchesSubject && !matchesType) return false;
            }
            if (assignSubjectFilter !== "all" && q.subject !== assignSubjectFilter) return false;
            if (assignTypeFilter !== "all" && q.question_type !== assignTypeFilter) return false;
            if (assignLevelFilter !== "all" && q.level?.toLowerCase() !== assignLevelFilter.toLowerCase()) return false;
            return true;
        });
    }, [availableQuestions, assignSearch, assignSubjectFilter, assignTypeFilter, assignLevelFilter]);

    const totalAssignMarks = useMemo(() => {
        return assignQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    }, [assignQuestions]);

    const handleSelectAllFiltered = () => {
        const currentMap = new Map(assignQuestions.map(q => [q.id, q.marks]));
        const defaultMarks = Math.max(1, parseInt(assignBulkMarks) || 1);
        filteredAssignQuestions.forEach(q => {
            if (!currentMap.has(q.id)) {
                currentMap.set(q.id, defaultMarks);
            }
        });
        setAssignQuestions(Array.from(currentMap.entries()).map(([id, marks]) => ({ id, marks })));
    };

    const handleDeselectAllFiltered = () => {
        const filteredIds = new Set(filteredAssignQuestions.map(q => q.id));
        setAssignQuestions(prev => prev.filter(q => !filteredIds.has(q.id)));
    };

    const handleApplyBulkMarks = () => {
        const marksNum = Math.max(1, parseInt(assignBulkMarks) || 1);
        setAssignQuestions(prev => prev.map(q => ({ ...q, marks: marksNum })));
        toast({ title: "Marks Updated", description: `Applied ${marksNum} marks to all ${assignQuestions.length} selected questions.` });
    };

    const updateQuestionMarks = (id: number, marks: number) => {
        const validMarks = Math.max(1, marks);
        setAssignQuestions(prev => prev.map(q => q.id === id ? { ...q, marks: validMarks } : q));
    };

    const toggleQuestion = (id: number) => {
        setAssignQuestions(prev => {
            const exists = prev.some(q => q.id === id);
            if (exists) {
                return prev.filter(q => q.id !== id);
            } else {
                return [...prev, { id, marks: Math.max(1, parseInt(assignBulkMarks) || 1) }];
            }
        });
    };
    
    // View Exam Details Dialog state
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewExamDetails, setViewExamDetails] = useState<any>(null);

    const fetchAvailableQuestions = async () => {
        try {
            const response = await api.get('/online-examination/questions', {
                params: { per_page: 1000 }
            });
            const qList = response.data?.data || [];
            setAvailableQuestions(Array.isArray(qList) ? qList : (qList.data || []));
        } catch (error) {
            console.error("Failed to fetch questions", error);
        }
    };

    useEffect(() => {
        fetchExams();
    }, [currentPage, itemsPerPage, searchTerm, statusTab]);

    useEffect(() => {
        fetchAvailableQuestions();
    }, []);

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
            tt.error("failed_to_fetch_exams");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.exam_from || !formData.exam_to) {
            tt.error("please_fill_all_required_fields");
            return;
        }

        const payload = {
            ...formData,
            exam_from: formData.exam_from.includes("T") ? formData.exam_from.replace("T", " ") + ":00" : formData.exam_from,
            exam_to: formData.exam_to.includes("T") ? formData.exam_to.replace("T", " ") + ":00" : formData.exam_to,
        };

        try {
            if (dialogMode === "edit" && selectedId) {
                await api.put(`/online-examination/online-exams/${selectedId}`, payload);
                tt.success("exam_updated_successfully");
            } else {
                await api.post('/online-examination/online-exams', payload);
                tt.success("exam_created_successfully");
            }
            setIsDialogOpen(false);
            fetchExams();
        } catch (error) {
            tt.error("failed_to_save_exam");
        }
    };

    const handleEdit = async (exam: OnlineExam) => {
        setLoading(true);
        try {
            const response = await api.get(`/online-examination/online-exams/${exam.id}`);
            const examDetails = response.data;
            setDialogMode("edit");
            setSelectedId(exam.id);
            setFormData({
                title: examDetails.title || "",
                is_quiz: !!examDetails.is_quiz,
                exam_from: examDetails.exam_from ? examDetails.exam_from.replace(" ", "T").substring(0, 16) : "",
                exam_to: examDetails.exam_to ? examDetails.exam_to.replace(" ", "T").substring(0, 16) : "",
                duration: examDetails.duration || "01:00:00",
                attempt: examDetails.attempt || 1,
                passing_percentage: examDetails.passing_percentage || 33,
                is_published: !!examDetails.is_published,
                is_result_published: !!examDetails.is_result_published,
                description: examDetails.description || "",
                questions: (examDetails.questions || []).map((q: any) => ({
                    id: q.id,
                    marks: q.pivot?.marks || 1
                }))
            });
            setIsDialogOpen(true);
        } catch (error) {
            tt.error("failed_to_load_exam_details");
        } finally {
            setLoading(false);
        }
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/online-examination/online-exams/${deleteId}`);
            tt.success("exam_deleted_successfully");
            fetchExams();
        } catch (error) {
            tt.error("failed_to_delete_exam");
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
            description: "",
            questions: []
        });
        setIsDialogOpen(true);
    };

    const openAssignDialog = async (exam: OnlineExam) => {
        setAssignExam(exam);
        setAssignExamId(exam.id);
        setLoading(true);
        try {
            const response = await api.get(`/online-examination/online-exams/${exam.id}`);
            const examDetails = response.data;
            setAssignQuestions((examDetails.questions || []).map((q: any) => ({
                id: q.id,
                marks: q.pivot?.marks || 1
            })));
            setAssignSearch("");
            setAssignSubjectFilter("all");
            setAssignTypeFilter("all");
            setAssignLevelFilter("all");
            setIsAssignDialogOpen(true);
        } catch (error) {
            tt.error("failed_to_load_exam_details");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAssign = async () => {
        if (!assignExamId) return;
        setSavingAssign(true);
        try {
            await api.post(`/online-examination/online-exams/${assignExamId}/assign-questions`, {
                questions: assignQuestions
            });
            tt.success("questions_assigned_successfully");
            setIsAssignDialogOpen(false);
            fetchExams();
        } catch (error) {
            tt.error("failed_to_assign_questions");
        } finally {
            setSavingAssign(false);
        }
    };

    const openViewDialog = async (exam: OnlineExam) => {
        setLoading(true);
        try {
            const response = await api.get(`/online-examination/online-exams/${exam.id}`);
            setViewExamDetails(response.data);
            setIsViewDialogOpen(true);
        } catch (error) {
            tt.error("failed_to_load_exam_details");
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = async () => {
        if (exams.length === 0) {
            tt.error("no_data_to_export");
            return;
        }
        let invoicePrintSettings = {};
        try {
            const res = await api.get("system-setting/print-settings");
            if (res.data?.status === "success") {
                invoicePrintSettings = (res.data.data || []).find((s: any) => s.type === "Online Exam") || {};
            }
        } catch (err) {
            console.error("Could not fetch print settings", err);
        }
        const baseApiUrl = api.defaults.baseURL?.replace('/api/v1', '') || "";
        const doc = new jsPDF();
        const startY = await renderPdfHeader(doc, settings, invoicePrintSettings, baseApiUrl, "ONLINE EXAMINATION LIST");
        autoTable(doc, {
            startY,
            head: [["Title", "Type", "Questions", "Attempt", "From", "To", "Duration", "Published"]],
            body: exams.map(e => [
                e.title,
                e.is_quiz ? "Quiz" : "Exam",
                String(e.questions_count),
                String(e.attempt),
                new Date(e.exam_from).toLocaleDateString(),
                new Date(e.exam_to).toLocaleDateString(),
                e.duration,
                e.is_published ? "Yes" : "No"
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [99, 102, 241] },
        });
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        renderPdfFooter(doc, (invoicePrintSettings as any).footer_content || "", finalY);
        doc.save("online_exams.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Laptop className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("online_examinations")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("manage_digital_tests_quizzes_and_results")}</p>
                    </div>
                </div>
                <Button onClick={openAddDialog} className="btn-gradient text-white gap-2 h-11 px-8 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full">
                    <Plus className="h-4 w-4" /> {t("add_exam")}
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 pt-5 bg-gray-50/30">
                    <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full">
                        <TabsList className="bg-transparent border-b border-gray-100 rounded-none w-full justify-start h-auto p-0 gap-8">
                            <TabsTrigger
                                value="upcoming"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 pb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 data-[state=active]:text-indigo-600 transition-all"
                            >
                                {t("upcoming_exams")}
                            </TabsTrigger>
                            <TabsTrigger
                                value="closed"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 pb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 data-[state=active]:text-indigo-600 transition-all"
                            >
                                {t("closed_exams")}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={t("search_exams")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 mr-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">{t("rows")}:</span>
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
                                <Button variant="ghost" size="icon" onClick={exportToPDF} title="Export PDF" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => window.print()} title="Print" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <Columns className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="!bg-[#f3f4f6] text-[11px] uppercase font-bold text-gray-600">
                                <TableRow className="hover:bg-transparent border-gray-50">
                                    <TableHead className="py-4 px-6">{t("exam_title")}</TableHead>
                                    <TableHead className="py-4 px-6 text-center">{t("quiz")}</TableHead>
                                    <TableHead className="py-4 px-6">{t("questions")}</TableHead>
                                    <TableHead className="py-4 px-6 text-center">{t("attempt")}</TableHead>
                                    <TableHead className="py-4 px-6">{t("exam_period")}</TableHead>
                                    <TableHead className="py-4 px-6">{t("duration")}</TableHead>
                                    <TableHead className="py-4 px-6 text-center">{t("published")}</TableHead>
                                    <TableHead className="py-4 px-6 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">{t("syncing_exams")}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : exams.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center text-gray-400 text-sm italic">
                                            {t("no_exams_found", { status: statusTab })}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    exams.map((exam) => (
                                        <TableRow key={exam.id} className="text-[12px] text-gray-600 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer group border-b last:border-0 border-gray-50 transition-colors">
                                            <TableCell className="py-4 px-6 font-bold text-gray-800 uppercase tracking-tight">{exam.title}</TableCell>
                                            <TableCell className="text-center">
                                                {exam.is_quiz ? (
                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 border">{t("yes")}</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-gray-500 border-gray-300 bg-gray-50 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5">{t("no")}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-indigo-600 flex items-center gap-1.5"><ListOrdered className="h-3 w-3" /> {exam.questions_count} {t("total")}</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase flex items-center gap-1.5"><FileSearch className="h-3 w-3" /> {exam.descriptive_questions_count} {t("descriptive")}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-4 px-6">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-bold">{exam.attempt}</span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col gap-1 text-[10px] font-bold">
                                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1.5 w-fit"><Calendar className="h-3 w-3" /> {formatDate(exam.exam_from?.replace(" ", "T"), "dd/MM/yyyy h:mm a")}</span>
                                                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1.5 w-fit"><Calendar className="h-3 w-3" /> {formatDate(exam.exam_to?.replace(" ", "T"), "dd/MM/yyyy h:mm a")}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <span className="flex items-center gap-1.5 font-bold text-gray-700"><Clock className="h-3.5 w-3.5 text-indigo-400" /> {exam.duration}</span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{t("exam")}:</span>
                                                        {exam.is_published ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-300" />}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{t("result")}:</span>
                                                        {exam.is_result_published ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-300" />}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5 flex-wrap max-w-[200px] ml-auto">
                                                    <Button size="icon" variant="ghost" title={t("assign_questions")} onClick={() => openAssignDialog(exam)} className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("edit")} onClick={() => handleEdit(exam)} className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("view")} onClick={() => openViewDialog(exam)} className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title={t("delete")} onClick={() => setDeleteId(exam.id)} className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md">
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
                            {t("showing_x_to_y_of_z", {
                                from: ((currentPage - 1) * itemsPerPage) + 1,
                                to: Math.min(currentPage * itemsPerPage, totalEntries),
                                total: totalEntries
                            })}
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
                <DialogContent className="w-full sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[1150px] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                        
                        <div className="relative z-10 flex justify-between items-center pr-8">
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3 drop-shadow-md">
                                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                                        <Laptop className="h-5 w-5 text-white" />
                                    </div>
                                    {dialogMode === "edit" ? t("edit_online_exam") : t("add_online_exam")}
                                </DialogTitle>
                                <p className="text-white/80 text-[11px] font-medium mt-1 leading-relaxed">
                                    {t("configure_exam_settings_and_publication_parameters")}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 max-h-[70vh] overflow-y-auto bg-gray-50/50">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Column 1: Basic & Timing Info (4/12) */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-5 w-1 rounded-full bg-indigo-500"></div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Basic Info</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("exam_title")} <span className="text-red-500">*</span></Label>
                                            <Input
                                                value={formData.title}
                                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                                placeholder={t("eg_final_revision_test")}
                                                className="h-10 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none text-xs"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-gray-50/85 transition-colors rounded-xl border border-gray-100 h-10">
                                            <Label className="text-xs font-bold text-gray-700">{t("quiz_mode")}</Label>
                                            <Switch 
                                                checked={formData.is_quiz} 
                                                onCheckedChange={(val) => setFormData({...formData, is_quiz: val})}
                                                className="data-[state=checked]:bg-indigo-500 scale-90"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-5 w-1 rounded-full bg-orange-400"></div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Timing</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("exam_from")} <span className="text-red-500">*</span></Label>
                                            <DateTimePicker 
                                                value={formData.exam_from} 
                                                onChange={(val) => setFormData({...formData, exam_from: val})}
                                                placeholder="DD/MM/YYYY HH:MM"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("exam_to")} <span className="text-red-500">*</span></Label>
                                            <DateTimePicker 
                                                value={formData.exam_to} 
                                                onChange={(val) => setFormData({...formData, exam_to: val})}
                                                placeholder="DD/MM/YYYY HH:MM"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold text-gray-400 uppercase">{t("duration")}</Label>
                                            <Input 
                                                value={formData.duration} 
                                                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                                className="h-9 border-gray-100 bg-gray-50/30 text-center text-xs p-1"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold text-gray-400 uppercase">{t("attempts")}</Label>
                                            <Input 
                                                type="number"
                                                value={formData.attempt} 
                                                onChange={(e) => setFormData({...formData, attempt: parseInt(e.target.value) || 1})}
                                                className="h-9 border-gray-100 bg-gray-50/30 text-center text-xs p-1"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold text-gray-400 uppercase">Pass %</Label>
                                            <Input 
                                                type="number"
                                                value={formData.passing_percentage} 
                                                onChange={(e) => setFormData({...formData, passing_percentage: parseInt(e.target.value) || 33})}
                                                className="h-9 border-gray-100 bg-gray-50/30 text-center text-xs p-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Visibility & Description (4/12) */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-5 w-1 rounded-full bg-emerald-500"></div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Settings</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-emerald-50/30 hover:bg-emerald-50 transition-colors rounded-xl border border-emerald-100/50 shadow-sm h-10">
                                            <Label className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> {t("publish_exam")}</Label>
                                            <Switch 
                                                checked={formData.is_published} 
                                                onCheckedChange={(val) => setFormData({...formData, is_published: val})}
                                                className="data-[state=checked]:bg-emerald-500 scale-90"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-indigo-50/30 hover:bg-indigo-50 transition-colors rounded-xl border border-indigo-100/50 shadow-sm h-10">
                                            <Label className="text-[11px] font-bold text-indigo-800 flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> {t("publish_result")}</Label>
                                            <Switch 
                                                checked={formData.is_result_published} 
                                                onCheckedChange={(val) => setFormData({...formData, is_result_published: val})}
                                                className="data-[state=checked]:bg-indigo-500 scale-90"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3 flex flex-col h-[230px]">
                                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("description")}</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder={t("enter_exam_instructions_or_details")}
                                        className="flex-1 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 p-3 text-xs resize-none"
                                    />
                                </div>
                            </div>

                            {/* Column 3: Question Assignment (4/12) */}
                            <div className="lg:col-span-4 flex flex-col space-y-6">
                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3 flex flex-col h-[395px]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-1 rounded-full bg-indigo-500"></div>
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Assign Questions</h3>
                                        </div>
                                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                                            {(formData.questions || []).length} {t("selected")}
                                        </span>
                                    </div>

                                    <Input
                                        placeholder="Search questions..."
                                        value={questionSearch}
                                        onChange={(e) => setQuestionSearch(e.target.value)}
                                        className="h-9 text-xs border-gray-100 bg-gray-50/50 shadow-none focus:ring-indigo-500"
                                    />

                                    <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50/20 space-y-2 max-h-[260px]">
                                        {availableQuestions.filter(q => 
                                            q.question?.toLowerCase().includes(questionSearch.toLowerCase()) ||
                                            q.subject?.toLowerCase().includes(questionSearch.toLowerCase())
                                        ).length === 0 ? (
                                            <p className="text-[10px] text-gray-400 text-center py-12">No questions available</p>
                                        ) : (
                                            availableQuestions.filter(q => 
                                                q.question?.toLowerCase().includes(questionSearch.toLowerCase()) ||
                                                q.subject?.toLowerCase().includes(questionSearch.toLowerCase())
                                            ).map((q) => {
                                                const isChecked = (formData.questions || []).some((sq: any) => sq.id === q.id);
                                                const selectedQ = (formData.questions || []).find((sq: any) => sq.id === q.id);
                                                const marksValue = selectedQ?.marks || 1;

                                                return (
                                                    <div key={q.id} className="flex items-start justify-between p-2 rounded-lg bg-white border border-gray-100 hover:border-indigo-100 transition-colors">
                                                        <div className="flex items-start gap-2 max-w-[70%]">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    let updated = [...(formData.questions || [])];
                                                                    if (e.target.checked) {
                                                                        updated.push({ id: q.id, marks: 1 });
                                                                    } else {
                                                                        updated = updated.filter((sq: any) => sq.id !== q.id);
                                                                    }
                                                                    setFormData({ ...formData, questions: updated });
                                                                }}
                                                                className="mt-1 accent-indigo-600 h-3.5 w-3.5 rounded"
                                                            />
                                                            <div className="space-y-0.5">
                                                                <p className="text-[11px] font-bold text-gray-700 line-clamp-2">{stripHtml(q.question)}</p>
                                                                <span className="text-[8px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded uppercase font-black">
                                                                    {q.subject}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {isChecked && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[9px] text-gray-400 font-bold">Marks:</span>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={marksValue}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value) || 1;
                                                                        const updated = (formData.questions || []).map((sq: any) => 
                                                                            sq.id === q.id ? { ...sq, marks: val } : sq
                                                                        );
                                                                        setFormData({ ...formData, questions: updated });
                                                                    }}
                                                                    className="w-10 h-7 border border-gray-200 rounded text-center text-xs font-bold focus:outline-indigo-500"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-gray-50/50 flex justify-end gap-3 border-t border-gray-100">
                        <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="h-10 px-6 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-200">
                            {t("cancel")}
                        </Button>
                        <Button onClick={handleSave} className="btn-gradient text-white h-10 px-10 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-orange-200/50">
                            {dialogMode === "edit" ? t("update_exam") : t("save_exam")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Enhanced Assign Questions to Exam Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent className="w-full sm:max-w-4xl lg:max-w-5xl rounded-3xl border-0 shadow-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
                    {/* Header */}
                    <DialogHeader className="p-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <DialogTitle className="text-xl font-black flex items-center gap-2.5 drop-shadow-sm">
                                    <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                        <Plus className="h-5 w-5 text-white" />
                                    </div>
                                    <span>Assign Questions to Exam</span>
                                </DialogTitle>
                                <p className="text-white/80 text-xs font-medium">
                                    {assignExam?.title ? `Exam: ${assignExam.title}` : "Select questions from the question bank and configure their scores"}
                                </p>
                            </div>

                            {/* Live Exam Summary Pills */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 text-right">
                                    <div className="text-[10px] text-white/80 uppercase font-bold tracking-wider">Selected</div>
                                    <div className="text-sm font-black text-white">{assignQuestions.length} Questions</div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 text-right">
                                    <div className="text-[10px] text-white/80 uppercase font-bold tracking-wider">Total Marks</div>
                                    <div className="text-sm font-black text-amber-300">{totalAssignMarks} Marks</div>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Filter & Toolbar Area */}
                    <div className="p-4 bg-gray-50/90 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            {/* Search */}
                            <div className="sm:col-span-4 relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search question, subject..."
                                    value={assignSearch}
                                    onChange={(e) => setAssignSearch(e.target.value)}
                                    className="h-9 pl-9 text-xs border-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-none"
                                />
                            </div>

                            {/* Subject filter */}
                            <div className="sm:col-span-3">
                                <Select value={assignSubjectFilter} onValueChange={setAssignSubjectFilter}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 bg-white dark:bg-gray-800 rounded-lg">
                                        <SelectValue placeholder="All Subjects" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Subjects ({availableQuestions.length})</SelectItem>
                                        {distinctSubjects.map(sub => (
                                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Type filter */}
                            <div className="sm:col-span-3">
                                <Select value={assignTypeFilter} onValueChange={setAssignTypeFilter}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 bg-white dark:bg-gray-800 rounded-lg">
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {distinctTypes.map(t => (
                                            <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bulk select / deselect */}
                            <div className="sm:col-span-2 flex gap-1 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAllFiltered}
                                    className="h-9 text-[10.5px] font-bold text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 flex-1"
                                    title="Select all currently filtered questions"
                                >
                                    Select All
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDeselectAllFiltered}
                                    className="h-9 text-[10.5px] font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 px-2"
                                    title="Deselect filtered"
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>

                        {/* Bulk Marks Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-200/60 dark:border-gray-800 text-xs">
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                <span>Showing <strong>{filteredAssignQuestions.length}</strong> of <strong>{availableQuestions.length}</strong> questions</span>
                                {assignQuestions.length > 0 && (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                                        {assignQuestions.length} Selected
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-500 uppercase">Set Marks for Selected:</span>
                                <div className="flex items-center gap-1">
                                    <Input
                                        type="number"
                                        min="1"
                                        value={assignBulkMarks}
                                        onChange={(e) => setAssignBulkMarks(e.target.value)}
                                        className="h-7 w-16 text-center text-xs font-bold bg-white dark:bg-gray-800 border-gray-200 p-1"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleApplyBulkMarks}
                                        disabled={assignQuestions.length === 0}
                                        className="h-7 text-[10.5px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 rounded-md"
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Question Cards List */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gray-50/40 dark:bg-gray-950">
                        {filteredAssignQuestions.length === 0 ? (
                            <div className="py-16 text-center space-y-2">
                                <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto text-gray-400">
                                    <Search className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No questions found</p>
                                <p className="text-xs text-gray-400">Try adjusting your search query or subject filters.</p>
                            </div>
                        ) : (
                            filteredAssignQuestions.map((q, idx) => {
                                const isChecked = assignQuestions.some((sq) => sq.id === q.id);
                                const selectedQ = assignQuestions.find((sq) => sq.id === q.id);
                                const marksValue = selectedQ?.marks || 1;

                                return (
                                    <div
                                        key={q.id}
                                        onClick={() => toggleQuestion(q.id)}
                                        className={cn(
                                            "p-4 rounded-2xl border transition-all cursor-pointer relative group",
                                            isChecked
                                                ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700 shadow-sm"
                                                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-indigo-200 hover:shadow-xs"
                                        )}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            {/* Left: Checkbox & Question Content */}
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleQuestion(q.id)}
                                                        className="h-4 w-4 accent-indigo-600 rounded cursor-pointer mt-0.5"
                                                    />
                                                </div>

                                                <div className="space-y-2 flex-1">
                                                    {/* Question Text */}
                                                    <div className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">#{idx + 1}.</span>
                                                        {stripHtml(q.question)}
                                                    </div>

                                                    {/* Badges */}
                                                    <div className="flex flex-wrap gap-1.5 items-center">
                                                        {q.subject && (
                                                            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full font-bold uppercase">
                                                                {q.subject}
                                                            </span>
                                                        )}
                                                        {q.question_type && (
                                                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full font-bold uppercase">
                                                                {q.question_type.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                        {q.level && (
                                                            <span className={cn(
                                                                "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border",
                                                                q.level.toLowerCase() === 'easy' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                q.level.toLowerCase() === 'hard' ? "bg-rose-50 text-rose-700 border-rose-200" :
                                                                "bg-amber-50 text-amber-700 border-amber-200"
                                                            )}>
                                                                {q.level}
                                                            </span>
                                                        )}
                                                        {q.class_name && (
                                                            <span className="text-[9px] text-gray-400 font-medium">
                                                                Class: {q.class_name} {q.section ? `(${q.section})` : ""}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Options Preview (if array) */}
                                                    {Array.isArray(q.options) && q.options.length > 0 && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-gray-600 dark:text-gray-400">
                                                            {q.options.slice(0, 4).map((opt: any, optIdx: number) => (
                                                                <div key={optIdx} className="bg-gray-50/80 dark:bg-gray-800/80 px-2.5 py-1 rounded-md border border-gray-100 dark:border-gray-800 truncate">
                                                                    <span className="font-bold text-gray-500 mr-1">{String.fromCharCode(65 + optIdx)}.</span>
                                                                    {typeof opt === 'string' ? opt : (opt.option || opt.text || "")}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Marks Stepper */}
                                            <div
                                                className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span className="text-[10px] uppercase font-bold text-gray-400">Score / Marks</span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={!isChecked || marksValue <= 1}
                                                        onClick={() => updateQuestionMarks(q.id, marksValue - 1)}
                                                        className="h-7 w-7 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        disabled={!isChecked}
                                                        value={marksValue}
                                                        onChange={(e) => updateQuestionMarks(q.id, parseInt(e.target.value) || 1)}
                                                        className="w-14 h-7 text-center text-xs font-bold border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-1 shadow-none disabled:opacity-50"
                                                    />
                                                    <button
                                                        type="button"
                                                        disabled={!isChecked}
                                                        onClick={() => updateQuestionMarks(q.id, marksValue + 1)}
                                                        className="h-7 w-7 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Dialog Footer */}
                    <DialogFooter className="p-4 sm:p-5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between gap-3 shrink-0">
                        <div className="text-xs text-gray-500 font-medium">
                            Total: <strong className="text-indigo-600 dark:text-indigo-400">{assignQuestions.length}</strong> selected (<strong>{totalAssignMarks}</strong> Marks)
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={() => setIsAssignDialogOpen(false)}
                                variant="outline"
                                className="h-9 px-5 rounded-full text-xs font-bold uppercase border-gray-200"
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSaveAssign}
                                disabled={savingAssign}
                                className="btn-gradient text-white h-9 px-7 rounded-full text-xs font-bold uppercase shadow-lg shadow-orange-200/50"
                            >
                                {savingAssign ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Exam Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="w-full sm:max-w-2xl rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
                    {viewExamDetails && (
                        <>
                            <DialogHeader className="p-6 bg-gradient-to-r from-[#F7A148] to-[#7778EC] text-white">
                                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                    <Eye className="h-5 w-5" /> {viewExamDetails.title}
                                </DialogTitle>
                                <div className="flex gap-4 mt-2 text-xs text-indigo-100">
                                    <span>Attempt Limit: <strong className="text-white">{viewExamDetails.attempt}</strong></span>
                                    <span>•</span>
                                    <span>Passing: <strong className="text-white">{viewExamDetails.passing_percentage}%</strong></span>
                                    <span>•</span>
                                    <span>Duration: <strong className="text-white">{viewExamDetails.duration}</strong></span>
                                </div>
                            </DialogHeader>

                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto bg-gray-50/50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
                                        <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Exam Period Start</Label>
                                        <p className="text-xs font-bold text-gray-700">{formatDate(viewExamDetails.exam_from?.replace(" ", "T"), "dd/MM/yyyy h:mm a")}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
                                        <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Exam Period End</Label>
                                        <p className="text-xs font-bold text-gray-700">{formatDate(viewExamDetails.exam_to?.replace(" ", "T"), "dd/MM/yyyy h:mm a")}</p>
                                    </div>
                                </div>

                                {viewExamDetails.description && (
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
                                        <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Instructions</Label>
                                        <p className="text-xs text-gray-600 whitespace-pre-wrap">{viewExamDetails.description}</p>
                                    </div>
                                )}

                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Assigned Questions</h3>
                                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold uppercase text-[9px] px-2 py-0.5">{viewExamDetails.questions?.length || 0} Questions</Badge>
                                    </div>

                                    <div className="space-y-3">
                                        {(!viewExamDetails.questions || viewExamDetails.questions.length === 0) ? (
                                            <p className="text-xs text-gray-400 italic text-center py-6">No questions assigned to this exam yet.</p>
                                        ) : (
                                            viewExamDetails.questions.map((q: any, idx: number) => (
                                                <div key={q.id} className="flex justify-between items-start p-3 rounded-lg bg-gray-50/50 border border-gray-50">
                                                    <div className="space-y-1 max-w-[80%]">
                                                        <p className="text-xs font-bold text-gray-700"><span className="text-indigo-500 font-black mr-1">{idx+1}.</span> {stripHtml(q.question)}</p>
                                                        <div className="flex gap-2">
                                                            <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-black uppercase">{q.subject}</span>
                                                            <span className="text-[8px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded font-black uppercase">{q.question_type}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50/60 border border-indigo-100/50 px-2.5 py-1 rounded-lg">{q.pivot?.marks || 1} M</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="p-6 bg-gray-50/50 flex justify-end border-t border-gray-100">
                                <Button onClick={() => setIsViewDialogOpen(false)} className="btn-gradient text-white h-10 px-8 rounded-full text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50">
                                    {t("close")}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("delete_online_exam")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("are_you_sure_delete_online_exam")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            {t("yes_delete_exam")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
