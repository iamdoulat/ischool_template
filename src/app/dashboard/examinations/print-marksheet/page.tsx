"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Download, Printer, UserCircle, Calendar, Filter, Loader2 } from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { MarksheetTemplateLayout, MarksheetData } from "@/components/examination/MarksheetTemplateLayout";
import { useRef } from "react";

interface Student {
    id: string;
    admission_no: string;
    name: string;
    last_name: string;
    father_name: string;
    dob: string;
    gender: string;
    category: string;
    phone: string;
}

interface Exam {
    id: string | number;
    name: string;
}

interface ExamGroup {
    id: string | number;
    name: string;
    exam_type: string;
    exams?: Exam[];
}

interface Template {
    id: string | number;
    name: string;
}

interface SessionItem {
    id: string | number;
    session: string;
}

interface ClassItem {
    id: string | number;
    name: string;
    sections?: SectionItem[];
}

interface SectionItem {
    id: string | number;
    name: string;
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="px-6 py-4">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function PrintMarksheetPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Criteria Data
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [examGroups, setExamGroups] = useState<ExamGroup[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [sessions, setSessions] = useState<SessionItem[]>([]);

    // Selected Criteria
    const [selectedCriteria, setSelectedCriteria] = useState({
        exam_group_id: "",
        exam_id: "",
        session_id: "",
        school_class_id: "",
        section_id: "",
        template_id: ""
    });

    // Student List
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [examSubjectCount, setExamSubjectCount] = useState<number>(0);
    const [printingStudentId, setPrintingStudentId] = useState<string | null>(null);
    const [marksheetData, setMarksheetData] = useState<MarksheetData | null>(null);
    const marksheetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [criteriaRes, classesRes] = await Promise.all([
                api.get('/examination/print-marksheet/criteria'),
                api.get('/academics/classes?no_paginate=true')
            ]);

            const cData = criteriaRes.data?.data || criteriaRes.data || {};
            setExamGroups(cData.exam_groups || []);
            setTemplates(cData.marksheet_templates || cData.admit_card_templates || []);
            setSessions(cData.sessions || []);

            const clsData = classesRes.data?.data || classesRes.data || [];
            setClasses(Array.isArray(clsData) ? clsData : (clsData.data || []));
        } catch (error) {
            tt.error("failed_to_load_criteria_data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCriteria.exam_group_id) {
            const group = examGroups.find(g => g.id.toString() === selectedCriteria.exam_group_id);
            setExams(group?.exams || []);
        } else {
            setExams([]);
        }
        setSelectedCriteria(prev => ({ ...prev, exam_id: "" }));
    }, [selectedCriteria.exam_group_id, examGroups]);

    useEffect(() => {
        if (selectedCriteria.school_class_id) {
            // Fetch sections from API rather than relying on nested data
            api.get(`/academics/sections?school_class_id=${selectedCriteria.school_class_id}&no_paginate=true`)
                .then(res => setSections(res.data?.data || res.data || []))
                .catch(() => setSections([]));
        } else {
            setSections([]);
        }
        setSelectedCriteria(prev => ({ ...prev, section_id: "" }));
    }, [selectedCriteria.school_class_id]);

    const handleSearch = async () => {
        if (!selectedCriteria.school_class_id || !selectedCriteria.section_id || !selectedCriteria.exam_id) {
            tt.error("please_select_all_required_fields");
            return;
        }

        setSearching(true);
        try {
            const [studentsRes, schedulesRes] = await Promise.all([
                api.post('/examination/print-marksheet/search', {
                    exam_id: selectedCriteria.exam_id,
                    school_class_id: selectedCriteria.school_class_id,
                    section_id: selectedCriteria.section_id,
                    session_id: selectedCriteria.session_id
                }),
                api.post('/examination/exam-schedules/search', {
                    exam_id: selectedCriteria.exam_id
                })
            ]);
            const resData = studentsRes.data?.data || studentsRes.data || [];
            setStudents(Array.isArray(resData) ? resData : (resData.data || []));
            const schedules = schedulesRes.data || [];
            setExamSubjectCount(Array.isArray(schedules) ? schedules.length : 0);
            setSelectedIds([]);
        } catch (error) {
            tt.error("failed_to_fetch_students");
        } finally {
            setSearching(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === students.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students.map(s => s.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const fetchMarksheetData = async (studentId: string) => {
        try {
            const res = await api.post('/examination/print-marksheet/generate', {
                student_id: studentId,
                exam_id: selectedCriteria.exam_id
            });
            const data = res.data;
            setMarksheetData(data);
            return data;
        } catch (error: any) {
            tt.error(error?.response?.data?.message || "Failed to fetch marksheet data");
            return null;
        }
    };

    // Convert all <img> in the container to inline base64 so html2canvas can render them
    const inlineAllImages = async (container: HTMLElement) => {
        const images = container.querySelectorAll('img');
        const promises = Array.from(images).map(async (img) => {
            const src = img.getAttribute('src');
            if (!src || src.startsWith('data:')) return;
            try {
                // Use a temporary Image to draw onto a canvas → base64
                const tmpImg = new Image();
                tmpImg.crossOrigin = 'anonymous';
                await new Promise<void>((resolve, reject) => {
                    tmpImg.onload = () => resolve();
                    tmpImg.onerror = () => reject(new Error('img load failed'));
                    tmpImg.src = src;
                });
                const cvs = document.createElement('canvas');
                cvs.width = tmpImg.naturalWidth;
                cvs.height = tmpImg.naturalHeight;
                const ctx = cvs.getContext('2d')!;
                ctx.drawImage(tmpImg, 0, 0);
                img.src = cvs.toDataURL('image/png');
            } catch {
                // crossOrigin load failed — try fetching through our Next.js proxy
                try {
                    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
                    const res = await fetch(proxyUrl);
                    const blob = await res.blob();
                    const dataUrl = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                    img.src = dataUrl;
                } catch {
                    console.warn('Could not inline image:', src);
                }
            }
        });
        await Promise.all(promises);
    };

    const generatePdf = async () => {
        if (!marksheetRef.current) return null;
        // Pre-convert all images to base64 so html2canvas can render them
        await inlineAllImages(marksheetRef.current);
        const canvas = await html2canvas(marksheetRef.current, {
            scale: 2,
            useCORS: true,
            logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        return pdf;
    };

    const handleDownload = async (studentId: string) => {
        setPrintingStudentId(studentId);
        const data = await fetchMarksheetData(studentId);
        if (data) {
            // Need slight delay to allow React to render the hidden marksheet
            setTimeout(async () => {
                const pdf = await generatePdf();
                if (pdf) {
                    pdf.save(`Marksheet_${data.student.admission_no}.pdf`);
                }
                setPrintingStudentId(null);
            }, 500);
        } else {
            setPrintingStudentId(null);
        }
    };

    const handlePrint = async (studentId: string) => {
        setPrintingStudentId(studentId);
        const data = await fetchMarksheetData(studentId);
        if (data) {
            setTimeout(async () => {
                const pdf = await generatePdf();
                if (pdf) {
                    pdf.autoPrint();
                    const blob = pdf.output('blob');
                    const url = URL.createObjectURL(blob);
                    
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = url;
                    document.body.appendChild(iframe);
                    
                    iframe.onload = () => {
                        setTimeout(() => {
                            iframe.focus();
                            iframe.contentWindow?.print();
                            setPrintingStudentId(null);
                        }, 100);
                    };
                } else {
                    setPrintingStudentId(null);
                }
            }, 500);
        } else {
            setPrintingStudentId(null);
        }
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header Section */}
            <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <Printer className="h-6 w-6 text-indigo-500" />
                        {t("print_marksheet")}
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t("print_marksheet_subtitle")}</p>
                </div>
            </div>

            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("choose_exam_class_template")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                {t("exam_group")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedCriteria.exam_group_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, exam_group_id: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_group")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {examGroups.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.name} ({g.exam_type})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                {t("exam")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedCriteria.exam_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, exam_id: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_exam")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                {t("session")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedCriteria.session_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, session_id: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_session")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.session}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                {t("class")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedCriteria.school_class_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, school_class_id: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_class")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                {t("section")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedCriteria.section_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, section_id: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_section")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                {t("template")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedCriteria.template_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, template_id: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_template")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleSearch}
                            disabled={searching}
                            className="btn-gradient text-white px-10 h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-2"
                        >
                            {searching ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search className="h-4 w-4" />}
                            {t("search_students")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Student List Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <UserCircle className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("x_students_found", { count: students.length })}</p>
                        </div>
                    </div>
                    {selectedIds.length > 0 && (
                        <Button className="btn-gradient text-white h-10 px-8 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 flex gap-2">
                            <Download className="h-3.5 w-3.5" /> {t("bulk_download")} ({selectedIds.length})
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="!bg-[#f3f4f6] text-[10px] uppercase font-bold text-gray-500">
                                <TableRow className="hover:bg-transparent border-gray-50">
                                    <TableHead className="w-[60px] px-6 text-center">
                                        <Checkbox
                                            className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 transition-all"
                                            checked={students.length > 0 && selectedIds.length === students.length}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="py-4 px-6">{t("admission_no")}</TableHead>
                                    <TableHead className="py-4 px-6">{t("student_name")}</TableHead>
                                    <TableHead className="py-4 px-6">{t("father_name")}</TableHead>
                                    <TableHead className="py-4 px-6">{t("date_of_birth")}</TableHead>
                                    <TableHead className="py-4 px-6">{t("gender")}</TableHead>
                                    <TableHead className="py-4 px-6 text-center">{t("subjects")}</TableHead>
                                    <TableHead className="py-4 px-6">{t("mobile")}</TableHead>
                                    <TableHead className="py-4 px-6 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {searching ? (
                                    <TableSkeleton rows={5} cols={9} />
                                ) : students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-gray-400 text-sm italic">
                                            {t("please_select_criteria_and_search")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    students.map((student) => (
                                        <TableRow key={student.id} className="text-[12px] text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                            <TableCell className="text-center px-6 py-4">
                                                <Checkbox
                                                    className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                                    checked={selectedIds.includes(student.id)}
                                                    onCheckedChange={() => toggleSelect(student.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="py-4 px-6 font-bold text-gray-700 bg-gray-50/30">{student.admission_no}</TableCell>
                                            <TableCell className="py-4 px-6">
                                                <Link href={`/dashboard/students/${student.id}`} className="font-bold text-indigo-600 hover:underline flex items-center gap-2">
                                                    <UserCircle className="h-3.5 w-3.5 text-gray-300" />
                                                    {student.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 font-medium">{student.father_name || "---"}</TableCell>
                                            <TableCell className="py-4 px-6 text-[11px] font-bold">
                                                <span className="flex items-center gap-2 text-gray-500"><Calendar className="h-3 w-3" /> {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : "---"}</span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${student.gender === 'Male' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {student.gender}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                                                    {examSubjectCount}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 font-medium text-gray-400">{student.phone || "---"}</TableCell>
                                            <TableCell className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDownload(student.id)}
                                                        disabled={printingStudentId === student.id}
                                                        className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md transition-all disabled:opacity-50"
                                                        title={t("download_marksheet")}
                                                    >
                                                        {printingStudentId === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handlePrint(student.id)}
                                                        disabled={printingStudentId === student.id}
                                                        className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-all disabled:opacity-50"
                                                        title={t("print_marksheet")}
                                                    >
                                                        {printingStudentId === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Hidden marksheet template for PDF generation */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -1 }}>
                {marksheetData && (
                    <MarksheetTemplateLayout ref={marksheetRef} data={marksheetData} />
                )}
            </div>
        </div>
    );
}
