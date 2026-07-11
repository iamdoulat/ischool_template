"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Loader2, Filter, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import api from "@/lib/api";

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
    father_name: string;
    dob: string;
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

    // Filtered sections by selected class
    const filteredSections = sections.filter(s => s.school_class_id === parseInt(currentClassId));
    const promoteFilteredSections = sections.filter(s => s.school_class_id === parseInt(promoteClassId));

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

                // Set default session if active one exists
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
            const fetchedStudents = (response.data.data || []).map((s: Student) => ({
                ...s,
                result: "pass", // Default Pass
                status: "continue" // Default Continue
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

    return (
        <div className="space-y-6">
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
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">
                                {t("academic_session")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={currentSessionId} onValueChange={setCurrentSessionId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("select_session")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.session}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">
                                {t("class")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={currentClassId} onValueChange={(val) => { setCurrentClassId(val); setCurrentSectionId(""); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("select_class")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">
                                {t("section")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={currentSectionId} onValueChange={setCurrentSectionId}>
                                <SelectTrigger>
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
                    <div className="flex justify-end pt-2 border-t mt-4">
                        <Button
                            onClick={handleSearch}
                            disabled={searching || loading}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-6 h-9 text-xs gap-2 transition-all duration-300 shadow-md"
                        >
                            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
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
                    <CardContent className="p-4">
                        <div className="rounded-lg border border-gray-200/50 shadow-sm overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-100 text-[11px] uppercase font-bold text-gray-600">
                                    <TableRow>
                                        <TableHead className="w-[40px] px-4"></TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("admission_no")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("student_name")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("father_name")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("date_of_birth")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("current_result")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("next_session_status")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableSkeleton rows={5} cols={7} />
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {hasSearched && !searching && students.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-8 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-orange-50 p-4 rounded-full mb-4">
                        <Search className="h-8 w-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">{t("no_students_found")}</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                        {t("no_students_found_message")}
                    </p>
                </div>
            )}

            {/* Student List Section */}
            {!searching && students.length > 0 && (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 font-sans animate-in fade-in slide-in-from-top-4 duration-500">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <TrendingUp className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("x_of_y_students_selected", { selected: selectedStudentIds.length, total: students.length })}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {/* Promotion Target Criteria */}
                        <div className="bg-indigo-50/50 p-4 rounded-md border border-indigo-100 mb-4">
                            <h3 className="text-sm font-medium text-indigo-800 mb-3">{t("target_for_promotion")}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600">
                                        {t("promote_in_session")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={promoteSessionId} onValueChange={setPromoteSessionId}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder={t("select_session")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sessions.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.session}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600">
                                        {t("promote_to_class")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={promoteClassId} onValueChange={(val) => { setPromoteClassId(val); setPromoteSectionId(""); }}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder={t("select_class")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600">
                                        {t("promote_to_section")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={promoteSectionId} onValueChange={setPromoteSectionId}>
                                        <SelectTrigger className="bg-white">
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

                        <div className="rounded-lg border border-gray-200/50 shadow-sm overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-100 text-[11px] uppercase font-bold text-gray-600">
                                    <TableRow>
                                        <TableHead className="w-[40px] px-4">
                                            <Checkbox
                                                checked={selectedStudentIds.length === students.length && students.length > 0}
                                                onCheckedChange={toggleSelectAll}
                                                className="border-gray-300"
                                            />
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("admission_no")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("student_name")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("father_name")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("date_of_birth")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("current_result")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("next_session_status")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => (
                                        <TableRow key={student.id} className="text-[13px] hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                            <TableCell className="px-4">
                                                <Checkbox
                                                    checked={selectedStudentIds.includes(student.id)}
                                                    onCheckedChange={() => toggleSelectStudent(student.id)}
                                                    className="border-gray-300"
                                                />
                                            </TableCell>
                                            <TableCell className="text-gray-600">{student.admission_no}</TableCell>
                                            <TableCell className="text-gray-900 font-medium">{student.name}</TableCell>
                                            <TableCell className="text-gray-600">{student.father_name}</TableCell>
                                            <TableCell className="text-gray-600">{student.dob}</TableCell>
                                            <TableCell>
                                                <RadioGroup
                                                    value={student.result}
                                                    onValueChange={(val) => handleResultChange(student.id, val as "pass" | "fail")}
                                                    className="flex gap-4"
                                                >
                                                    <div className="flex items-center space-x-1.5">
                                                        <RadioGroupItem value="pass" id={`result-pass-${student.id}`} className="h-4 w-4 border-indigo-300 text-indigo-600" />
                                                        <Label htmlFor={`result-pass-${student.id}`} className="text-xs font-medium text-gray-700">{t("pass")}</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-1.5">
                                                        <RadioGroupItem value="fail" id={`result-fail-${student.id}`} className="h-4 w-4 border-indigo-300 text-indigo-600" />
                                                        <Label htmlFor={`result-fail-${student.id}`} className="text-xs font-medium text-gray-700">{t("fail")}</Label>
                                                    </div>
                                                </RadioGroup>
                                            </TableCell>
                                            <TableCell>
                                                <RadioGroup
                                                    value={student.status}
                                                    onValueChange={(val) => handleStatusChange(student.id, val as "continue" | "leave")}
                                                    className="flex gap-4"
                                                >
                                                    <div className="flex items-center space-x-1.5">
                                                        <RadioGroupItem value="continue" id={`status-cont-${student.id}`} className="h-4 w-4 border-indigo-300 text-indigo-600" />
                                                        <Label htmlFor={`status-cont-${student.id}`} className="text-xs font-medium text-gray-700">{t("continue")}</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-1.5">
                                                        <RadioGroupItem value="leave" id={`status-leave-${student.id}`} className="h-4 w-4 border-indigo-300 text-indigo-600" />
                                                        <Label htmlFor={`status-leave-${student.id}`} className="text-xs font-medium text-gray-700">{t("leave")}</Label>
                                                    </div>
                                                </RadioGroup>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handlePromote}
                                disabled={promoting || selectedStudentIds.length === 0}
                                className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-8 h-9 text-xs shadow-md transition-all duration-300"
                            >
                                {promoting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                                {t("promote")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {students.length === 0 && !searching && (
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
