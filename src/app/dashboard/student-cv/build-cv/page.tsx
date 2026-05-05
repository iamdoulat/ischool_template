"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Search,
    Settings,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    LayoutList,
    ArrowUpDown,
    RefreshCw,
    GraduationCap,
    Layers,
    Info,
    FileJson
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
    id: string;
    admission_no: string;
    name: string;
    dob: string;
    gender: string;
    category: string;
    phone: string;
}

export default function BuildCVPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [criteria, setCriteria] = useState<any[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [mounted, setMounted] = useState(false);

    // Selection State
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [sections, setSections] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
        fetchCriteria();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const cls = criteria.find(c => c.id.toString() === selectedClass);
            setSections(cls?.sections || []);
            setSelectedSection("");
        } else {
            setSections([]);
        }
    }, [selectedClass, criteria]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/student-cv/criteria');
            setCriteria(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch criteria");
        }
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection) {
            toast({ title: "Validation Error", description: "Please identify a target class and section node.", variant: "destructive" });
            return;
        }

        setSearching(true);
        try {
            const response = await api.get('/student-cv/students', {
                params: { school_class_id: selectedClass, section_id: selectedSection }
            });
            setStudents(response.data.data || []);
            toast({ title: "Matrix Synchronized", description: "Student registry nodes successfully re-indexed." });
        } catch (error) {
            toast({ title: "Lookup Failure", description: "Failed to locate students in specified sector.", variant: "destructive" });
        } finally {
            setSearching(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_no.includes(searchTerm)
    );

    if (!mounted) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 font-sans text-slate-800">
            {/* Strategy Hub - Criteria Selection */}
            <Card className="border-none shadow-[0_8px_40px_rgb(0,0,0,0.02)] bg-white/50 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
                <CardHeader className="px-10 py-8 border-b border-gray-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner transform -rotate-3 transition-transform hover:rotate-0 duration-500">
                            <GraduationCap className="h-8 w-8" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tight text-slate-800 uppercase tracking-widest">Select Criteria</CardTitle>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.25em] mt-1.5 flex items-center gap-2">
                                <Info className="h-3 w-3 text-indigo-400" /> Specify institutional parameters to index curriculum vitae nodes
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-11 px-6 rounded-2xl border-gray-100 bg-white shadow-sm text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all flex gap-2">
                        <Settings className="h-4 w-4" />
                        Registry Config
                    </Button>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                        <div className="space-y-4 group">
                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">
                                Target Class <span className="text-rose-500">*</span>
                            </Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-white shadow-sm font-bold text-sm px-6 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all">
                                    <SelectValue placeholder="Identify Class Node" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                    {criteria.map(cls => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-4 group">
                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">
                                Target Section
                            </Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-white shadow-sm font-bold text-sm px-6 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all">
                                    <SelectValue placeholder="Identify Section Node" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                    {sections.map(sec => <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <Button 
                            onClick={handleSearch}
                            disabled={searching}
                            className="h-14 px-12 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-orange-200/50 hover:shadow-orange-300/60 active:scale-95 transition-all flex items-center gap-3"
                        >
                            {searching ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                            Execute Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Matrix Results - Student List */}
            <Card className="border-none shadow-[0_8px_40px_rgb(0,0,0,0.02)] bg-white/50 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
                <CardHeader className="px-10 py-8 border-b border-gray-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-[1.5rem] bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner">
                            <Layers className="h-7 w-7" />
                        </div>
                        <CardTitle className="text-xl font-black tracking-tight text-slate-700 uppercase tracking-widest">Student List</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                        {[Copy, FileSpreadsheet, FileJson, FileText, Printer, Columns].map((Icon, i) => (
                            <Button key={i} variant="outline" size="icon" className="h-11 w-11 rounded-xl border-gray-100 bg-white text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 hover:border-indigo-100 active:scale-95 transition-all shadow-sm">
                                <Icon className="h-4 w-4" />
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Integrated Toolbar */}
                    <div className="px-10 py-8 flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-gray-50 bg-slate-50/30">
                        <div className="relative w-full lg:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                placeholder="Identify nodal asset..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 h-12 rounded-2xl border-2 border-gray-100 bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-xs shadow-inner"
                            />
                        </div>

                        <div className="flex items-center gap-6">
                            <Select defaultValue="50">
                                <SelectTrigger className="h-11 w-20 text-[11px] font-black border-gray-200 bg-white shadow-sm rounded-xl focus:ring-indigo-500/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] py-6 pl-10">Admission No <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] py-6">Student Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] py-6 text-center">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] py-6 text-center">Gender <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] py-6 whitespace-nowrap">Category <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] py-6">Mobile Number <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] py-6 pr-10 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {searching ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="h-16 w-16 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner animate-pulse">
                                                    <RefreshCw className="h-8 w-8 animate-spin" />
                                                </div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 animate-pulse">Synchronizing Matrix...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStudents.length === 0 ? (
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-6">
                                                <div className="p-12 rounded-[3rem] bg-slate-50 text-slate-300 transform rotate-3 shadow-inner">
                                                    <RefreshCw className="h-16 w-16 opacity-20" />
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 bg-rose-50 px-8 py-3 rounded-full border border-rose-100 shadow-sm">No analytical nodes identified</span>
                                                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-tighter italic">Execute search to populate student matrix.</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student, index) => (
                                        <TableRow key={student.id} className={cn(
                                            "hover:bg-indigo-50/20 border-b border-gray-50 transition-all group text-[11px]",
                                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                        )}>
                                            <TableCell className="py-5 pl-10 font-black text-slate-500 tabular-nums uppercase tracking-widest">{student.admission_no}</TableCell>
                                            <TableCell className="py-5">
                                                <span className="text-indigo-500 underline underline-offset-4 decoration-indigo-200 cursor-pointer font-black uppercase tracking-tight hover:text-indigo-600 transition-colors">{student.name}</span>
                                            </TableCell>
                                            <TableCell className="py-5 text-center text-slate-500 font-bold tabular-nums tracking-widest">{student.dob || "—"}</TableCell>
                                            <TableCell className="py-5 text-center">
                                                <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full font-black text-[9px] border border-indigo-100 uppercase tracking-widest shadow-sm">
                                                    {student.gender}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-5 text-slate-500 font-black uppercase tracking-widest whitespace-nowrap">{student.category || "—"}</TableCell>
                                            <TableCell className="py-5 text-slate-600 font-bold tabular-nums tracking-[0.15em]">{student.phone || "—"}</TableCell>
                                            <TableCell className="py-5 pr-10 text-right">
                                                <Button size="icon" className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 transition-all active:scale-90">
                                                    <LayoutList className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Premium Pagination Matrix */}
                    <div className="px-10 py-10 bg-slate-50/50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            Matrix Analytics: <span className="text-indigo-600">{filteredStudents.length}</span> active nodes identified
                        </p>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-gray-100 bg-white text-slate-400 hover:text-indigo-500 active:scale-95 transition-all shadow-sm">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button className="h-12 w-12 rounded-2xl border-none p-0 text-white font-black text-xs active:scale-95 transition-all shadow-xl shadow-indigo-200/50 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                                1
                            </Button>
                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-gray-100 bg-white text-slate-400 hover:text-indigo-500 active:scale-95 transition-all shadow-sm">
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
