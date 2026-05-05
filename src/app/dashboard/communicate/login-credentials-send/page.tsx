"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
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
    Send
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/academics/classes?no_paginate=true');
            setClasses(response.data.data || response.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch classes", variant: "destructive" });
        }
    };

    const handleClassChange = (value: string) => {
        setSelectedClass(value);
        setSelectedSection("");
        // Extract sections from the selected class (already loaded with classes)
        const selectedClassObj = classes.find(c => String(c.id) === value);
        setSections(selectedClassObj?.sections || []);
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection) {
            toast({ title: "Required", description: "Please select both class and section", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const response = await api.post('/communicate/search-students', {
                class_id: selectedClass,
                section_id: selectedSection,
                search: searchTerm
            });
            setStudents(response.data.data || response.data);
            setSelectedStudentIds([]); // Reset selection on new search
        } catch (error) {
            toast({ title: "Error", description: "Failed to search students", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedStudentIds.length === students.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(students.map(s => s.id));
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
        const text = students.map(s => `${s.admission_no}\t${s.first_name} ${s.last_name}\t${s.mobile_no}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Student data copied" });
    };

    const handleExportCSV = () => {
        const headers = ["Admission No", "Student Name", "Mobile"];
        const rows = students.map(s => [s.admission_no, `${s.first_name} ${s.last_name}`, s.mobile_no]);
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
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-sm font-medium text-gray-800 uppercase tracking-tight">Login Credentials Send</h1>
            </div>

             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center gap-2 border-b pb-4">
                    <div className="h-5 w-1 bg-indigo-500 rounded-full" />
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Select Criteria</h2>
                </div>

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
            </div>

            {/* Dispatch Configuration Section */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 pt-8 mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start border-b border-gray-50 pb-8">
                    <div className="space-y-3">
                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Select All</Label>
                        <div className="flex items-center gap-3">
                            <Checkbox 
                                checked={students.length > 0 && selectedStudentIds.length === students.length}
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
                            <SelectTrigger className="h-11 border-gray-200 text-sm focus:ring-indigo-500 rounded-xl bg-gray-50/20 shadow-none">
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
                            <SelectTrigger className="h-11 border-gray-200 text-sm focus:ring-indigo-500 rounded-xl bg-gray-50/20 shadow-none">
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

                 {/* Student Credential Table */}
                <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="w-[50px] py-4">
                                    <Checkbox 
                                        checked={students.length > 0 && selectedStudentIds.length === students.length}
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
                            {students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-xs italic">
                                        No students found. Please search by class and section.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student) => (
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
                                        <TableCell className="py-4 text-gray-500">{student.dob}</TableCell>
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
                        {students.length > 0 ? `Showing 1 to ${students.length} of ${students.length} entries` : "No entries to show"}
                    </div>
                    <div className="flex gap-6 items-center">
                        <Button 
                            onClick={handleSend} 
                            disabled={sending || selectedStudentIds.length === 0}
                            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white px-10 h-10 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg shadow-purple-300/50 min-w-[150px] border-none"
                        >
                            {sending ? "Sending..." : `Send Credentials (${selectedStudentIds.length})`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
