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
    Zap, RefreshCw, Save, Calendar, Loader2
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

interface Student {
    id: string;
    name: string;
    admission_no: string;
    class: string;
    section: string;
    gender: string;
    phone: string;
    total_points: number;
}

interface Incident {
    id: string;
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
            setStudents(response.data);
            setSelectedStudents([]);
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

    const toggleAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    const toggleStudent = (id: string) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(s => s !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 gap-0 text-slate-800">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <GraduationCap className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("assign_incident")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("pick_a_class_and_section_to_find_students")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("class_label")} <span className="text-red-500">*</span></Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder={t("select_class")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {criteria.classes.map(cls => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("section_label")} <span className="text-red-500">*</span></Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder={t("select_section")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(sec => <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-1">
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all"
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            {t("find_students")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Assign Incident List Section */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 gap-0 text-slate-800">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Users className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("students")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("select_students_to_assign_an_incident")}</p>
                        </div>
                    </div>
                    {selectedStudents.length > 0 && (
                        <Button
                            onClick={() => setOpen(true)}
                            className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all animate-in zoom-in shrink-0"
                        >
                            <UserPlus className="h-4 w-4" />
                            {t("assign_x", { count: selectedStudents.length })}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[700px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600 w-[50px]">
                                        <Checkbox
                                            checked={students.length > 0 && selectedStudents.length === students.length}
                                            onCheckedChange={toggleAll}
                                        />
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("student")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("adm_no")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("gender")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("points")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right w-[100px]">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <TableRow key={i} className="text-xs">
                                            <TableCell><Skeleton className="h-4 w-4 rounded" /></TableCell>
                                            <TableCell className="py-3"><div className="flex items-center gap-2.5"><Skeleton className="h-7 w-7 rounded-md" /><Skeleton className="h-3.5 w-32 rounded" /></div></TableCell>
                                            <TableCell className="py-3"><Skeleton className="h-3.5 w-20 rounded" /></TableCell>
                                            <TableCell className="py-3"><Skeleton className="h-3.5 w-14 rounded" /></TableCell>
                                            <TableCell className="py-3 text-center"><Skeleton className="h-6 w-14 rounded-full mx-auto" /></TableCell>
                                            <TableCell className="py-3 text-right"><Skeleton className="h-7 w-16 rounded ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="px-4 py-14 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                <FolderOpen className="h-10 w-10 opacity-30" />
                                                <p className="text-xs font-semibold text-gray-500">{t("no_students_found")}</p>
                                                <p className="text-[11px] text-gray-400">{t("select_a_class_and_section_then_click_find_students")}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    students.map((student) => (
                                        <TableRow key={student.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                            <TableCell className="py-3">
                                                <Checkbox
                                                    checked={selectedStudents.includes(student.id)}
                                                    onCheckedChange={() => toggleStudent(student.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-500 font-bold text-[11px]">
                                                        {student.name?.[0]}
                                                    </span>
                                                    <span className="text-gray-800 font-semibold">{student.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 tabular-nums">{student.admission_no}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{student.gender}</TableCell>
                                            <TableCell className="py-3 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border tabular-nums",
                                                    (student.total_points || 0) >= 0
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                                )}>
                                                    <Zap className="h-3 w-3" />
                                                    {student.total_points || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <Button
                                                    onClick={() => { setSelectedStudents([student.id]); setOpen(true); }}
                                                    size="sm" className="h-7 px-3 rounded bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold shadow-sm active:scale-95 transition-all"
                                                >
                                                    {t("assign")}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                        <div>{t("x_students", { count: students.length })}</div>
                        <div className="flex gap-1 items-center">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40" disabled>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="sm" className="h-8 w-8 p-0 rounded-[10px] text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md">
                                1
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40" disabled>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Assignment Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-2xl gap-0">
                    <DialogHeader className="flex flex-row items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 space-y-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ShieldAlert className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-sm font-bold text-gray-800 tracking-tight leading-none">
                                {t("assign_incident")}
                            </DialogTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("record_and_assign_behavioural_incident_to_students")}
                            </p>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                        {/* Target Student Count Banner */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                                    <Users className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-indigo-950">
                                        {t("target_x_students_selected", { count: selectedStudents.length })}
                                    </p>
                                    <p className="text-[10px] text-indigo-600 font-medium">
                                        {t("incident_will_be_applied_to_all_selected_students")}
                                    </p>
                                </div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                {selectedStudents.length} {t("selected")}
                            </span>
                        </div>

                        {/* Incident Type Select */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700">
                                {t("incident_type")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={formData.incident_id} onValueChange={(val) => setFormData({...formData, incident_id: val})}>
                                <SelectTrigger className="h-9 text-xs bg-white border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                    <SelectValue placeholder={t("select_incident_type")} />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {incidents.map(inc => (
                                        <SelectItem key={inc.id} value={inc.id.toString()} className="text-xs">
                                            <div className="flex items-center justify-between w-full gap-4">
                                                <span>{inc.title}</span>
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] font-bold font-mono",
                                                    (inc.point || 0) >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                                )}>
                                                    {inc.point > 0 ? `+${inc.point}` : inc.point} pts
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Incident Date Input */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700">
                                {t("incident_date")} <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                <Input
                                    type="date"
                                    value={formData.incident_date}
                                    onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                                    className="h-9 text-xs pl-9 bg-white border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Description Textarea */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700">
                                {t("assigned_description")}
                            </Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder={t("details_regarding_this_specific_assignment")}
                                rows={3}
                                className="text-xs bg-white border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                            />
                        </div>
                    </div>

                    {/* Dialog Footer */}
                    <div className="px-6 py-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="h-8 px-4 text-xs font-medium rounded-full border-gray-200 hover:bg-gray-100"
                        >
                            {t("discard")}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleAssign}
                            disabled={submitting}
                            className="h-8 px-6 text-xs font-bold uppercase rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-md border-none transition-all disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    {t("saving")}
                                </>
                            ) : (
                                <>
                                    <Save className="mr-1.5 h-3.5 w-3.5" />
                                    {t("commit_assignment")}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
