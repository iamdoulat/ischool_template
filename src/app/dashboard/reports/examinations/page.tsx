"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Search,
    FileText,
    Trophy,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExaminationsReportPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [criteria, setCriteria] = useState<any>({ exam_groups: [], sessions: [], classes: [] });
    const [exams, setExams] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [selectedExam, setSelectedExam] = useState("");
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [reportData, setReportData] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            const res = await api.get("reports/examinations/criteria");
            setCriteria(res.data);
        } catch (error) {
            toast.error("Failed to load criteria");
        }
    };

    const handleGroupChange = async (val: string) => {
        setSelectedGroup(val);
        setSelectedExam("");
        setExams([]);
        try {
            const res = await api.get(`reports/examinations/exams/${val}`);
            setExams(res.data);
        } catch (error) {}
    };

    const handleSearch = async () => {
        if (!selectedExam || !selectedClass || !selectedSection) {
            toast.warning("Please select Exam, Class and Section");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("reports/examinations/rank", {
                params: { 
                    exam_id: selectedExam, 
                    school_class_id: selectedClass, 
                    section_id: selectedSection 
                }
            });
            setReportData(res.data.data);
            setSubjects(res.data.subjects);
            toast.success("Rank report generated");
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const filteredSections = selectedClass 
        ? criteria.classes.find((c: any) => c.id.toString() === selectedClass)?.sections || []
        : [];

    const handleExport = (type: string) => {
        if (reportData.length === 0) {
            toast.warning("No data to export");
            return;
        }
        toast.success(`Exporting as ${type.toUpperCase()}...`);
        
        const headers = ["Rank", "Admission No", "Roll Number", "Student Name", ...subjects.map(s => s.name), "Grand Total", "Percent", "Result"];
        const rows = reportData.map(row => [
            row.rank,
            row.admission_no,
            row.roll_no,
            row.student_name,
            ...subjects.map(s => row.marks[s.id] || 0),
            `${row.total_marks}/${row.max_total}`,
            `${row.percent}%`,
            row.result
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `Examination_Rank_Report.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Examinations Report</h1>

            {/* Report Links Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 px-4 rounded-lg border transition-all duration-300 cursor-pointer group relative overflow-hidden bg-white border-gray-300 shadow-[0_10px_25px_rgba(0,0,0,0.08)] ring-1 ring-gray-400/10 -translate-y-0.5">
                        <div className="p-2 rounded-lg transition-all duration-300 bg-gray-100 text-gray-900 shadow-inner">
                            <Trophy className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold tracking-tight uppercase transition-colors duration-300 text-gray-900">
                            Rank Report
                        </span>
                    </div>
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Exam Group <span className="text-red-500">*</span></Label>
                        <Select value={selectedGroup} onValueChange={handleGroupChange}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {criteria.exam_groups.map((g: any) => <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Exam <span className="text-red-500">*</span></Label>
                        <Select value={selectedExam} onValueChange={setSelectedExam}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {exams.map((e: any) => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Session <span className="text-red-500">*</span></Label>
                        <Select value={selectedSession} onValueChange={setSelectedSession}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {criteria.sessions.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.session}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {criteria.classes.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Select</SelectItem>
                                {filteredSections.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button 
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                    >
                        <Search className="h-4 w-4" />
                        {loading ? "Searching..." : "Search"}
                    </Button>
                </div>
            </div>

            {/* Student List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Student List</h2>

                {/* Table Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <Select defaultValue="50">
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            <Button onClick={() => handleExport('copy')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded"><Copy className="h-3.5 w-3.5" /></Button>
                            <Button onClick={() => handleExport('excel')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                            <Button onClick={() => handleExport('csv')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded"><FileBox className="h-3.5 w-3.5" /></Button>
                            <Button onClick={() => handleExport('pdf')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded"><FileText className="h-3.5 w-3.5" /></Button>
                            <Button onClick={() => handleExport('print')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded"><Printer className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded"><Columns className="h-3.5 w-3.5" /></Button>
                        </div>
                    </div>
                </div>

                {/* Results Table */}
                <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1500px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Rank</TableHead>
                                <TableHead className="py-3 px-4">Admission No</TableHead>
                                <TableHead className="py-3 px-4">Roll Number</TableHead>
                                <TableHead className="py-3 px-4">Student Name</TableHead>
                                {subjects.map(sub => (
                                    <TableHead key={sub.id} className="py-3 px-4 text-center">
                                        {sub.name} ({sub.min_marks}/{sub.max_marks})
                                    </TableHead>
                                ))}
                                <TableHead className="py-3 px-4 text-center">Grand Total</TableHead>
                                <TableHead className="py-3 px-4 text-center">Percent (%)</TableHead>
                                <TableHead className="py-3 px-4 text-right">Result</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.length > 0 ? (
                                reportData.filter(row => 
                                    row.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    row.admission_no.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((row, i) => (
                                    <TableRow key={i} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50">
                                        <TableCell className="py-3 px-4 font-bold text-indigo-600">{row.rank}</TableCell>
                                        <TableCell className="py-3 px-4">{row.admission_no}</TableCell>
                                        <TableCell className="py-3 px-4">{row.roll_no}</TableCell>
                                        <TableCell className="py-3 px-4 font-medium">{row.student_name}</TableCell>
                                        {subjects.map(sub => (
                                            <TableCell key={sub.id} className="py-3 px-4 text-center">
                                                {row.marks[sub.id] || 0}
                                            </TableCell>
                                        ))}
                                        <TableCell className="py-3 px-4 text-center font-bold">{row.total_marks} / {row.max_total}</TableCell>
                                        <TableCell className="py-3 px-4 text-center">
                                            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold", 
                                                row.percent >= 80 ? "bg-emerald-100 text-emerald-700" : 
                                                row.percent >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {row.percent}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <span className={cn("font-bold", row.result === 'Pass' ? "text-emerald-500" : "text-red-500")}>
                                                {row.result}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={11 + subjects.length} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                            <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                            <div className="relative">
                                                <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                    <Trophy className="h-8 w-8 text-gray-200" />
                                                </div>
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                    <Plus className="h-3 w-3 text-indigo-300" />
                                                </div>
                                            </div>
                                            <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                <span className="text-lg">←</span> Add new record or search with different criteria.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>Showing {reportData.length} to {reportData.length} of {reportData.length} entries</div>
                </div>
            </div>
        </div>
    );
}
