"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Copy, FileSpreadsheet, FileText, Printer, Columns, Search, 
    ChevronLeft, ChevronRight, Trophy, BookOpen, GraduationCap,
    BarChart3, FileBarChart, UserCircle, Calculator
} from "lucide-react";
import Link from "next/link";

interface Subject {
    id: number;
    name: string;
    code: string;
}

interface ExamMark {
    subject_id: number;
    marks: string;
    is_absent: boolean;
    subject: Subject;
}

interface StudentResult {
    id: string;
    admission_no: string;
    roll_no: string;
    name: string;
    last_name: string;
    exam_results: ExamMark[];
}

export default function ExamResultPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    
    // Criteria Data
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [examGroups, setExamGroups] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);

    // Selected Criteria
    const [selectedCriteria, setSelectedCriteria] = useState({
        exam_group_id: "",
        exam_id: "",
        session_id: "",
        school_class_id: "",
        section_id: ""
    });

    // Results Data
    const [students, setStudents] = useState<StudentResult[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [criteriaRes, classesRes, sectionsRes] = await Promise.all([
                api.get('/examination/exam-results/criteria'),
                api.get('/academics/classes?no_paginate=true'),
                api.get('/academics/sections?no_paginate=true')
            ]);
            
            setExamGroups(criteriaRes.data.exam_groups || []);
            setSessions(criteriaRes.data.sessions || []);
            setClasses(classesRes.data.data || classesRes.data || []);
            setSections(sectionsRes.data.data || sectionsRes.data || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load criteria", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCriteria.exam_group_id) {
            const group = examGroups.find(g => g.id.toString() === selectedCriteria.exam_group_id);
            setExams(group?.exams || []);
        } else {
            setExams([]);
        }
    }, [selectedCriteria.exam_group_id, examGroups]);

    const handleSearch = async () => {
        if (!selectedCriteria.exam_id || !selectedCriteria.school_class_id || !selectedCriteria.section_id) {
            toast({ title: "Validation Error", description: "Please select all required fields", variant: "destructive" });
            return;
        }

        setSearching(true);
        try {
            const response = await api.post('/examination/exam-results/search', {
                exam_id: selectedCriteria.exam_id,
                school_class_id: selectedCriteria.school_class_id,
                section_id: selectedCriteria.section_id
            });
            setStudents(response.data.students || []);
            setSubjects(response.data.subjects || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch results", variant: "destructive" });
        } finally {
            setSearching(false);
        }
    };

    const getStudentMark = (student: StudentResult, subjectId: number) => {
        return student.exam_results.find(r => r.subject_id === subjectId);
    };

    const calculateTotal = (student: StudentResult) => {
        return student.exam_results.reduce((acc, curr) => acc + (curr.is_absent ? 0 : parseFloat(curr.marks || "0")), 0);
    };

    const calculatePercent = (student: StudentResult) => {
        const total = calculateTotal(student);
        const max = subjects.length * 100; // Mocking 100 as max per subject
        return max > 0 ? ((total / max) * 100).toFixed(2) : "0.00";
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.admission_no.includes(searchTerm)
    );

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <Trophy className="h-6 w-6 text-indigo-500" />
                        Exam Performance Index
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Institutional academic result repository</p>
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                    <GraduationCap className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Search Configuration</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Exam Group <span className="text-red-500">*</span></Label>
                        <Select value={selectedCriteria.exam_group_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, exam_group_id: val})}>
                            <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select Group" />
                            </SelectTrigger>
                            <SelectContent>
                                {examGroups.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Exam <span className="text-red-500">*</span></Label>
                        <Select value={selectedCriteria.exam_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, exam_id: val})}>
                            <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select Exam" />
                            </SelectTrigger>
                            <SelectContent>
                                {exams.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Session <span className="text-red-500">*</span></Label>
                        <Select value={selectedCriteria.session_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, session_id: val})}>
                            <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select Session" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.year}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Class <span className="text-red-500">*</span></Label>
                        <Select value={selectedCriteria.school_class_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, school_class_id: val})}>
                            <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Section <span className="text-red-500">*</span></Label>
                        <Select value={selectedCriteria.section_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, section_id: val})}>
                            <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
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
                        Retrieve Results
                    </Button>
                </div>
            </div>

            {/* Exam Result List Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <FileBarChart className="h-5 w-5 text-indigo-500" />
                        Tabulation Record
                    </h2>
                    <div className="flex items-center gap-1 text-gray-400">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileSpreadsheet className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Printer className="h-4 w-4" /></Button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by student name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none"
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-50 overflow-hidden shadow-sm overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-500">
                            <TableRow className="hover:bg-transparent border-gray-50">
                                <TableHead className="py-4 px-6 min-w-[120px]">Admission No</TableHead>
                                <TableHead className="py-4 px-6 min-w-[150px]">Student Name</TableHead>
                                {subjects.map(subject => (
                                    <TableHead key={subject.id} className="py-4 px-6 min-w-[120px] text-center border-l border-gray-50">
                                        <div className="flex flex-col items-center">
                                            <span className="text-indigo-600">{subject.name}</span>
                                            <span className="text-[8px] text-gray-400">{subject.code}</span>
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className="py-4 px-6 min-w-[120px] text-center border-l border-indigo-50 bg-indigo-50/20">Grand Total</TableHead>
                                <TableHead className="py-4 px-6 min-w-[100px] text-center border-l border-gray-50 bg-indigo-50/20">Percent (%)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {searching ? (
                                <TableRow>
                                    <TableCell colSpan={subjects.length + 4} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Collating performance metrics...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={subjects.length + 4} className="h-32 text-center text-gray-400 text-sm italic">
                                        Please select criteria and search to view results.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStudents.map((student) => (
                                    <TableRow key={student.id} className="text-[12px] text-gray-600 hover:bg-gray-50/30 transition-colors border-b last:border-0 border-gray-50">
                                        <TableCell className="py-4 px-6 font-bold text-gray-500 uppercase tracking-tighter bg-gray-50/20">{student.admission_no}</TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <UserCircle className="h-4 w-4 text-gray-300" />
                                                <Link href="#" className="font-bold text-indigo-600 hover:underline">
                                                    {student.name} {student.last_name}
                                                </Link>
                                            </div>
                                        </TableCell>
                                        
                                        {subjects.map(subject => {
                                            const mark = getStudentMark(student, subject.id);
                                            return (
                                                <TableCell key={subject.id} className="py-4 px-6 text-center border-l border-gray-50">
                                                    {mark ? (
                                                        mark.is_absent ? (
                                                            <span className="text-rose-500 font-bold text-[9px] uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">Absent</span>
                                                        ) : (
                                                            <span className="font-bold text-gray-700">{mark.marks}</span>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-300">---</span>
                                                    )}
                                                </TableCell>
                                            );
                                        })}

                                        <TableCell className="py-4 px-6 text-center font-bold text-indigo-700 border-l border-indigo-50 bg-indigo-50/10">
                                            {calculateTotal(student).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center font-bold border-l border-gray-50 bg-indigo-50/10">
                                            <div className="flex flex-col items-center">
                                                <span className="text-indigo-600">{calculatePercent(student)}%</span>
                                                <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                    <div 
                                                        className="h-full bg-emerald-500" 
                                                        style={{ width: `${calculatePercent(student)}%` }} 
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
