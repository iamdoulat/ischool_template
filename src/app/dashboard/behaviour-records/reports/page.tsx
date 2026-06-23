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
    Search, FolderOpen, ChevronLeft, ChevronRight,
    BarChart3, UserCheck, ShieldAlert, GraduationCap,
    Layers, Home, RefreshCw, Eye, Download, Printer, Zap,
    Trash2, Calendar, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

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
    const { t } = useTranslation();
    const tt = useTranslateToast();
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
    }, [selectedClass, criteria.classes]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/behaviour/reports/criteria');
            setCriteria(response.data);
        } catch (error: any) {
            console.error("Failed to fetch analytical criteria");
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
                    session: selectedSession
                }
            });
            setReports(response.data.data || []);
        } catch (error) {
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
            setStudentIncidents(response.data);
        } catch (error) {
            tt.error("failed_to_fetch_student_incident_audit");
        } finally {
            setAuditLoading(false);
        }
    };

    const deleteIncident = async (id: string) => {
        if (!confirm(t("are_you_sure_you_want_to_purge_this_assigned_incident"))) return;
        try {
            await api.delete(`/behaviour/assigned-incidents/${id}`);
            tt.success("incident_node_purged_successfully");
            // Refresh audit list
            if (selectedStudent) handleAudit(selectedStudent);
            // Refresh main report to update points
            fetchReports();
        } catch (error) {
            tt.error("purge_protocol_failed");
        }
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
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">
            {/* Reports Strategy Hub */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] space-y-0">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BarChart3 className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("behaviour_reports")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("generate_behaviour_and_ranking_reports")}</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
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
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("session")}</Label>
                            <Select value={selectedSession} onValueChange={setSelectedSession}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder={t("current_session")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="current">{t("current_session")}</SelectItem>
                                    <SelectItem value="all">{t("all_sessions")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={fetchReports}
                            className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all"
                        >
                            <Search className="h-4 w-4" />
                            {t("generate_report")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Student Incident List Section */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 gap-0 text-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Layers className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("report_results")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("results_for_the_selected_criteria")}</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-white hover:text-indigo-600 rounded-md transition-all"><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-white hover:text-indigo-600 rounded-md transition-all"><Printer className="h-4 w-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[760px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600">{t("adm_no")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("student")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("class_label")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("gender")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("incidents")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("points")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right w-[80px]">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <TableRow key={i} className="text-xs">
                                            <TableCell className="py-3"><Skeleton className="h-3.5 w-16 rounded" /></TableCell>
                                            <TableCell className="py-3"><div className="flex items-center gap-2.5"><Skeleton className="h-7 w-7 rounded-md" /><Skeleton className="h-3.5 w-28 rounded" /></div></TableCell>
                                            <TableCell className="py-3 text-center"><div className="flex items-center justify-center gap-1.5"><Skeleton className="h-5 w-12 rounded-full" /><Skeleton className="h-5 w-8 rounded-full" /></div></TableCell>
                                            <TableCell className="py-3"><Skeleton className="h-3.5 w-14 rounded" /></TableCell>
                                            <TableCell className="py-3 text-center"><Skeleton className="h-5 w-10 rounded-full mx-auto" /></TableCell>
                                            <TableCell className="py-3 text-center"><Skeleton className="h-5 w-10 rounded-full mx-auto" /></TableCell>
                                            <TableCell className="py-3 text-right"><Skeleton className="h-7 w-7 rounded ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : reports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="px-4 py-14 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                <FolderOpen className="h-10 w-10 opacity-30" />
                                                <p className="text-xs font-semibold text-gray-500">{t("no_results_yet")}</p>
                                                <p className="text-[11px] text-gray-400">{t("choose_criteria_above_and_click_generate_report")}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.map((item) => (
                                        <TableRow key={item.id} className="text-xs hover:bg-gray-50/60 transition-colors">
                                            <TableCell className="py-3 text-gray-500 tabular-nums">{item.admission_no}</TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-500 font-bold text-[11px]">
                                                        {item.name?.[0]}
                                                    </span>
                                                    <span className="text-gray-800 font-semibold">{item.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold text-[10px] border border-indigo-100">{item.class}</span>
                                                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold text-[10px] border border-gray-200">{item.section}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.gender}</TableCell>
                                            <TableCell className="py-3 text-center">
                                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full font-bold text-xs border border-rose-200">
                                                    <ShieldAlert className="h-3 w-3" /> {item.total_incidents}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 text-center">
                                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold text-xs border border-emerald-200 tabular-nums">
                                                    <Zap className="h-3 w-3" /> {item.total_points}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <Button onClick={() => handleAudit(item)} size="sm" className="h-7 w-7 p-0 rounded bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm active:scale-95 transition-all">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
                        <div>{t("x_students", { count: reports.length })}</div>
                        <div className="flex gap-1 items-center">
                            <Button
                                variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                                disabled={loading || reports.length === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="sm" className="h-8 w-8 p-0 rounded-[10px] text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md">
                                1
                            </Button>
                            <Button
                                variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
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
                <DialogContent className="rounded-lg border-0 shadow-2xl max-w-3xl p-0 overflow-hidden bg-white">
                    <div className="bg-indigo-600 p-8 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <UserCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight">{t("nodal_incident_audit")}</DialogTitle>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1">
                                    {selectedStudent?.name} ({selectedStudent?.admission_no})
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-0 min-h-[400px]">
                        {auditLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center space-y-3">
                                <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("syncing_behavioural_audit_data")}</p>
                            </div>
                        ) : studentIncidents.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <ShieldAlert className="h-10 w-10 text-gray-300" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("no_incidents_assigned_to_this_student_node")}</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100">
                                        <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 pl-8">{t("protocol_date")}</TableHead>
                                        <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">{t("incident_title")}</TableHead>
                                        <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 text-center">{t("points")}</TableHead>
                                        <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">{t("assigned_by")}</TableHead>
                                        <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 pr-8 text-right">{t("purge_protocol")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentIncidents.map((incident) => (
                                        <TableRow key={incident.id} className="hover:bg-rose-50/5 transition-colors group">
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="text-slate-500 text-[10px] font-black uppercase tabular-nums">{incident.incident_date}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <span className="text-slate-700 text-[11px] font-black uppercase tracking-tight">{incident.incident?.title}</span>
                                            </TableCell>
                                            <TableCell className="py-5 text-center">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest",
                                                    incident.point >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                )}>
                                                    {incident.point > 0 ? '+' : ''}{incident.point}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-3.5 w-3.5 text-indigo-400" />
                                                    <span className="text-slate-500 text-[10px] font-bold uppercase">{incident.assigner?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-8 py-5 text-right">
                                                <Button 
                                                    onClick={() => deleteIncident(incident.id)}
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white transition-all shadow-sm border border-rose-100 hover:border-rose-500 active:scale-90"
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

                    <div className="p-8 bg-slate-50 border-t border-gray-100 flex justify-end">
                        <Button onClick={() => setAuditOpen(false)} className="h-12 px-12 rounded-full bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 active:scale-95 transition-all">
                            {t("discard_audit")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ReportLink({ label, active, onClick, icon }: { label: string, active?: boolean, onClick?: () => void, icon?: React.ReactNode }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group border",
                active
                    ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                    : "text-gray-600 hover:text-slate-800 hover:bg-gray-50 border-gray-100"
            )}
        >
            <div className={cn(
                "p-1 rounded transition-all duration-200",
                active ? "bg-white/20" : "bg-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-500"
            )}>
                {icon}
            </div>
            <span className={cn(
                "text-[11px] font-semibold leading-tight",
                active ? "text-white" : "text-gray-600 group-hover:text-slate-800"
            )}>{label}</span>
        </div>
    )
}
