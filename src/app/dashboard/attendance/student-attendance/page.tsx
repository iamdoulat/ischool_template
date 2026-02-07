"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface StudentAttendanceRecord {
    id: number;
    admissionNo: string;
    rollNumber: string;
    name: string;
    attendance: "present" | "late" | "absent" | "holiday" | "half-day";
    reason: string;
    entryTime: string;
    exitTime: string;
    note: string;
}

const studentRecords: StudentAttendanceRecord[] = [
    {
        id: 1,
        admissionNo: "10224",
        rollNumber: "20120",
        name: "Silver Talor",
        attendance: "present",
        reason: "Manual",
        entryTime: "8:45 AM",
        exitTime: "0:02 AM",
        note: "",
    },
    {
        id: 10,
        admissionNo: "485090",
        rollNumber: "616920",
        name: "James Banerjii",
        attendance: "late",
        reason: "Manual",
        entryTime: "8:48 AM",
        exitTime: "0:05 AM",
        note: "",
    },
    {
        id: 11,
        admissionNo: "7085",
        rollNumber: "87",
        name: "SJM",
        attendance: "absent",
        reason: "Manual",
        entryTime: "8:45 AM",
        exitTime: "0:05 AM",
        note: "",
    },
    {
        id: 12,
        admissionNo: "8091",
        rollNumber: "",
        name: "Nishtha",
        attendance: "holiday",
        reason: "Manual",
        entryTime: "8:45 AM",
        exitTime: "0:05 AM",
        note: "",
    },
    {
        id: 13,
        admissionNo: "90234",
        rollNumber: "55",
        name: "Noni Ujjwal",
        attendance: "present",
        reason: "Manual",
        entryTime: "8:45 AM",
        exitTime: "0:02 AM",
        note: "",
    },
    {
        id: 14,
        admissionNo: "9004",
        rollNumber: "",
        name: "AYMAN",
        attendance: "late",
        reason: "Manual",
        entryTime: "8:45 AM",
        exitTime: "0:02 AM",
        note: "",
    },
    {
        id: 15,
        admissionNo: "98030",
        rollNumber: "",
        name: "Matthew Bricks",
        attendance: "late",
        reason: "Manual",
        entryTime: "8:48 AM",
        exitTime: "0:05 AM",
        note: "",
    },
];

