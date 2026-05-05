"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
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
import { 
    Search, FolderOpen, FileText, ChevronLeft, ChevronRight, 
    BarChart3, UserCheck, ShieldAlert, GraduationCap, 
    Layers, Home, RefreshCw, Eye, Download, Printer, Info, Zap,
    Trash2, Calendar, User, UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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
    const { toast } = useToast();
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
            toast({ title: "Validation", description: "Please select Class and Section", variant: "destructive" });
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
            toast({ title: "Error", description: "Failed to fetch analytical report", variant: "destructive" });
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
            toast({ title: "Error", description: "Failed to fetch student incident audit", variant: "destructive" });
        } finally {
            setAuditLoading(false);
        }
    };

    const deleteIncident = async (id: string) => {
        if (!confirm("Are you sure you want to purge this assigned incident?")) return;
        try {
            await api.delete(`/behaviour/assigned-incidents/${id}`);
            toast({ title: "Success", description: "Incident node purged successfully" });
            // Refresh audit list
            if (selectedStudent) handleAudit(selectedStudent);
            // Refresh main report to update points
            fetchReports();
        } catch (error) {
            toast({ title: "Error", description: "Purge protocol failed", variant: "destructive" });
        }
    };

    const reportTypes = [
        { id: "incident", label: "Incident Registry Report", icon: ShieldAlert },
        { id: "behaviour", label: "Nodal Behaviour Rank", icon: BarChart3 },
        { id: "class_rank", label: "Class Performance Rank", icon: GraduationCap },
        { id: "section_rank", label: "Section Performance Matrix", icon: Layers },
        { id: "house_rank", label: "Institutional House Rank", icon: Home },
        { id: "incident_wise", label: "Incident Analytical Audit", icon: Zap },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">
            {/* Reports Strategy Hub */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-muted/50 pb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-xl font-black tracking-tight text-slate-700 uppercase">Analytical Reports Registry</CardTitle>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {reportTypes.map((report) => (
                            <ReportLink 
                                key={report.id} 
                                label={report.label} 
                                active={activeReport === report.id} 
                                onClick={() => setActiveReport(report.id)}
                                icon={<report.icon className="h-3.5 w-3.5" />}
                            />
                        ))}
                    </div>
                </CardHeader>

                {/* Select Criteria Section */}
                <div className="p-10 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] transform rotate-12">
                        <Zap className="h-48 w-48 text-indigo-500" />
                    </div>
                    
                    <div className="flex items-center gap-3 relative z-10">
                        <Info className="h-4 w-4 text-indigo-400" />
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Execute Audit Parameters</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Target Class <span className="text-red-500">*</span></label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-14 rounded-2xl bg-white border-gray-100 focus:ring-indigo-500/20 shadow-none text-sm font-bold tracking-tight px-6">
                                    <SelectValue placeholder="Select Institutional Class" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                    {criteria.classes.map(cls => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Class Section <span className="text-red-500">*</span></label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="h-14 rounded-2xl bg-white border-gray-100 focus:ring-indigo-500/20 shadow-none text-sm font-bold tracking-tight px-6">
                                    <SelectValue placeholder="Select Academic Section" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                    {sections.map(sec => <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Temporal Session</label>
                            <Select value={selectedSession} onValueChange={setSelectedSession}>
                                <SelectTrigger className="h-14 rounded-2xl bg-white border-gray-100 focus:ring-indigo-500/20 shadow-none text-sm font-bold tracking-tight px-6">
                                    <SelectValue placeholder="Current Session Points" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                    <SelectItem value="current">Current Session Points</SelectItem>
                                    <SelectItem value="all">Global Analytical Cumulative</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-50 relative z-10">
                        <Button 
                            onClick={fetchReports}
                            className="btn-gradient text-white px-12 h-14 text-[11px] font-black uppercase tracking-[0.2em] gap-3 shadow-2xl shadow-orange-200/50 active:scale-95 transition-all rounded-full group"
                        >
                            <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            Initiate Audit
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Student Incident List Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner">
                            <Layers className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase">Audit Results Matrix</CardTitle>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"><Printer className="h-4 w-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 pl-8">Admission Ref</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">Nodal Identity</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 text-center">Protocol Node</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">Gender</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 text-center">Incidents</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 text-center">Nodal Points</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 pr-8 text-right">Utility</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Executing Behavioural Audit Protocol...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : reports.length === 0 ? (
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableCell colSpan={7} className="h-[350px] text-center">
                                            <div className="flex flex-col items-center justify-center gap-6 text-muted-foreground/50">
                                                <div className="p-8 rounded-[2.5rem] bg-indigo-50/50 text-indigo-400 transform rotate-6 shadow-inner">
                                                    <FolderOpen className="h-16 w-16 opacity-30" />
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/60 bg-rose-50 px-6 py-2 rounded-full border border-rose-100">
                                                        No analytical nodes indexed in registry
                                                    </span>
                                                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-tighter italic">
                                                        Initiate an audit protocol or calibrate criteria parameters.
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.map((item, index) => (
                                        <TableRow key={item.id} className={cn(
                                            "hover:bg-indigo-50/20 border-b border-muted/10 transition-colors group",
                                            index % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                        )}>
                                            <TableCell className="py-5 pl-8">
                                                <span className="text-slate-500 text-[11px] font-black uppercase tracking-widest tabular-nums">{item.admission_no}</span>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-[10px] shadow-inner">
                                                        {item.name?.[0]}
                                                    </div>
                                                    <span className="text-slate-700 text-[11px] font-black uppercase tracking-tight">{item.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black text-[9px] border border-indigo-100 uppercase tracking-tighter">
                                                        {item.class}
                                                    </span>
                                                    <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-black text-[9px] border border-gray-200 uppercase tracking-tighter">
                                                        {item.section}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-[10px] py-5 font-black uppercase tracking-widest">{item.gender}</TableCell>
                                            <TableCell className="py-5 text-center">
                                                <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-black text-[10px] border border-rose-100 uppercase tracking-widest shadow-sm">
                                                    <ShieldAlert className="h-3 w-3" /> {item.total_incidents}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 text-center">
                                                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black text-[10px] border border-emerald-100 uppercase tracking-widest shadow-sm">
                                                    <Zap className="h-3 w-3" /> {item.total_points}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-8 py-5 text-right">
                                                <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                                                    <Button onClick={() => handleAudit(item)} size="icon" className="h-8 w-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl shadow-indigo-200">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    <div className="p-8 border-t border-muted/20 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                        <span>Node Summary: {reports.length} analytical units identified</span>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" size="icon" className="h-10 w-10 rounded-xl border-muted/50 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                                disabled={loading || reports.length === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="icon" className="h-10 w-10 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-lg font-black text-xs">
                                1
                            </Button>
                            <Button 
                                variant="outline" size="icon" className="h-10 w-10 rounded-xl border-muted/50 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
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
                <DialogContent className="rounded-[2rem] border-0 shadow-2xl max-w-3xl p-0 overflow-hidden bg-white">
                    <div className="bg-indigo-600 p-8 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <UserCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight">Nodal Incident Audit</DialogTitle>
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
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Behavioural Audit Data...</p>
                            </div>
                        ) : studentIncidents.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <ShieldAlert className="h-10 w-10 text-gray-300" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No incidents assigned to this student node.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100">
                                        <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 pl-8">Protocol Date</TableHead>
                                        <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">Incident Title</TableHead>
                                        <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 text-center">Points</TableHead>
                                        <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">Assigned By</TableHead>
                                        <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 pr-8 text-right">Purge Protocol</TableHead>
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
                            Discard Audit
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
                "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 group border-2",
                active 
                    ? "bg-indigo-50/50 border-indigo-500 text-slate-800 shadow-xl shadow-indigo-50 scale-[1.02]" 
                    : "text-muted-foreground hover:text-slate-700 hover:bg-white border-transparent hover:border-gray-100 hover:shadow-lg"
            )}
        >
            <div className={cn(
                "p-2 rounded-xl transition-all duration-500 group-hover:scale-110 shadow-inner", 
                active ? "bg-indigo-500 text-white" : "bg-muted/50"
            )}>
                {icon}
            </div>
            <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                active ? "text-indigo-700" : "group-hover:text-slate-700"
            )}>{label}</span>
        </div>
    )
}
