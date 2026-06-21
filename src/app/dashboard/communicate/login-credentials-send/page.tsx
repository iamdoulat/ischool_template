"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    ChevronLeft,
    ChevronRight,
    Send,
    ChevronsLeft,
    ChevronsRight,
    Filter
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatDate } from "@/lib/utils";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

interface StudentCredential {
    id: number;
    admission_no: string;
    name: string;
    last_name: string;
    dob: string;
    gender: string;
    phone: string;
    school_class?: { name: string };
    section?: { name: string };
}

interface AcademicClass {
    id: number;
    name: string;
    sections?: Section[];
}

interface Section {
    id: number;
    name: string;
}

export default function LoginCredentialsSendPage() {
    const { toast } = useToast();
    const [classes, setClasses] = useState<AcademicClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [selectedSection, setSelectedSection] = useState<string>("");
    const [students, setStudents] = useState<StudentCredential[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [messageTo, setMessageTo] = useState<string>("student");
    const [notificationType, setNotificationType] = useState<string>("email");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [perPage, setPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchClasses = useCallback(async () => {
        try {
            const response = await api.get('/academics/classes?no_paginate=true');
            setClasses(response.data.data || response.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch classes", variant: "destructive" });
        }
    }, [toast]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const handleClassChange = (value: string) => {
        setSelectedClass(value);
        setSelectedSection("");
        const selectedClassObj = classes.find(c => String(c.id) === value);
        setSections(selectedClassObj?.sections || []);
    };

    const handleSearch = useCallback(async () => {
        if (!selectedClass || !selectedSection) {
            toast({ title: "Required", description: "Please select both class and section", variant: "destructive" });
            return;
        }
        setLoading(true);
        setCurrentPage(1);
        try {
            const response = await api.post('/communicate/search-students', {
                class_id: selectedClass,
                section_id: selectedSection,
                search: searchTerm
            });
            setStudents(response.data.data || response.data);
            setSelectedStudentIds([]);
        } catch (error) {
            toast({ title: "Error", description: "Failed to search students", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedSection, searchTerm, toast]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const term = searchTerm.toLowerCase();
            return !term || s.admission_no?.toLowerCase().includes(term) ||
                s.name?.toLowerCase().includes(term) ||
                `${s.name} ${s.last_name}`.toLowerCase().includes(term);
        });
    }, [students, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / perPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, filteredStudents.length);
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    const toggleSelectAll = () => {
        if (selectedStudentIds.length === filteredStudents.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(filteredStudents.map(s => s.id));
        }
    };

    const toggleStudentSelection = (id: number) => {
        setSelectedStudentIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleSend = async () => {
        if (selectedStudentIds.length === 0) {
            toast({ title: "Selection Required", description: "Please select at least one student", variant: "destructive" });
            return;
        }
        setSending(true);
        try {
            const response = await api.post('/communicate/send-credentials', {
                student_ids: selectedStudentIds,
                message_to: messageTo,
                notification_type: notificationType
            });
            toast({ title: "Success", description: response.data.message });
        } catch (error) {
            toast({ title: "Error", description: "Failed to send credentials", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    const handleCopy = () => {
        const text = students.map(s => `${s.admission_no}\t${s.name} ${s.last_name}\t${s.phone}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Student data copied" });
    };

    const handleExportCSV = () => {
        const headers = ["Admission No", "Student Name", "Mobile"];
        const rows = students.map(s => [s.admission_no, `${s.name} ${s.last_name}`, s.phone]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "students_credentials.csv");
        link.click();
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
    ];

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-50 rounded-lg shadow-sm shadow-indigo-50/50">
                    <Send className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight uppercase">Login Credentials Send</h1>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">Send login credentials to students and parents</p>
                </div>
            </div>

            {/* Select Criteria Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Select Criteria</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Choose class and section to find students</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedClass} onValueChange={handleClassChange}>
                                <SelectTrigger className="h-10 border-gray-200 text-sm focus:ring-indigo-500 rounded-lg shadow-none bg-gray-50/30">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                Section <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-3 items-center">
                                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                    <SelectTrigger className="h-10 border-gray-200 text-sm focus:ring-indigo-500 rounded-lg shadow-none bg-gray-50/30 flex-1">
                                        <SelectValue placeholder="Select Section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleSearch} disabled={loading} className="btn-gradient gap-2 h-10 px-6 text-xs font-bold uppercase transition-all rounded-full shadow-lg shadow-indigo-100">
                                    <Search className="h-4 w-4" /> {loading ? "Searching..." : "Search"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dispatch Configuration Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Send className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Dispatch Configuration</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Configure how credentials will be sent</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* Config Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start border-b border-gray-50 pb-8">
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Select All</Label>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                                    onCheckedChange={toggleSelectAll}
                                    className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-6 w-6 rounded-md transition-all"
                                />
                                <span className="text-[11px] text-gray-400 font-medium">({selectedStudentIds.length} Selected)</span>
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                Message To <span className="text-red-500">*</span>
                            </Label>
                            <Select value={messageTo} onValueChange={setMessageTo}>
                                <SelectTrigger className="h-11 border-gray-200 text-sm focus:ring-indigo-500 rounded-lg bg-gray-50/20 shadow-none">
                                    <SelectValue placeholder="Recipient" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="parent">Parent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                Notification Type <span className="text-red-500">*</span>
                            </Label>
                            <Select value={notificationType} onValueChange={setNotificationType}>
                                <SelectTrigger className="h-11 border-gray-200 text-sm focus:ring-indigo-500 rounded-lg bg-gray-50/20 shadow-none">
                                    <SelectValue placeholder="Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email">Email Only</SelectItem>
                                    <SelectItem value="sms">SMS Only</SelectItem>
                                    <SelectItem value="both">Both (Email & SMS)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Filter results..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-9 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 font-medium">Per page:</span>
                                <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-16 text-[10px] border-gray-100 bg-gray-50/30 rounded-lg shadow-none px-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="200">200</SelectItem>
                                        <SelectItem value="500">500</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400">
                                {toolbarActions.map((action, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        onClick={action.onClick}
                                        title={action.title}
                                        className="h-8 w-8 hover:bg-gray-100 rounded-full transition-all"
                                    >
                                        <action.Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Student Table */}
                    <div className="rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-gray-100">
                                    <TableHead className="w-[50px] py-4">
                                        <Checkbox
                                            checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4"
                                        />
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-4 tracking-widest">Admission No</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-4 tracking-widest">Student Name</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-4 tracking-widest">Class / Section</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-4 tracking-widest">Date Of Birth</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-4 tracking-widest">Gender</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-4 tracking-widest text-right">Mobile Number</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton rows={5} cols={7} />
                                ) : paginatedStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-xs italic">
                                            No students found. Please search by class and section.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedStudents.map((student) => (
                                        <TableRow key={student.id} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/20 transition-colors">
                                            <TableCell className="py-4">
                                                <Checkbox
                                                    checked={selectedStudentIds.includes(student.id)}
                                                    onCheckedChange={() => toggleStudentSelection(student.id)}
                                                    className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4"
                                                />
                                            </TableCell>
                                            <TableCell className="py-4 text-gray-500 font-medium">{student.admission_no}</TableCell>
                                            <TableCell className="py-4 text-gray-800 font-bold uppercase tracking-tight">{student.name} {student.last_name || ''}</TableCell>
                                            <TableCell className="py-4 text-gray-400 font-medium">{student.school_class?.name} ({student.section?.name})</TableCell>
                                            <TableCell className="py-4 text-gray-500">{formatDate(student.dob, "dd/MM/yyyy")}</TableCell>
                                            <TableCell className="py-4 text-gray-500 uppercase">{student.gender}</TableCell>
                                            <TableCell className="py-4 text-right text-indigo-600 font-bold">{student.phone || "-"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-gray-50">
                        <div className="text-[11px] text-gray-400 font-medium mb-4 md:mb-0">
                            {filteredStudents.length > 0
                                ? `Showing ${startIndex + 1} to ${endIndex} of ${filteredStudents.length} entries`
                                : "No entries to show"}
                        </div>
                        <div className="flex items-center gap-4">
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        size="icon"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={safeCurrentPage <= 1}
                                        className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all"
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        onClick={() => setCurrentPage(safeCurrentPage - 1)}
                                        disabled={safeCurrentPage <= 1}
                                        className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let pageNum: number;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (safeCurrentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (safeCurrentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = safeCurrentPage - 2 + i;
                                        }
                                        return (
                                            <Button
                                                key={pageNum}
                                                size="icon"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={cn(
                                                    "h-8 w-8 rounded-[10px] border-none p-0 font-bold active:scale-95 transition-all",
                                                    pageNum === safeCurrentPage
                                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-orange-500/10"
                                                        : "bg-white border border-gray-200 text-gray-600 hover:bg-card"
                                                )}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                    <Button
                                        size="icon"
                                        onClick={() => setCurrentPage(safeCurrentPage + 1)}
                                        disabled={safeCurrentPage >= totalPages}
                                        className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={safeCurrentPage >= totalPages}
                                        className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all"
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <Button
                                onClick={handleSend}
                                disabled={sending || selectedStudentIds.length === 0}
                                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white px-10 h-10 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg shadow-purple-300/50 min-w-[150px] border-none"
                            >
                                {sending ? "Sending..." : `Send Credentials (${selectedStudentIds.length})`}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
