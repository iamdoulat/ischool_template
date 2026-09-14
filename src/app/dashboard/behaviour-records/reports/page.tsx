/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { 
    Search,
    FolderOpen,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    UserCheck,
    ShieldAlert,
    GraduationCap,
    Layers,
    Home,
    RefreshCw,
    Eye,
    Download,
    Printer,
    Zap,
    Trash2,
    Calendar,
    User,
} from "lucide-react";
import { cn, toLocaleNumber, translateClassName } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface BehaviourReport {
    id: string;
    admission_no: string;
    name: string;
    class: string;
    section: string;
    gender: string;
    phone: string;
    total_incidents: number;
    total_points: number;
}

interface AssignedIncident {
    id: string;
    incident_date: string;
    point: number;
    description: string;
    incident: { title: string };
    assigner: { name: string };
}

export default function ReportsPage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const shortCode = language?.short_code || "en";
    const [activeReport, setActiveReport] = useState("incident");
    const [loading, setLoading] = useState(false);
    const [criteria, setCriteria] = useState<{ classes: any[], sessions: any[] }>({ classes: [], sessions: [] });
    
    // Selection State
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedSession, setSelectedSession] = useState("current");
    const [sections, setSections] = useState<any[]>([]);

    const [reports, setReports] = useState<BehaviourReport[]>([]);

    // Audit State
    const [auditOpen, setAuditOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<BehaviourReport | null>(null);
    const [studentIncidents, setStudentIncidents] = useState<AssignedIncident[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [deleteIncidentId, setDeleteIncidentId] = useState<string | null>(null);

    useEffect(() => {
        fetchCriteria();
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
            setCriteria(response.data || { classes: [], sessions: [] });
        } catch {
            // Error silently ignored
        }
    };

    const fetchReports = async () => {
        if (!selectedClass || !selectedSection) {
            tt.error("please_select_class_and_section");
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/behaviour/reports', {
                params: {
                    type: activeReport,
                    class_id: selectedClass,
                    section_id: selectedSection,
                    session: selectedSession,
                }
            });
            setReports(response.data?.data || response.data || []);
        } catch {
            tt.error("failed_to_fetch_analytical_report");
        } finally {
            setLoading(false);
        }
    };

    const handleAudit = async (student: BehaviourReport) => {
        setSelectedStudent(student);
        setAuditOpen(true);
        setAuditLoading(true);
        try {
            const response = await api.get('/behaviour/assigned-incidents', {
                params: { student_id: student.id }
            });
            setStudentIncidents(Array.isArray(response.data) ? response.data : (response.data?.data || []));
        } catch {
            tt.error("failed_to_fetch_student_incident_audit");
        } finally {
            setAuditLoading(false);
        }
    };

    const confirmDeleteIncident = async () => {
        if (!deleteIncidentId) return;
        try {
            await api.delete(`/behaviour/assigned-incidents/${deleteIncidentId}`);
            tt.success("incident_node_purged_successfully");
            if (selectedStudent) handleAudit(selectedStudent);
            fetchReports();
        } catch {
            tt.error("purge_protocol_failed");
        } finally {
            setDeleteIncidentId(null);
        }
    };

    const formatGender = (gender: string) => {
        const lower = String(gender || "").toLowerCase();
        if (lower === "male") return t("male");
        if (lower === "female") return t("female");
        if (lower === "other") return t("other");
        return gender || "—";
    };

    const reportTypes = [
        { id: "incident", label: t("incident_registry_report"), icon: ShieldAlert },
        { id: "behaviour", label: t("nodal_behaviour_rank"), icon: BarChart3 },
        { id: "class_rank", label: t("class_performance_rank"), icon: GraduationCap },
        { id: "section_rank", label: t("section_performance_matrix"), icon: Layers },
        { id: "house_rank", label: t("institutional_house_rank"), icon: Home },
        { id: "incident_wise", label: t("incident_analytical_audit"), icon: Zap },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800 dark:text-slate-100">
            {/* Reports Strategy Hub */}
            <Card className="border-[0.5px] border-gray-200 dark:border-gray-800 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 gap-0 rounded-2xl">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-gray-800 dark:to-gray-850 border-b border-gray-100 dark:border-gray-800 space-y-0">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BarChart3 className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                {t("behaviour_reports")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                {t("generate_behaviour_and_ranking_reports")}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-5 space-y-5">
                    {/* Report type selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {reportTypes.map((report) => (
                            <ReportLink
                                key={report.id}
                                label={report.label}
                                active={activeReport === report.id}
                                onClick={() => setActiveReport(report.id)}
                                icon={<report.icon className="h-4 w-4" />}
                            />
                        ))}
                    </div>

                    {/* Select Criteria */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {t("class_label")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl">
                                    <SelectValue placeholder={t("select_class")} />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {criteria.classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id.toString()} className="text-xs font-medium">
                                            {translateClassName(cls.name, shortCode)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {t("section_label")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-50">
                                    <SelectValue placeholder={t("select_section")} />
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
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {t("session")}
                            </Label>
                            <Select value={selectedSession} onValueChange={setSelectedSession}>
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl">
                                    <SelectValue placeholder={t("current_session")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="current" className="text-xs">{t("current_session")}</SelectItem>
                                    <SelectItem value="all" className="text-xs">{t("all_sessions")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={fetchReports}
                            disabled={loading || !selectedClass || !selectedSection}
                            className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span>{t("generate_report")}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Student Incident List Section */}
            <Card className="border-[0.5px] border-gray-200 dark:border-gray-800 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 gap-0 text-slate-800 dark:text-slate-100 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-gray-800 dark:to-gray-850 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Layers className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                {t("report_results")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                {t("results_for_the_selected_criteria")}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-white hover:text-indigo-600 rounded-md transition-all cursor-pointer">
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-white hover:text-indigo-600 rounded-md transition-all cursor-pointer">
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[760px]">
                            <TableHeader className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase font-bold text-gray-600 dark:text-gray-300">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 py-3.5 px-4">{t("adm_no")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 py-3.5 px-4">{t("student")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 text-center py-3.5 px-4">{t("class_label")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 py-3.5 px-4">{t("gender")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 text-center py-3.5 px-4">{t("incidents")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 text-center py-3.5 px-4">{t("points")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 text-right w-[80px] py-3.5 px-4">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <TableRow key={i} className="text-xs">
                                            <TableCell className="py-3 px-4"><Skeleton className="h-3.5 w-16 rounded" /></TableCell>
                                            <TableCell className="py-3 px-4"><div className="flex items-center gap-2.5"><Skeleton className="h-7 w-7 rounded-md" /><Skeleton className="h-3.5 w-28 rounded" /></div></TableCell>
                                            <TableCell className="py-3 px-4 text-center"><div className="flex items-center justify-center gap-1.5"><Skeleton className="h-5 w-12 rounded-full" /><Skeleton className="h-5 w-8 rounded-full" /></div></TableCell>
                                            <TableCell className="py-3 px-4"><Skeleton className="h-3.5 w-14 rounded" /></TableCell>
                                            <TableCell className="py-3 px-4 text-center"><Skeleton className="h-5 w-10 rounded-full mx-auto" /></TableCell>
                                            <TableCell className="py-3 px-4 text-center"><Skeleton className="h-5 w-10 rounded-full mx-auto" /></TableCell>
                                            <TableCell className="py-3 px-4 text-right"><Skeleton className="h-7 w-7 rounded ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : reports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="px-4 py-14 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                <FolderOpen className="h-10 w-10 opacity-30" />
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("no_results_yet")}</p>
                                                <p className="text-[11px] text-gray-400">{t("choose_criteria_above_and_click_generate_report")}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.map((item) => (
                                        <TableRow key={item.id} className="text-xs hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer whitespace-nowrap">
                                            <TableCell className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono font-bold">
                                                {item.admission_no}
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] border border-indigo-100 dark:border-indigo-900">
                                                        {item.name?.[0]}
                                                    </span>
                                                    <span className="text-gray-900 dark:text-gray-100 font-bold">{item.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold text-[10px] border-indigo-200 dark:border-indigo-800">
                                                        {translateClassName(item.class, shortCode)}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-semibold text-[10px] border-gray-200 dark:border-gray-700">
                                                        {item.section}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs",
                                                    String(item.gender).toLowerCase() === "male"
                                                        ? "bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/60 dark:text-blue-300"
                                                        : "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/60 dark:text-rose-300"
                                                )}>
                                                    {formatGender(item.gender)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-2.5 py-0.5 rounded-full font-bold text-xs border border-rose-200 dark:border-rose-900 font-mono shadow-2xs">
                                                    <ShieldAlert className="h-3 w-3" /> {toLocaleNumber(item.total_incidents, shortCode)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs border font-mono shadow-2xs tabular-nums",
                                                    Number(item.total_points || 0) >= 0
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900"
                                                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900"
                                                )}>
                                                    <Zap className="h-3 w-3" />
                                                    {Number(item.total_points || 0) > 0 ? `+${toLocaleNumber(item.total_points, shortCode)}` : toLocaleNumber(item.total_points, shortCode)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <Button 
                                                    onClick={() => handleAudit(item)} 
                                                    size="sm" 
                                                    title={t("view")}
                                                    className="h-7 w-7 p-0 rounded bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium pt-1">
                        <div>
                            {reports.length > 0 && (
                                <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-xs px-2.5 py-0.5 rounded-lg">
                                    {t("x_students", { count: toLocaleNumber(reports.length, shortCode) })}
                                </Badge>
                            )}
                        </div>
                        <div className="flex gap-1 items-center">
                            <Button
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 rounded-lg bg-background border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 cursor-pointer"
                                disabled={loading || reports.length === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="sm" className="h-8 w-8 p-0 rounded-lg text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-xs cursor-pointer">
                                {toLocaleNumber(1, shortCode)}
                            </Button>
                            <Button
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 rounded-lg bg-background border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 cursor-pointer"
                                disabled={loading || reports.length === 0}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Student Incident Audit Modal */}
            <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
                <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl gap-0">
                    <DialogHeader className="flex flex-row items-center gap-4 px-6 py-5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-gray-800 dark:to-gray-850 border-b border-gray-100 dark:border-gray-800 space-y-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <UserCheck className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-none">
                                {t("nodal_incident_audit")}
                            </DialogTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                                {selectedStudent?.name} ({selectedStudent?.admission_no})
                            </p>
                        </div>
                    </DialogHeader>

                    <div className="p-0 min-h-[350px] max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {auditLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center space-y-3">
                                <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                                <p className="text-xs font-bold text-gray-400">{t("syncing_behavioural_audit_data")}</p>
                            </div>
                        ) : studentIncidents.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-3">
                                <ShieldAlert className="h-10 w-10 text-gray-300" />
                                <p className="text-xs font-bold text-gray-400">{t("no_incidents_assigned_to_this_student_node")}</p>
                            </div>
                        ) : (
                            <Table className="w-full">
                                <TableHeader className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase font-bold text-gray-600 dark:text-gray-300">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                                        <TableHead className="py-3.5 px-4">{t("incident_date")}</TableHead>
                                        <TableHead className="py-3.5 px-4">{t("incident_title")}</TableHead>
                                        <TableHead className="py-3.5 px-4 text-center">{t("points")}</TableHead>
                                        <TableHead className="py-3.5 px-4">{t("assigned_by")}</TableHead>
                                        <TableHead className="py-3.5 px-4 text-right">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {studentIncidents.map((incident) => (
                                        <TableRow key={incident.id} className="text-xs hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors">
                                            <TableCell className="py-3 px-4">
                                                <div className="flex items-center gap-2 font-mono text-gray-600 dark:text-gray-300">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    <span>{incident.incident_date}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">
                                                {incident.incident?.title}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full font-mono font-bold text-xs shadow-2xs",
                                                    Number(incident.point || 0) >= 0 
                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" 
                                                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                                                )}>
                                                    {Number(incident.point || 0) > 0 ? `+${toLocaleNumber(incident.point, shortCode)}` : toLocaleNumber(incident.point, shortCode)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                                    <User className="h-3.5 w-3.5 text-indigo-500" />
                                                    <span>{incident.assigner?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <Button 
                                                    onClick={() => setDeleteIncidentId(incident.id)}
                                                    size="sm" 
                                                    title={t("delete")}
                                                    className="h-7 w-7 p-0 rounded bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-all shadow-2xs border border-rose-200 active:scale-95 cursor-pointer"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50/80 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                        <Button 
                            onClick={() => setAuditOpen(false)} 
                            className="h-9 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold active:scale-95 transition-all cursor-pointer"
                        >
                            {t("discard_audit")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Incident Dialog */}
            <AlertDialog open={!!deleteIncidentId} onOpenChange={(isOpen) => !isOpen && setDeleteIncidentId(null)}>
                <AlertDialogContent className="rounded-3xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-black tracking-tight text-foreground">
                            {t("delete")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {t("are_you_sure_you_want_to_purge_this_assigned_incident")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-border text-xs font-bold">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDeleteIncident} 
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function ReportLink({ label, active, onClick, icon }: { label: string, active?: boolean, onClick?: () => void, icon?: React.ReactNode }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-2.5 px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-200 group border shadow-2xs",
                active
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border-gray-200 dark:border-gray-700"
            )}
        >
            <div className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                active ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
            )}>
                {icon}
            </div>
            <span className={cn(
                "text-xs font-bold leading-tight",
                active ? "text-white" : "text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
            )}>
                {label}
            </span>
        </div>
    );
}
