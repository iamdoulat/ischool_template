"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Video, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Meeting {
    id: string;
    title: string;
    description: string;
    dateTime: string;
    duration: number;
    apiUsed: "Self" | "Global";
    createdBy: string;
    status: "Awaited" | "Finished";
}

const meetings: Meeting[] = [
    {
        id: "1",
        title: "PTM Preparation Online",
        description: "PTM Preparation Online",
        dateTime: "02/27/2026 15:25:00",
        duration: 30,
        apiUsed: "Self",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "2",
        title: "Student Health Serve Mission",
        description: "Student Health Serve Mission",
        dateTime: "02/17/2026 15:23:00",
        duration: 40,
        apiUsed: "Self",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "3",
        title: "Syllabus Complete before Timeline",
        description: "Syllabus Complete before Timeline",
        dateTime: "02/13/2026 15:21:00",
        duration: 20,
        apiUsed: "Self",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "4",
        title: "Staff Meeting",
        description: "Staff Meeting",
        dateTime: "01/30/2026 13:00:00",
        duration: 45,
        apiUsed: "Global",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "5",
        title: "Finance Report Discussion",
        description: "Finance Report Discussion",
        dateTime: "01/25/2026 10:30:00",
        duration: 45,
        apiUsed: "Global",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "6",
        title: "Online Teacher Training Meeting",
        description: "Online Teacher Training Meeting",
        dateTime: "01/20/2026 01:30:00",
        duration: 45,
        apiUsed: "Global",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "7",
        title: "New CBSE Book Stock",
        description: "New CBSE Book Stock",
        dateTime: "01/15/2026 12:30:00",
        duration: 35,
        apiUsed: "Global",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "8",
        title: "PTM Preparation Online",
        description: "PTM Preparation Online",
        dateTime: "01/10/2026 15:00:00",
        duration: 35,
        apiUsed: "Global",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "9",
        title: "Syllabus Complete before Timeline",
        description: "Syllabus Complete before Timeline",
        dateTime: "01/01/2026 13:30:00",
        duration: 45,
        apiUsed: "Global",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "10",
        title: "Book Stock Discussion",
        description: "Book Stock Discussion",
        dateTime: "12/30/2025 12:30:00",
        duration: 45,
        apiUsed: "Global",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "11",
        title: "Teacher's Meeting",
        description: "Teacher's Meeting",
        dateTime: "12/25/2025 01:30:00",
        duration: 45,
        apiUsed: "Global",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "12",
        title: "Finance Report Discussion",
        description: "Finance Report Discussion",
        dateTime: "12/20/2025 03:30:00",
        duration: 45,
        apiUsed: "Global",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "13",
        title: "PTM Preparation Online",
        description: "PTM Preparation Online",
        dateTime: "12/15/2025 12:30:00",
        duration: 45,
        apiUsed: "Global",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "14",
        title: "School Management",
        description: "School Management",
        dateTime: "12/10/2025 12:30:00",
        duration: 35,
        apiUsed: "Global",
        createdBy: "",
        status: "Awaited",
    },
    {
        id: "15",
        title: "Student Health Serve Mission",
        description: "Student Health Serve Mission",
        dateTime: "12/05/2025 02:00:00",
        duration: 35,
        apiUsed: "Global",
        createdBy: "",
        status: "Finished",
    },
];

export default function LiveMeetingPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredMeetings = meetings.filter((meeting) =>
        meeting.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-800">Live Meeting</h1>
                <div className="flex gap-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add Credential
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex w-full md:w-auto items-center gap-2">
                        <div className="relative w-full md:w-64 flex gap-2">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 pr-10"
                            />
                            <Button className="bg-gradient-to-r from-orange-400 to-indigo-600 text-white hover:opacity-90 transition-opacity">
                                Search
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                            <SelectTrigger className="w-[70px]">
                                <SelectValue placeholder="50" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <Columns className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 text-xs uppercase">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600">Meeting Title</TableHead>
                                <TableHead className="font-semibold text-gray-600">Description</TableHead>
                                <TableHead className="font-semibold text-gray-600">Date Time</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center">Meeting Duration <br /> (Minutes)</TableHead>
                                <TableHead className="font-semibold text-gray-600">Api Used</TableHead>
                                <TableHead className="font-semibold text-gray-600">Created By</TableHead>
                                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMeetings.map((meeting) => (
                                <TableRow key={meeting.id} className="text-sm">
                                    <TableCell className="font-medium text-gray-700">{meeting.title}</TableCell>
                                    <TableCell className="text-gray-600">{meeting.description}</TableCell>
                                    <TableCell className="text-gray-600">{meeting.dateTime}</TableCell>
                                    <TableCell className="text-center text-gray-600 text-xs">{meeting.duration}</TableCell>
                                    <TableCell className="text-gray-600">{meeting.apiUsed}</TableCell>
                                    <TableCell className="text-gray-600">{meeting.createdBy}</TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`${meeting.status === 'Awaited'
                                                ? 'bg-amber-500 hover:bg-amber-600'
                                                : 'bg-green-600 hover:bg-green-700'
                                                } border-none text-white font-normal px-2 py-0.5 rounded text-[10px] uppercase`}
                                        >
                                            {meeting.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                        >
                                            <Video className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                    <div>
                        Showing 1 to {filteredMeetings.length} of {meetings.length} entries
                    </div>
                    <div className="flex gap-1">
                        {/* Simplified Pagination */}
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-indigo-500 hover:bg-indigo-600 text-white">1</Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
