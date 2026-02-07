"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, Video } from "lucide-react";

interface MeetingReport {
    id: string;
    meetingTitle: string;
    description: string;
    dateTime: string;
    apiUsed: "Global" | "Self";
    createdBy: string;
    totalJoin: number;
}

const reportData: MeetingReport[] = [
    {
        id: "1",
        meetingTitle: "Time Table change discussion",
        description: "Time Table change discussion",
        dateTime: "01/05/2026 02:00:00",
        apiUsed: "Global",
        createdBy: "",
        totalJoin: 2,
    },
    {
        id: "2",
        meetingTitle: "Student Health Serve Mission",
        description: "Student Health Serve Mission",
        dateTime: "12/05/2025 02:00:00",
        apiUsed: "Global",
        createdBy: "",
        totalJoin: 2,
    },
];

export default function LiveMeetingReportPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredData = reportData.filter((item) =>
        item.meetingTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <h2 className="text-lg font-medium text-gray-800">Live Meeting Report</h2>

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
                                <TableHead className="font-semibold text-gray-600">Api Used</TableHead>
                                <TableHead className="font-semibold text-gray-600">Created By</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center">Total Join</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((item) => (
                                <TableRow key={item.id} className="text-sm">
                                    <TableCell className="font-medium text-gray-700">{item.meetingTitle}</TableCell>
                                    <TableCell className="text-gray-600">{item.description}</TableCell>
                                    <TableCell className="text-gray-600">{item.dateTime}</TableCell>
                                    <TableCell className="text-gray-600">{item.apiUsed}</TableCell>
                                    <TableCell className="text-gray-600">{item.createdBy}</TableCell>
                                    <TableCell className="text-center text-gray-600">{item.totalJoin}</TableCell>
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
                            {filteredData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                                        No data available in table
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                    <div>
                        Showing 1 to {filteredData.length} of {reportData.length} entries
                    </div>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-indigo-500 hover:bg-indigo-600 text-white">1</Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
