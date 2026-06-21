"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Filter, BarChart3, BookOpen, Copy, FileSpreadsheet, FileText, Printer, Columns } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Student {
    id: number;
    name: string;
    admission_no: string;
    roll_no: string;
    attendances: {
        attendance: string;
        note: string;
        entry_time?: string | null;
        exit_time?: string | null;
    }[];
}

interface SchoolClass {
    id: number;
    name: string;
    sections?: { id: number; name: string }[];
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
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

    const getEntryTime = (student: Student) => {
        const record = student.attendances?.[0];
        if (!record || !record.entry_time) return "-";
        return record.entry_time;
    };

    const getExitTime = (student: Student) => {
        const record = student.attendances?.[0];
        if (!record || !record.exit_time) return "-";
        return record.exit_time;
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
            case "on_leave":
                return <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-none px-3 py-0.5 text-[9px] uppercase font-black rounded-full transition-all flex items-center gap-1"><span className="text-purple-500 text-[11px]">●</span> On Leave</Badge>;
            default:
                return <Badge className="bg-gray-50 text-gray-400 hover:bg-gray-100 border-none px-3 py-0.5 text-[9px] uppercase font-black rounded-full transition-all">Not Marked</Badge>;
        }
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Select Criteria</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Choose class, section &amp; date</p>
                    </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
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
                            variant="gradient"
                            className="h-9 px-8 text-[11px] uppercase tracking-wider shadow-lg shadow-orange-500/20"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Report Section */}
            {hasSearched && (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <BarChart3 className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Student Attendance Report</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{students.length} record{students.length === 1 ? '' : 's'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 bg-white/60 p-1 rounded-full border border-gray-100">
                            {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, idx) => (
                                <Button key={idx} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:text-indigo-600 rounded-full transition-all">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5">
                        <div className="rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-gray-500 bg-gray-50/50">
                                        <TableHead className="py-4 px-6 w-16 text-center">#</TableHead>
                                        <TableHead className="py-4 px-6">Admission No</TableHead>
                                        <TableHead className="py-4 px-6">Roll No</TableHead>
                                        <TableHead className="py-4 px-6">Student Name</TableHead>
                                        <TableHead className="py-4 px-6 text-center">Attendance</TableHead>
                                        <TableHead className="py-4 px-6 text-center">Entry Time</TableHead>
                                        <TableHead className="py-4 px-6 text-center">Exit Time</TableHead>
                                        <TableHead className="py-4 px-6">Note</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={8} />
                                    ) : students.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={8} className="p-12 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-4">
                                                    <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 border border-gray-100">
                                                        <BookOpen className="h-8 w-8" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No Records Found</p>
                                                        <p className="text-[11px] text-gray-400 max-w-[200px] mx-auto leading-relaxed">We couldn&apos;t find any student records for the selected parameters.</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        students.map((student, idx) => (
                                            <TableRow key={student.id} className="text-sm border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                                <TableCell className="py-4 px-6 text-center font-medium text-gray-400">{idx + 1}</TableCell>
                                                <TableCell className="py-4 px-6 font-bold text-gray-800">{student.admission_no}</TableCell>
                                                <TableCell className="py-4 px-6 text-gray-600 font-medium">{student.roll_no || "-"}</TableCell>
                                                <TableCell className="py-4 px-6 font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{student.name}</TableCell>
                                                <TableCell className="py-4 px-6 text-center">
                                                    {getStatusBadge(getAttendanceStatus(student))}
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-center text-gray-600 text-[11px] font-mono">
                                                    {getEntryTime(student)}
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-center text-gray-600 text-[11px] font-mono">
                                                    {getExitTime(student)}
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-gray-500 font-medium italic">
                                                    {getAttendanceNote(student)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
