"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Calendar, BookOpen, User, Info, FileSpreadsheet, FileText, Printer, Copy, Columns } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Student {
    id: number;
    name: string;
    admission_no: string;
    period_attendances: {
        subject_id: number;
        attendance: string;
    }[];
}

interface TimetableItem {
    id: number;
    subject_id: number;
    subject: {
        name: string;
        code: string;
    };
    start_time: string;
    end_time: string;
}

interface SchoolClass {
    id: number;
    name: string;
    sections?: { id: number; name: string }[];
}

export default function PeriodAttendanceByDatePage() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [students, setStudents] = useState<Student[]>([]);
    const [timetable, setTimetable] = useState<TimetableItem[]>([]);
    const [loading, setLoading] = useState(false);

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
        try {
            const response = await api.get("/attendance/period/report", {
                params: {
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                    attendance_date: attendanceDate,
                },
            });

            if (response.data.success) {
                setStudents(response.data.data.students);
                setTimetable(response.data.data.timetable);
                if (response.data.data.students.length === 0) {
                    toast.info("No students found for this class and section");
                }
                if (response.data.data.timetable.length === 0) {
                    toast.warning("No timetable found for this day. Attendance might not have been scheduled.");
                }
            }
        } catch (error) {
            console.error("Error searching report:", error);
            toast.error("Failed to load report");
        } finally {
            setLoading(false);
        }
    };

    const getAttendanceStatus = (student: Student, subjectId: number) => {
        const record = student.period_attendances.find(a => a.subject_id === subjectId);
        if (!record) return "N/A";
        return record.attendance;
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "present":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none px-2 text-[9px] uppercase font-bold">P</Badge>;
            case "absent":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none px-2 text-[9px] uppercase font-bold">A</Badge>;
            case "late":
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none px-2 text-[9px] uppercase font-bold">L</Badge>;
            case "half_day":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-2 text-[9px] uppercase font-bold">F</Badge>;
            case "holiday":
                return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none px-2 text-[9px] uppercase font-bold">H</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-200 border-none px-2 text-[9px] uppercase font-bold">N/A</Badge>;
        }
    };

    const formatTime = (time: string) => {
        try {
            const [hours, minutes] = time.split(':');
            const h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        } catch (e) {
            return time;
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
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(cls => (
                                    <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(sec => (
                                    <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Date</Label>
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
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 h-8 text-[10px] font-bold uppercase transition-all rounded shadow-md flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                        Search
                    </Button>
                </div>
            </div>

            {/* Attendance Report Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-tight flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-indigo-500" />
                        Period Attendance Report
                    </h2>
                    
                    <div className="flex items-center gap-1 text-gray-400">
                        {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, idx) => (
                            <Button key={idx} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 rounded">
                                <Icon className="h-3.5 w-3.5" />
                            </Button>
                        ))}
                    </div>
                </div>

                {timetable.length > 0 ? (
                    <div className="rounded border border-gray-50 overflow-x-auto shadow-sm">
                        <Table className="min-w-max border-collapse">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-gray-500 bg-gray-50/50">
                                    <TableHead className="py-3 px-4 border-r w-[200px] sticky left-0 bg-gray-50/50 z-10">Student</TableHead>
                                    {timetable.map((item) => (
                                        <TableHead key={item.id} className="py-3 px-4 text-center border-r min-w-[150px]">
                                            <div className="flex flex-col items-center">
                                                <span className="text-gray-800">{item.subject.name} ({item.subject.code})</span>
                                                <span className="text-[9px] text-indigo-500 font-normal">
                                                    {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                                </span>
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student) => (
                                    <TableRow key={student.id} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/10 transition-colors">
                                        <TableCell className="py-3 px-4 font-bold text-gray-700 border-r sticky left-0 bg-white group-hover:bg-indigo-50/10 z-10">
                                            <div className="flex flex-col">
                                                <span>{student.name}</span>
                                                <span className="text-[9px] text-gray-400 font-normal">Adm: {student.admission_no}</span>
                                            </div>
                                        </TableCell>
                                        {timetable.map((item) => (
                                            <TableCell key={item.id} className="py-3 px-4 text-center border-r">
                                                {getStatusBadge(getAttendanceStatus(student, item.subject_id))}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : !loading && students.length > 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 bg-indigo-50/20 rounded-lg border border-indigo-100">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                            <Info className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[12px] font-bold text-indigo-700 uppercase">No Timetable Scheduled</p>
                            <p className="text-[11px] text-indigo-600/70">Please configure the class timetable for this day to view period attendance.</p>
                        </div>
                    </div>
                ) : !loading && (
                    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-tighter">No Records Found</p>
                            <p className="text-[11px] text-gray-400">Select class, section and date to view the attendance report.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
