"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    FileSpreadsheet, Printer, Search, FileBarChart, 
    ClipboardCheck, LayoutList, Trophy, GraduationCap,
    Calculator, ShieldAlert, UserCircle, Download,
    FileText, BarChart3, Presentation, BookMarked
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Subject {
    id: number;
    name: string;
    code: string;
}

interface ExamMark {
    subject_id: number;
    marks: string;
    theory_marks: string;
    practical_marks: string;
    is_absent: boolean;
    subject: Subject;
}

interface StudentReport {
    id: string;
    admission_no: string;
    name: string;
    last_name: string;
    father_name: string;
    exam_results: ExamMark[];
}

export default function ReportsPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("subject-marks");
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [students, setStudents] = useState<StudentReport[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        setLoading(true);
        try {
            const response = await api.get('/examination/cbse-reports/criteria');
            setExams(response.data.exams || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load criteria", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!selectedExamId) {
            toast({ title: "Validation Error", description: "Please select an exam", variant: "destructive" });
            return;
        }

        setSearching(true);
        try {
            const response = await api.post('/examination/cbse-reports/subject-marks', {
                exam_id: selectedExamId
            });
            setStudents(response.data.students || []);
            setSubjects(response.data.subjects || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
        } finally {
            setSearching(false);
        }
    };

    const getStudentMark = (student: StudentReport, subjectId: number) => {
        return student.exam_results.find(r => r.subject_id === subjectId);
    };

    const calculateTotal = (student: StudentReport) => {
        return student.exam_results.reduce((acc, curr) => {
            const theory = parseFloat(curr.theory_marks || "0");
            const practical = parseFloat(curr.practical_marks || "0");
            return acc + (curr.is_absent ? 0 : (theory + practical));
        }, 0);
    };

    const calculatePercent = (student: StudentReport) => {
        const total = calculateTotal(student);
        const max = subjects.length * 100; // Mocking 100 max per subject
        return max > 0 ? ((total / max) * 100).toFixed(2) : "0.00";
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <Presentation className="h-6 w-6 text-indigo-500" />
                        CBSE Analytical Reporting
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Cross-sectional board performance & metric analysis</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-50 bg-gray-50/20 p-1">
                    <button
                        onClick={() => setActiveTab("subject-marks")}
                        className={cn(
                            "flex-1 px-4 py-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 rounded-lg transition-all",
                            activeTab === "subject-marks"
                                ? "bg-white text-indigo-600 shadow-sm border border-gray-100"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
                        )}
                    >
                        <BarChart3 className="h-4 w-4" />
                        Subject Marks Index
                    </button>
                    <button
                        onClick={() => setActiveTab("template-marks")}
                        className={cn(
                            "flex-1 px-4 py-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 rounded-lg transition-all",
                            activeTab === "template-marks"
                                ? "bg-white text-indigo-600 shadow-sm border border-gray-100"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
                        )}
                    >
                        <LayoutList className="h-4 w-4" />
                        Template Aggregate Report
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === "subject-marks" && (
                        <div className="space-y-8">
                            {/* Filter Section */}
                            <div className="bg-gray-50/30 p-6 rounded-lg border border-gray-100 flex flex-col md:flex-row items-end justify-between gap-6">
                                <div className="space-y-2 w-full md:w-1/2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                        Examination Cycle <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                                        <SelectTrigger className="h-11 border-gray-100 bg-white rounded-lg focus:ring-indigo-500 shadow-none">
                                            <SelectValue placeholder="Select Target Exam" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {exams.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button 
                                    onClick={handleSearch} 
                                    disabled={searching}
                                    className="btn-gradient text-white px-10 h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-2"
                                >
                                    {searching ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search className="h-4 w-4" />}
                                    Generate Report
                                </Button>
                            </div>

                            {/* Actions & Summary */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" className="h-9 w-9 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-lg cursor-pointer"><Printer className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-lg cursor-pointer"><FileSpreadsheet className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-lg cursor-pointer"><Download className="h-4 w-4" /></Button>
                                </div>
                                {students.length > 0 && (
                                    <div className="flex items-center gap-4 bg-indigo-50/30 px-4 py-2 rounded-full border border-indigo-100">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                            <Trophy className="h-3 w-3" /> Students: {students.length}
                                        </span>
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                            <BookMarked className="h-3 w-3" /> Subjects: {subjects.length}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Table */}
                            <div className="rounded-lg border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
                                <Table className="border-collapse">
                                    <TableHeader className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-500">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead rowSpan={2} className="py-4 px-6 min-w-[180px] border-r border-gray-100">Student Profile</TableHead>
                                            <TableHead rowSpan={2} className="py-4 px-6 min-w-[120px] border-r border-gray-100">Admission No</TableHead>
                                            <TableHead rowSpan={2} className="py-4 px-6 min-w-[150px] border-r border-gray-100">Father Name</TableHead>

                                            {subjects.map(subject => (
                                                <TableHead key={subject.id} colSpan={2} className="py-4 px-6 text-center border-r border-gray-100 bg-indigo-50/10">
                                                    <div className="flex flex-col">
                                                        <span className="text-indigo-600 tracking-tighter">{subject.name}</span>
                                                        <span className="text-[8px] text-gray-400 font-bold uppercase">{subject.code}</span>
                                                    </div>
                                                </TableHead>
                                            ))}

                                            <TableHead rowSpan={2} className="py-4 px-6 w-[120px] text-center bg-indigo-50/20 border-r border-gray-100">Total Score</TableHead>
                                            <TableHead rowSpan={2} className="py-4 px-6 w-[100px] text-center bg-indigo-50/20 border-r border-gray-100">Percent (%)</TableHead>
                                            <TableHead rowSpan={2} className="py-4 px-6 w-[80px] text-center bg-indigo-50/20">Rank</TableHead>
                                        </TableRow>
                                        <TableRow className="hover:bg-transparent bg-gray-50/30">
                                            {subjects.map(subject => (
                                                <div key={`sub-${subject.id}`} className="contents">
                                                    <TableHead className="py-2 px-3 text-[9px] text-center font-bold text-gray-400 border-r border-gray-100 uppercase tracking-tighter">Theory</TableHead>
                                                    <TableHead className="py-2 px-3 text-[9px] text-center font-bold text-gray-400 border-r border-gray-100 uppercase tracking-tighter">Prac.</TableHead>
                                                </div>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {searching ? (
                                            <TableRow>
                                                <TableCell colSpan={subjects.length * 2 + 6} className="h-64 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aggregating Board Analytics...</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : students.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={subjects.length * 2 + 6} className="h-48 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                                        <ShieldAlert className="h-10 w-10 text-gray-300" />
                                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Select examination parameters to generate analytical report</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            students.map((item) => (
                                                <TableRow key={item.id} className="text-[12px] text-gray-600 hover:bg-gray-50/30 transition-colors border-b last:border-0 border-gray-100">
                                                    <TableCell className="py-4 px-6 border-r border-gray-100 font-bold text-indigo-700 uppercase tracking-tighter">
                                                        <div className="flex items-center gap-2">
                                                            <UserCircle className="h-4 w-4 text-gray-300" />
                                                            {item.name} {item.last_name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 border-r border-gray-100 font-bold text-gray-500 bg-gray-50/10">{item.admission_no}</TableCell>
                                                    <TableCell className="py-4 px-6 border-r border-gray-100 font-medium text-gray-400">{item.father_name}</TableCell>

                                                    {subjects.map(subject => {
                                                        const mark = getStudentMark(item, subject.id);
                                                        return (
                                                            <div key={`marks-${item.id}-${subject.id}`} className="contents">
                                                                <TableCell className="py-4 px-3 text-center border-r border-gray-100">
                                                                    {mark ? (mark.is_absent ? <span className="text-rose-500 font-bold">ABS</span> : mark.theory_marks || "0.00") : "---"}
                                                                </TableCell>
                                                                <TableCell className="py-4 px-3 text-center border-r border-gray-100 bg-gray-50/20">
                                                                    {mark ? (mark.is_absent ? <span className="text-rose-500 font-bold">ABS</span> : mark.practical_marks || "0.00") : "---"}
                                                                </TableCell>
                                                            </div>
                                                        );
                                                    })}

                                                    <TableCell className="py-4 px-6 text-center font-bold text-indigo-700 bg-indigo-50/10 border-r border-gray-100">
                                                        {calculateTotal(item).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-center font-bold bg-indigo-50/10 border-r border-gray-100">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-emerald-600">{calculatePercent(item)}%</span>
                                                            <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-emerald-500" 
                                                                    style={{ width: `${calculatePercent(item)}%` }} 
                                                                />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-center font-bold text-gray-700 bg-indigo-50/10 italic">
                                                        #0
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                    {activeTab === "template-marks" && (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4 opacity-40">
                            <Presentation className="h-12 w-12 text-indigo-500" />
                            <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-gray-500">Aggregate Module Pending</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center max-w-[300px]">Template-based reporting will be enabled upon finalizing institutional marksheet architecture</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
