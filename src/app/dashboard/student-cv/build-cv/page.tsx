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
            toast({ title: "Validation Error", description: "Please select Class and Section.", variant: "destructive" });
            return;
        }

        setSearching(true);
        try {
            const response = await api.get('/student-cv/students', {
                params: { school_class_id: selectedClass, section_id: selectedSection }
            });
            setStudents(response.data.data || []);
            toast({ title: "Success", description: "Student list updated." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch students.", variant: "destructive" });
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
        <div className="p-2 space-y-2 bg-transparent min-h-screen font-sans text-slate-700">
            {/* Select Criteria Section */}
            <Card className="border border-slate-200/60 shadow-none rounded-md overflow-hidden bg-transparent">
                <CardHeader className="px-4 py-2 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 bg-white/30">
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Select Criteria</h2>
                </CardHeader>
                <CardContent className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-600">
                                Class <span className="text-rose-500">*</span>
                            </Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm focus:ring-1 focus:ring-indigo-500 transition-all">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="rounded-md border-slate-200 shadow-lg">
                                    {criteria.map(cls => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-600">
                                Section
                            </Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm focus:ring-1 focus:ring-indigo-500 transition-all">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="rounded-md border-slate-200 shadow-lg">
                                    {sections.map(sec => <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <Button 
                            onClick={handleSearch}
                            disabled={searching}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 py-2 rounded-md text-xs font-medium flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Search className="h-4 w-4" />
                            {searching ? "Searching..." : "Search"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Student List Section */}
            <Card className="border border-slate-200/60 shadow-none rounded-md overflow-hidden bg-transparent">
                <CardHeader className="px-4 py-2 border-b border-slate-100 bg-white/30">
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Student List</h2>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Toolbar */}
                    <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-9 rounded-md border-slate-200 bg-white text-sm focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Select defaultValue="50">
                                    <SelectTrigger className="h-8 w-20 text-xs border-slate-200 bg-white rounded-md">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-md border-slate-200">
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1.5 border-l border-slate-100 pl-4">
                                {[Copy, FileSpreadsheet, FileJson, FileText, Printer, Columns].map((Icon, i) => (
                                    <Button key={i} variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 transition-colors">
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="text-xs font-semibold text-slate-600 py-3 pl-6">
                                        Admission No <ArrowUpDown className="inline-block h-3 w-3 ml-1 text-slate-300" />
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 py-3">
                                        Student Name <ArrowUpDown className="inline-block h-3 w-3 ml-1 text-slate-300" />
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 py-3 text-center">
                                        Date Of Birth <ArrowUpDown className="inline-block h-3 w-3 ml-1 text-slate-300" />
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 py-3 text-center">
                                        Gender <ArrowUpDown className="inline-block h-3 w-3 ml-1 text-slate-300" />
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 py-3">
                                        Category <ArrowUpDown className="inline-block h-3 w-3 ml-1 text-slate-300" />
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 py-3">
                                        Mobile Number <ArrowUpDown className="inline-block h-3 w-3 ml-1 text-slate-300" />
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 py-3 pr-6 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-slate-400 text-sm italic">
                                            No students found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <TableRow key={student.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors">
                                            <TableCell className="py-3 pl-6 text-sm text-slate-600">{student.admission_no}</TableCell>
                                            <TableCell className="py-3 text-sm text-indigo-600 font-medium">{student.name}</TableCell>
                                            <TableCell className="py-3 text-sm text-slate-600 text-center">{student.dob || "—"}</TableCell>
                                            <TableCell className="py-3 text-sm text-slate-600 text-center">{student.gender}</TableCell>
                                            <TableCell className="py-3 text-sm text-slate-600">{student.category || "—"}</TableCell>
                                            <TableCell className="py-3 text-sm text-slate-600">{student.phone || "—"}</TableCell>
                                            <TableCell className="py-3 pr-6 text-right">
                                                <Button size="icon" className="h-7 w-7 rounded bg-[#6366F1] hover:bg-[#5558E6] text-white transition-colors">
                                                    <LayoutList className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-slate-400">
                            Showing {filteredStudents.length > 0 ? 1 : 0} to {filteredStudents.length} of {filteredStudents.length} entries
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600 disabled:opacity-30" disabled>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button className="h-8 w-8 rounded-md bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-medium p-0 shadow-md">
                                1
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600 disabled:opacity-30" disabled>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
