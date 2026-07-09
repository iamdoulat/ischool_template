"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Copy, FileSpreadsheet, FileText, Printer, Search,
    Award, GraduationCap, Filter,
    FileBarChart, UserCircle
} from "lucide-react";
import Link from "next/link";

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

interface Subject {
    id: number;
    name: string;
    code: string;
}

interface ExamMark {
    subject_id: number;
    marks: string;
    is_absent: boolean;
    subject: Subject;
}

interface StudentResult {
    id: string;
    admission_no: string;
    roll_no: string;
    name: string;
    last_name: string;
    exam_results: ExamMark[];
}

interface SectionItem {
    id: number;
    name: string;
}

interface ClassItem {
    id: number;
    name: string;
    sections?: SectionItem[];
}

interface ExamItem {
    id: number;
    name: string;
}

interface ExamGroupItem {
    id: number;
    name: string;
    exams?: ExamItem[];
}

interface SessionItem {
    id: number;
    session: string;
}

export default function ExamResultPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Criteria Data
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [examGroups, setExamGroups] = useState<ExamGroupItem[]>([]);
    const [exams, setExams] = useState<ExamItem[]>([]);
    const [sessions, setSessions] = useState<SessionItem[]>([]);

    // Selected Criteria
    const [selectedCriteria, setSelectedCriteria] = useState({
        exam_group_id: "",
        exam_id: "",
        session_id: "",
        school_class_id: "",
        section_id: ""
    });

    // Results Data
    const [students, setStudents] = useState<StudentResult[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [criteriaRes, classesRes] = await Promise.all([
                api.get('/examination/exam-results/criteria'),
                api.get('/academics/classes?no_paginate=true')
            ]);

            setExamGroups(criteriaRes.data.exam_groups || []);
            setSessions(criteriaRes.data.sessions || []);
            setClasses(classesRes.data.data || classesRes.data || []);
        } catch (error) {
            tt.error("failed_to_load_criteria");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCriteria.school_class_id) {
            const cls = classes.find(c => c.id.toString() === selectedCriteria.school_class_id);
            setSections(cls?.sections || []);
        } else {
            setSections([]);
        }
        setSelectedCriteria(prev => ({ ...prev, section_id: "" }));
    }, [selectedCriteria.school_class_id, classes]);

    useEffect(() => {
        if (selectedCriteria.exam_group_id) {
            const group = examGroups.find(g => g.id.toString() === selectedCriteria.exam_group_id);
            setExams(group?.exams || []);
        } else {
            setExams([]);
        }
    }, [selectedCriteria.exam_group_id, examGroups]);

    const handleSearch = async () => {
        if (!selectedCriteria.exam_id || !selectedCriteria.school_class_id || !selectedCriteria.section_id) {
            tt.error("please_select_all_required_fields");
            return;
        }

        setSearching(true);
        try {
            const response = await api.post('/examination/exam-results/search', {
                exam_id: selectedCriteria.exam_id,
                school_class_id: selectedCriteria.school_class_id,
                section_id: selectedCriteria.section_id
            });
            setStudents(response.data.students || []);
            setSubjects(response.data.subjects || []);
        } catch (error) {
            tt.error("failed_to_fetch_results");
        } finally {
            setSearching(false);
        }
    };

    const getStudentMark = (student: StudentResult, subjectId: number) => {
        const results = student.exam_results || (student as any).examResults || [];
        return results.find((r: any) => r.subject_id === subjectId);
    };

    const calculateTotal = (student: StudentResult) => {
        const results = student.exam_results || (student as any).examResults || [];
        return results.reduce((acc: number, curr: any) => acc + (curr.is_absent ? 0 : parseFloat(curr.marks || "0")), 0);
    };

    const calculatePercent = (student: StudentResult) => {
        const total = calculateTotal(student);
        const max = subjects.length * 100; // Mocking 100 as max per subject
        return max > 0 ? ((total / max) * 100).toFixed(2) : "0.00";
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_no.includes(searchTerm)
    );

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <Award className="h-6 w-6 text-indigo-500" />
                        {t("exam_result")}
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t("exam_result_subtitle")}</p>
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
                        <p className="text-[11px] text-gray-500 mt-1">{t("choose_exam_session_class_section")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("exam_group")} <span className="text-red-500">*</span></Label>
                            <Select value={selectedCriteria.exam_group_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, exam_group_id: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_group")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {examGroups.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("exam")} <span className="text-red-500">*</span></Label>
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
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("session")} <span className="text-red-500">*</span></Label>
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
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("class")} <span className="text-red-500">*</span></Label>
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
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("section")} <span className="text-red-500">*</span></Label>
                            <Select value={selectedCriteria.section_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, section_id: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_section")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleSearch}
                                disabled={searching}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-10 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg active:scale-95 flex items-center gap-2"
                            >
                            {searching ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search className="h-4 w-4" />}
                            {t("retrieve_results")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Exam Result List Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileBarChart className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("tabulation_record")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{filteredStudents.length} {t("students_found")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileSpreadsheet className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Printer className="h-4 w-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={t("search_by_student_name")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                            />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-500">
                                <TableRow className="hover:bg-transparent border-gray-50">
                                    <TableHead className="py-4 px-6 min-w-[120px]">{t("admission_no")}</TableHead>
                                    <TableHead className="py-4 px-6 min-w-[150px]">{t("student_name")}</TableHead>
                                    {subjects.map(subject => (
                                        <TableHead key={subject.id} className="py-4 px-6 min-w-[120px] text-center border-l border-gray-50">
                                            <div className="flex flex-col items-center">
                                                <span className="text-indigo-600">{subject.name}</span>
                                                <span className="text-[8px] text-gray-400">{subject.code}</span>
                                            </div>
                                        </TableHead>
                                    ))}
                                    <TableHead className="py-4 px-6 min-w-[120px] text-center border-l border-indigo-50 bg-indigo-50/20">{t("grand_total")}</TableHead>
                                    <TableHead className="py-4 px-6 min-w-[100px] text-center border-l border-gray-50 bg-indigo-50/20">{t("percent")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {searching ? (
                                    <TableSkeleton rows={5} cols={subjects.length + 4} />
                                ) : students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={subjects.length + 4} className="h-32 text-center text-gray-400 text-sm italic">
                                            {t("please_select_criteria_and_search")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <TableRow key={student.id} className="text-[12px] text-gray-600 hover:bg-gray-50/30 transition-colors border-b last:border-0 border-gray-50">
                                            <TableCell className="py-4 px-6 font-bold text-gray-500 uppercase tracking-tighter bg-gray-50/20">{student.admission_no}</TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <UserCircle className="h-4 w-4 text-gray-300" />
                                                    <Link href="#" className="font-bold text-indigo-600 hover:underline">
                                                        {student.name} {student.last_name}
                                                    </Link>
                                                </div>
                                            </TableCell>

                                            {subjects.map(subject => {
                                                const mark = getStudentMark(student, subject.id);
                                                return (
                                                    <TableCell key={subject.id} className="py-4 px-6 text-center border-l border-gray-50">
                                                        {mark ? (
                                                            mark.is_absent ? (
                                                                <span className="text-rose-500 font-bold text-[9px] uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">{t("absent")}</span>
                                                            ) : (
                                                                <span className="font-bold text-gray-700">{mark.marks}</span>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-300">---</span>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}

                                            <TableCell className="py-4 px-6 text-center font-bold text-indigo-700 border-l border-indigo-50 bg-indigo-50/10">
                                                {calculateTotal(student).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-center font-bold border-l border-gray-50 bg-indigo-50/10">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-indigo-600">{calculatePercent(student)}%</span>
                                                    <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500"
                                                            style={{ width: `${calculatePercent(student)}%` }}
                                                        />
                                                    </div>
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
        </div>
    );
}
