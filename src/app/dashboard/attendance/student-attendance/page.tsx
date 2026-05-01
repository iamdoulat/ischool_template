"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Info, AlertCircle, CheckCircle2, Search, Save, Loader2, UserCheck } from "lucide-react";
import CsvImportDialog from "@/components/attendance/CsvImportDialog";

interface StudentAttendanceRecord {
    id: number;
    student_id: number;
    admission_no: string;
    roll_no: string;
    name: string;
    attendance: "present" | "late" | "absent" | "holiday" | "half_day";
    reason: string;
    entry_time: string;
    exit_time: string;
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

const ATTENDANCE_OPTIONS = [
    { id: "present", label: "Present" },
    { id: "late", label: "Late" },
    { id: "absent", label: "Absent" },
    { id: "holiday", label: "Holiday" },
    { id: "half_day", label: "Half Day" },
];

export default function StudentAttendancePage() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<StudentAttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [bulkAttendance, setBulkAttendance] = useState("");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const selectedCls = classes.find(c => c.id.toString() === selectedClass);
            setSections(selectedCls?.sections || []);
            setSelectedSection("");
        } else {
            setSections([]);
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
            toast.error("Failed to load classes");
        }
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection || !attendanceDate) {
            toast.error("Please select all criteria");
            return;
        }

        setLoading(true);
        setHasSearched(true);
        setStudents([]);

        try {
            // Step 1: Try to get students with existing attendance data
            let studentsData: any[] = [];
            
            try {
                const attendanceRes = await api.get("/attendance/student", {
                    params: {
                        school_class_id: selectedClass,
                        section_id: selectedSection,
                        attendance_date: attendanceDate,
                    },
                });
                if (attendanceRes.data.success && attendanceRes.data.data?.length > 0) {
                    studentsData = attendanceRes.data.data;
                }
            } catch (err) {
                console.warn("Attendance endpoint failed, falling back to students endpoint:", err);
            }

            // Step 2: If no students found via attendance endpoint, fetch from students list
            if (studentsData.length === 0) {
                try {
                    const studentsRes = await api.get("/students", {
                        params: {
                            school_class_id: selectedClass,
                            section_id: selectedSection,
                            limit: 200,
                        },
                    });
                    if (studentsRes.data.success) {
                        // Handle paginated response
                        const rawData = studentsRes.data.data?.data || studentsRes.data.data;
                        if (Array.isArray(rawData)) {
                            studentsData = rawData;
                        }
                    }
                } catch (err) {
                    console.error("Students endpoint also failed:", err);
                }
            }

            if (studentsData.length > 0) {
                const mappedStudents = studentsData.map((student: any) => {
                    const attendance = student.attendances?.[0] || student.student_attendances?.[0];
                    return {
                        id: student.id,
                        student_id: student.id,
                        admission_no: student.admission_no || "-",
                        roll_no: student.roll_no || "-",
                        name: `${student.name || ""}${student.last_name ? " " + student.last_name : ""}`.trim(),
                        attendance: attendance?.attendance || "present",
                        reason: attendance?.reason || "N/A",
                        entry_time: attendance?.entry_time || "",
                        exit_time: attendance?.exit_time || "",
                        note: attendance?.note || "",
                    };
                });
                setStudents(mappedStudents);
                setBulkAttendance("");
                toast.success(`Found ${mappedStudents.length} student(s)`);
            } else {
                toast.info("No students found for this class and section");
            }
        } catch (error: any) {
            console.error("Error searching students:", error);
            toast.error(error?.response?.data?.message || "Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceChange = (studentId: number, value: "present" | "late" | "absent" | "holiday" | "half_day") => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, attendance: value } : s));
    };

    const handleBulkAction = (value: string) => {
        setBulkAttendance(value);
        setStudents(prev => prev.map(s => ({ ...s, attendance: value as any })));
        toast.info(`Set all students to ${value}`);
    };

    const handleInputChange = (studentId: number, field: keyof StudentAttendanceRecord, value: string) => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, [field]: value } : s));
    };

    const handleSave = async () => {
        if (students.length === 0) {
            toast.error("No attendance data to save");
            return;
        }

        setSaving(true);
        try {
            const response = await api.post("/attendance/student", {
                attendance_date: attendanceDate,
                attendances: students.map(s => ({
                    student_id: s.student_id,
                    attendance: s.attendance,
                    reason: s.reason || "Manual",
                    entry_time: s.entry_time || null,
                    exit_time: s.exit_time || null,
                    note: s.note || null,
                })),
            });

            if (response.data.success) {
                toast.success("Success!", {
                    description: "Student attendance records have been updated successfully.",
                    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
                });
                setIsConfirmOpen(false);
            }
        } catch (error: any) {
            console.error("Error saving attendance:", error);
            toast.error(error?.response?.data?.message || "Failed to save attendance");
        } finally {
            setSaving(false);
        }
    };

    const handleCsvImport = (records: any[]) => {
        setStudents(records);
        setHasSearched(true);
        setBulkAttendance("");
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* Select Criteria */}
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
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id.toString()}>
                                        {cls.name}
                                    </SelectItem>
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
                                {sections.map((sec) => (
                                    <SelectItem key={sec.id} value={sec.id.toString()}>
                                        {sec.name}
                                    </SelectItem>
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
                            className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
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

            {/* Student List - shown after search */}
            {hasSearched && students.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-indigo-500" />
                            Student List
                            <span className="text-[10px] font-medium text-gray-400 ml-1">({students.length} students)</span>
                        </h2>
                        <CsvImportDialog
                            onImport={handleCsvImport}
                            attendanceDate={attendanceDate}
                            selectedClass={selectedClass}
                            selectedSection={selectedSection}
                        />
                    </div>

                    {/* Bulk Actions & Save Button Row */}
                    <div className="flex items-center justify-between flex-wrap gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-[11px] font-semibold text-gray-500">
                                Set attendance for all students as
                            </span>
                            <RadioGroup
                                value={bulkAttendance}
                                onValueChange={handleBulkAction}
                                className="flex items-center gap-4"
                            >
                                {ATTENDANCE_OPTIONS.map((opt) => (
                                    <div key={opt.id} className="flex items-center gap-1.5">
                                        <RadioGroupItem
                                            value={opt.id}
                                            id={`bulk-${opt.id}`}
                                            className={cn(
                                                "h-4 w-4 border-gray-300",
                                                bulkAttendance === opt.id && "text-indigo-600 border-indigo-600"
                                            )}
                                        />
                                        <label
                                            htmlFor={`bulk-${opt.id}`}
                                            className={cn(
                                                "text-[11px] font-medium cursor-pointer",
                                                "text-gray-600"
                                            )}
                                        >
                                            {opt.label}
                                        </label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    disabled={saving || students.length === 0}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-9 text-xs font-bold uppercase transition-all rounded-full shadow-lg active:scale-95 flex items-center gap-2"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save Attendance
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[400px] rounded-2xl border-none shadow-2xl">
                                <AlertDialogHeader>
                                    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                                        <Info className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <AlertDialogTitle className="text-lg font-bold text-gray-800">Confirm Attendance</AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed">
                                        You are about to save attendance for <span className="font-bold text-indigo-600">{students.length}</span> students for <span className="font-bold text-gray-700">{attendanceDate}</span>. 
                                        <br /><br />
                                        Are you sure you want to proceed with these records?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-6 gap-2">
                                    <AlertDialogCancel className="rounded-full border-gray-100 text-xs font-bold uppercase h-10 px-6">
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleSave();
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold uppercase h-10 px-8 transition-all active:scale-95"
                                    >
                                        Confirm & Save
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    {/* Attendance Table */}
                    <div className="rounded-lg border border-gray-100 overflow-x-auto shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-gray-500 bg-gray-50/50">
                                    <TableHead className="py-3 px-4 w-10 text-center">#</TableHead>
                                    <TableHead className="py-3 px-4">Admission No</TableHead>
                                    <TableHead className="py-3 px-4">Roll Number</TableHead>
                                    <TableHead className="py-3 px-4">Name</TableHead>
                                    <TableHead className="py-3 px-4">Attendance</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Date</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Source</TableHead>
                                    <TableHead className="py-3 px-4">Entry Time</TableHead>
                                    <TableHead className="py-3 px-4">Exit Time</TableHead>
                                    <TableHead className="py-3 px-4">Note</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student, idx) => (
                                    <TableRow
                                        key={student.id}
                                        className={cn(
                                            "text-[12px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors bg-white"
                                        )}
                                    >
                                        <TableCell className="py-3 px-4 text-center text-gray-400 font-medium">
                                            {idx + 1}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-indigo-600 font-bold">
                                            {student.admission_no}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600 font-medium">
                                            {student.roll_no}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                            {student.name}
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <RadioGroup 
                                                value={student.attendance} 
                                                onValueChange={(val) => handleAttendanceChange(student.id, val as any)}
                                                className="flex flex-col gap-1"
                                            >
                                                {ATTENDANCE_OPTIONS.map((opt) => (
                                                    <div key={opt.id} className="flex items-center gap-1.5">
                                                        <RadioGroupItem
                                                            value={opt.id}
                                                            id={`${opt.id}-${student.id}`}
                                                            className={cn(
                                                                "h-3.5 w-3.5 border-gray-300",
                                                                student.attendance === opt.id && "text-indigo-600 border-indigo-600"
                                                            )}
                                                        />
                                                        <label
                                                            htmlFor={`${opt.id}-${student.id}`}
                                                            className={cn(
                                                                "text-[11px] font-medium cursor-pointer leading-none",
                                                                "text-gray-600"
                                                            )}
                                                        >
                                                            {opt.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-center text-gray-500 font-medium text-[11px]">
                                            {attendanceDate}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-center text-gray-400 font-medium text-[11px]">
                                            {student.reason || "N/A"}
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <Input
                                                type="time"
                                                value={student.entry_time}
                                                onChange={(e) => handleInputChange(student.id, 'entry_time', e.target.value)}
                                                className="h-8 text-[11px] border-gray-200 shadow-none rounded w-[110px] focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <Input
                                                type="time"
                                                value={student.exit_time}
                                                onChange={(e) => handleInputChange(student.id, 'exit_time', e.target.value)}
                                                className="h-8 text-[11px] border-gray-200 shadow-none rounded w-[110px] focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <Input
                                                placeholder="Note..."
                                                value={student.note}
                                                onChange={(e) => handleInputChange(student.id, 'note', e.target.value)}
                                                className="h-8 text-[11px] border-gray-200 shadow-none rounded w-[100px] focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {(!hasSearched || (hasSearched && students.length === 0 && !loading)) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 border border-gray-100">
                        <UserCheck className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No Records Found</p>
                        <p className="text-[11px] text-gray-400 max-w-[220px] mx-auto leading-relaxed">
                            Select class, section and date to fetch students.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
