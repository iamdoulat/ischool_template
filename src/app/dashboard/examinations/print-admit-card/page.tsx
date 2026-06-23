"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Search, Printer, UserCircle, Calendar, Filter, UserCheck
} from "lucide-react";

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

interface OptionItem {
    id: string | number;
    name?: string;
    year?: string;
    exams?: OptionItem[];
}

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

export default function PrintAdmitCardPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Criteria Data
    const [classes, setClasses] = useState<OptionItem[]>([]);
    const [sections, setSections] = useState<OptionItem[]>([]);
    const [examGroups, setExamGroups] = useState<OptionItem[]>([]);
    const [exams, setExams] = useState<OptionItem[]>([]);
    const [templates, setTemplates] = useState<OptionItem[]>([]);
    const [sessions, setSessions] = useState<OptionItem[]>([]);

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

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [criteriaRes, classesRes, sectionsRes] = await Promise.all([
                api.get('/examination/print-admit-card/criteria'),
                api.get('/academics/classes?no_paginate=true'),
                api.get('/academics/sections?no_paginate=true')
            ]);

            setExamGroups(criteriaRes.data.exam_groups || []);
            setTemplates(criteriaRes.data.admit_card_templates || []);
            setSessions(criteriaRes.data.sessions || []);
            setClasses(classesRes.data.data || classesRes.data || []);
            setSections(sectionsRes.data.data || sectionsRes.data || []);
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
    }, [selectedCriteria.exam_group_id, examGroups]);

    const handleSearch = async () => {
        if (!selectedCriteria.school_class_id || !selectedCriteria.section_id || !selectedCriteria.exam_id) {
            tt.error("please_select_all_required_fields");
            return;
        }

        setSearching(true);
        try {
            const response = await api.post('/examination/print-admit-card/search', {
                school_class_id: selectedCriteria.school_class_id,
                section_id: selectedCriteria.section_id
            });
            setStudents(response.data || []);
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

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header Section */}
            <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <Printer className="h-6 w-6 text-indigo-500" />
                        {t("print_admit_card")}
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t("print_admit_card_subtitle")}</p>
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
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_students_by_exam_group")}</p>
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
                                    {examGroups.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>)}
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
                                    {sessions.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.year}</SelectItem>)}
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
                            <UserCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("x_students_y_selected", { total: students.length, selected: selectedIds.length })}</p>
                        </div>
                    </div>
                    {selectedIds.length > 0 && (
                        <Button className="btn-gradient text-white h-10 px-8 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 flex gap-2">
                            <Printer className="h-3.5 w-3.5" /> {t("generate_admit_cards")} ({selectedIds.length})
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-500">
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
                                    <TableHead className="py-4 px-6 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {searching ? (
                                    <TableSkeleton rows={5} cols={7} />
                                ) : students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-sm italic">
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
                                                <span className="font-bold text-indigo-600 flex items-center gap-2">
                                                    <UserCircle className="h-3.5 w-3.5 text-gray-300" />
                                                    {student.name} {student.last_name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 font-medium">{student.father_name || "---"}</TableCell>
                                            <TableCell className="py-4 px-6 text-[11px] font-bold">
                                                <span className="flex items-center gap-2 text-gray-500"><Calendar className="h-3 w-3" /> {student.dob || "---"}</span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${student.gender === 'Male' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {student.gender}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-all"
                                                        title={t("generate_admit_card")}
                                                    >
                                                        <Printer className="h-4 w-4" />
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
        </div>
    );
}
