"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Calendar, BookOpen, Copy, FileSpreadsheet, FileText, Printer, Columns, UserCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Student {
    id: number;
    name: string;
    admission_no: string;
    roll_no: string;
    attendances: {
        attendance: string;
        note: string;
    }[];
}

interface SchoolClass {
    id: number;
    name: string;
    sections?: { id: number; name: string }[];
}

export default function AttendanceReportPage() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const cls = classes.find(c => c.id.toString() === selectedClass);
            setSections(cls?.sections || []);
            setSelectedSection("");
        }
    }, [selectedClass, classes]);

    const fetchClasses = async () => {
        try {
            const response = await api.get("/academics/classes?no_paginate=true");
            if (response.data.success) {
                setClasses(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection || !attendanceDate) {
            toast.error("Please select class, section and date");
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            const response = await api.get("/attendance/student", {
                params: {
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                    attendance_date: attendanceDate,
                },
            });

            if (response.data.success) {
                setStudents(response.data.data);
                if (response.data.data.length === 0) {
                    toast.info("No students found for this class and section");
                }
            }
        } catch (error) {
            console.error("Error searching attendance:", error);
            toast.error("Failed to load attendance report");
        } finally {
            setLoading(false);
        }
    };

    const getAttendanceStatus = (student: Student) => {
        const record = student.attendances?.[0];
        if (!record) return "N/A";
        return record.attendance;
    };

    const getAttendanceNote = (student: Student) => {
        const record = student.attendances?.[0];
        if (!record || !record.note) return "-";
        return record.note;
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "present":
                return <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-none px-3 py-0.5 text-[9px] uppercase font-black rounded-full transition-all">Present</Badge>;
            case "absent":
                return <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-none px-3 py-0.5 text-[9px] uppercase font-black rounded-full transition-all">Absent</Badge>;
            case "late":
                return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-none px-3 py-0.5 text-[9px] uppercase font-black rounded-full transition-all">Late</Badge>;
            case "half_day":
                return <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-3 py-0.5 text-[9px] uppercase font-black rounded-full transition-all">Half Day</Badge>;
            case "holiday":
                return <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-3 py-0.5 text-[9px] uppercase font-black rounded-full transition-all">Holiday</Badge>;
            default:
                return <Badge className="bg-gray-50 text-gray-400 hover:bg-gray-100 border-none px-3 py-0.5 text-[9px] uppercase font-black rounded-full transition-all">Not Marked</Badge>;
        }
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mb-4 border-b border-gray-50 pb-2 flex items-center gap-2">
                    <Search className="h-3 w-3" />
                    Select Criteria
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(cls => (
                                    <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(sec => (
                                    <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Attendance Date <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                            type="date" 
                            value={attendanceDate} 
                            onChange={(e) => setAttendanceDate(e.target.value)} 
                            className="h-8 text-[11px] border-gray-200 shadow-none rounded focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button 
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-9 text-xs font-bold uppercase transition-all rounded-full shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Search
                    </Button>
                </div>
            </div>

            {/* Attendance Report Section */}
            {hasSearched && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                        <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-tight flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-indigo-500" />
                            Student Attendance Report
                        </h2>
                        
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-full border border-gray-100">
                            {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, idx) => (
                                <Button key={idx} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:text-indigo-600 rounded-full transition-all">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>

                    {students.length > 0 ? (
                        <div className="rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-gray-500 bg-gray-50/50">
                                        <TableHead className="py-4 px-6 w-16 text-center">#</TableHead>
                                        <TableHead className="py-4 px-6">Admission No</TableHead>
                                        <TableHead className="py-4 px-6">Roll No</TableHead>
                                        <TableHead className="py-4 px-6">Student Name</TableHead>
                                        <TableHead className="py-4 px-6 text-center">Attendance</TableHead>
                                        <TableHead className="py-4 px-6">Note</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student, idx) => (
                                        <TableRow key={student.id} className="text-sm border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                            <TableCell className="py-4 px-6 text-center font-medium text-gray-400">{idx + 1}</TableCell>
                                            <TableCell className="py-4 px-6 font-bold text-gray-800">{student.admission_no}</TableCell>
                                            <TableCell className="py-4 px-6 text-gray-600 font-medium">{student.roll_no || "-"}</TableCell>
                                            <TableCell className="py-4 px-6 font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{student.name}</TableCell>
                                            <TableCell className="py-4 px-6 text-center">
                                                {getStatusBadge(getAttendanceStatus(student))}
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-gray-500 font-medium italic">
                                                {getAttendanceNote(student)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                            <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 border border-gray-100">
                                <BookOpen className="h-8 w-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No Records Found</p>
                                <p className="text-[11px] text-gray-400 max-w-[200px] mx-auto leading-relaxed">We couldn't find any student records for the selected parameters.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
