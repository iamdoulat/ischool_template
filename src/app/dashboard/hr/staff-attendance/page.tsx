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
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Save } from "lucide-react";

interface StaffAttendanceRecord {
    id: string;
    staffId: string;
    name: string;
    role: string;
    attendance: string;
    date: string;
    source: string;
    entryTime: string;
    exitTime: string;
    note: string;
}

const mockStaffList: StaffAttendanceRecord[] = [
    {
        id: "1",
        staffId: "9002",
        name: "Shivam Verma",
        role: "Teacher",
        attendance: "absent",
        date: "",
        source: "N/A",
        entryTime: "",
        exitTime: "",
        note: ""
    },
    {
        id: "2",
        staffId: "90008",
        name: "Jason Sharlton",
        role: "Teacher",
        attendance: "absent",
        date: "",
        source: "N/A",
        entryTime: "",
        exitTime: "",
        note: ""
    },
    {
        id: "3",
        staffId: "1002",
        name: "Nishant Khare",
        role: "Teacher",
        attendance: "absent",
        date: "",
        source: "N/A",
        entryTime: "",
        exitTime: "",
        note: ""
    },
    {
        id: "4",
        staffId: "554",
        name: "aman",
        role: "Teacher",
        attendance: "absent",
        date: "",
        source: "N/A",
        entryTime: "",
        exitTime: "",
        note: ""
    }
];

const attendanceOptions = [
    { label: "Present", value: "present" },
    { label: "Late", value: "late" },
    { label: "Absent", value: "absent" },
    { label: "Half Day", value: "half_day" },
    { label: "Holiday", value: "holiday" },
    { label: "Half Day (Second Half)", value: "half_day_second" },
];

export default function StaffAttendancePage() {
    const [attendanceData, setAttendanceData] = useState(mockStaffList);
    const [bulkAttendance, setBulkAttendance] = useState("");

    const handleBulkChange = (value: string) => {
        setBulkAttendance(value);
        setAttendanceData(prev => prev.map(item => ({ ...item, attendance: value })));
    };

    const handleIndividualChange = (id: string, value: string) => {
        setAttendanceData(prev => prev.map(item =>
            item.id === id ? { ...item, attendance: value } : item
        ));
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Staff Attendance</h1>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800">Select Criteria</h2>

                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 space-y-1.5 w-full">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                            Role <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="teacher">
                            <SelectTrigger className="h-9 border-gray-200 text-sm focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="accountant">Accountant</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 space-y-1.5 w-full">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                            Attendance Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="text"
                            defaultValue="02/06/2026"
                            className="h-9 border-gray-200 text-sm focus-visible:ring-indigo-500"
                        />
                    </div>

                    <div className="pb-0.5">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-6 text-xs shadow-sm transition-all rounded">
                            <Search className="h-3.5 w-3.5" /> Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Staff List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-sm font-medium text-gray-800">Staff List</h2>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-2 border-y border-gray-50 bg-gray-50/30 -mx-4 px-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-xs font-medium text-gray-500">Set attendance for all Staff as</span>
                        <RadioGroup
                            value={bulkAttendance}
                            onValueChange={handleBulkChange}
                            className="flex flex-wrap gap-4"
                        >
                            {attendanceOptions.map((option) => (
                                <div key={option.value} className="flex items-center space-x-1.5">
                                    <RadioGroupItem value={option.value} id={`bulk-${option.value}`} className="h-3.5 w-3.5 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <Label htmlFor={`bulk-${option.value}`} className="text-[11px] text-gray-600 font-normal cursor-pointer leading-none">
                                        {option.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-5 text-xs shadow-sm transition-all rounded">
                        <Save className="h-3.5 w-3.5" /> Save Attendance
                    </Button>
                </div>

                <div className="overflow-x-auto -mx-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-transparent border-gray-100">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 w-10">#</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600">Staff ID</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600">Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600">Role</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600">Attendance</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600">Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600">Source</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600">Entry Time</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600">Exit Time</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600">Note</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceData.map((staff, idx) => (
                                <TableRow key={staff.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                    <TableCell className="py-3 text-gray-500 font-medium">{idx + 1}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{staff.staffId}</TableCell>
                                    <TableCell className="py-3 text-gray-800 font-medium">{staff.name}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{staff.role}</TableCell>
                                    <TableCell className="py-3">
                                        <RadioGroup
                                            value={staff.attendance}
                                            onValueChange={(val) => handleIndividualChange(staff.id, val)}
                                            className="flex gap-3"
                                        >
                                            {attendanceOptions.map((option) => (
                                                <div key={option.value} className="flex items-center space-x-1.5">
                                                    <RadioGroupItem value={option.value} id={`${staff.id}-${option.value}`} className="h-3 w-3 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                    <Label htmlFor={`${staff.id}-${option.value}`} className="text-[10px] text-gray-500 font-normal cursor-pointer leading-none">
                                                        {option.label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-400 italic">{staff.date || ""}</TableCell>
                                    <TableCell className="py-3 text-gray-400">{staff.source}</TableCell>
                                    <TableCell className="py-3">
                                        <Input className="h-7 w-24 text-[10px] bg-white border-gray-100 shadow-none focus-visible:ring-indigo-500" />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <Input className="h-7 w-24 text-[10px] bg-white border-gray-200 shadow-none focus-visible:ring-indigo-500" />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <Input className="h-7 w-32 text-[10px] bg-white border-gray-200 shadow-none focus-visible:ring-indigo-500" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
