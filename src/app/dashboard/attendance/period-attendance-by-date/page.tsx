"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface StudentAttendanceRecord {
    id: string;
    student: string;
    subjects: {
        name: string;
        code: string;
        time: string;
        status: string;
    }[];
}

const mockAttendanceData: StudentAttendanceRecord[] = [
    {
        id: "1",
        student: "Mayer (5482)",
        subjects: [
            { name: "English", code: "(210)", time: "9:00 AM - 09:45 AM", status: "N/A" },
            { name: "Drawing", code: "(200)", time: "09:45 AM - 10:30 AM", status: "N/A" },
            { name: "Mathematics", code: "(110)", time: "10:30 AM - 11:15 AM", status: "N/A" },
            { name: "Hindi", code: "(230)", time: "11:45 AM - 12:15 PM", status: "N/A" },
        ]
    },
    {
        id: "2",
        student: "Hazel (1205)",
        subjects: [
            { name: "English", code: "(210)", time: "9:00 AM - 09:45 AM", status: "N/A" },
            { name: "Drawing", code: "(200)", time: "09:45 AM - 10:30 AM", status: "N/A" },
            { name: "Mathematics", code: "(110)", time: "10:30 AM - 11:15 AM", status: "N/A" },
            { name: "Hindi", code: "(230)", time: "11:45 AM - 12:15 PM", status: "N/A" },
        ]
    },
    {
        id: "3",
        student: "Vinni Khatri (980867)",
        subjects: [
            { name: "English", code: "(210)", time: "9:00 AM - 09:45 AM", status: "N/A" },
            { name: "Drawing", code: "(200)", time: "09:45 AM - 10:30 AM", status: "N/A" },
            { name: "Mathematics", code: "(110)", time: "10:30 AM - 11:15 AM", status: "N/A" },
            { name: "Hindi", code: "(230)", time: "11:45 AM - 12:15 PM", status: "N/A" },
        ]
    }
];

export default function PeriodAttendanceByDatePage() {
    return (
        <div className="space-y-6">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-6">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="class" className="text-xs font-semibold text-gray-600">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="class2">
                            <SelectTrigger id="class">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section" className="text-xs font-semibold text-gray-600">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="b">
                            <SelectTrigger id="section">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-xs font-semibold text-gray-600">
                            Date <span className="text-red-500">*</span>
                        </Label>
                        <Input type="text" defaultValue="02/06/2026" id="date" className="h-10" />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 gap-2 text-xs h-9">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* Student List Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-lg font-medium text-gray-800">Student List</h2>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-white text-[11px]">
                            <TableRow className="border-b">
                                <TableHead className="font-semibold text-gray-600 border-r min-w-[200px]">Student</TableHead>
                                {mockAttendanceData[0].subjects.map((subj, idx) => (
                                    <TableHead key={idx} className="text-center font-semibold text-gray-600 border-r min-w-[180px]">
                                        <div className="flex flex-col items-center">
                                            <span>{subj.name} {subj.code}</span>
                                            <span className="text-[10px] text-gray-400 font-normal uppercase">{subj.time}</span>
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockAttendanceData.map((record) => (
                                <TableRow key={record.id} className="text-[13px] border-b last:border-0 hover:bg-gray-50/50">
                                    <TableCell className="font-medium text-gray-600 border-r py-4">{record.student}</TableCell>
                                    {record.subjects.map((subj, idx) => (
                                        <TableCell key={idx} className="text-center border-r py-4">
                                            <Badge className="bg-red-500 hover:bg-red-600 text-[10px] font-bold h-5 px-1.5 rounded-sm">
                                                {subj.status}
                                            </Badge>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
