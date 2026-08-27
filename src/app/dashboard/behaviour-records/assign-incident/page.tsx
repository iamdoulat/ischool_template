"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Search, FolderOpen, ChevronLeft, ChevronRight, 
    UserPlus, ShieldAlert, GraduationCap, Users, 
    Zap, RefreshCw, Save, Calendar, Loader2,
    CheckCircle2, Sparkles, AlertTriangle, User,
    Phone, Mail, Hash, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useImageUrl } from "@/lib/image-url";

interface Student {
    id: string | number;
    name: string;
    last_name?: string;
    admission_no: string;
    roll_no?: string;
    class?: string;
    section?: string;
    gender: string;
    phone?: string;
    email?: string;
    avatar?: string;
    student_photo?: string;
    photo?: string;
    image?: string;
    user?: {
        avatar?: string;
        photo?: string;
        student_photo?: string;
    };
    total_points?: number;
}

interface Incident {
    id: string | number;
    title: string;
    point: number;
}

interface SchoolSection {
    id: number | string;
    name: string;
}

interface SchoolClass {
    id: number | string;
    name: string;
    sections?: SchoolSection[];
}

export default function AssignIncidentPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const getImageUrl = useImageUrl();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [criteria, setCriteria] = useState<{ classes: SchoolClass[] }>({ classes: [] });
    const [incidents, setIncidents] = useState<Incident[]>([]);
    
    // Selection State
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [sections, setSections] = useState<SchoolSection[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [filterSearch, setFilterSearch] = useState("");

    // Assignment Modal State
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        incident_id: "",
        incident_date: new Date().toISOString().split('T')[0],
        description: ""
    });

    useEffect(() => {
        fetchCriteria();
        fetchIncidents();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const cls = criteria.classes.find(c => c.id.toString() === selectedClass);
            setSections(cls?.sections || []);
        } else {
            setSections([]);
        }
        setSelectedSection("");
    }, [selectedClass, criteria.classes]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/behaviour/reports/criteria');
            setCriteria(response.data);
        } catch {
            console.error("Failed to fetch analytical criteria");
        }
    };

    const fetchIncidents = async () => {
        try {
            const response = await api.get('/behaviour/incidents', { params: { per_page: 100 } });
            setIncidents(response.data.data || []);
        } catch {
            console.error("Failed to fetch incident registry");
        }
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection) {
            tt.error("please_select_class_and_section");
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/behaviour/assigned-incidents/search-students', {
                params: { class_id: selectedClass, section_id: selectedSection }
            });
            const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            setStudents(data);
            setSelectedStudents([]);
            setFilterSearch("");
        } catch {
            tt.error("failed_to_locate_students");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (selectedStudents.length === 0) {
            tt.error("please_select_at_least_one_student");
            return;
        }

        if (!formData.incident_id || !formData.incident_date) {
            tt.error("incident_type_and_date_are_required");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/behaviour/assigned-incidents', {
                student_ids: selectedStudents,
                ...formData
            });
            tt.success("behavioural_incident_assigned_successfully");
            setOpen(false);
            setFormData({
                incident_id: "",
                incident_date: new Date().toISOString().split('T')[0],
                description: ""
            });
            handleSearch(); // Refresh total points
        } catch {
            tt.error("failed_to_assign_incident");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStudent = (id: string | number) => {
        const idStr = String(id);
        setSelectedStudents(prev => 
            prev.includes(idStr) ? prev.filter(item => item !== idStr) : [...prev, idStr]
        );
    };

    const filteredStudents = students.filter(student => {
        if (!filterSearch.trim()) return true;
        const q = filterSearch.toLowerCase();
        const fullName = `${student.name || ""} ${student.last_name || ""}`.toLowerCase();
        const adm = (student.admission_no || "").toLowerCase();
        const roll = (student.roll_no || "").toLowerCase();
        return fullName.includes(q) || adm.includes(q) || roll.includes(q);
    });

    const toggleAll = () => {
        if (selectedStudents.length === filteredStudents.length && filteredStudents.length > 0) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(s => String(s.id)));
        }
    };

    const selectedIncident = incidents.find(i => String(i.id) === String(formData.incident_id));

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Select Criteria Section */}
            <Card className="border border-gray-200/80 dark:border-gray-800 shadow-md bg-card/70 backdrop-blur-sm overflow-hidden pt-0 gap-0 text-slate-800 dark:text-slate-100 rounded-2xl">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-gray-800 dark:to-gray-850 border-b border-gray-100 dark:border-gray-800">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <GraduationCap className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                            {t("assign_incident") || "Assign Incident"}
                        </CardTitle>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t("pick_a_class_and_section_to_find_students") || "Pick a class and section to find students"}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                        {/* Class Field */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                                {t("class") || "Class"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-10 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-2xs rounded-xl focus:ring-2 focus:ring-indigo-500/20">
                                    <SelectValue placeholder={t("select_class") || "Select Class"} />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {criteria.classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id.toString()} className="text-xs font-medium">
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section Field */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-purple-500" />
                                {t("section") || "Section"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                <SelectTrigger className="h-10 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-2xs rounded-xl focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50">
                                    <SelectValue placeholder={t("select_section") || "Select Section"} />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {sections.map(sec => (
                                        <SelectItem key={sec.id} value={sec.id.toString()} className="text-xs font-medium">
                                            {sec.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <Button
                                onClick={handleSearch}
                                disabled={loading || !selectedClass || !selectedSection}
                                className="w-full h-10 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("find_students") || "Find Students"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Students List Table Section */}
            <Card className="border border-gray-200/80 dark:border-gray-800 shadow-md bg-card/70 backdrop-blur-sm overflow-hidden pt-0 gap-0 text-slate-800 dark:text-slate-100 rounded-2xl">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-gray-800 dark:to-gray-850 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Users className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                                    {t("students") || "Students"}
                                </CardTitle>
                                {students.length > 0 && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                                        {students.length}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {t("select_students_to_assign_an_incident") || "Select students to record and assign behavioural incidents"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {students.length > 0 && (
                            <div className="relative w-48 sm:w-60">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    placeholder={t("quick_filter") || "Filter students..."}
                                    value={filterSearch}
                                    onChange={(e) => setFilterSearch(e.target.value)}
                                    className="h-9 text-xs pl-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl"
                                />
                            </div>
                        )}

                        {selectedStudents.length > 0 && (
                            <Button
                                onClick={() => setOpen(true)}
                                className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all shrink-0 cursor-pointer animate-in zoom-in-95"
                            >
                                <ShieldAlert className="h-4 w-4" />
                                {t("assign_to_selected") || "Assign Incident"} ({selectedStudents.length})
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0 space-y-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <Table className="w-full">
                            <TableHeader className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-xs uppercase font-bold text-gray-600 dark:text-gray-300">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="w-[50px] px-4 py-3.5 text-center">
                                        <Checkbox
                                            checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                                            onCheckedChange={toggleAll}
                                            aria-label="Select all students"
                                        />
                                    </TableHead>
                                    <TableHead className="px-4 py-3.5 font-bold">{t("student") || "Student"}</TableHead>
                                    <TableHead className="px-4 py-3.5 font-bold">{t("adm_no") || "Adm No"}</TableHead>
                                    <TableHead className="px-4 py-3.5 font-bold">{t("roll_no") || "Roll No"}</TableHead>
                                    <TableHead className="px-4 py-3.5 font-bold text-center">{t("gender") || "Gender"}</TableHead>
                                    <TableHead className="px-4 py-3.5 font-bold text-center">{t("points") || "Score / Points"}</TableHead>
                                    <TableHead className="px-4 py-3.5 font-bold text-right w-[110px]">{t("action") || "Action"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="text-xs">
                                            <TableCell className="px-4 py-3 text-center"><Skeleton className="h-4 w-4 rounded mx-auto" /></TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-9 w-9 rounded-full" />
                                                    <div className="space-y-1">
                                                        <Skeleton className="h-3.5 w-32 rounded" />
                                                        <Skeleton className="h-2.5 w-20 rounded" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3"><Skeleton className="h-4 w-20 rounded" /></TableCell>
                                            <TableCell className="px-4 py-3"><Skeleton className="h-4 w-12 rounded" /></TableCell>
                                            <TableCell className="px-4 py-3 text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></TableCell>
                                            <TableCell className="px-4 py-3 text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                                            <TableCell className="px-4 py-3 text-right"><Skeleton className="h-7 w-20 rounded-lg ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="px-4 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto text-gray-400">
                                                <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center shadow-inner">
                                                    <FolderOpen className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                                        {t("no_students_found") || "No Students Found"}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {t("select_a_class_and_section_then_click_find_students") || "Select a class and section above, then click Find Students."}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="px-4 py-10 text-center text-xs text-gray-400">
                                            {t("no_students_match_filter") || "No students match your filter search."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student, idx) => {
                                        const isSelected = selectedStudents.includes(String(student.id));
                                        const studentPhoto = student.avatar || student.student_photo || student.photo || student.image || student.user?.avatar || student.user?.photo;
                                        const photoUrl = studentPhoto ? getImageUrl(studentPhoto) : "";
                                        const fullName = `${student.name || ""} ${student.last_name || ""}`.trim() || "Student";
                                        const initials = student.name ? student.name.substring(0, 2).toUpperCase() : "ST";
                                        const totalPts = Number(student.total_points || 0);

                                        return (
                                            <TableRow 
                                                key={student.id} 
                                                className={cn(
                                                    "text-xs transition-colors duration-150 group cursor-pointer",
                                                    isSelected 
                                                        ? "bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-50/70" 
                                                        : "hover:bg-slate-50/80 dark:hover:bg-gray-800/40"
                                                )}
                                                onClick={() => toggleStudent(student.id)}
                                            >
                                                {/* Checkbox */}
                                                <TableCell className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleStudent(student.id)}
                                                        aria-label={`Select ${fullName}`}
                                                    />
                                                </TableCell>

                                                {/* Student Profile Info */}
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 rounded-full border border-gray-200 dark:border-gray-700 shadow-2xs shrink-0 overflow-hidden">
                                                            <AvatarImage
                                                                src={photoUrl}
                                                                alt={fullName}
                                                                className="object-cover h-full w-full"
                                                            />
                                                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-[11px] flex items-center justify-center h-full w-full">
                                                                {initials}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors leading-tight">
                                                                {fullName}
                                                            </p>
                                                            {student.email || student.phone ? (
                                                                <p className="text-[10.5px] text-gray-400 dark:text-gray-500 truncate max-w-[170px] mt-0.5">
                                                                    {student.email || student.phone}
                                                                </p>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-400">Student</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Admission No */}
                                                <TableCell className="px-4 py-3">
                                                    {student.admission_no ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-mono font-bold text-[11px] border border-indigo-200/60 dark:border-indigo-800">
                                                            {student.admission_no}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Roll No */}
                                                <TableCell className="px-4 py-3">
                                                    {student.roll_no ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono font-medium text-[11px]">
                                                            #{student.roll_no}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Gender */}
                                                <TableCell className="px-4 py-3 text-center">
                                                    {student.gender ? (
                                                        <span className={cn(
                                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border shadow-2xs",
                                                            String(student.gender).toLowerCase() === "male"
                                                                ? "bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/60 dark:text-blue-300"
                                                                : "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/60 dark:text-rose-300"
                                                        )}>
                                                            {student.gender}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Behaviour Score / Total Points */}
                                                <TableCell className="px-4 py-3 text-center">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border tabular-nums shadow-2xs",
                                                        totalPts > 0
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                            : totalPts < 0
                                                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300"
                                                                : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/80 dark:text-gray-400"
                                                    )}>
                                                        {totalPts > 0 ? (
                                                            <Zap className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                                                        ) : totalPts < 0 ? (
                                                            <AlertTriangle className="h-3 w-3 text-rose-500" />
                                                        ) : (
                                                            <Sparkles className="h-3 w-3 text-gray-400" />
                                                        )}
                                                        {totalPts > 0 ? `+${totalPts}` : totalPts} pts
                                                    </span>
                                                </TableCell>

                                                {/* Action Button */}
                                                <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        onClick={() => { setSelectedStudents([String(student.id)]); setOpen(true); }}
                                                        size="sm" 
                                                        className="h-7 px-3 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer gap-1"
                                                    >
                                                        <ShieldAlert className="h-3 w-3" />
                                                        {t("assign") || "Assign"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Table Footer Summary */}
                    {!loading && students.length > 0 && (
                        <div className="px-5 py-3.5 bg-gray-50/70 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                    Showing {filteredStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
                                </span>
                                {selectedStudents.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60">
                                        {selectedStudents.length} selected
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleAll}
                                    className="h-7 px-3 text-[11px] font-semibold rounded-lg border-gray-200 dark:border-gray-700"
                                >
                                    {selectedStudents.length === filteredStudents.length ? "Deselect All" : "Select All"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Assignment Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl gap-0">
                    <DialogHeader className="flex flex-row items-center gap-3 px-6 py-5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-gray-800 dark:to-gray-850 border-b border-gray-100 dark:border-gray-800 space-y-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ShieldAlert className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-none">
                                {t("assign_incident") || "Assign Incident"}
                            </DialogTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {t("record_and_assign_behavioural_incident_to_students") || "Record and assign behavioural incident to selected student(s)"}
                            </p>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                        {/* Target Student Count Banner */}
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                                    <Users className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                                        {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''} Selected
                                    </p>
                                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                                        Incident score will be recorded for each selected student
                                    </p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {selectedStudents.length} Target
                            </span>
                        </div>

                        {/* Incident Type Select */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                {t("incident_type") || "Incident Type"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={formData.incident_id} onValueChange={(val) => setFormData({...formData, incident_id: val})}>
                                <SelectTrigger className="h-10 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20">
                                    <SelectValue placeholder={t("select_incident_type") || "Select Incident Type"} />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {incidents.map(inc => {
                                        const pts = Number(inc.point || 0);
                                        return (
                                            <SelectItem key={inc.id} value={inc.id.toString()} className="text-xs">
                                                <div className="flex items-center justify-between w-full gap-4">
                                                    <span className="font-semibold">{inc.title}</span>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono",
                                                        pts >= 0 
                                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" 
                                                            : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                                    )}>
                                                        {pts > 0 ? `+${pts}` : pts} pts
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selected Incident Details Badge */}
                        {selectedIncident && (
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-600 dark:text-gray-300">Score Modifier:</span>
                                <span className={cn(
                                    "font-bold font-mono px-2 py-0.5 rounded-full text-xs",
                                    Number(selectedIncident.point || 0) >= 0 
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" 
                                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                )}>
                                    {Number(selectedIncident.point || 0) > 0 ? `+${selectedIncident.point}` : selectedIncident.point} Points
                                </span>
                            </div>
                        )}

                        {/* Incident Date Input */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                {t("incident_date") || "Incident Date"} <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                <Input
                                    type="date"
                                    value={formData.incident_date}
                                    onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                                    className="h-10 text-xs pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>

                        {/* Description Textarea */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                {t("assigned_description") || "Description / Notes"}
                            </Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder={t("details_regarding_this_specific_assignment") || "Add any specific context or remarks regarding this incident..."}
                                rows={3}
                                className="text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 resize-none"
                            />
                        </div>
                    </div>

                    {/* Dialog Footer */}
                    <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="h-9 px-4 text-xs font-semibold rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        >
                            {t("discard") || "Cancel"}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleAssign}
                            disabled={submitting}
                            className="h-9 px-6 text-xs font-bold rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md hover:shadow-lg border-none transition-all disabled:opacity-50 cursor-pointer gap-1.5"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    {t("saving") || "Saving..."}
                                </>
                            ) : (
                                <>
                                    <Save className="h-3.5 w-3.5" />
                                    {t("commit_assignment") || "Assign Incident"}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