export default function StudentAttendancePage() {
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [attendanceDate, setAttendanceDate] = useState("02-06-2026");
    const [bulkAction, setBulkAction] = useState<string>("");

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* Select Criteria */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mb-4 border-b border-gray-50 pb-2">
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
                                <SelectItem value="class-1">Class 1</SelectItem>
                                <SelectItem value="class-2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
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
                    <Button className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 h-8 text-[10px] font-bold uppercase transition-all rounded shadow-md flex items-center gap-2">
                        <Search className="h-3.5 w-3.5" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-tight border-b border-gray-50 pb-2">
                    Student List
                </h2>

                {/* Bulk Actions */}
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Set attendance for all students as:
                    </span>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <Checkbox id="present" className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm" />
                            <label htmlFor="present" className="text-[10px] text-gray-600 font-medium cursor-pointer">
                                Present
                            </label>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Checkbox id="late" className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm" />
                            <label htmlFor="late" className="text-[10px] text-gray-600 font-medium cursor-pointer">
                                Late
                            </label>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Checkbox id="absent" className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm" />
                            <label htmlFor="absent" className="text-[10px] text-gray-600 font-medium cursor-pointer">
                                Absent
                            </label>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Checkbox id="holiday" className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm" />
                            <label htmlFor="holiday" className="text-[10px] text-gray-600 font-medium cursor-pointer">
                                Holiday
                            </label>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Checkbox id="half-day" className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm" />
                            <label htmlFor="half-day" className="text-[10px] text-gray-600 font-medium cursor-pointer">
                                Half Day
                            </label>
                        </div>
                    </div>
                </div>

                {/* Attendance Table */}
                <div className="rounded border border-gray-50 overflow-x-auto">
                    <Table className="min-w-[1400px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-gray-500 bg-gray-50/30">
                                <TableHead className="py-3 px-4 w-12">#</TableHead>
                                <TableHead className="py-3 px-4">Admission No</TableHead>
                                <TableHead className="py-3 px-4">Roll Number</TableHead>
                                <TableHead className="py-3 px-4">Name</TableHead>
                                <TableHead className="py-3 px-4 w-[280px]">Attendance</TableHead>
                                <TableHead className="py-3 px-4">Reason</TableHead>
                                <TableHead className="py-3 px-4">Entry Time</TableHead>
                                <TableHead className="py-3 px-4">Exit Time</TableHead>
                                <TableHead className="py-3 px-4">Note</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentRecords.map((student, idx) => (
                                <TableRow
                                    key={student.id}
                                    className={cn(
                                        "text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors",
                                        student.id === 10 && "bg-red-50/30",
                                        student.id === 15 && "bg-red-50/30"
                                    )}
                                >
                                    <TableCell className="py-3 px-4 text-gray-500 font-medium">
                                        {student.id}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">
                                        {student.admissionNo}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-600">
                                        {student.rollNumber || "-"}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">
                                        {student.name}
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                        <RadioGroup defaultValue={student.attendance} className="flex gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <RadioGroupItem
                                                    value="present"
                                                    id={`present-${student.id}`}
                                                    className="h-3.5 w-3.5 border-gray-300 text-indigo-500"
                                                />
                                                <label
                                                    htmlFor={`present-${student.id}`}
                                                    className="text-[10px] text-gray-600 font-medium cursor-pointer"
                                                >
                                                    Present
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <RadioGroupItem
                                                    value="late"
                                                    id={`late-${student.id}`}
                                                    className="h-3.5 w-3.5 border-gray-300 text-indigo-500"
                                                />
                                                <label
                                                    htmlFor={`late-${student.id}`}
                                                    className="text-[10px] text-gray-600 font-medium cursor-pointer"
                                                >
                                                    Late
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <RadioGroupItem
                                                    value="absent"
                                                    id={`absent-${student.id}`}
                                                    className="h-3.5 w-3.5 border-gray-300 text-indigo-500"
                                                />
                                                <label
                                                    htmlFor={`absent-${student.id}`}
                                                    className="text-[10px] text-gray-600 font-medium cursor-pointer"
                                                >
                                                    Absent
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <RadioGroupItem
                                                    value="holiday"
                                                    id={`holiday-${student.id}`}
                                                    className="h-3.5 w-3.5 border-gray-300 text-indigo-500"
                                                />
                                                <label
                                                    htmlFor={`holiday-${student.id}`}
                                                    className="text-[10px] text-gray-600 font-medium cursor-pointer"
                                                >
                                                    Holiday
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <RadioGroupItem
                                                    value="half-day"
                                                    id={`half-day-${student.id}`}
                                                    className="h-3.5 w-3.5 border-gray-300 text-indigo-500"
                                                />
                                                <label
                                                    htmlFor={`half-day-${student.id}`}
                                                    className="text-[10px] text-gray-600 font-medium cursor-pointer"
                                                >
                                                    Half Day
                                                </label>
                                            </div>
                                        </RadioGroup>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-600">
                                        {student.reason}
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                        <Input
                                            type="time"
                                            defaultValue={student.entryTime}
                                            className="h-7 text-[10px] border-gray-200 shadow-none rounded w-28"
                                        />
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                        <Input
                                            type="time"
                                            defaultValue={student.exitTime}
                                            className="h-7 text-[10px] border-gray-200 shadow-none rounded w-28"
                                        />
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                        <Input
                                            placeholder=""
                                            className="h-7 text-[10px] border-gray-200 shadow-none rounded w-32"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                    <Button className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-8 h-8 text-[10px] font-bold uppercase transition-all rounded shadow-md">
                        Save Attendance
                    </Button>
                </div>
            </div>
        </div>
    );
}
