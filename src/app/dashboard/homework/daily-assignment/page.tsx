"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Inbox
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
interface Assignment {
    id: number;
    title: string;
    description: string;
    submission_date: string;
    evaluation_date?: string;
    student?: { name: string };
    class?: { name: string };
    section?: { name: string };
    subject?: { name: string };
    evaluator?: { name: string };
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export default function DailyAssignmentPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");

    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [filters, setFilters] = useState({
        class_id: "",
        section_id: "",
        subject_group_id: "",
        subject_id: "",
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [classesRes, sectionsRes, groupsRes, subjectsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true'),
                api.get('/academics/sections?no_paginate=true'),
                api.get('/academics/subject-groups?no_paginate=true'),
                api.get('/academics/subjects?no_paginate=true')
            ]);
            setClasses(classesRes.data.data || []);
            setSections(sectionsRes.data.data || []);
            setSubjectGroups(groupsRes.data.data || []);
            setSubjects(subjectsRes.data.data || []);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const fetchAssignments = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit,
                search: searchTerm,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });
            const response = await api.get(`/homework/daily-assignments?${params.toString()}`);
            setAssignments(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching assignments:", error);
            toast({ title: "Error", description: "Failed to fetch assignments", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAssignments(1);
    };

    const handleCopy = () => {
        const text = assignments.map(a => `${a.student?.name}\t${a.title}\t${a.subject?.name}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Student Name", "Class", "Section", "Subject", "Title", "Submission Date"];
        const rows = assignments.map(a => [a.student?.name, a.class?.name, a.section?.name, a.subject?.name, a.title, a.submission_date]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "daily_assignments.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 border-b pb-2">Select Criteria</h2>

                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select value={filters.class_id} onValueChange={(v) => setFilters({ ...filters, class_id: v })}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select value={filters.section_id} onValueChange={(v) => setFilters({ ...filters, section_id: v })}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Subject Group <span className="text-red-500">*</span>
                        </Label>
                        <Select value={filters.subject_group_id} onValueChange={(v) => setFilters({ ...filters, subject_group_id: v })}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjectGroups.map(sg => <SelectItem key={sg.id} value={String(sg.id)}>{sg.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Subject <span className="text-red-500">*</span>
                        </Label>
                        <Select value={filters.subject_id} onValueChange={(v) => setFilters({ ...filters, subject_id: v })}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex justify-end pt-2 md:col-span-5">
                        <Button type="submit" className="btn-gradient gap-2 h-9 px-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-md">
                            <Search className="h-3.5 w-3.5" /> Search
                        </Button>
                    </div>
                </form>
            </div>

            {/* Daily Assignment List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 pt-6">
                <h2 className="text-sm font-medium text-gray-800 mb-6">Daily Assignment List</h2>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 border-b border-gray-50 pb-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search in results..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-9 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 bg-transparent shadow-none rounded-md px-2 flex gap-1 items-center justify-between">
                                    <SelectValue />
                                    <ChevronLeft className="h-2 w-2 text-gray-400 rotate-90" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            {toolbarActions.map((action, i) => (
                                <Button 
                                    key={i} 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={action.onClick}
                                    title={action.title}
                                    className="h-7 w-7 hover:bg-gray-100 rounded"
                                >
                                    <action.Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Student Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Class</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Section</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Subject</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Title</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Submission Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Evaluation Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Evaluated By</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-72 text-center py-10">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                            <Inbox className="h-16 w-16 text-gray-200" />
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-red-400">No data available in table</p>
                                                <p className="text-[10px] text-indigo-500 font-medium">Search with criteria to see results.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                assignments.map((a) => (
                                    <TableRow key={a.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 text-gray-700 font-medium">{a.student?.name}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{a.class?.name}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{a.section?.name}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{a.subject?.name}</TableCell>
                                        <TableCell className="py-3 text-gray-700">{a.title}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{formatDate(a.submission_date)}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{a.evaluation_date ? formatDate(a.evaluation_date) : "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{a.evaluator?.name || "-"}</TableCell>
                                        <TableCell className="py-3 text-right">
                                            <Button size="icon" variant="ghost" className="h-7 w-7 btn-gradient text-white rounded-full shadow-md">
                                                <Search className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer / Pagination */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50">
                    <div>
                        Showing {pagination?.from || 0} to {pagination?.to || 0} of {pagination?.total || 0} entries
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pagination?.current_page === 1}
                            onClick={() => fetchAssignments(pagination!.current_page - 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {[...Array(pagination?.last_page || 0)].map((_, i) => (
                            <Button 
                                key={i + 1}
                                onClick={() => fetchAssignments(i + 1)}
                                className={cn(
                                    "h-7 w-7 p-0 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300",
                                    pagination?.current_page === i + 1 
                                        ? "btn-gradient" 
                                        : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
                                )}
                            >
                                {i + 1}
                            </Button>
                        ))}
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pagination?.current_page === pagination?.last_page}
                            onClick={() => fetchAssignments(pagination!.current_page + 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
