"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Search,
    Loader2,
    Filter,
    TrendingUp,
    GraduationCap,
    Check,
    X,
    ArrowRight,
    LogOut,
    Calendar,
    User,
    Sparkles,
    CheckCircle2,
    Users
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { getImageUrl } from "@/lib/image-url";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

interface Student {
    id: number;
    admission_no: string;
    name: string;
    last_name?: string;
    father_name: string;
    dob: string;
    avatar?: string;
    student_photo?: string;
    image?: string;
    photo?: string;
    result?: "pass" | "fail";
    status?: "continue" | "leave";
}

interface AcademicSession {
    id: number;
    session: string;
    is_active: boolean;
}

interface SchoolClass {
    id: number;
    name: string;
}

interface Section {
    id: number;
    name: string;
    school_class_id: number | null;
}

export default function PromoteStudentsPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();

    // Dropdown Data
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);

    // Search Criteria
    const [currentSessionId, setCurrentSessionId] = useState<string>("");
    const [currentClassId, setCurrentClassId] = useState<string>("");
    const [currentSectionId, setCurrentSectionId] = useState<string>("");

    // Promotion Criteria
    const [promoteSessionId, setPromoteSessionId] = useState<string>("");
    const [promoteClassId, setPromoteClassId] = useState<string>("");
    const [promoteSectionId, setPromoteSectionId] = useState<string>("");

    // Unique sections helper
    const getUniqueSections = (allSections: Section[], classId: string): Section[] => {
        const classSpecific = classId ? allSections.filter(s => String(s.school_class_id) === String(classId)) : [];
        const candidates = classSpecific.length > 0 ? classSpecific : allSections.filter(s => !s.school_class_id || String(s.school_class_id) === String(classId));

        const seen = new Set<string>();
        return candidates.filter(s => {
            const key = s.name.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const filteredSections = getUniqueSections(sections, currentClassId);
    const promoteFilteredSections = getUniqueSections(sections, promoteClassId);

    // Results
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Load prerequisites
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [sessionRes, classRes, sectionRes] = await Promise.all([
                    api.get("/system-setting/sessions"),
                    api.get("/academics/classes?no_paginate=true"),
                    api.get("/academics/sections?with_class=true")
                ]);
                setSessions(sessionRes.data.data || []);
                setClasses(classRes.data.data?.data || classRes.data.data || []);
                setSections(sectionRes.data.data?.data || sectionRes.data.data || []);

                const activeSession = sessionRes.data.data?.find((s: AcademicSession) => s.is_active);
                if (activeSession) {
                    setCurrentSessionId(activeSession.id.toString());
                }
            } catch (error) {
                console.error("Error fetching prerequisites:", error);
                tt.error("failed_to_load");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSearch = async () => {
        if (!currentSessionId || !currentClassId || !currentSectionId) {
            tt.error("please_select_all_search_criteria");
            return;
        }

        setSearching(true);
        try {
            const response = await api.get("/academics/student-promotion", {
                params: {
                    academic_session_id: currentSessionId,
                    school_class_id: currentClassId,
                    section_id: currentSectionId
                }
            });
            const data = response.data?.data?.data || response.data?.data || response.data || [];
            const rawList = Array.isArray(data) ? data : [];
            const fetchedStudents = rawList.map((s: Student) => ({
                ...s,
                result: s.result || "pass",
                status: s.status || "continue"
            }));
            setStudents(fetchedStudents);
            setSelectedStudentIds(fetchedStudents.map((s: Student) => s.id));
            setHasSearched(true);
        } catch (error) {
            console.error("Error searching students:", error);
            tt.error("failed_to_fetch");
        } finally {
            setSearching(false);
        }
    };

    const handlePromote = async () => {
        if (selectedStudentIds.length === 0) {
            tt.error("please_select_at_least_one_student");
            return;
        }
        if (!promoteSessionId || !promoteClassId || !promoteSectionId) {
            tt.error("please_select_all_promotion_criteria");
            return;
        }

        const payload = {
            promote_session_id: parseInt(promoteSessionId),
            promote_class_id: parseInt(promoteClassId),
            promote_section_id: parseInt(promoteSectionId),
            students: students
                .filter(s => selectedStudentIds.includes(s.id))
                .map(s => ({
                    id: s.id,
                    result: s.result,
                    status: s.status
                }))
        };

        setPromoting(true);
        try {
            await api.post("/academics/student-promotion", payload);
            tt.success("students_promoted_successfully");
            setStudents([]);
            setSelectedStudentIds([]);
        } catch (error) {
            console.error("Error promoting students:", error);
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_promote_students");
        } finally {
            setPromoting(false);
        }
    };

    const handleResultChange = (id: number, value: "pass" | "fail") => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, result: value } : s));
    };

    const handleStatusChange = (id: number, value: "continue" | "leave") => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, status: value } : s));
    };

    const toggleSelectAll = () => {
        if (selectedStudentIds.length === students.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(students.map(s => s.id));
        }
    };

    const toggleSelectStudent = (id: number) => {
        if (selectedStudentIds.includes(id)) {
            setSelectedStudentIds(prev => prev.filter(sid => sid !== id));
        } else {
            setSelectedStudentIds(prev => [...prev, id]);
        }
    };

    const setAllResults = (val: "pass" | "fail") => {
        setStudents(prev => prev.map(s => selectedStudentIds.includes(s.id) ? { ...s, result: val } : s));
    };

    const setAllStatuses = (val: "continue" | "leave") => {
        setStudents(prev => prev.map(s => selectedStudentIds.includes(s.id) ? { ...s, status: val } : s));
    };

    const passCount = students.filter(s => s.result === "pass").length;
    const failCount = students.filter(s => s.result === "fail").length;
    const continueCount = students.filter(s => s.status === "continue").length;
    const leaveCount = students.filter(s => s.status === "leave").length;

    return (
        <div className="space-y-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen">
            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("choose_session_class_section_to_find_students")}</p>
                    </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("academic_session")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={currentSessionId} onValueChange={setCurrentSessionId}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={t("select_session")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.session}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("class")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={currentClassId} onValueChange={(val) => { setCurrentClassId(val); setCurrentSectionId(""); }}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={t("select_class")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("section")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={currentSectionId} onValueChange={setCurrentSectionId} disabled={!currentClassId}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={t("select_section")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSections.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            onClick={handleSearch}
                            disabled={searching || loading}
                            className="btn-gradient text-white gap-2 h-10 px-8 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full"
                        >
                            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            {t("search")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Searching Skeleton */}
            {searching && (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <TrendingUp className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("loading_students")}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableBody>
                                <TableSkeleton rows={4} cols={6} />
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {hasSearched && !searching && students.length === 0 && (
                <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-16 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl mb-4 text-indigo-500">
                        <Search className="h-8 w-8" />
                    </div>
                    <h3 className="text-gray-600 dark:text-gray-300 text-sm font-bold">{t("no_students_found")}</h3>
                    <p className="text-gray-400 text-xs mt-1">{t("no_students_found_message")}</p>
                </div>
            )}

            {/* Student List & Target Promotion Section */}
            {!searching && students.length > 0 && (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 font-sans">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <TrendingUp className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {t("x_of_y_students_selected", { selected: selectedStudentIds.length, total: students.length })}
                                </p>
                            </div>
                        </div>

                        {/* Summary Badges */}
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-2.5 py-1">
                                {passCount} Pass • {failCount} Fail
                            </Badge>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold px-2.5 py-1">
                                {continueCount} Continue • {leaveCount} Leave
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 space-y-5">
                        {/* Target For Promotion Card Panel */}
                        <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 via-white to-amber-50/50 dark:from-indigo-950/40 dark:via-gray-900 dark:to-gray-900 shadow-2xs space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/60 dark:border-indigo-900/60 pb-2.5">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                                        {t("target_for_promotion")}
                                    </h3>
                                </div>

                                {/* Quick Bulk Action Buttons */}
                                <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                                    <button
                                        type="button"
                                        onClick={() => setAllResults("pass")}
                                        className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200 transition-colors"
                                    >
                                        All Pass
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAllResults("fail")}
                                        className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold hover:bg-rose-200 transition-colors"
                                    >
                                        All Fail
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        type="button"
                                        onClick={() => setAllStatuses("continue")}
                                        className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold hover:bg-indigo-200 transition-colors"
                                    >
                                        All Continue
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAllStatuses("leave")}
                                        className="px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors"
                                    >
                                        All Leave
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        {t("promote_in_session")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={promoteSessionId} onValueChange={setPromoteSessionId}>
                                        <SelectTrigger className="h-10 border-gray-200 bg-white dark:bg-gray-800 text-xs rounded-lg shadow-none">
                                            <SelectValue placeholder={t("select_session")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sessions.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.session}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        {t("promote_to_class")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={promoteClassId} onValueChange={(val) => { setPromoteClassId(val); setPromoteSectionId(""); }}>
                                        <SelectTrigger className="h-10 border-gray-200 bg-white dark:bg-gray-800 text-xs rounded-lg shadow-none">
                                            <SelectValue placeholder={t("select_class")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        {t("promote_to_section")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={promoteSectionId} onValueChange={setPromoteSectionId} disabled={!promoteClassId}>
                                        <SelectTrigger className="h-10 border-gray-200 bg-white dark:bg-gray-800 text-xs rounded-lg shadow-none">
                                            <SelectValue placeholder={t("select_section")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {promoteFilteredSections.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Students Table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                            <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-800/80 text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                                        <TableHead className="w-[50px] px-4">
                                            <Checkbox
                                                checked={selectedStudentIds.length === students.length && students.length > 0}
                                                onCheckedChange={toggleSelectAll}
                                                className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-600"
                                            />
                                        </TableHead>
                                        <TableHead className="py-3 px-4 min-w-[240px]">{t("student_name")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[150px]">{t("father_name")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[130px]">{t("date_of_birth")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[160px]">{t("current_result")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[180px]">{t("next_session_status")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => {
                                        const isSelected = selectedStudentIds.includes(student.id);
                                        const isPass = student.result === "pass";
                                        const isContinue = student.status === "continue";
                                        const photoUrl = getImageUrl(student.student_photo || student.avatar || student.photo || student.image);

                                        return (
                                            <TableRow
                                                key={student.id}
                                                className={cn(
                                                    "text-[13px] border-b last:border-0 border-gray-100 dark:border-gray-800 transition-colors",
                                                    isSelected ? "bg-indigo-50/30 dark:bg-indigo-950/20" : "hover:bg-gray-50/50"
                                                )}
                                            >
                                                <TableCell className="px-4">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleSelectStudent(student.id)}
                                                        className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-600"
                                                    />
                                                </TableCell>

                                                {/* Student with Real Picture / Avatar and Admission No */}
                                                <TableCell className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                            <AvatarImage
                                                                src={photoUrl}
                                                                alt={student.name}
                                                                className="object-cover h-full w-full"
                                                            />
                                                            <AvatarFallback className="bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white font-bold text-xs flex items-center justify-center">
                                                                {student.name.slice(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                                                {student.name} {student.last_name || ""}
                                                            </p>
                                                            <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-gray-500 font-semibold">
                                                                {student.admission_no}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Father Name */}
                                                <TableCell className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium">
                                                        <User className="h-3.5 w-3.5 text-gray-400" />
                                                        {student.father_name || "—"}
                                                    </div>
                                                </TableCell>

                                                {/* DOB */}
                                                <TableCell className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium">
                                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                        {student.dob || "—"}
                                                    </div>
                                                </TableCell>

                                                {/* Current Result Segment Buttons */}
                                                <TableCell className="py-3.5 px-4">
                                                    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-800">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleResultChange(student.id, "pass")}
                                                            className={cn(
                                                                "px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
                                                                isPass
                                                                    ? "bg-emerald-600 text-white shadow-2xs"
                                                                    : "text-gray-500 hover:text-emerald-700"
                                                            )}
                                                        >
                                                            <Check className="h-3 w-3" />
                                                            Pass
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleResultChange(student.id, "fail")}
                                                            className={cn(
                                                                "px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
                                                                !isPass
                                                                    ? "bg-rose-600 text-white shadow-2xs"
                                                                    : "text-gray-500 hover:text-rose-700"
                                                            )}
                                                        >
                                                            <X className="h-3 w-3" />
                                                            Fail
                                                        </button>
                                                    </div>
                                                </TableCell>

                                                {/* Next Session Status Segment Buttons */}
                                                <TableCell className="py-3.5 px-4">
                                                    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-800">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusChange(student.id, "continue")}
                                                            className={cn(
                                                                "px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
                                                                isContinue
                                                                    ? "bg-indigo-600 text-white shadow-2xs"
                                                                    : "text-gray-500 hover:text-indigo-700"
                                                            )}
                                                        >
                                                            <ArrowRight className="h-3 w-3" />
                                                            Continue
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusChange(student.id, "leave")}
                                                            className={cn(
                                                                "px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
                                                                !isContinue
                                                                    ? "bg-amber-600 text-white shadow-2xs"
                                                                    : "text-gray-500 hover:text-amber-700"
                                                            )}
                                                        >
                                                            <LogOut className="h-3 w-3" />
                                                            Leave
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                            <div className="text-xs text-gray-500 font-bold">
                                {selectedStudentIds.length} of {students.length} students selected for promotion
                            </div>
                            <Button
                                onClick={handlePromote}
                                disabled={promoting || selectedStudentIds.length === 0}
                                className="btn-gradient text-white px-8 h-10 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex items-center gap-2"
                            >
                                {promoting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {t("promote")} ({selectedStudentIds.length})
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!hasSearched && !searching && students.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-indigo-50 rounded-full">
                        <Search className="h-8 w-8 text-indigo-400 opacity-50" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-gray-700">{t("no_students_found")}</h3>
                        <p className="text-xs text-gray-500 max-w-xs">{t("select_criteria_and_search_for_students")}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
