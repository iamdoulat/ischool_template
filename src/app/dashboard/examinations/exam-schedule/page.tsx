"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, FileSpreadsheet, FileText, Printer, Columns, Search } from "lucide-react";

interface ExamSchedule {
    id: string;
    subject: string;
    dateFrom: string;
    startTime: string;
    duration: number;
    roomNo: string;
    marksMax: number;
    marksMin: number;
}

const mockScheduleData: ExamSchedule[] = [
    { id: "1", subject: "English (210)", dateFrom: "01/26/2026", startTime: "11:00:00", duration: 60, roomNo: "12", marksMax: 100.00, marksMin: 35.00 },
    { id: "2", subject: "Hindi (230)", dateFrom: "01/27/2026", startTime: "11:00:00", duration: 60, roomNo: "11", marksMax: 100.00, marksMin: 35.00 },
    { id: "3", subject: "Mathematics (110)", dateFrom: "01/28/2026", startTime: "11:00:00", duration: 60, roomNo: "12", marksMax: 100.00, marksMin: 35.00 },
    { id: "4", subject: "Science (111)", dateFrom: "01/29/2026", startTime: "11:00:00", duration: 60, roomNo: "11", marksMax: 100.00, marksMin: 35.00 },
];

export default function ExamSchedulePage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = mockScheduleData.filter((item) =>
        item.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-6">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="examGroup" className="text-xs font-semibold text-gray-600">
                            Exam Group <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="general">
                            <SelectTrigger id="examGroup">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General Exam (Pass / Fail)</SelectItem>
                                <SelectItem value="grading">Grading System</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="exam" className="text-xs font-semibold text-gray-600">
                            Exam <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="weekly">
                            <SelectTrigger id="exam">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weekly">Weekly Exam 2</SelectItem>
                                <SelectItem value="monthly">Monthly Exam</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 gap-2 text-xs">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* Exam Schedule List Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Exam Schedule</h2>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-48">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3"
                        />
                    </div>

                    <div className="flex items-center gap-1 text-gray-500">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                            <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                            <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                            <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                            <Columns className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 text-xs uppercase">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600 min-w-[150px]">Subject</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[120px]">Date From</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Start Time</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[80px]">Duration</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[80px]">Room No.</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px] text-right">Marks (Max..)</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px] text-right">Marks (Min..)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((item) => (
                                <TableRow key={item.id} className="text-sm hover:bg-gray-50">
                                    <TableCell className="font-medium text-gray-700 py-3">{item.subject}</TableCell>
                                    <TableCell className="text-gray-600">{item.dateFrom}</TableCell>
                                    <TableCell className="text-gray-600">{item.startTime}</TableCell>
                                    <TableCell className="text-gray-600">{item.duration}</TableCell>
                                    <TableCell className="text-gray-600">{item.roomNo}</TableCell>
                                    <TableCell className="text-right text-gray-600">{item.marksMax.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-gray-600">{item.marksMin.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

            </div>
        </div>
    );
}
