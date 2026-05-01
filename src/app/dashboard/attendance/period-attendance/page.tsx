"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Save, Loader2, BookOpen, UserCheck, Calendar } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Student {
    id: number;
    student_id: number;
    admission_no: string;
    roll_no: string;
    name: string;
    attendance: "present" | "late" | "absent" | "holiday" | "half_day";
    note: string;
}

interface SchoolClass {
    id: number;
    name: string;
    sections?: Section[];
}

interface Section {
    id: number;
    name: string;
}

interface Subject {
    id: number;
    name: string;
    code: string;
}

export default function PeriodAttendancePage() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [fetchingSubjects, setFetchingSubjects] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const selectedCls = classes.find(c => c.id.toString() === selectedClass);
            if (selectedCls && selectedCls.sections) {
                setSections(selectedCls.sections);
            } else {
                setSections([]);
            }
            setSelectedSection("");
            setSubjects([]);
            setSelectedSubject("");
        }
    }, [selectedClass, classes]);

    useEffect(() => {
        if (selectedClass && selectedSection) {
            fetchSubjects(selectedClass, selectedSection);
        } else {
            setSubjects([]);
            setSelectedSubject("");
        }
    }, [selectedClass, selectedSection]);

    const fetchClasses = async () => {
        try {
            const response = await api.get("/academics/classes?no_paginate=true");
            if (response.data.success) {
                setClasses(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
            toast.error("Failed to load classes");
        }
    };

    const fetchSubjects = async (classId: string, sectionId: string) => {
        setFetchingSubjects(true);
        try {
            const response = await api.get("/attendance/period/subjects", {
                params: { school_class_id: classId, section_id: sectionId }
            });
            if (response.data.success) {
                setSubjects(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
            toast.error("Failed to load subjects");
        } finally {
            setFetchingSubjects(false);
        }
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection || !selectedSubject || !attendanceDate) {
            toast.error("Please select all criteria");
            return;
        }

        setLoading(true);
        try {
            const response = await api.get("/attendance/period", {
                params: {
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                    subject_id: selectedSubject,
                    attendance_date: attendanceDate,
                },
            });

            if (response.data.success) {
                const mappedStudents = response.data.data.map((student: any) => {
                    const attendance = student.period_attendances?.[0];
                    return {
                        id: student.id,
                        student_id: student.id,
                        admission_no: student.admission_no,
                        roll_no: student.roll_no || "-",
                        name: student.name,
                        attendance: attendance?.attendance || "present",
                        note: attendance?.note || "",
                    };
                });
                setStudents(mappedStudents);
                if (mappedStudents.length === 0) {
                    toast.info("No students found for this class and section");
                }
            }
        } catch (error) {
            console.error("Error searching students:", error);
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAttendanceChange = (value: "present" | "late" | "absent" | "holiday" | "half_day") => {
        setStudents(prev => prev.map(s => ({ ...s, attendance: value })));
        toast.info(`Marked all students as ${value}`);
    };

    const handleIndividualAttendanceChange = (id: number, value: "present" | "late" | "absent" | "holiday" | "half_day") => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, attendance: value } : s));
    };

    const handleNoteChange = (id: number, value: string) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, note: value } : s));
    };

    const handleSave = async () => {
        if (students.length === 0) {
            toast.error("No attendance data to save");
            return;
        }

        setSaving(true);
        try {
            const response = await api.post("/attendance/period", {
                attendance_date: attendanceDate,
                subject_id: selectedSubject,
                attendances: students.map(s => ({
                    student_id: s.student_id,
                    attendance: s.attendance,
                    note: s.note,
                })),
            });

            if (response.data.success) {
                toast.success("Period attendance saved successfully");
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
            toast.error("Failed to save attendance");
        } finally {
            setSaving(false);
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                            Date <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input 
                                type="date" 
                                value={attendanceDate} 
                                onChange={(e) => setAttendanceDate(e.target.value)} 
                                className="h-8 text-[11px] border-gray-200 shadow-none rounded focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Subject <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedSection || fetchingSubjects}>
                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                <SelectValue placeholder={fetchingSubjects ? "Loading..." : "Select"} />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map(sub => (
                                    <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name} ({sub.code})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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

            {/* Student List Section */}
            {students.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-tight flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-indigo-500" />
                            Student List
                        </h2>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                        <div className="flex flex-col space-y-3">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Set attendance for all students:</span>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { label: "Present", value: "present", color: "bg-green-500" },
                                    { label: "Late", value: "late", color: "bg-amber-500" },
                                    { label: "Absent", value: "absent", color: "bg-red-500" },
                                    { label: "Holiday", value: "holiday", color: "bg-indigo-500" },
                                    { label: "Half Day", value: "half_day", color: "bg-blue-500" }
                                ].map((item) => (
                                    <Button
                                        key={item.value}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleBulkAttendanceChange(item.value as any)}
                                        className="h-8 px-4 text-[10px] font-bold uppercase rounded-full hover:bg-gray-100 border-gray-200 transition-all active:scale-95 shadow-sm"
                                    >
                                        <div className={cn("w-1.5 h-1.5 rounded-full mr-2", item.color)} />
                                        {item.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-10 h-11 text-xs font-bold uppercase transition-all rounded-full shadow-xl active:scale-95 flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Save Attendance
                        </Button>
                    </div>

                    <div className="rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-gray-500 bg-gray-50/50">
                                    <TableHead className="py-4 px-6 w-12 text-center">#</TableHead>
                                    <TableHead className="py-4 px-6">Admission No</TableHead>
                                    <TableHead className="py-4 px-6">Roll No</TableHead>
                                    <TableHead className="py-4 px-6">Name</TableHead>
                                    <TableHead className="py-4 px-6 text-center">Attendance</TableHead>
                                    <TableHead className="py-4 px-6">Note</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student, index) => (
                                    <TableRow 
                                        key={student.id} 
                                        className={cn(
                                            "text-sm border-b border-gray-50 hover:bg-gray-50/50 transition-colors",
                                            student.attendance === "absent" && "bg-red-50/10",
                                            student.attendance === "late" && "bg-amber-50/10"
                                        )}
                                    >
                                        <TableCell className="py-4 px-6 text-center text-gray-400 font-medium">{index + 1}</TableCell>
                                        <TableCell className="py-4 px-6 text-gray-800 font-bold">{student.admission_no}</TableCell>
                                        <TableCell className="py-4 px-6 text-gray-600 font-medium">{student.roll_no}</TableCell>
                                        <TableCell className="py-4 px-6 text-gray-900 font-semibold">{student.name}</TableCell>
                                        <TableCell className="py-4 px-6">
                                            <RadioGroup
                                                value={student.attendance}
                                                onValueChange={(val) => handleIndividualAttendanceChange(student.id, val as any)}
                                                className="flex justify-center gap-3"
                                            >
                                                {[
                                                    { label: "P", value: "present", color: "text-green-600", bg: "bg-green-100", active: "bg-green-600 text-white" },
                                                    { label: "L", value: "late", color: "text-amber-600", bg: "bg-amber-100", active: "bg-amber-600 text-white" },
                                                    { label: "A", value: "absent", color: "text-red-600", bg: "bg-red-100", active: "bg-red-600 text-white" },
                                                    { label: "H", value: "holiday", color: "text-indigo-600", bg: "bg-indigo-100", active: "bg-indigo-600 text-white" },
                                                    { label: "F", value: "half_day", color: "text-blue-600", bg: "bg-blue-100", active: "bg-blue-600 text-white" }
                                                ].map((opt) => (
                                                    <div key={opt.value} className="flex flex-col items-center gap-1">
                                                        <RadioGroupItem
                                                            value={opt.value}
                                                            id={`${opt.value}-${student.id}`}
                                                            className="sr-only"
                                                        />
                                                        <label
                                                            htmlFor={`${opt.value}-${student.id}`}
                                                            className={cn(
                                                                "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black cursor-pointer transition-all border shadow-sm",
                                                                student.attendance === opt.value 
                                                                    ? opt.active 
                                                                    : cn("bg-white text-gray-400 border-gray-100 hover:border-gray-200")
                                                            )}
                                                        >
                                                            {opt.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Input
                                                placeholder="Remark..."
                                                value={student.note}
                                                onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                                className="h-9 text-xs border-gray-100 shadow-none rounded-md w-full focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {students.length === 0 && !loading && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[13px] font-bold text-gray-400">No Records Found</p>
                        <p className="text-[11px] text-gray-400">Select class, section, date and subject to mark attendance.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
