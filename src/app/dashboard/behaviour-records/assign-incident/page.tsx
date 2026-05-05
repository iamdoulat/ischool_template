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
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Search, FolderOpen, ChevronLeft, ChevronRight, 
    UserPlus, ShieldAlert, GraduationCap, Users, 
    Info, Zap, RefreshCw, Save, Calendar
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

export default function AssignIncidentPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [criteria, setCriteria] = useState<{ classes: any[] }>({ classes: [] });
    const [incidents, setIncidents] = useState<Incident[]>([]);
    
    // Selection State
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [sections, setSections] = useState<any[]>([]);
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
        } catch (error) {
            console.error("Failed to fetch analytical criteria");
        }
    };

    const fetchIncidents = async () => {
        try {
            const response = await api.get('/behaviour/incidents', { params: { per_page: 100 } });
            setIncidents(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch incident registry");
        }
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection) {
            toast({ title: "Validation", description: "Please select Class and Section", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/behaviour/assigned-incidents/search-students', {
                params: { class_id: selectedClass, section_id: selectedSection }
            });
            setStudents(response.data);
            setSelectedStudents([]);
        } catch (error) {
            toast({ title: "Error", description: "Failed to locate students", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (selectedStudents.length === 0) {
            toast({ title: "Validation", description: "Please select at least one student", variant: "destructive" });
            return;
        }

        if (!formData.incident_id || !formData.incident_date) {
            toast({ title: "Validation", description: "Incident type and date are required", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/behaviour/assigned-incidents', {
                student_ids: selectedStudents,
                ...formData
            });
            toast({ title: "Success", description: "Behavioural incident assigned successfully" });
            setOpen(false);
            setFormData({
                incident_id: "",
                incident_date: new Date().toISOString().split('T')[0],
                description: ""
            });
            handleSearch(); // Refresh total points
        } catch (error) {
            toast({ title: "Error", description: "Failed to assign incident", variant: "destructive" });
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
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-black tracking-tight text-slate-700 uppercase">Behavioural Target Selection</CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Academic Class <span className="text-red-500">*</span></label>
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
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-50">
                        <Button 
                            onClick={handleSearch}
                            disabled={loading}
                            className="btn-gradient text-white px-12 h-14 text-[11px] font-black uppercase tracking-[0.2em] gap-3 shadow-2xl shadow-orange-200/50 active:scale-95 transition-all rounded-full group"
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                            Locate Students
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Assign Incident List Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner">
                            <Users className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase">Student Engagement Registry</CardTitle>
                    </div>
                    {selectedStudents.length > 0 && (
                        <Button 
                            onClick={() => setOpen(true)}
                            className="btn-gradient text-white px-8 h-10 text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg rounded-full animate-in zoom-in"
                        >
                            <UserPlus className="h-4 w-4" />
                            Assign Incident ({selectedStudents.length})
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="py-5 pl-8 w-[60px]">
                                        <Checkbox 
                                            checked={students.length > 0 && selectedStudents.length === students.length} 
                                            onCheckedChange={toggleAll}
                                            className="rounded-md border-gray-300"
                                        />
                                    </TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">Nodal Identity</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">Admission Ref</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">Gender</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">Comm Port</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 text-center">Cumulative Points</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 pr-8 text-right">Utility</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.length === 0 ? (
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableCell colSpan={7} className="h-[350px] text-center">
                                            <div className="flex flex-col items-center justify-center gap-6 text-muted-foreground/50">
                                                <div className="p-8 rounded-[2.5rem] bg-indigo-50/50 text-indigo-400 transform rotate-6 shadow-inner">
                                                    <FolderOpen className="h-16 w-16 opacity-30" />
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/60 bg-rose-50 px-6 py-2 rounded-full border border-rose-100">
                                                        No data available in table
                                                    </span>
                                                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-tighter italic">
                                                        Select criteria and execute search to populate the engagement registry.
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    students.map((student, index) => (
                                        <TableRow key={student.id} className={cn(
                                            "hover:bg-indigo-50/20 border-b border-muted/10 transition-colors group",
                                            index % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                        )}>
                                            <TableCell className="py-5 pl-8">
                                                <Checkbox 
                                                    checked={selectedStudents.includes(student.id)} 
                                                    onCheckedChange={() => toggleStudent(student.id)}
                                                    className="rounded-md border-gray-300"
                                                />
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-[10px] shadow-inner">
                                                        {student.name?.[0]}
                                                    </div>
                                                    <span className="text-slate-700 text-[11px] font-black uppercase tracking-tight">{student.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <span className="text-slate-500 text-[11px] font-black uppercase tracking-widest tabular-nums">{student.admission_no}</span>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-[10px] py-5 font-black uppercase tracking-widest">{student.gender}</TableCell>
                                            <TableCell className="text-slate-600 text-[10px] font-bold py-5 tabular-nums tracking-widest">{student.phone}</TableCell>
                                            <TableCell className="py-5 text-center">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full font-black text-[10px] border uppercase tracking-widest shadow-sm",
                                                    (student.total_points || 0) >= 0 
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                                        : "bg-rose-50 text-rose-600 border-rose-100"
                                                )}>
                                                    <Zap className="h-3 w-3" /> {student.total_points || 0}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-8 py-5 text-right">
                                                <Button 
                                                    onClick={() => { setSelectedStudents([student.id]); setOpen(true); }}
                                                    className="h-8 px-4 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                                >
                                                    Assign
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    <div className="p-8 border-t border-muted/20 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                        <span>Registry Summary: {students.length} nodes identified</span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-muted/50 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm" disabled>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="icon" className="h-10 w-10 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-lg font-black text-xs">
                                1
                            </Button>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-muted/50 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm" disabled>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Assignment Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded-[2rem] border-0 shadow-2xl max-w-lg p-0 overflow-hidden bg-white">
                    <div className="bg-indigo-500/5 p-8 border-b border-indigo-100 flex items-center justify-between">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-gray-800 uppercase tracking-[0.2em] flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                                Assign Incident
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-10 grid grid-cols-1 gap-8">
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 flex items-center gap-4">
                            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                                <Users className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">
                                Target: {selectedStudents.length} Students Selected
                            </span>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Incident Type <span className="text-red-500">*</span></Label>
                            <Select value={formData.incident_id} onValueChange={(val) => setFormData({...formData, incident_id: val})}>
                                <SelectTrigger className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:ring-indigo-500 shadow-none text-sm font-bold tracking-tight px-6">
                                    <SelectValue placeholder="Select Incident Type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                    {incidents.map(inc => (
                                        <SelectItem key={inc.id} value={inc.id.toString()}>
                                            {inc.title} ({inc.point > 0 ? '+' : ''}{inc.point})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Incident Date <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    type="date"
                                    value={formData.incident_date}
                                    onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                                    className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-indigo-500 shadow-none text-sm font-bold tracking-tight pl-14 pr-6"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Assigned Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Details regarding this specific assignment..."
                                rows={4}
                                className="border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-indigo-500 shadow-none text-sm font-bold tracking-tight px-6 py-4 resize-none"
                            />
                        </div>
                    </div>

                    <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-12 px-8 rounded-full text-[10px] font-bold uppercase tracking-widest">Discard</Button>
                        <Button
                            onClick={handleAssign}
                            disabled={submitting}
                            className="btn-gradient text-white px-12 h-12 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-3 active:scale-95"
                        >
                            {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Commit Assignment
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
