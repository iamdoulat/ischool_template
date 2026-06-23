"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Download, Mail, Search, Printer, UserCircle, 
    ShieldCheck, Calendar, FileText, BadgeCheck,
    Users2, LayoutTemplate, Filter, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StudentRecord {
    id: string;
    admission_no: string;
    name: string;
    last_name: string;
    father_name: string;
    dob: string;
    gender: string;
    mobile_no: string;
}

export default function PrintMarksheetPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    
    // Criteria Data
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    
    // Selection State
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("");
    const [selectedTemplateId, setSelectedTemplateId] = useState("");

    // Results
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        setLoading(true);
        try {
            const response = await api.get('/examination/cbse-reports/criteria');
            setClasses(response.data.classes || []);
            setSections(response.data.sections || []);
            setTemplates(response.data.templates || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load criteria", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!selectedClassId || !selectedTemplateId) {
            toast({ title: "Validation Error", description: "Please select Class and Template", variant: "destructive" });
            return;
        }

        setSearching(true);
        try {
            const response = await api.post('/examination/cbse-reports/students', {
                class_id: selectedClassId,
                section_id: selectedSectionId
            });
            setStudents(response.data || []);
            setSelectedStudents([]);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch students", variant: "destructive" });
        } finally {
            setSearching(false);
        }
    };

    const toggleStudent = (id: string) => {
        setSelectedStudents(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Printer className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">Board Markcard Issuance</h1>
                        <p className="text-[11px] text-gray-500 mt-1">Bulk print and distribute official records</p>
                    </div>
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Filter className="h-24 w-24 text-indigo-500" />
                </div>

                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                    <ShieldCheck className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Issuance Parameters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            Target Class <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.class}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Target Section</Label>
                        <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                            <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select Section (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.section}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            Board Template <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                            <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select Layout Template" />
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
                        Retrieve Student Registry
                    </Button>
                </div>
            </div>

            {/* Student List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <Users2 className="h-5 w-5 text-indigo-500" />
                        Student Registry
                    </h2>
                    {selectedStudents.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold uppercase h-9 px-6 rounded-full shadow-lg flex gap-2">
                                <Download className="h-3.5 w-3.5" /> Bulk Download ({selectedStudents.length})
                            </Button>
                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase h-9 px-6 rounded-full shadow-lg flex gap-2">
                                <Mail className="h-3.5 w-3.5" /> Dispatch Mail
                            </Button>
                        </div>
                    )}
                </div>

                <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-gray-50/50 text-[11px] uppercase font-bold text-gray-600">
                            <TableRow className="hover:bg-transparent border-gray-50">
                                <TableHead className="w-[60px] py-4 px-6">
                                    <Checkbox 
                                        checked={students.length > 0 && selectedStudents.length === students.length}
                                        onCheckedChange={toggleAll}
                                        className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" 
                                    />
                                </TableHead>
                                <TableHead className="py-4 px-6 min-w-[120px]">Admission ID</TableHead>
                                <TableHead className="py-4 px-6 min-w-[200px]">Student Identity</TableHead>
                                <TableHead className="py-4 px-6 min-w-[180px]">Guardian Record</TableHead>
                                <TableHead className="py-4 px-6 min-w-[120px]">Birth Date</TableHead>
                                <TableHead className="py-4 px-6 text-right min-w-[120px]">Issuance Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {searching ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Querying Institutional Database...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                                            <LayoutTemplate className="h-12 w-12 text-gray-300" />
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Initialize criteria to retrieve issuance records</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student) => (
                                    <TableRow key={student.id} className="text-[13px] text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                        <TableCell className="py-4 px-6">
                                            <Checkbox 
                                                checked={selectedStudents.includes(student.id)}
                                                onCheckedChange={() => toggleStudent(student.id)}
                                                className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" 
                                            />
                                        </TableCell>
                                        <TableCell className="py-4 px-6 font-bold text-gray-400 bg-gray-50/10 tracking-widest">{student.admission_no}</TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                                    <UserCircle className="h-5 w-5 text-indigo-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-indigo-700 uppercase tracking-tight">{student.name} {student.last_name}</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{student.gender}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 font-medium text-gray-500">{student.father_name}</TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5" /> {student.dob || "N/A"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md">
                                                    <Mail className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {students.length > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-4 uppercase tracking-tight">
                        <div className="flex items-center gap-2">
                            <BadgeCheck className="h-4 w-4 text-emerald-500" />
                            Synchronized {students.length} student records for issuance
                        </div>
                        <div className="flex items-center gap-2 text-indigo-600">
                            Review Selections <ArrowRight className="h-4 w-4" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
